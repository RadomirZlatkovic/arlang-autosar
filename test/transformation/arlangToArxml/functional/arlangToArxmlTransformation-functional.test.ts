import { describe, expect, it } from "vitest";
import * as transformation from '../../../../src/transformation/arlangToArxml/arlangToArxmlTransformation.js';
import * as vscodeHelperFunctions from '../../../../src/transformation/vscodeHelperFunctions.js';
import * as arxmlToArlangTransformation from '../../../../src/transformation/arxmlToArlang/arxmlToArlangTransformation.js';
import * as arlangToArxmlTransformationFlowHelper from '../../../../src/transformation/arlangToArxml/arlangToArxmlTransformationFlowHelper.js';
import { Uri } from 'vscode';
import { vi } from 'vitest';
import path from 'path';
import * as fs from 'fs';
import * as fsExtra from 'fs-extra';
import { FileTestHelper, getAllFiles } from '../../../test-helper.js';
import { fail } from 'assert';

const baseArlangFolderPath = path.resolve(__dirname, '../../../test-input/arlangToArxml');
const baseTargetFolderPath = path.resolve(__dirname, '../../../test-output/arlangToArxml');

describe('Package transformation functional tests', () => {

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

describe('Interface transformation functional tests', () => {

    it('Should report error when arlangModId is not found', async () => {
        await performTestArlangModIdNotFound('interface/noArlangModIdFound');
    });

    it('Should transform one file with Client Server Interfaces', async () => {
        const relativePath = 'interface/oneFileClientServerInterfaces';

        copyFilesUsedAsBaseForModification(relativePath);

        await performTest(relativePath, { withModifications : true });
    });

    it('Should transform one file with Sender Receiver Interfaces', async () => {
        const relativePath = 'interface/oneFileSenderReceiverInterfaces';

        copyFilesUsedAsBaseForModification(relativePath);

        await performTest(relativePath, { withModifications : true });
    });

    it('Should transform multiple files with Client Server Interfaces', async () => {
        const relativePath = 'interface/multipleFilesClientServerInterfaces';

        copyFilesUsedAsBaseForModification(relativePath);

        await performTest(relativePath, { withModifications : true });
    });

    it('Should transform multiple files with Sender Receiver Interfaces', async () => {
        const relativePath = 'interface/multipleFilesSenderReceiverInterfaces';

        copyFilesUsedAsBaseForModification(relativePath);

        await performTest(relativePath, { withModifications : true });
    });

    it('Should transform one file with different Interfaces', async () => {
        const relativePath = 'interface/oneFileDifferentInterfaces';

        copyFilesUsedAsBaseForModification(relativePath);

        await performTest(relativePath, { withModifications : true });
    });

    it('Should transform multiple files with different Interfaces', async () => {
        const relativePath = 'interface/multipleFilesDifferentInterfaces';

        copyFilesUsedAsBaseForModification(relativePath);

        await performTest(relativePath, { withModifications : true });
    });

});

describe('Software component transformation functional tests', () => {

    it('Should transform one file with Application Software Components', async () => {
        const relativePath = 'swc/oneFileApplicationSwcs';

        copyFilesUsedAsBaseForModification(relativePath);

        await performTest(relativePath, { withModifications : true });
    });

    it('Should transform multiple files with Application Software Components', async () => {
        const relativePath = 'swc/multipleFilesApplicationSwcs';

        copyFilesUsedAsBaseForModification(relativePath);

        await performTest(relativePath, { withModifications : true });
    });

});

describe('Port transformation functional tests', () => {

    it('Should transform one file with ports', async () => {
        const relativePath = 'swc_port/oneFilePorts';

        copyFilesUsedAsBaseForModification(relativePath);

        await performTest(relativePath, { withModifications : true });
    });

    it('Should transform multiple files with ports including cross-document references', async () => {
        const relativePath = 'swc_port/multipleFilesPorts';

        copyFilesUsedAsBaseForModification(relativePath);

        await performTest(relativePath, { withModifications : true });
    });

});

describe('Elements deletion', () => {

    it('Elements that are given arlangModId but do not appear in arlang file should be deleted', async () => {
        const relativePath = 'deletion/interfaceSwcPortDeletions'

        copyFilesUsedAsBaseForModification(relativePath);

        await performTest(relativePath, { withModifications : true });
    });

});

function copyFilesUsedAsBaseForModification(relativeFolderPath : string) {
    const testInputFolderPath = path.join(baseArlangFolderPath, `${relativeFolderPath}-toCopy`);
    const testOutputFolderPath = path.join(baseTargetFolderPath, relativeFolderPath);

    fs.mkdirSync(testOutputFolderPath, {recursive : true});
    fsExtra.copySync(testInputFolderPath, testOutputFolderPath);
}

async function performTest(relativeFolderPath : string, options ?: { withModifications ?: true }) {
    const arlangFolderPath = path.resolve(baseArlangFolderPath, relativeFolderPath);
    const targetFolderPath = path.resolve(baseTargetFolderPath, relativeFolderPath);

    const arlangFilesHolder : FileTestHelper[] = [];
    await getAllFiles(arlangFolderPath, ['arlang'], arlangFilesHolder);
    let mockArlangFsUris : Uri[] = arlangFilesHolder.map((arlangFile : FileTestHelper) => {
        let mockArlangFsPath = path.resolve(arlangFolderPath, arlangFile.relativePath , arlangFile.name + '.arlang');
        let mockArlangFsUri = {
            fsPath : mockArlangFsPath
        } as unknown as Uri;

        return mockArlangFsUri;
    });

    vi.spyOn(arlangToArxmlTransformationFlowHelper, "initTransformationFlowHelpers");
    vi.spyOn(vscodeHelperFunctions, "getWorkspaceFiles").mockResolvedValue(mockArlangFsUris);
    vi.spyOn(arxmlToArlangTransformation, "transform").mockResolvedValue();
    vi.spyOn(vscodeHelperFunctions, "showMetadataFolderAccessWarning").mockImplementation(() => {});
    vi.spyOn(vscodeHelperFunctions, "showTransformationError").mockImplementation((message) => {fail(`Transformation reported error message: ${message}`)});
    vi.spyOn(vscodeHelperFunctions, "showNoArlangModIdFoundError").mockImplementation((arlangModId) => {fail(`No arlangModId found error reported for id ${arlangModId}`)})
    vi.spyOn(vscodeHelperFunctions, "showTransformationDone").mockImplementation(() => {});

    await transformation.transform(arlangFolderPath, targetFolderPath);

    expect(arlangToArxmlTransformationFlowHelper.initTransformationFlowHelpers).toHaveBeenCalled();
    expect(vscodeHelperFunctions.getWorkspaceFiles).toHaveBeenCalled();
    expect(arxmlToArlangTransformation.transform).toHaveBeenCalled();

    if (options?.withModifications === undefined) {
        expect(vscodeHelperFunctions.showMetadataFolderAccessWarning).toHaveBeenCalled();
    } else {
        expect(vscodeHelperFunctions.showMetadataFolderAccessWarning).not.toHaveBeenCalled();
    }

    expect(vscodeHelperFunctions.showTransformationError).not.toHaveBeenCalled();
    expect(vscodeHelperFunctions.showTransformationDone).toHaveBeenCalled();

    const transformedFilesFolderPath = path.resolve(__dirname, '../../../test-output/arlangToArxml', relativeFolderPath);
    const expectedFilesFolderPath = path.resolve(__dirname, '../../../test-expected/arlangToArxml', relativeFolderPath);

    const transformedFilesHolder : FileTestHelper[] = [];
    await getAllFiles(transformedFilesFolderPath, ['arxml'], transformedFilesHolder);

    const expectedFilesHolder : FileTestHelper[] = [];
    await getAllFiles(expectedFilesFolderPath, ['arxml'], expectedFilesHolder);

    expect(transformedFilesHolder.length).toEqual(expectedFilesHolder.length);

    for (let i = 0; i < transformedFilesHolder.length; i++) {
        const transformedFile = transformedFilesHolder[i];
        const expectedFile = expectedFilesHolder[i];

        expect(transformedFile.name).toEqual(expectedFile.name);
        expect(transformedFile.relativePath, `File path is different for file ${transformedFile.name}.arxml`).toEqual(expectedFile.relativePath);
        expect(transformedFile.content, `File conent is different for file: ${transformedFile.name}.arxml`).toEqual(expectedFile.content);
    }
}

async function performTestArlangModIdNotFound(relativeFolderPath : string) {
    const arlangFolderPath = path.resolve(baseArlangFolderPath, relativeFolderPath);
    const targetFolderPath = path.resolve(baseTargetFolderPath, relativeFolderPath);

    const arlangFilesHolder : FileTestHelper[] = [];
    await getAllFiles(arlangFolderPath, ['arlang'], arlangFilesHolder);
    let mockArlangFsUris : Uri[] = arlangFilesHolder.map((arlangFile : FileTestHelper) => {
        let mockArlangFsPath = path.resolve(arlangFolderPath, arlangFile.relativePath , arlangFile.name + '.arlang');
        let mockArlangFsUri = {
            fsPath : mockArlangFsPath
        } as unknown as Uri;

        return mockArlangFsUri;
    });

    vi.spyOn(arlangToArxmlTransformationFlowHelper, "initTransformationFlowHelpers");
    vi.spyOn(vscodeHelperFunctions, "getWorkspaceFiles").mockResolvedValue(mockArlangFsUris);
    vi.spyOn(arxmlToArlangTransformation, "transform").mockResolvedValue();
    vi.spyOn(vscodeHelperFunctions, "showMetadataFolderAccessWarning").mockImplementation(() => {});

    vi.spyOn(vscodeHelperFunctions, "showNoArlangModIdFoundError").mockImplementation(() => { arlangToArxmlTransformationFlowHelper.setErrorOccurredIndication(); });

    vi.spyOn(vscodeHelperFunctions, "showTransformationError").mockImplementation(() => {});
    vi.spyOn(vscodeHelperFunctions, "showTransformationDone").mockImplementation(() => {});

    await transformation.transform(arlangFolderPath, targetFolderPath);

    expect(arlangToArxmlTransformationFlowHelper.initTransformationFlowHelpers).toHaveBeenCalled();
    expect(vscodeHelperFunctions.getWorkspaceFiles).toHaveBeenCalled();
    expect(arxmlToArlangTransformation.transform).not.toHaveBeenCalled();
    expect(vscodeHelperFunctions.showMetadataFolderAccessWarning).not.toHaveBeenCalled();

    expect(vscodeHelperFunctions.showNoArlangModIdFoundError).toHaveBeenCalled();

    expect(vscodeHelperFunctions.showTransformationDone).not.toHaveBeenCalled();
}
