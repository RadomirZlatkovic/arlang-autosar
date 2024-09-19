import path from 'path';
import fs from 'fs';
import fsPromise from 'fs/promises';
import * as vscode from 'vscode';
import { showFolderCreationError } from './vscodeHelperFunctions.js';

/**
 * Clear files and empty folders inside startingFolderPath recursively. Does not clear startingFolderPath in any case.
 */
export async function clearFilesAndEmptyFolders(startingFolderPath : string, fileExtensions : string[],
                                                options ?: { topDirExcludeFolderNames ?: string[] }) : Promise<void> {
    for (const file of await fsPromise.readdir(startingFolderPath)) {
        const fullFileName = path.join(startingFolderPath, file);

        if ( (await fsPromise.lstat(fullFileName)).isDirectory() ) {
            if (options === undefined || options.topDirExcludeFolderNames === undefined ||
                options.topDirExcludeFolderNames.map(topDirExcludeFolderName => path.join(startingFolderPath, topDirExcludeFolderName))
                                                .findIndex(excludeFolderFullName => fullFileName === excludeFolderFullName) === -1) {
                await clearFilesAndEmptyFoldersRecursive(fullFileName, fileExtensions);
            }
        } else {
            for (const fileExtension of fileExtensions) {
                if (file.endsWith(`.${fileExtension}`)) {
                    await fsPromise.unlink(fullFileName);
                }
            }
        }
    }
}

async function clearFilesAndEmptyFoldersRecursive(folderPath : string, fileExtensions : string[]) : Promise<void> {
    for (const file of await fsPromise.readdir(folderPath)) {
        const fullFileName = path.join(folderPath, file);

        if ( (await fsPromise.lstat(fullFileName)).isDirectory() ) {
            await clearFilesAndEmptyFoldersRecursive(fullFileName, fileExtensions);
        } else {
            for (const fileExtension of fileExtensions) {
                if (file.endsWith(`.${fileExtension}`)) {
                    await fsPromise.unlink(fullFileName);
                }
            }
        }
    }

    if ( (await fsPromise.readdir(folderPath)).length === 0) {
        await fsPromise.rmdir(folderPath);
    }
}

/**
 * @returns -1 if the first argument is less than the second argument, zero if they're equal, 1 if the first argument is greater than the second argument
 */
// TODO optimization - have one function called compareFQNames(str1, str2, separator) - use this for package/arpackage comparison
export function compareFilePaths(path1 : string, path2 : string) : number {
    const path1Segments = path1.split(path.sep);
    const path2Segments = path2.split(path.sep);

    if (path1Segments.length < path2Segments.length) {
        return -1;
    } else if (path1Segments.length > path2Segments.length) {
        return 1;
    }

    for (let i = 0; i < path1Segments.length; i++) {
        const path1Segment = path1Segments[i];
        const path2Segment = path2Segments[i];

        const localeCompare = path1Segment.localeCompare(path2Segment);
        if (localeCompare !== 0) {
            return localeCompare;
        }
    }

    return 0;
}

export async function createFoldersAndWriteFile(destinationPath : string, fileName : string, fileExtension : string, content : string) : Promise<void> {
    if (!fs.existsSync(destinationPath)) {
        return new Promise((resolve, reject) => {

            fs.mkdir(destinationPath, {recursive: true}, (err) => {
                if (err) {
                    showFolderCreationError(err.message);
                    reject();
                } else {
                    writeFile(destinationPath, fileName, fileExtension, content)
                        .then(() => resolve())
                        .catch(() => reject());
                }
            });

        });
    } else {
        return writeFile(destinationPath, fileName, fileExtension, content);
    }
}

export async function writeFile(destinationPath: string, fileName: string, extension: string, content: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const targetFilePath = path.join(destinationPath, fileName) + '.' + extension;

        fs.writeFile(targetFilePath, content, (err : NodeJS.ErrnoException | null) => {
            if (err) {
                vscode.window.showErrorMessage(err.message);
                reject();
            } else {
                resolve();
            }
        });
    });
}

export function getFileName(pathWithExtension: string) : string {
    const baseName = path.basename(pathWithExtension);
    const extensionName = path.extname(baseName);

    return baseName.substring(0, baseName.lastIndexOf(extensionName));
}

export function isChildNodeElementNode(childNode : ChildNode) : boolean {
    return childNode.nodeType === 1 // nodeType 1 is Element node (not comment, whitespace or something like that)
}
