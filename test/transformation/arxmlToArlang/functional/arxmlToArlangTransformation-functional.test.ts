import { describe, expect, it } from "vitest";
import * as transformation from '../../../../src/transformation/arxmlToArlang/arxmlToArlangTransformation.js';
import * as metadataTransformation from '../../../../src/transformation/arxmlToMetadata/arxmlToMetadaTransformation.js';
import * as transformationGeneral from '../../../../src/transformation/transformationGeneral.js';
import * as vscodeHelperFunctions from '../../../../src/transformation/vscodeHelperFunctions.js';
import { Uri } from 'vscode';
import { vi } from 'vitest';
import path from 'path';
import * as fs from 'fs';
import * as fsPromise from 'fs/promises';
import * as fsExtra from 'fs-extra';
import { FileTestHelper, getAllFiles, sortFileNames, getAllFolders } from '../../../test-helper.js';

const baseTargetFolderPath = path.resolve(__dirname, '../../../test-input/arxmlToArlang');
const baseArlangFolderPath = path.resolve(__dirname, '../../../test-output/arxmlToArlang');

describe('Package transformation functional tests', () => {

    it('Should handle case when no ARPackage exist in Arxml', async () => {
        await performTestWhenNoARPackageExists('package/noPackage');
    });

    it('Should transform one file with one package', async () => {
        await performTest('package/oneFileOnePackage');
    });

    it('Should transform multiple files with one package', async () => {
        await performTest('package/multipleFilesOnePackage');
    });

    it('Should transform one file with multiple packages', async () => {
        await performTest('package/oneFileMultiplePackages');
    });

    it('Should transform multiple files with multiple packages', async () => {
        await performTest('package/multipleFilesMultiplePackages');
    });

});

describe('Old arlang and metadata files should be deleted', () => {

    it('Should also create arlang and metadata files for each arxml file', async () => {
        const relativeFolderPath = 'deletionAndCreation/transformation';
        const outputFolderPath = path.resolve(baseArlangFolderPath, relativeFolderPath);

        fs.mkdirSync(outputFolderPath, {recursive : true});
        fsExtra.copySync(path.resolve(baseTargetFolderPath, 'deletionAndCreation/filesToCopy'), outputFolderPath);

        await performTest(relativeFolderPath, { doClearFilesAndEmptyFolders : true } );

        const fileExtensions = ['txt', 'text', 'txt1', 'example', 'example1', '1'];

        const additionalOutputFiles : FileTestHelper[] = [];
        await getAllFiles(outputFolderPath, fileExtensions, additionalOutputFiles);

        const expectedFolderPath = path.resolve(__dirname, '../../../test-expected/arxmlToArlang', relativeFolderPath);
        let additionalExpectedFiles : FileTestHelper[] = [];
        await getAllFiles(expectedFolderPath, fileExtensions, additionalExpectedFiles);

        const outputTxtFiles = additionalOutputFiles.filter(outFile => outFile.extension === 'txt');
        const expectedTxtFiles = additionalExpectedFiles.filter(expectedFile => expectedFile.extension === 'txt');
        expect(outputTxtFiles.length).toEqual(expectedTxtFiles.length);
        expect(outputTxtFiles[0].name).toEqual(expectedTxtFiles[0].name);
        expect(outputTxtFiles[0].content).toEqual(expectedTxtFiles[0].content);

        const outputTextFiles = additionalOutputFiles.filter(outFile => outFile.extension === 'text');
        const expectedTextFiles = additionalExpectedFiles.filter(expectedFile => expectedFile.extension === 'text');
        expect(outputTextFiles.length).toEqual(expectedTextFiles.length);
        expect(outputTextFiles[0].name).toEqual(expectedTextFiles[0].name);
        expect(outputTextFiles[0].content).toEqual(expectedTextFiles[0].content);

        const outputTxt1Files = additionalOutputFiles.filter(outFile => outFile.extension === 'txt1');
        const expectedTxt1Files = additionalExpectedFiles.filter(expectedFile => expectedFile.extension === 'txt1');
        expect(outputTxt1Files.length).toEqual(expectedTxt1Files.length);
        expect(outputTxt1Files[0].name).toEqual(expectedTxt1Files[0].name);
        expect(outputTxt1Files[0].content).toEqual(expectedTxt1Files[0].content);

        const outputExampleFiles = additionalOutputFiles.filter(outFile => outFile.extension === 'example');
        const expectedExampleFiles = additionalExpectedFiles.filter(expectedFile => expectedFile.extension === 'example');
        expect(outputExampleFiles.length).toEqual(expectedExampleFiles.length);
        expect(outputExampleFiles[0].name).toEqual(expectedExampleFiles[0].name);
        expect(outputExampleFiles[0].content).toEqual(expectedExampleFiles[0].content);

        const outputExample1Files = additionalOutputFiles.filter(outFile => outFile.extension === 'example1');
        const expectedExample1Files = additionalExpectedFiles.filter(expectedFile => expectedFile.extension === 'example1');
        expect(outputExample1Files.length).toEqual(expectedExample1Files.length);
        expect(outputExample1Files[0].name).toEqual(expectedExample1Files[0].name);
        expect(outputExample1Files[0].content).toEqual(expectedExample1Files[0].content);

        const output1Files = additionalOutputFiles.filter(outFile => outFile.extension === '1')
                                                .sort((outFile1, outFile2) => sortFileNames(outFile1.name, outFile2.name));
        const expected1Files = additionalExpectedFiles.filter(expectedFile => expectedFile.extension === '1')
                                                .sort((expectedFile1, expectedFile2) => sortFileNames(expectedFile1.name, expectedFile2.name));
        expect(output1Files.length).toEqual(expected1Files.length);
        expect(output1Files[0].name).toEqual(expected1Files[0].name);
        expect(output1Files[0].content).toEqual(expected1Files[0].content);
        expect(output1Files[1].name).toEqual(expected1Files[1].name);
        expect(output1Files[1].content).toEqual(expected1Files[1].content);

        const allOutputFolders : string[] = [];
        await getAllFolders(outputFolderPath, allOutputFolders);

        const allExpectedFolders : string[] = [];
        await getAllFolders(outputFolderPath, allExpectedFolders);

        expect(allOutputFolders.length).toEqual(allExpectedFolders.length);

        const sortedAllOutputFolders = allOutputFolders.sort((dir1, dir2) => sortFileNames(dir1, dir2));
        const sortedAllExpectedFolders = allOutputFolders.sort((dir1, dir2) => sortFileNames(dir1, dir2));
        for (let i = 0; i < sortedAllExpectedFolders.length; i++) {
            expect(sortedAllOutputFolders[i]).toEqual(sortedAllExpectedFolders[i]);
        }
    });

});

describe('Interface transformation functional tests', () => {

    it('Should transform one file with Client Server Interfaces', async () => {
        await performTest('interface/oneFileClientServerInterfaces');
    });

    it('Should transform one file with Sender Receiver Interfaces', async () => {
        await performTest('interface/oneFileSenderReceiverInterfaces');
    });

    it('Should transform multiple files with Client Server Interfaces', async () => {
        await performTest('interface/multipleFilesClientServerInterfaces');
    });

    it('Should transform multiple files with Sender Receiver Interfaces', async () => {
        await performTest('interface/multipleFilesSenderReceiverInterfaces');
    });

    it('Should transform one file with different Interfaces', async () => {
        await performTest('interface/oneFileDifferentInterfaces');
    });

    it('Should transform multiple files with different Interfaces', async () => {
        await performTest('interface/multipleFilesDifferentInterfaces');
    });

});

describe('Software component transformation functional tests', () => {

    it('Should transform one file with Application Software Components', async () => {
        await performTest('swc/oneFileApplicationSwcs');
    });

    it('Should transform multiple files with Application Software Components', async () => {
        await performTest('swc/multipleFilesApplicationSwcs');
    });

});

describe('Port transformation functional tests', () => {

    it('Should transform one file with ports', async () => {
        await performTest('swc_port/oneFilePorts');
    });

    it('Should transform multiple files with ports including cross-document references', async () => {
        await performTest('swc_port/multipleFilesPorts');
    });

});

async function performTest(relativeFolderPath : string, options ?: { doClearFilesAndEmptyFolders ?: true}) {
    const targetFolderPath = path.resolve(baseTargetFolderPath, relativeFolderPath);
    const arlangFolderPath = path.resolve(baseArlangFolderPath, relativeFolderPath);

    const arxmlFilesHolder : FileTestHelper[] = [];
    await getAllFiles(targetFolderPath, ['arxml'], arxmlFilesHolder);
    let mockArxmlFsUris : Uri[] = arxmlFilesHolder.map((arxmlFile : FileTestHelper) => {
        let mockArxmlFsPath = path.resolve(targetFolderPath, arxmlFile.relativePath , arxmlFile.name + '.arxml');
        let mockArxmlFsUri = {
            fsPath : mockArxmlFsPath
        } as unknown as Uri;

        return mockArxmlFsUri;
    });

    vi.spyOn(metadataTransformation, "initArxmlToMetadataTransformation");
    vi.spyOn(vscodeHelperFunctions, "getWorkspaceFiles").mockResolvedValue(mockArxmlFsUris);
    vi.spyOn(vscodeHelperFunctions, "showNoARPackageFound").mockImplementation(() => {});
    vi.spyOn(vscodeHelperFunctions, "showTransformationError").mockImplementation(() => {});
    vi.spyOn(vscodeHelperFunctions, "showTransformationDone").mockImplementation(() => {});

    if (options?.doClearFilesAndEmptyFolders === undefined) { // if doClearFilesAndEmptyFolders is not specified, then mock that function
        /**
         * Arlang folder should be 'cleared' only if it exists.
         * Arlang folder may not exist during transformation only during test or in ci/cd environment.
         * If that is the case, if it is not mocked it will give the error that file/folder does not exist.
         */
        await fsPromise.stat(arlangFolderPath).then(() => {})
                                            .catch(() => vi.spyOn(transformationGeneral, "clearFilesAndEmptyFolders").mockResolvedValue());
    }

    await transformation.transform(targetFolderPath, arlangFolderPath);

    expect(metadataTransformation.initArxmlToMetadataTransformation).toHaveBeenCalled();

    expect(vscodeHelperFunctions.getWorkspaceFiles).toHaveBeenCalled();
    expect(vscodeHelperFunctions.showNoARPackageFound).not.toHaveBeenCalled();
    expect(vscodeHelperFunctions.showTransformationError).not.toHaveBeenCalled();
    expect(vscodeHelperFunctions.showTransformationDone).toHaveBeenCalled();

    const transformedFilesFolderPath = path.resolve(__dirname, '../../../test-output/arxmlToArlang', relativeFolderPath);
    const expectedFilesFolderPath = path.resolve(__dirname, '../../../test-expected/arxmlToArlang', relativeFolderPath);

    const transformedArlangFilesHolder : FileTestHelper[] = [];
    await getAllFiles(transformedFilesFolderPath, ['arlang'], transformedArlangFilesHolder);

    const expectedArlangFilesHolder : FileTestHelper[] = [];
    await getAllFiles(expectedFilesFolderPath, ['arlang'], expectedArlangFilesHolder);

    expect(transformedArlangFilesHolder.length).toEqual(expectedArlangFilesHolder.length);

    for (let i = 0; i < transformedArlangFilesHolder.length; i++) {
        const transformedFile = transformedArlangFilesHolder[i];
        const expectedFile = expectedArlangFilesHolder[i];

        expect(transformedFile.name).toEqual(expectedFile.name);
        expect(transformedFile.relativePath, `File path is different for file ${transformedFile.name}.arlang`).toEqual(expectedFile.relativePath);
        expect(transformedFile.content, `File conent is different for file: ${transformedFile.name}.arlang`).toEqual(expectedFile.content);
    }

    const transformedMetadataFilesHolder : FileTestHelper[] = [];
    await getAllFiles(path.join(transformedFilesFolderPath, '.arlang'), ['json'], transformedMetadataFilesHolder);

    const expectedMetadataFilesHolder : FileTestHelper[] = [];
    await getAllFiles(path.join(expectedFilesFolderPath, '.arlang'), ['json'], expectedMetadataFilesHolder);

    expect(transformedMetadataFilesHolder.length).toEqual(expectedMetadataFilesHolder.length);
    for (let i = 0 ; i < transformedMetadataFilesHolder.length; i++) {
        const transformedFile = transformedMetadataFilesHolder[i];
        const expectedFile = expectedMetadataFilesHolder[i];

        expect(transformedFile.name).toEqual(expectedFile.name);
        expect(transformedFile.relativePath, `File path is different for file ${transformedFile.name}.json`).toEqual(expectedFile.relativePath);
        expect(transformedFile.content, `File conent is different for file: ${transformedFile.name}.json`).toEqual(expectedFile.content);
    }
}

async function performTestWhenNoARPackageExists(relativeFolderPath : string) {
    const targetFolderPath = path.resolve(baseTargetFolderPath, relativeFolderPath);
    const arlangFolderPath = path.resolve(baseArlangFolderPath, relativeFolderPath);

    const arxmlFilesHolder : FileTestHelper[] = [];
    await getAllFiles(targetFolderPath, ['arxml'], arxmlFilesHolder);
    let mockArxmlFsUris : Uri[] = arxmlFilesHolder.map((arxmlFile : FileTestHelper) => {
        let mockArxmlFsPath = path.resolve(targetFolderPath, arxmlFile.relativePath , arxmlFile.name + '.arxml');
        let mockArxmlFsUri = {
            fsPath : mockArxmlFsPath
        } as unknown as Uri;

        return mockArxmlFsUri;
    });

    vi.spyOn(metadataTransformation, "initArxmlToMetadataTransformation");
    vi.spyOn(vscodeHelperFunctions, "getWorkspaceFiles").mockResolvedValue(mockArxmlFsUris);
    vi.spyOn(vscodeHelperFunctions, "showNoARPackageFound").mockImplementation(() => {});
    vi.spyOn(vscodeHelperFunctions, "showTransformationError").mockImplementation(() => {});
    vi.spyOn(vscodeHelperFunctions, "showTransformationDone").mockImplementation(() => {});

    /**
     * Arlang folder should be 'cleared' only if it exists.
     * Arlang folder may not exist during transformation only during test or in ci/cd environment.
     * If that is the case, if it is not mocked it will give the error that file/folder does not exist.
     */
    await fsPromise.stat(arlangFolderPath).then(() => {})
                                    .catch(() => vi.spyOn(transformationGeneral, "clearFilesAndEmptyFolders").mockResolvedValue());

    await transformation.transform(targetFolderPath, arlangFolderPath);

    expect(metadataTransformation.initArxmlToMetadataTransformation).toHaveBeenCalled();

    expect(vscodeHelperFunctions.getWorkspaceFiles).toHaveBeenCalled();
    expect(vscodeHelperFunctions.showNoARPackageFound).toHaveBeenCalled();
    expect(vscodeHelperFunctions.showTransformationError).not.toHaveBeenCalled();
    expect(vscodeHelperFunctions.showTransformationDone).toHaveBeenCalled();

    const transformedFilesFolderPath = path.resolve(__dirname, '../../../test-output/arxmlToArlang', relativeFolderPath);
    const expectedFilesFolderPath = path.resolve(__dirname, '../../../test-expected/arxmlToArlang', relativeFolderPath);

    const transformedArlangFilesHolder : FileTestHelper[] = [];
    await getAllFiles(transformedFilesFolderPath, ['arlang'], transformedArlangFilesHolder);

    const expectedArlangFilesHolder : FileTestHelper[] = [];
    await getAllFiles(expectedFilesFolderPath, ['arlang'], expectedArlangFilesHolder);

    expect(transformedArlangFilesHolder.length).toEqual(expectedArlangFilesHolder.length);

    for (let i = 0; i < transformedArlangFilesHolder.length; i++) {
        const transformedFile = transformedArlangFilesHolder[i];
        const expectedFile = expectedArlangFilesHolder[i];

        expect(transformedFile.name).toEqual(expectedFile.name);
        expect(transformedFile.relativePath, `File path is different for file ${transformedFile.name}.arlang`).toEqual(expectedFile.relativePath);
        expect(transformedFile.content, `File ${transformedFile.name}.arlang should be empty`).toEqual('');
    }

    const transformedMetadataFilesHolder : FileTestHelper[] = [];
    await getAllFiles(path.join(transformedFilesFolderPath, '.arlang'), ['json'], transformedMetadataFilesHolder);

    const expectedMetadataFilesHolder : FileTestHelper[] = [];
    await getAllFiles(path.join(expectedFilesFolderPath, '.arlang'), ['json'], expectedMetadataFilesHolder);

    expect(transformedMetadataFilesHolder.length).toEqual(expectedMetadataFilesHolder.length);
    for (let i = 0 ; i < transformedMetadataFilesHolder.length; i++) {
        const transformedFile = transformedMetadataFilesHolder[i];
        const expectedFile = expectedMetadataFilesHolder[i];

        expect(transformedFile.name).toEqual(expectedFile.name);
        expect(transformedFile.relativePath, `File path is different for file ${transformedFile.name}.json`).toEqual(expectedFile.relativePath);
        expect(transformedFile.content, `File ${transformedFile.name}.json should contain empty array`).toEqual('[]');
    }
}
