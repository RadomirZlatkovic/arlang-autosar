import { ArlangMetadata, ArlangMetadataObject } from "../typesAndConstants.js";
import path from 'path';
import fs from 'fs/promises';
import { showTransformationError, showMetadataFolderAccessWarning } from "../vscodeHelperFunctions.js";
import { DOMParser } from '@xmldom/xmldom';

const metadataHolder : ArlangMetadata = [];

/**
 * Relative file path with file name, without file extension
 */
const relativeFilePathToArxml = new Map<string, Document>;

const arlangModIdToMetadataObject = new Map<string, ArlangMetadataObject>;

/**
 * Relative file path with file name, without file extension,
 * of metadata file (it should also be relative path of arxml file) where arlangModId is defined.
 */
const arlangModIdToRelativeFilePath = new Map<string, string>;

const arlangModIdToArxmlObject = new Map<string, Element>;


/**
 * Initialize holders to original state.
 * This should be called once per arlang to arxml transformation.
 */
export function initMetadataToArxmlTransformation() {
    metadataHolder.length = 0;
    relativeFilePathToArxml.clear();
    arlangModIdToMetadataObject.clear();
    arlangModIdToRelativeFilePath.clear();
    arlangModIdToArxmlObject.clear();
}

/**
 * This should be called once per arlang to arxml transformation.
 * @param startingMetadataFolderPath used to calculate relative path, if not provided it is the same as metadataFolderPath
 */
export async function populateMetadataInfo(metadataFolderPath : string, arxmlFolderPath : string, startingMetadataFolderPath? : string) : Promise<void> {
    // if metadata folder does not exist do nothing
    try {
        await fs.access(metadataFolderPath);
    } catch (err) {
        showMetadataFolderAccessWarning(metadataFolderPath);
        return;
    }

    const fileList = await fs.readdir(metadataFolderPath);
    for (const file of fileList) {
        const fullFileName = path.join(metadataFolderPath, file);

        if ((await fs.lstat(fullFileName)).isDirectory()) {
            await populateMetadataInfo(fullFileName, arxmlFolderPath, startingMetadataFolderPath === undefined ? metadataFolderPath : startingMetadataFolderPath);
        } else if (fullFileName.endsWith('.json')) {
            let folderRelativePath = '';
            if (startingMetadataFolderPath !== undefined && metadataFolderPath !== startingMetadataFolderPath) {
                folderRelativePath = metadataFolderPath.substring(startingMetadataFolderPath!.length);
                if (folderRelativePath.startsWith(path.sep)) {
                    folderRelativePath = folderRelativePath.substring(1);
                }
            }

            const fileName = file.substring(0, file.lastIndexOf('.'));
            try {
                const fileContent = await fs.readFile(fullFileName, {encoding: 'utf-8'});
                const metadata = JSON.parse(fileContent);

                metadataHolder.push(metadata);
                await populateArlangModIdRelatedData(folderRelativePath, fileName, metadata, arxmlFolderPath);
            } catch(err) {
                showTransformationError(`Metadata files (json files inside .arlang folder) are generated. They should not be edited. ${err}`);
            }
        }
    }
}

async function populateArlangModIdRelatedData(folderRelativePath : string, fileName : string, metadata : ArlangMetadata, arxmlFolderPath : string) : Promise<void> {
    const relativeFilePath = path.join(folderRelativePath, fileName);
    const fullArxmlPath = path.join(arxmlFolderPath, folderRelativePath, fileName + '.arxml');

    await fs.readFile(fullArxmlPath, { encoding: 'utf8' })
        .then(arxmlContent => {
            const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');

            relativeFilePathToArxml.set(relativeFilePath, arxml);

            for (const metadataObject of metadata) {
                const arlangModId = metadataObject.arlangModId;

                arlangModIdToMetadataObject.set(arlangModId, metadataObject);
                arlangModIdToRelativeFilePath.set(arlangModId, path.join(folderRelativePath, fileName));
                arlangModIdToArxmlObject.set(arlangModId, arxml.getElementsByTagName(metadataObject.tagName)[metadataObject.index]);
            }
        })
        .catch(err => {
            showTransformationError(`Metadata files (json files inside .arlang folder) are generated. They should not be edited. ${err}`);
        });
}

export function getArlangModIdFromArxmlObject(arxmlObject : Element) : string | undefined {
    for (const entry of arlangModIdToArxmlObject.entries()) {
        const arlangModId = entry[0];
        const arxmlObjectInMap = entry[1];

        if (arxmlObject === arxmlObjectInMap) {
            return arlangModId;
        }
    }

    return undefined;
}

/**
 * @param relativeFilePath relative file path with file name, without file extension
 */
export function getArxmlFromRelativePath(relativeFilePath : string) : Document | undefined {
    return relativeFilePathToArxml.get(relativeFilePath);
}

export function getArxmlObject(arlangModId : string) : Element | undefined {
    return arlangModIdToArxmlObject.get(arlangModId);
}

export function getArlangModIdToArxmlObject() : Map<string, Element> {
    return arlangModIdToArxmlObject;
}

/**
 * @returns Relative file path with file name, without file extension,
 * of metadata file (it should also be relative path of arxml file) where arlangModId is defined.
 */
export function getRelativeFilePathWithoutExtension(arlangModId : string) : string | undefined {
    return arlangModIdToRelativeFilePath.get(arlangModId);
}

export function getContainerFQNFromMetadata(arlangModId : string) : string | undefined {
    const metadataObject = arlangModIdToMetadataObject.get(arlangModId);
    if (metadataObject === undefined) {
        return undefined;
    }

    return metadataObject.containerFQN;
}
