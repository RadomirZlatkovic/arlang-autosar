import { describe, expect, it } from "vitest";
import { getFirstChildElementByTagNameInsideArxmlObject, getChildElementsByTagNameInsideArxmlObject, getElementAfterShortName,
    createShortNameElement, getArxmlReferencePath, initializeModels, cloneElement,
    getArxmlTagNameFromArlangInterfaceType, checkSameContainerFQNAndRelativeFilePath, 
    getArxmlTagNameFromArlangPortType,
    getArxmlInterfaceTrefTagNameFromArlangPortType} from '../../../../src/transformation/arlangToArxml/arlangToArxmlGeneral.js';
import { createArlangModel } from '../../../test-helper.js'
import { isInterface, Interface as ArlangInterface, isSwComponent, SwComponent } from '../../../../src/language/generated/ast.js';
import { DOMParser } from '@xmldom/xmldom';
import path from 'path';
import { ClonedChildData } from '../../../../src/transformation/arlangToArxml/arlangToArxmlTransformationFlowHelper.js';
import * as metadataToArxmlTransformation from '../../../../src/transformation/metadataToArxml/metadataToArxmlTransformation.js';
import { vi } from 'vitest';

describe('getChildElementsByTagNameInsideArxmlObject', () => {

    it ('Should return empty list if no child contains specified tag name', () => {
        const arxmlContent =
`<AUTOSAR>
	<AR-PACKAGES>
		<AR-PACKAGE>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>
`

		const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
		const arPackage = arxml.getElementsByTagName('AR-PACKAGE')[0];

		expect(getChildElementsByTagNameInsideArxmlObject(arPackage, 'EXAMPLE-TAG-NAME').length).toEqual(0);
    });

	it ('Should return elements with specified tag name (only inside specified object)', () => {
        const testTagName = 'TEST-TAG-NAME';
        const arxmlContent =
`<AUTOSAR>
	<AR-PACKAGES>
		<AR-PACKAGE>
            <EXAMPLE-COLLECTION1>
                <${testTagName}>
                </${testTagName}>
            </EXAMPLE-COLLECTION1>
            </EXAMPLE-COLLECTION>
			<${testTagName}>
			</${testTagName}>
            <${testTagName}>
                <EXAMPLE-COLLECTION2>
                    <${testTagName}>
                    </${testTagName}>
                </EXAMPLE-COLLECTION2>
			</${testTagName}>
            <${testTagName}>
			</${testTagName}>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>
`

		const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
		const arPackage = arxml.getElementsByTagName('AR-PACKAGE')[0];

        const childElements = getChildElementsByTagNameInsideArxmlObject(arPackage, 'TEST-TAG-NAME');

		expect(childElements.length).toEqual(3);
        expect(childElements[0]).toBe(arxml.getElementsByTagName(testTagName)[1]);
        expect(childElements[1]).toBe(arxml.getElementsByTagName(testTagName)[2]);
        expect(childElements[2]).toBe(arxml.getElementsByTagName(testTagName)[4]);
    });

});

describe('getFirstChildElementByTagNameInsideArxmlObject', () => {

    it ('Should return null if no child contains specified tag name', () => {
        const arxmlContent =
`<AUTOSAR>
	<AR-PACKAGES>
		<AR-PACKAGE>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>
`

		const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
		const arPackage = arxml.getElementsByTagName('AR-PACKAGE')[0];

		expect(getFirstChildElementByTagNameInsideArxmlObject(arPackage, 'EXAMPLE-TAG-NAME')).toBeNull();
    });

	it ('Should return element with specified tag name', () => {
        const arxmlContent =
`<AUTOSAR>
	<AR-PACKAGES>
		<AR-PACKAGE>
			<ELEMENTS>
			</ELEMENTS>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>
`

		const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
		const arPackage = arxml.getElementsByTagName('AR-PACKAGE')[0];
		const elementsArxmlObject = arxml.getElementsByTagName('ELEMENTS')[0];

		expect(getFirstChildElementByTagNameInsideArxmlObject(arPackage, 'ELEMENTS')).toBe(elementsArxmlObject);
    });

});

describe('getElementAfterShortName', () => {

    it ('Should return null if no elemenet after SHORT-NAME element exists', () => {
        let arxmlContent =
`<AUTOSAR>
	<AR-PACKAGES>
		<AR-PACKAGE>
            <SENDER-RECEIVER-INTERFACE>
                <SHORT-NAME>A</SHORT-NAME>
            </SENDER-RECEIVER-INTERFACE>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>
`
		let arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
		let sri = arxml.getElementsByTagName('SENDER-RECEIVER-INTERFACE')[0];
		expect(getElementAfterShortName(sri)).toBeNull();

        arxmlContent =
`<AUTOSAR>
	<AR-PACKAGES>
		<AR-PACKAGE>
            <SENDER-RECEIVER-INTERFACE>
                <SHORT-NAME>A</SHORT-NAME>


            </SENDER-RECEIVER-INTERFACE>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>
`
		arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
		sri = arxml.getElementsByTagName('SENDER-RECEIVER-INTERFACE')[0];
		expect(getElementAfterShortName(sri)).toBeNull();
    });

    it ('Should return element after SHORT-NAME element', () => {
        const arxmlContent =
`<AUTOSAR>
	<AR-PACKAGES>
		<AR-PACKAGE>
            <CLIENT-SERVER-INTERFACE>
                <SHORT-NAME>A</SHORT-NAME>
                <EXAMPLE-TAG>
                </EXAMPLE-TAG>
                <EXAMPLE-TAG>
                </EXAMPLE-TAG>
                <EXAMPLE-TAG1>
                </EXAMPLE-TAG1>
            </CLIENT-SERVER-INTERFACE>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>
`
		const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
		const sri = arxml.getElementsByTagName('CLIENT-SERVER-INTERFACE')[0];
		expect(getElementAfterShortName(sri)).toBe(arxml.getElementsByTagName('EXAMPLE-TAG')[0]);
    });

});

describe('cloneElement', () => {

    it ('Should create same element with specified tag name', () => {
        const arxmlContent =
`<AUTOSAR>
	<AR-PACKAGES>
		<AR-PACKAGE>
            <CLIENT-SERVER-INTERFACE>
                <SHORT-NAME>A</SHORT-NAME>
                <ELEMENT-TO-CLONE attr1="val1" attr2="val2">
                    <NESTED-ELEMENT-TO-CLONE1>
                        <NESTED-ELEMENT-TO-CLONE2 exampleAttr1="exampleAttr1V" exampleAttr2="exampleAttr2V" exampleAttr3="exampleAttr3V">Value</NESTED-ELEMENT-TO-CLONE2>
                    </NESTED-ELEMENT-TO-CLONE1>
                    <EMPTY-COLLECTION>
                    </EMPTY-COLLECTION>
                </ELEMENT-TO-CLONE>
            </CLIENT-SERVER-INTERFACE>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>
`
		const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const elementToClone = arxml.getElementsByTagName('ELEMENT-TO-CLONE')[0];
        const clonedElement = cloneElement(arxml, elementToClone, 'NEW-ELEMENT-TAG-NAME');

        expect(clonedElement.tagName).toEqual('NEW-ELEMENT-TAG-NAME');

        let attributes = clonedElement.attributes;
        expect(attributes.length).toEqual(2);
        expect(attributes[0].name).toEqual('attr1');
        expect(attributes[0].value).toEqual('val1');
        expect(attributes[1].name).toEqual('attr2');
        expect(attributes[1].value).toEqual('val2');

        const clonedElementChilds = getElementNodesFromChildNodes(clonedElement.childNodes);
        expect(clonedElementChilds.length).toEqual(2);

        const nestedElement1 = clonedElementChilds[0];
        expect(nestedElement1.tagName).toEqual('NESTED-ELEMENT-TO-CLONE1');
        expect(nestedElement1.attributes.length).toEqual(0);

        const emptyCollection = clonedElementChilds[1];
        expect(emptyCollection.tagName).toEqual('EMPTY-COLLECTION');
        expect(emptyCollection.attributes.length).toEqual(0);

        const nestedElement1Childs = getElementNodesFromChildNodes(nestedElement1.childNodes);
        expect(nestedElement1Childs.length).toEqual(1);

        const nestedElement2 = nestedElement1Childs[0];
        expect(nestedElement2.tagName).toEqual('NESTED-ELEMENT-TO-CLONE2');
        expect(nestedElement2.childNodes[0].textContent).toEqual('Value');

        attributes = nestedElement2.attributes;
        expect(attributes[0].name).toEqual('exampleAttr1');
        expect(attributes[0].value).toEqual('exampleAttr1V');
        expect(attributes[1].name).toEqual('exampleAttr2');
        expect(attributes[1].value).toEqual('exampleAttr2V');
        expect(attributes[2].name).toEqual('exampleAttr3');
        expect(attributes[2].value).toEqual('exampleAttr3V');

        expect(getElementNodesFromChildNodes(nestedElement2.childNodes).length).toEqual(0);

        expect(getElementNodesFromChildNodes(emptyCollection.childNodes).length).toEqual(0);
    });

    it ('Should create same element with specified tag name and return cloned childs', () => {
        const arxmlContent =
`<AUTOSAR>
	<AR-PACKAGES>
		<AR-PACKAGE>
            <CLIENT-SERVER-INTERFACE>
                <SHORT-NAME>A</SHORT-NAME>
                <ELEMENT-TO-CLONE attr1="val1" attr2="val2">
                    <NESTED-ELEMENT-TO-CLONE1>
                        <NESTED-ELEMENT-TO-CLONE2 exampleAttr1="exampleAttr1V" exampleAttr2="exampleAttr2V" exampleAttr3="exampleAttr3V">Value</NESTED-ELEMENT-TO-CLONE2>
                    </NESTED-ELEMENT-TO-CLONE1>
                    <EMPTY-COLLECTION>
                    </EMPTY-COLLECTION>
                </ELEMENT-TO-CLONE>
            </CLIENT-SERVER-INTERFACE>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>
`
		const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const elementToClone = arxml.getElementsByTagName('ELEMENT-TO-CLONE')[0];
        const clonedChilds : ClonedChildData[] = [];

        vi.spyOn(metadataToArxmlTransformation, "getArlangModIdFromArxmlObject")
                                                                .mockReturnValueOnce('arlangModId@0')
                                                                .mockReturnValueOnce('arlangModId@1')
                                                                .mockReturnValueOnce('arlangModId@2');

        const clonedElement = cloneElement(arxml, elementToClone, 'NEW-ELEMENT-TAG-NAME', clonedChilds);

        expect(clonedElement.tagName).toEqual('NEW-ELEMENT-TAG-NAME');

        let attributes = clonedElement.attributes;
        expect(attributes.length).toEqual(2);
        expect(attributes[0].name).toEqual('attr1');
        expect(attributes[0].value).toEqual('val1');
        expect(attributes[1].name).toEqual('attr2');
        expect(attributes[1].value).toEqual('val2');

        const clonedElementChilds = getElementNodesFromChildNodes(clonedElement.childNodes);
        expect(clonedElementChilds.length).toEqual(2);

        const nestedElement1 = clonedElementChilds[0];
        expect(nestedElement1.tagName).toEqual('NESTED-ELEMENT-TO-CLONE1');
        expect(nestedElement1.attributes.length).toEqual(0);

        const emptyCollection = clonedElementChilds[1];
        expect(emptyCollection.tagName).toEqual('EMPTY-COLLECTION');
        expect(emptyCollection.attributes.length).toEqual(0);

        const nestedElement1Childs = getElementNodesFromChildNodes(nestedElement1.childNodes);
        expect(nestedElement1Childs.length).toEqual(1);

        const nestedElement2 = nestedElement1Childs[0];
        expect(nestedElement2.tagName).toEqual('NESTED-ELEMENT-TO-CLONE2');
        expect(nestedElement2.childNodes[0].textContent).toEqual('Value');

        attributes = nestedElement2.attributes;
        expect(attributes[0].name).toEqual('exampleAttr1');
        expect(attributes[0].value).toEqual('exampleAttr1V');
        expect(attributes[1].name).toEqual('exampleAttr2');
        expect(attributes[1].value).toEqual('exampleAttr2V');
        expect(attributes[2].name).toEqual('exampleAttr3');
        expect(attributes[2].value).toEqual('exampleAttr3V');

        expect(getElementNodesFromChildNodes(nestedElement2.childNodes).length).toEqual(0);

        expect(getElementNodesFromChildNodes(emptyCollection.childNodes).length).toEqual(0);

        expect(clonedChilds.length).toEqual(3);

        expect(clonedChilds[0].arlangModId).toEqual('arlangModId@0');
        expect(clonedChilds[0].clonedArxmlObject.tagName).toEqual('NESTED-ELEMENT-TO-CLONE2');
        expect(clonedChilds[0].transformed).toEqual(false);

        expect(clonedChilds[1].arlangModId).toEqual('arlangModId@1');
        expect(clonedChilds[1].clonedArxmlObject.tagName).toEqual('NESTED-ELEMENT-TO-CLONE1');
        expect(clonedChilds[1].transformed).toEqual(false);

        expect(clonedChilds[2].arlangModId).toEqual('arlangModId@2');
        expect(clonedChilds[2].clonedArxmlObject.tagName).toEqual('EMPTY-COLLECTION');
        expect(clonedChilds[2].transformed).toEqual(false);
    });

    function getElementNodesFromChildNodes(childNodes: NodeListOf<ChildNode>) : Element[] {
        const elementChilds : Element[] = [];
        for (let i = 0; i < childNodes.length; i++) {
            const childNode = childNodes[i];

            if (childNode.nodeType === 1) { // if nodeType is Element
                elementChilds.push(childNode as Element);
            }
        }

        return elementChilds;
    }

});

describe('createShortNameElement', () => {

    it ('Should create short name element', () => {
        const arxmlContent =
`<AUTOSAR>
	<AR-PACKAGES>
		<AR-PACKAGE>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>
`
		const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');

        const textValue = 'ExampleShortNameValue';
        const shortNameElement = createShortNameElement(arxml, textValue);

        expect(shortNameElement.tagName).toEqual('SHORT-NAME');

        const childNodes = shortNameElement.childNodes;
        expect(childNodes.length).toEqual(1);

        expect(childNodes[0].textContent).toEqual(textValue);
    });

});

describe('getArxmlTagNameFromArlangPortType', () => {

    it ('Should return P-PORT-PROTOTYPE', () => {
        expect(getArxmlTagNameFromArlangPortType('provided')).toEqual('P-PORT-PROTOTYPE');
    });

    it ('Should return R-PORT-PROTOTYPE', () => {
        expect(getArxmlTagNameFromArlangPortType('required')).toEqual('R-PORT-PROTOTYPE');
    });

});

describe('getArxmlInterfaceTrefTagNameFromArlangPortType', () => {

    it ('Should return PROVIDED-INTERFACE-TREF', () => {
        expect(getArxmlInterfaceTrefTagNameFromArlangPortType('provided')).toEqual('PROVIDED-INTERFACE-TREF');
    });

    it ('Should return REQUIRED-INTERFACE-TREF', () => {
        expect(getArxmlInterfaceTrefTagNameFromArlangPortType('required')).toEqual('REQUIRED-INTERFACE-TREF');
    });

});

describe('getArxmlTagNameFromArlangInterfaceType', () => {

    it ('Should return SENDER-RECEIVER-INTERFACE', () => {
        expect(getArxmlTagNameFromArlangInterfaceType('senderReceiver')).toEqual('SENDER-RECEIVER-INTERFACE');
    });

    it ('Should return CLIENT-SERVER-INTERFACE', () => {
        expect(getArxmlTagNameFromArlangInterfaceType('clientServer')).toEqual('CLIENT-SERVER-INTERFACE');
    });

});

describe('checkSameContainerFQNAndRelativeFilePath', () => {

    it ('Should return false when packages are different', () => {
        expect(checkSameContainerFQNAndRelativeFilePath('p1.p2.p3', 'a/b/c', 'p1.p2', 'a/b/c')).toEqual(false);
    });

    it ('Should return false when relative file paths are different', () => {
        expect(checkSameContainerFQNAndRelativeFilePath('p1.p2.p3', 'a/b/c', 'p1.p2.p3', 'a/b/d')).toEqual(false);
    });

    it ('Should return true when packages are the same and file paths are the same', () => {
        expect(checkSameContainerFQNAndRelativeFilePath('p1.p2.p3', 'a1/b2/c3', 'p1.p2.p3', 'a1/b2/c3')).toEqual(true);
    });

});

describe('getArxmlReferencePath', () => {

    it('Should return empty string when Arlang Package is not passed without name', () => {
        expect( getArxmlReferencePath(undefined) ).toEqual('');
    });

    it('Should return reference path when Arlang Package is not passed with one name', () => {
        const name = 'ExampleName';

        expect( getArxmlReferencePath([name]) ).toEqual(`/ExampleName`);
    });

    it('Should return reference path when Arlang Package is not passed with multiple names', () => {
        const names = ['n1', 'N2', '3'];

        expect( getArxmlReferencePath(names) ).toEqual('/n1/N2/3');
    });

    it('Should return reference path when Arlang Package is passed without name', async () => {
        const model = await createArlangModel(`
#package p1.p2.p3
#end`);
        const packages = model.packages;

        expect( getArxmlReferencePath(undefined, packages[0]) ).toEqual('/p1/p2/p3');
    });

    it('Should return reference path when Arlang Package is passed with one name', async () => {
        const model = await createArlangModel(`
#package a.b.c
#end`);
        const packages = model.packages;

        const name = 'IName'

        expect( getArxmlReferencePath([name], packages[0]) ).toEqual('/a/b/c/IName');
    });

    it('Should return reference path when Arlang Package is passed with multiple names', async () => {
        const model = await createArlangModel(`
#package collection.union
#end`);
        const packages = model.packages;

        const names = ['IName', 's1', 'SWC'];

        expect( getArxmlReferencePath(names, packages[0]) ).toEqual('/collection/union/IName/s1/SWC');
    });

});

describe('initializeModels', () => {

    const baseFolderPath = path.resolve(__dirname, '../../../test-input/arlangToArxml/initialization');

    it('Should initialize one model', async () => {
        const folderPath = path.resolve(baseFolderPath, 'oneFile');
        const filePath = path.join(folderPath, 'example.arlang');

        const models = await initializeModels([filePath]);

        expect(models.length).toEqual(1);

        const packages = models[0].packages;
        expect(packages.length).toEqual(1);
        expect(packages[0].name).toEqual('a');
    });

    it('Should initialize multiple models', async () => {
        const folderPath = path.resolve(baseFolderPath, 'multipleFiles');
        const filePathOne = path.join(folderPath, 'one.arlang');
        const filePathTwo = path.join(folderPath, 'two.arlang');
        const filePathThree = path.join(folderPath, 'three.arlang');

        const models = await initializeModels([filePathOne, filePathTwo, filePathThree]);

        expect(models.length).toEqual(3);

        // check package of first file
        let packages = models[0].packages;
        expect(packages.length).toEqual(1);
        expect(packages[0].name).toEqual('one');

        // check package of second file
        packages = models[1].packages;
        expect(packages.length).toEqual(1);
        expect(packages[0].name).toEqual('two');

        // check package of three file
        packages = models[2].packages;
        expect(packages.length).toEqual(1);
        expect(packages[0].name).toEqual('three');
    });

    it('Should initialize multiple models with cross document references', async () => {
        const folderPath = path.resolve(baseFolderPath, 'multipleFilesReferences');
        const swcFile = path.join(folderPath, 'swc.arlang');
        const iFile = path.join(folderPath, 'i.arlang');
        const i1File = path.join(folderPath, 'p1', 'i1.arlang');
        const i2File = path.join(folderPath, 'p1', 'p2', 'i2.arlang');

        const models = await initializeModels([iFile, swcFile, i1File, i2File]);

        expect(models.length).toEqual(4);

        // get first interface
        let packages = models[0].packages;
        expect(packages.length).toEqual(1);

        let elements = packages[0].elements;
        expect(elements.length).toEqual(1);

        let element = elements[0];
        expect(isInterface(element)).toBeTruthy;

        const interface1 = element as ArlangInterface;

        // get second interface
        packages = models[2].packages;
        expect(packages.length).toEqual(1);

        elements = packages[0].elements;
        expect(elements.length).toEqual(1);

        element = elements[0];
        expect(isInterface(element));

        const interface2 = element as ArlangInterface;

        // get third and fourth interface
        packages = models[3].packages;
        expect(packages.length).toEqual(1);

        elements = packages[0].elements;
        expect(elements.length).toEqual(2);

        element = elements[0];
        expect(isInterface(element));

        const interface3 = element as ArlangInterface;

        element = elements[1];
        expect(isInterface(element));

        const interface4 = element as ArlangInterface;

        // check swc file because ports contain references
        packages = models[1].packages;
        expect(packages.length).toEqual(1);

        elements = packages[0].elements;
        expect(elements.length).toEqual(1);

        element = elements[0];
        expect(isSwComponent(element));

        const ports = (element as SwComponent).ports;
        expect(ports.length).toEqual(4);

        expect(ports[0].interfaceRef.ref).toEqual(interface1);
        expect(ports[1].interfaceRef.ref).toEqual(interface2);
        expect(ports[2].interfaceRef.ref).toEqual(interface3);
        expect(ports[3].interfaceRef.ref).toEqual(interface4);
    });

});
