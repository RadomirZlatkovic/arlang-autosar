import path from 'path';
import * as vscode from 'vscode';
import { Model as ArlangModel} from '../../language/generated/ast.js';
import { initMetadataToArxmlTransformation, getArxmlFromRelativePath, populateMetadataInfo, getArlangModIdToArxmlObject } from '../metadataToArxml/metadataToArxmlTransformation.js';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import xmlFormatter from 'xml-formatter';
import { getElementAfterShortName, initializeModels, getFirstChildElementByTagNameInsideArxmlObject } from './arlangToArxmlGeneral.js';
import { getFileName, createFoldersAndWriteFile, compareFilePaths } from '../transformationGeneral.js';
import { ARLANG_METADATA_FOLDER_NAME } from '../typesAndConstants.js';
import { createARPackage, getARPackageInsideSpecifiedARPackages } from './packageTransformation.js';
import { transformArlangElements } from './elementTransformation.js';
import { getWorkspaceFiles, showTransformationDone } from '../vscodeHelperFunctions.js';
import { transform as doArxmlToArlangTransformation } from '../arxmlToArlang/arxmlToArlangTransformation.js';
import { initTransformationFlowHelpers, setCurrentRelativeFilePath, currentRelativeFilePath, arxmlObjectsToRemove, transformedOriginalArlangModIds, clonedChildsDataGlobalHolder, isErrorOccurred } from './arlangToArxmlTransformationFlowHelper.js';
import { EOL } from "os";

export type TransformedArxmlData = {
    xmlDocument : Document,
    destinationPath: string,
    fileName: string
};

export async function transform(arlangFolderPath : string, targetFolderPath: string) : Promise<void> {
    await initTransformation(arlangFolderPath, targetFolderPath);

    const transformedArxmls = await transformArlangToArxml(arlangFolderPath, targetFolderPath);
    if (isErrorOccurred()) {
        return;
    }

    await saveArxmlFiles(transformedArxmls);

    // arxml -> arlang must be performed because arlangModId must be created in arlang element
    // if it is not created, than if arlang to arxml is run twice in a row, it will produce two same arxml objects
    await doArxmlToArlangTransformation(targetFolderPath, arlangFolderPath);

    showTransformationDone(); // TODO additional information needs to be provided (ARLANG -> ARXML), because arxmlToArlangTransformation also shows that transformation is done. Also provide there more info
}

async function initTransformation(arlangFolderPath : string, targetFolderPath : string) : Promise<void> {
    initTransformationFlowHelpers();

    initMetadataToArxmlTransformation();
    const metadataFolderPath = path.join(arlangFolderPath, ARLANG_METADATA_FOLDER_NAME);
    await populateMetadataInfo(metadataFolderPath, targetFolderPath);
}

async function transformArlangToArxml(arlangFolderPath: string, targetFolderPath : string) : Promise<TransformedArxmlData[]> {
    const arlangUris = await getArlangFileUris(arlangFolderPath);
    const arlangModels = await initializeModels(arlangUris);

    const transformedArxmls : TransformedArxmlData[] = [];

    for (let i = 0; i < arlangUris.length; i++) {
        const arlangUri = arlangUris[i];
        const arlangModel = arlangModels[i];

        const fileName = getFileName(arlangUri);
        const relativeFilePathWithoutName = arlangUri.substring(arlangFolderPath.length + 1, arlangUri.lastIndexOf(fileName + '.arlang'));

        setCurrentRelativeFilePath(path.join(relativeFilePathWithoutName, fileName));

        const targetDestinationPath = path.join(targetFolderPath, relativeFilePathWithoutName);

        const arxml = transformArlangModelToArxmlModel(arlangModel, getArxmlFromRelativePath(currentRelativeFilePath));
        transformedArxmls.push({xmlDocument : arxml, destinationPath : targetDestinationPath, fileName : fileName});
    }

    if (isErrorOccurred()) {
        return [];
    }

    removeMarkedArxmlObjects();
    removeNonExistingElements();

    return transformedArxmls;
}

// TODO - refactor/optimize this function, getWorkspaceFiles is searching for all files, not the ones in arlangFolderPath
/**
 * @returns uris of arlang files
 */
async function getArlangFileUris(arlangFolderPath : string) : Promise<string[]> {
    const arlangUris : string[] = [];

    await getWorkspaceFiles('arlang').then(async (uris: vscode.Uri[]) => {
        uris.filter(uri => uri.fsPath.startsWith(arlangFolderPath))
            .map(uri => uri.fsPath)
            .sort((path1, path2) => compareFilePaths(path1, path2))
            .forEach(uri => arlangUris.push(uri));
    });

    return arlangUris;
}

/**
 * @param arxml  arxml to modify if it exists
 * @returns newly created arxml or modified arxml if passed as an argument (the same arxml reference if passed as argument)
 */
function transformArlangModelToArxmlModel(arlangModel: ArlangModel, arxml? : Document): Document {
    const doc = arxml ?? new DOMParser().parseFromString(
`<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_4-3-0.xsd">
    <AR-PACKAGES>
    </AR-PACKAGES>
</AUTOSAR>`, 'text/xml');

    arlangModel.packages.forEach((arlangPackage) => {
        // set ARPackage collection to root AR-PACKAGES
        let arPackageCollection = doc.getElementsByTagName("AR-PACKAGES")[0];

        const segments = arlangPackage.name.trim().split('.');
        const lastSegmentIndex = segments.length - 1;

        for (let i = 0; i < lastSegmentIndex; i++) {
            let arxmlPackage = getARPackageInsideSpecifiedARPackages(arPackageCollection, segments[i]);
            if (arxmlPackage === null) {
                arxmlPackage = createARPackage(doc, segments[i]);

                arPackageCollection.appendChild(arxmlPackage);

                // create and add new AR-PACKAGES
                const newARPackageCollection = doc.createElement("AR-PACKAGES");
                arxmlPackage.appendChild(newARPackageCollection);

                arPackageCollection = newARPackageCollection;
            } else {
                const followingARPackageCollections = arxmlPackage.getElementsByTagName("AR-PACKAGES");
                if (followingARPackageCollections.length === 0) {
                    // create and add new AR-PACKAGES
                    const newARPackageCollection = doc.createElement("AR-PACKAGES");
                    arxmlPackage.appendChild(newARPackageCollection);

                    arPackageCollection = newARPackageCollection;
                } else {
                    arPackageCollection = followingARPackageCollections[0];
                }
            }
        }

        // last segment
        let arxmlPackage = getARPackageInsideSpecifiedARPackages(arPackageCollection, segments[lastSegmentIndex]);
        if (arxmlPackage === null) {
            arxmlPackage = createARPackage(doc, segments[lastSegmentIndex]);

            const arxmlElementsCollection = transformArlangElements(doc, arlangPackage.elements);

            if (arxmlElementsCollection !== null) {
                arxmlPackage.appendChild(arxmlElementsCollection);
            }

            arPackageCollection.appendChild(arxmlPackage);
        } else {
            const arxmlElementsCollection = transformArlangElements(doc, arlangPackage.elements, getFirstChildElementByTagNameInsideArxmlObject(arxmlPackage, 'ELEMENTS') ?? undefined);

            if (arxmlElementsCollection !== null) {
                arxmlPackage.insertBefore(arxmlElementsCollection, getElementAfterShortName(arxmlPackage));
            }
        }
    });

    return doc;
}

function removeMarkedArxmlObjects() : void {
    arxmlObjectsToRemove.forEach(arxmlObject => arxmlObject.parentNode!.removeChild(arxmlObject));
}

function removeNonExistingElements() : void {
    const arlangModIdToArxmlObject = getArlangModIdToArxmlObject();
    for (const entry of arlangModIdToArxmlObject.entries()) {
        const arlangModId = entry[0];

        const nonTransformedArlangModIds = clonedChildsDataGlobalHolder.filter(iterator => iterator.arlangModId === arlangModId && iterator.transformed === false);

        for (const nonTransformedArlangModId of nonTransformedArlangModIds) {
            const clonedElement = nonTransformedArlangModId.clonedArxmlObject; 
            const parent = clonedElement.parentNode;
            if (parent !== null) {
                parent.removeChild(clonedElement);
            }
        }

        if (!transformedOriginalArlangModIds.get(arlangModId)) {
            const arxmlObject = entry[1];

            const parentNode = arxmlObject.parentNode;
            if (parentNode !== null) { // if element not already removed
                parentNode.removeChild(arxmlObject);
            }
        }
    }
}

export async function saveArxmlFiles(transformedArxmls : TransformedArxmlData[]) : Promise<void> {
    for (const transformedArxml of transformedArxmls) {
        await saveArxmlFile(transformedArxml);
    }
}

export async function saveArxmlFile(transformedArxml : TransformedArxmlData) : Promise<void> {
    const arxmlContent = formatXml(transformedArxml.xmlDocument);
    await createFoldersAndWriteFile(transformedArxml.destinationPath, transformedArxml.fileName, 'arxml', arxmlContent);
}

export function formatXml(doc: Document) : string {
    return xmlFormatter(new XMLSerializer().serializeToString(doc), {
        indentation: '	',
        collapseContent: true,
        lineSeparator: EOL
    });
}
