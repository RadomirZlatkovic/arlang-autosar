import { expect } from "vitest";
import { AstNode, LangiumDocument, EmptyFileSystem, ParseResult } from 'langium';
import { Model as ArlangModel } from '../src/language/generated/ast.js';
import { createArlangServices } from '../src/language/arlang-module.js';
import { parseDocument } from 'langium/test';
import path from 'path';
import fs from 'fs/promises';

export interface FileTestHelper {
    relativePath: string,
    name: string,
    extension: string
    content: string
}

export function expectNoError(parseResult : ParseResult<AstNode>) {
    const lexerErrors = parseResult.lexerErrors
    const parserErrors = parseResult.parserErrors

    const numberOfErrors = lexerErrors.length + parserErrors.length;
    expect(numberOfErrors,
    `Lexer Errors: ${lexerErrors}
    Parser Errors: ${parserErrors}`).toEqual(0);
}

export function expectAnyError(document : LangiumDocument<AstNode>) {
    const parseResult : ParseResult<AstNode> = document.parseResult;
    const numberOfErrors = parseResult.lexerErrors.length + parseResult.parserErrors.length;
    expect(numberOfErrors).toBeGreaterThan(0);
}

export async function createArlangModel(arlangContent : string) : Promise<ArlangModel> {
    const services = createArlangServices(EmptyFileSystem).Arlang;

    const document : LangiumDocument<AstNode> = await parseDocument(services, arlangContent);

    await services.shared.workspace.DocumentBuilder.build([document]);
    const parseResult : ParseResult<AstNode> = document.parseResult;
    expectNoError(parseResult);

    return parseResult.value as ArlangModel;
}

/**
 * Gets all files inside diretoryPath
 * 
 * @param directoryPath path of a directory
 * @param fileExtension file extension to look for
 * @param files holder for FileTestHelper objects
 * @param startingDirectoryPath used to calculate relative path, if not provided it is the same as directoryPath 
 */
export async function getAllFiles(directoryPath : string, fileExtensions : string[], filesHolder : FileTestHelper[], startingDirectoryPath? : string) : Promise<void> {
    const fileList = await fs.readdir(directoryPath);

    for (const file of fileList) {
        const fullFileName = path.join(directoryPath, file);

        if ((await fs.lstat(fullFileName)).isDirectory()) {
            await getAllFiles(fullFileName, fileExtensions, filesHolder, startingDirectoryPath === undefined ? directoryPath : startingDirectoryPath);
        } else {
            for (const fileExtension of fileExtensions) {
                if (!fullFileName.endsWith(`.${fileExtension}`)) {
                    continue;
                }

                let fileRelativePath = '';
                if (startingDirectoryPath !== undefined && directoryPath !== startingDirectoryPath) {
                    fileRelativePath = directoryPath.substring(startingDirectoryPath.length);
                    if (fileRelativePath.startsWith(path.sep)) {
                        fileRelativePath = fileRelativePath.substring(1);
                    }
                }

                const fileName = file.substring(0, file.lastIndexOf('.'));
                const fileContent = await fs.readFile(fullFileName, {encoding: 'utf-8'});

                filesHolder.push({relativePath: fileRelativePath, name: fileName, extension: fileExtension, content: fileContent});
            }
        }
    }
}

export async function getAllFolders(directoryPath : string, fullPathHolder : string[]) : Promise<void> {
    const fileList = await fs.readdir(directoryPath);
    for (const file of fileList) {
        const fullFileName = path.join(directoryPath, file);

        if ((await fs.lstat(fullFileName)).isDirectory()) {
            fullPathHolder.push(fullFileName);

            await getAllFolders(fullFileName, fullPathHolder);
        }
    }
}

export function sortFileNames(name1 : string, name2 : string) : number {
    if (name1 < name2) {
        return -1;
    } else if (name1 > name2) {
        return 1;
    }

    return 0;
}

export function checkShortName(xmlElement : Element, expectedShortNameValue : string) : void {
    expect(xmlElement.tagName).toEqual('SHORT-NAME');

    const childNodes = xmlElement.childNodes;
    expect(childNodes.length).toEqual(1);

    const shortNameTextNode = childNodes[0] as Text;
    expect(shortNameTextNode.data).toEqual(expectedShortNameValue);
}
