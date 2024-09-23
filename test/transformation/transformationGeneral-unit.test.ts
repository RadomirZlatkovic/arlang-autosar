import { describe, expect, it } from "vitest";
import { clearFilesAndEmptyFolders, compareFilePaths, getFileName,
    createFoldersAndWriteFile, writeFile, isChildNodeElementNode } from '../../src/transformation/transformationGeneral.js';
import { sortFileNames } from '../test-helper.js';
import path from 'path';
import * as fs from 'fs';
import * as fsPromise from 'fs/promises';
import * as fsExtra from 'fs-extra';
import { DOMParser } from '@xmldom/xmldom';

describe('clearFilesAndEmptyFolders', () => {

    const testInputFolderBasePath = path.resolve(__dirname, '../test-input/transformationGeneral');
    const testOutputFolderBasePath = path.resolve(__dirname, '../test-output/transformationGeneral');

    it('Should delete files with given extensions and empty folders with no option provided', async () => {
        const testInputFolderPath = path.join(testInputFolderBasePath, 'clearFilesAndEmptyFoldersNoOpts');
        const testOutputFolderPath = path.join(testOutputFolderBasePath, 'clearFilesAndEmptyFoldersNoOpts');

        fs.mkdirSync(testOutputFolderPath, {recursive : true});
        fsExtra.copySync(testInputFolderPath, testOutputFolderPath);

        await clearFilesAndEmptyFolders(testOutputFolderPath, ['testExt', 'testExt1']);

        let files = (await fsPromise.readdir(testOutputFolderPath)).sort((name1, name2) => sortFileNames(name1, name2));
        expect(files.length).toEqual(3);
        expect(files[0]).toEqual('a.testExt2');
        expect(files[1]).toEqual('r1');
        expect(files[2]).toEqual('s');

        const r1FolderPath = path.join(testOutputFolderPath, 'r1');
        files = await fsPromise.readdir(r1FolderPath);
        expect(files.length).toEqual(1);
        expect(files[0]).toEqual('r2');

        const r2FolderPath = path.join(r1FolderPath, 'r2');
        files = await fsPromise.readdir(r2FolderPath);
        expect(files.length).toEqual(1);
        expect(files[0]).toEqual('shouldNotBeRemoved.example');

        const sFolderPath = path.join(testOutputFolderPath, 's');
        files = (await fsPromise.readdir(sFolderPath)).sort((name1, name2) => sortFileNames(name1, name2));
        expect(files.length).toEqual(2);
        expect(files[0]).toEqual('keep1.txt');
        expect(files[1]).toEqual('keep2.txt');
    });

    it('Should delete files with given extensions and empty folders with excluded top directories', async () => {
        const testInputFolderPath = path.join(testInputFolderBasePath, 'clearFilesAndEmptyFoldersTopDirsExclude');
        const testOutputFolderPath = path.join(testOutputFolderBasePath, 'clearFilesAndEmptyFoldersTopDirsExclude');

        fs.mkdirSync(testOutputFolderPath, {recursive : true});
        fsExtra.copySync(testInputFolderPath, testOutputFolderPath);

        await clearFilesAndEmptyFolders(testOutputFolderPath, ['testExt', 'testExt1'], { topDirExcludeFolderNames : ['excl1', 'FolderToExclude2'] });

        let files = (await fsPromise.readdir(testOutputFolderPath)).sort((name1, name2) => sortFileNames(name1, name2));
        expect(files.length).toEqual(5);
        expect(files[0]).toEqual('FolderToExclude2');
        expect(files[1]).toEqual('a.testExt2');
        expect(files[2]).toEqual('excl1');
        expect(files[3]).toEqual('r1');
        expect(files[4]).toEqual('s');

        const folderToExclude2FolderPath = path.join(testOutputFolderPath, 'FolderToExclude2');
        files = await fsPromise.readdir(folderToExclude2FolderPath);
        expect(files.length).toEqual(1);
        expect(files[0]).toEqual('f');

        const fFolderPath = path.join(folderToExclude2FolderPath, 'f');
        files = (await fsPromise.readdir(fFolderPath)).sort((name1, name2) => sortFileNames(name1, name2));
        expect(files.length).toEqual(3);
        expect(files[0]).toEqual('f.testExt');
        expect(files[1]).toEqual('f.testExt1');
        expect(files[2]).toEqual('f.testExt2');

        const excl1FolderPath = path.join(testOutputFolderPath, 'excl1');
        files = await fsPromise.readdir(excl1FolderPath);
        expect(files.length).toEqual(1);
        expect(files[0]).toEqual('e.testExt');

        const r1FolderPath = path.join(testOutputFolderPath, 'r1');
        files = await fsPromise.readdir(r1FolderPath);
        expect(files.length).toEqual(1);
        expect(files[0]).toEqual('r2');

        const r2FolderPath = path.join(r1FolderPath, 'r2');
        files = await fsPromise.readdir(r2FolderPath);
        expect(files.length).toEqual(1);
        expect(files[0]).toEqual('shouldNotBeRemoved.example');

        const sFolderPath = path.join(testOutputFolderPath, 's');
        files = (await fsPromise.readdir(sFolderPath)).sort((name1, name2) => sortFileNames(name1, name2));
        expect(files.length).toEqual(2);
        expect(files[0]).toEqual('keep1.txt');
        expect(files[1]).toEqual('keep2.txt');
    });

});

describe('compareFilePaths', () => {

    it('Should return -1 when first path contains less segments then second path', () => {
        expect(compareFilePaths(`oneSegment`, `two${path.sep}segments`)).toEqual(-1);
    });

    it('Should return 1 when first path contains more segments then second path', () => {
        expect(compareFilePaths(`one${path.sep}segment${path.sep}example`, `two${path.sep}segments`)).toEqual(1);
    });

    it('Should return -1 when first path is alphabetically lower then second path', () => {
        expect(compareFilePaths(`asd`, `bnm`)).toEqual(-1);
        expect(compareFilePaths(`c1${path.sep}c2${path.sep}ab`, `c1${path.sep}c2${path.sep}ac`)).toEqual(-1);
    });

    it('Should return 1 when first path is alphabetically higher then second path', () => {
        expect(compareFilePaths(`jkl`, `cvb`)).toEqual(1);
        expect(compareFilePaths(`p1${path.sep}p2${path.sep}e`, `p1${path.sep}p2${path.sep}a2`)).toEqual(1);
    });

    it('Should return 0 when file paths are the same', () => {
        expect(compareFilePaths(`exampleName`, `exampleName`)).toEqual(0);
        expect(compareFilePaths(`a1${path.sep}b2${path.sep}c3${path.sep}ExampleName`, `a1${path.sep}b2${path.sep}c3${path.sep}ExampleName`)).toEqual(0);
    });

});

describe('getFileName', () => {

    it('Should return file name for fileName.extension', () => {
        const fileName = 'exampleFile';
        const fileNameArg = `${fileName}.exampleExtension`;

        const returnedFileName = getFileName(fileNameArg);

        expect(returnedFileName).toEqual(fileName);
    });

    it('Should return file name for path/fileName.extension', () => {
        const fileName = 'MyFile';
        const fileNameArg = `/some/path/${fileName}.e`;

        const returnedFileName = getFileName(fileNameArg);

        expect(returnedFileName).toEqual(fileName);
    });

});

describe('writeFile', () => {

    const fileName = 'fs';
    const extension = 'e';
    const filePath = path.resolve(__dirname, '../test-output');
    const content = 'content';

    it('Should create specified file', async () => {
        await writeFile(filePath, fileName, extension, '');
        expect(fs.existsSync(path.join(filePath, `${fileName}.${extension}`))).toEqual(true);
    });

    it('Should write content in specified file', async () => {
        await writeFile(filePath, fileName, extension, content);

        const writtenContent = await fsPromise.readFile(path.join(filePath, `${fileName}.${extension}`), {encoding: 'utf-8'});
        expect(writtenContent).toEqual(content);
    });

});

describe('writeFile', () => {

	it('Should write file', async () => {
		const fileName = 'writeFile';
        const fileExtension = 'tempExtension';
		const filePath = path.resolve(__dirname, '../test-output');
		const content = 'content2';

		await createFoldersAndWriteFile(filePath, fileName, fileExtension, content);

		const writtenContent = await fsPromise.readFile(path.join(filePath, `${fileName}.${fileExtension}`), {encoding: 'utf-8'});
        expect(writtenContent).toEqual(content);
	});

});

describe('createFoldersAndWriteFile', () => {

	it('Should write file', async () => {
		const fileName = 'createFoldersAndWriteFile';
        const fileExtension = 'tempExtension';
		const filePath = path.resolve(__dirname, '../test-output');
		const content = 'content2';

		await createFoldersAndWriteFile(filePath, fileName, fileExtension, content);

		const writtenContent = await fsPromise.readFile(path.join(filePath, `${fileName}.${fileExtension}`), {encoding: 'utf-8'});
        expect(writtenContent).toEqual(content);
	});

    it('Should create folder and write file', async () => {
		const fileName = 'createFoldersAndWriteFile';
        const fileExtension = 'tempExtension';
		const filePath = path.resolve(__dirname, '../test-output/newFolderCFAWF');
		const content = 'content2';

		await createFoldersAndWriteFile(filePath, fileName, fileExtension, content);

		const writtenContent = await fsPromise.readFile(path.join(filePath, `${fileName}.${fileExtension}`), {encoding: 'utf-8'});
        expect(writtenContent).toEqual(content);
	});

});

describe('isChildNodeElementNode', () => {

    it('Should return true when child node is element node', () => {
        const arxmlContent =
`<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_4-3-0.xsd">
<AR-PACKAGES>
	<AR-PACKAGE><SHORT-NAME>ExampleShortName</SHORT-NAME></AR-PACKAGE>
</AR-PACKAGES>
</AUTOSAR>
`
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');

        expect(isChildNodeElementNode(arxml.getElementsByTagName('AR-PACKAGE')[0].childNodes[0])).toEqual(true);
    });

    it('Should return false when child node is not element node', () => {
		const arxmlContent =
`<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_4-3-0.xsd">
<AR-PACKAGES>
	<AR-PACKAGE>
		<SHORT-NAME>ExampleShortName</SHORT-NAME>
	</AR-PACKAGE>
</AR-PACKAGES>
</AUTOSAR>
`
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');

        expect(isChildNodeElementNode(arxml.getElementsByTagName('AR-PACKAGE')[0].childNodes[0])).toEqual(false);
    });

});
