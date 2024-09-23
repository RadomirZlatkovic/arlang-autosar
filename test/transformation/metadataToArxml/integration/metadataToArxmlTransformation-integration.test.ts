import { describe, expect, test, it } from "vitest";
import { initMetadataToArxmlTransformation, getArxmlFromRelativePath, getArxmlObject, getRelativeFilePathWithoutExtension, getContainerFQNFromMetadata,
    populateMetadataInfo, getArlangModIdFromArxmlObject,
    getArlangModIdToArxmlObject} from '../../../../src/transformation/metadataToArxml/metadataToArxmlTransformation.js';
import * as path from 'path';
import { vi } from 'vitest';
import * as vscodeHelperFunctions from '../../../../src/transformation/vscodeHelperFunctions.js';

describe('metadataToArxmlTransformation', () => {

    it('Should report error when arxml file does not exist for corresponding metadata file', async () => {
        initMetadataToArxmlTransformation();

        const arxmlFolderPath = path.resolve(__dirname, '../../../test-input/metadataToArxml/invalidData');
        const metadataFolderPath = path.resolve(__dirname, '../../../test-input/metadataToArxml/invalidData/.arlang');

        vi.spyOn(vscodeHelperFunctions, "showMetadataFolderAccessWarning").mockImplementation(() => {});
        vi.spyOn(vscodeHelperFunctions, "showTransformationError").mockImplementation(() => {});

        await populateMetadataInfo(metadataFolderPath, arxmlFolderPath);

        expect(vscodeHelperFunctions.showMetadataFolderAccessWarning).not.toHaveBeenCalled();
        expect(vscodeHelperFunctions.showTransformationError).toHaveBeenCalled();
    });

    test('After using populateMetadataInfo, getters should return proper data and after init they should return default values', async () => {
        initMetadataToArxmlTransformation();
        expect(getArxmlFromRelativePath(`example${path.sep}path`)).toBeUndefined();
        expect(getArxmlObject('arlangModId@0')).toBeUndefined();
        expect(getRelativeFilePathWithoutExtension('arlangModId@0')).toBeUndefined();
        expect(getContainerFQNFromMetadata('arlangModId@0')).toBeUndefined();

        const arxmlFolderPath = path.resolve(__dirname, '../../../test-input/metadataToArxml/validData');
        const metadataFolderPath = path.resolve(__dirname, '../../../test-input/metadataToArxml/validData/.arlang');

        vi.spyOn(vscodeHelperFunctions, "showMetadataFolderAccessWarning").mockImplementation(() => {});
        vi.spyOn(vscodeHelperFunctions, "showTransformationError").mockImplementation(() => {});

        await populateMetadataInfo(metadataFolderPath, arxmlFolderPath);

        expect(vscodeHelperFunctions.showMetadataFolderAccessWarning).not.toHaveBeenCalled();
        expect(vscodeHelperFunctions.showTransformationError).not.toHaveBeenCalled();

        testGetArxmlFromRelativePath('f0', 'initPackage');
        testGetArxmlFromRelativePath(path.join('p1', 'f1'), 'SRIP');
        testGetArxmlFromRelativePath(path.join('p1', 'p2', 'f2'), 'CSIP');

        testGetArlangModIdToArxmlObject();

        testGetArxmlObjectAndGetArlangModIdFromArxmlObject('arlangModId@3', 'ExampleInterface2');
        testGetArxmlObjectAndGetArlangModIdFromArxmlObject('arlangModId@8', 'Sri1');
        testGetArxmlObjectAndGetArlangModIdFromArxmlObject('arlangModId@7', 'Csi3');

        testGetRelativeFilePathWithoutExtension('arlangModId@0', 'f0');
        testGetRelativeFilePathWithoutExtension('arlangModId@9', path.join('p1', 'f1'));
        testGetRelativeFilePathWithoutExtension('arlangModId@6', path.join('p1', 'p2', 'f2'));

        testGetContainerFQNFromMetadata('arlangModId@1', 'initPackage');
        testGetContainerFQNFromMetadata('arlangModId@10', 'SRIP.f');
        testGetContainerFQNFromMetadata('arlangModId@7', 'CSIP.f');

        initMetadataToArxmlTransformation();
        expect(getArxmlFromRelativePath(`example${path.sep}path`)).toBeUndefined();
        expect(getArxmlObject('arlangModId@0')).toBeUndefined();
        expect(getRelativeFilePathWithoutExtension('arlangModId@0')).toBeUndefined();
        expect(getContainerFQNFromMetadata('arlangModId@0')).toBeUndefined();
    });

    function testGetArxmlFromRelativePath(relativePath : string, expectedShortNameValue : string) : void {
        const arxml = getArxmlFromRelativePath(relativePath);
        expect(arxml, `relativePath: ${relativePath}`).not.toBeUndefined();
        expect( arxml!.getElementsByTagName('SHORT-NAME')[0].childNodes[0].textContent! ).toEqual(expectedShortNameValue);
    }

    function testGetArlangModIdToArxmlObject() : void {
        const arlangModIdToArxmlObject = getArlangModIdToArxmlObject();
        testGetArlangModIdToArxmlObjectFromF0(arlangModIdToArxmlObject);
        testGetArlangModIdToArxmlObjectFromF1(arlangModIdToArxmlObject);
        testGetArlangModIdToArxmlObjectFromF2(arlangModIdToArxmlObject);
    }

    function testGetArlangModIdToArxmlObjectFromF0(arlangModIdToArxmlObject: Map<string, Element>) {
        const element0 = arlangModIdToArxmlObject.get('arlangModId@0');
        expect(element0).not.toBeUndefined();
        expect(element0!.tagName).toEqual('SENDER-RECEIVER-INTERFACE');
        expect(getShortNameValue(element0!)).toEqual('ExampleInterface3');

        const element1 = arlangModIdToArxmlObject.get('arlangModId@1');
        expect(element1).not.toBeUndefined();
        expect(element1!.tagName).toEqual('SENDER-RECEIVER-INTERFACE');
        expect(getShortNameValue(element1!)).toEqual('ExampleInterface5');

        const element2 = arlangModIdToArxmlObject.get('arlangModId@2');
        expect(element2).not.toBeUndefined();
        expect(element2!.tagName).toEqual('CLIENT-SERVER-INTERFACE');
        expect(getShortNameValue(element2!)).toEqual('ExampleInterface1');

        const element3 = arlangModIdToArxmlObject.get('arlangModId@3');
        expect(element3).not.toBeUndefined();
        expect(element3!.tagName).toEqual('CLIENT-SERVER-INTERFACE');
        expect(getShortNameValue(element3!)).toEqual('ExampleInterface2');

        const element4 = arlangModIdToArxmlObject.get('arlangModId@4');
        expect(element4).not.toBeUndefined();
        expect(element4!.tagName).toEqual('CLIENT-SERVER-INTERFACE');
        expect(getShortNameValue(element4!)).toEqual('ExampleInterface4');
    }

    function testGetArlangModIdToArxmlObjectFromF1(arlangModIdToArxmlObject: Map<string, Element>) {
        const element8 = arlangModIdToArxmlObject.get('arlangModId@8');
        expect(element8).not.toBeUndefined();
        expect(element8!.tagName).toEqual('SENDER-RECEIVER-INTERFACE');
        expect(getShortNameValue(element8!)).toEqual('Sri1');

        const element9 = arlangModIdToArxmlObject.get('arlangModId@9');
        expect(element9).not.toBeUndefined();
        expect(element9!.tagName).toEqual('SENDER-RECEIVER-INTERFACE');
        expect(getShortNameValue(element9!)).toEqual('Sri2');

        const element10 = arlangModIdToArxmlObject.get('arlangModId@10');
        expect(element10).not.toBeUndefined();
        expect(element10!.tagName).toEqual('SENDER-RECEIVER-INTERFACE');
        expect(getShortNameValue(element10!)).toEqual('Sri3');
    }

    function testGetArlangModIdToArxmlObjectFromF2(arlangModIdToArxmlObject: Map<string, Element>) {
        const element5 = arlangModIdToArxmlObject.get('arlangModId@5');
        expect(element5).not.toBeUndefined();
        expect(element5!.tagName).toEqual('CLIENT-SERVER-INTERFACE');
        expect(getShortNameValue(element5!)).toEqual('Csi1');

        const element6 = arlangModIdToArxmlObject.get('arlangModId@6');
        expect(element6).not.toBeUndefined();
        expect(element6!.tagName).toEqual('CLIENT-SERVER-INTERFACE');
        expect(getShortNameValue(element6!)).toEqual('Csi2');

        const element7 = arlangModIdToArxmlObject.get('arlangModId@7');
        expect(element7).not.toBeUndefined();
        expect(element7!.tagName).toEqual('CLIENT-SERVER-INTERFACE');
        expect(getShortNameValue(element7!)).toEqual('Csi3');
    }

    function testGetArxmlObjectAndGetArlangModIdFromArxmlObject(arlangModId : string, expectedShortNameValue : string) : void {
        const arxmlObject = getArxmlObject(arlangModId);
        expect(arxmlObject, `arlangModId: ${arlangModId}`).not.toBeUndefined();
        expect( getShortNameValue(arxmlObject!) ).toEqual(expectedShortNameValue);

        const returnedArlangModId = getArlangModIdFromArxmlObject(arxmlObject!);
        expect(returnedArlangModId).toEqual(arlangModId);
    }

    function testGetRelativeFilePathWithoutExtension(arlangModId : string, expectedRelativeFilePathWithoutExtension : string) : void {
        const relativeFilePath = getRelativeFilePathWithoutExtension(arlangModId);
        expect(relativeFilePath, `arlangModId: ${arlangModId}`).not.toBeUndefined();
        expect(relativeFilePath!).toEqual(expectedRelativeFilePathWithoutExtension);
    }

    function testGetContainerFQNFromMetadata(arlangModId : string, expectedContainerFQN : string) : void {
        const containerFQN = getContainerFQNFromMetadata(arlangModId);
        expect(containerFQN, `arlangModId: ${arlangModId}`).not.toBeUndefined();
        expect(containerFQN!).toEqual(expectedContainerFQN);
    }

    function getShortNameValue(element : Element) {
        return element.getElementsByTagName('SHORT-NAME')[0].childNodes[0].textContent!
    }

});
