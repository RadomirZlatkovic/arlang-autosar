import { TargetProject } from './target-view.js';
import { ArlangProject } from './arlang-view.js';
import * as fs from 'fs/promises';
import path from 'path';

export async function isFileWithExtensionPresent(folderPath : string, fileExtension : string) : Promise<boolean> {
    let extension = fileExtension;
    if (!extension.startsWith('.')) {
        extension = '.' + extension;
    }

    const pathIsDirectory = await isDirectory(folderPath);
    if (!pathIsDirectory) {
        return false;
    }

    let containsFile = false;
    const fileNames = await fs.readdir(folderPath);
    for (const fileName of fileNames) {
        const filePath = path.join(folderPath, fileName);

        if (await isDirectory(filePath)) {
            containsFile = await isFileWithExtensionPresent(filePath, extension);
        } else if (fileName.endsWith(extension)) {
            containsFile =  true;
        }

        if (containsFile === true) {
            return true;
        }
    }

    return containsFile;
}

export async function isDirectory(path : string) : Promise<boolean> {
    return (await fs.lstat(path)).isDirectory();
}

export function getArlangFolderPath() : string | undefined {
    return ArlangProject.INSTANCE().getProjectFolder()?.uri.fsPath;
}

export function getTargetFolderPath() : string | undefined {
    return TargetProject.INSTANCE().getProjectFolder()?.uri.fsPath;
}
