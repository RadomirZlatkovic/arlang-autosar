import * as vscode from 'vscode';
import path from 'path';
import { getWorkspaceFiles, showTransformationDone, showTransformationError, showNoARPackageFound } from '../vscodeHelperFunctions.js';
import * as fs from 'fs/promises';
import { clearFilesAndEmptyFolders, getFileName, createFoldersAndWriteFile, compareFilePaths } from '../transformationGeneral.js';
import { ARLANG_METADATA_FOLDER_NAME } from '../typesAndConstants.js';
import { DOMParser } from '@xmldom/xmldom';
import { transformArxmlARPackage } from './arPackageTransformation.js';
import { initArxmlToMetadataTransformation, transformArxmlToMetadata } from '../arxmlToMetadata/arxmlToMetadaTransformation.js';
import { EOL } from "os";

export async function transform(targetFolderPath : string, arlangFolderPath : string) : Promise<void> {
    await initTransformation(arlangFolderPath);

    await getWorkspaceFiles('arxml').then(async (uris: vscode.Uri[]) => {

        const arxmlUris = uris
                            .filter(uri => uri.fsPath.startsWith(targetFolderPath))
                            .map(uri => uri.fsPath)
                            .sort((path1, path2) => compareFilePaths(path1, path2));

        for (const arxmlUri of arxmlUris) {
            try {
                const arxmlContent = await fs.readFile(arxmlUri, { encoding: 'utf8' });
                const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');

                const fileName = getFileName(arxmlUri);
                const relativePath = arxmlUri.substring(targetFolderPath.length, arxmlUri.lastIndexOf(fileName + '.arxml'));

                let arlangMetadata = '[]';
                let arlangContent = '';

                // transform if at least one AR-PACKAGE exists
                if (arxml.getElementsByTagName("AR-PACKAGE").length !== 0) {
                    arlangMetadata = JSON.stringify(transformArxmlToMetadata(arxml), null, 2).replaceAll("\n", EOL);
                    arlangContent = transformArxmlToArlang(arxml);
                } else {
                    showNoARPackageFound(fileName, targetFolderPath);
                }

                const arlangMetadataDestinationPath = path.join(arlangFolderPath, ARLANG_METADATA_FOLDER_NAME, relativePath);
                await createFoldersAndWriteFile(arlangMetadataDestinationPath, fileName, 'json',  arlangMetadata);

                const arlangDestinationPath = path.join(arlangFolderPath, relativePath);
                await createFoldersAndWriteFile(arlangDestinationPath, fileName, 'arlang', arlangContent);
            } catch (err) {
                showTransformationError((err as Error).message);
            }
        }

    });

    showTransformationDone();
}

async function initTransformation(arlangFolderPath : string) : Promise<void> {
    await clearArlangAndMetadataFiles(arlangFolderPath);
    initArxmlToMetadataTransformation();
}

async function clearArlangAndMetadataFiles(arlangFolderPath : string) {
    await clearFilesAndEmptyFolders(arlangFolderPath, ['arlang'], { topDirExcludeFolderNames : [ARLANG_METADATA_FOLDER_NAME] } );

    const metadataFolderPath = path.join(arlangFolderPath, ARLANG_METADATA_FOLDER_NAME);
    await fs.stat(metadataFolderPath).then(async () => await clearFilesAndEmptyFolders(metadataFolderPath, ['json']))
                                    .catch(() => {});
}

function transformArxmlToArlang(arxml : Document) : string {
    const arPackageElements = arxml.getElementsByTagName("AR-PACKAGE");

    // transform first ARPackage
    let arPackageElement = arPackageElements[0];
    let transformedPackage = transformArxmlARPackage(arPackageElement);
    let arlangContent = `${transformedPackage}`;

    // transform all following ARPackage elements
    for (let i = 1; i < arPackageElements.length; i++) {
        arPackageElement = arPackageElements[i];
        transformedPackage = transformArxmlARPackage(arPackageElement);

        arlangContent =
`${arlangContent}

${transformedPackage}`
    }

    return `${arlangContent.replaceAll("\n", EOL)}${EOL}`;
}
