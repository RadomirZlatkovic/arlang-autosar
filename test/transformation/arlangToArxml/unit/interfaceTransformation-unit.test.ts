import { afterEach, describe, expect, it } from "vitest";
import { transformArlangInterface, createArxmlInterface, modifyArxmlInterface, copyOrModifyArxmlInterface } from '../../../../src/transformation/arlangToArxml/interfaceTransformation.js';
import { DOMParser } from '@xmldom/xmldom';
import { InterfaceType as ArlangInterfaceType, Interface as ArlangInterface } from '../../../../src/language/generated/ast.js';
import * as metadataToArxmlTransformation from '../../../../src/transformation/metadataToArxml/metadataToArxmlTransformation.js';
import { initTransformationFlowHelpers, arxmlObjectsToRemove } from '../../../../src/transformation/arlangToArxml/arlangToArxmlTransformationFlowHelper.js';
import { createArlangModel, checkShortName } from '../../../test-helper.js';
import * as arlangToArxmlGeneral from '../../../../src/transformation/arlangToArxml/arlangToArxmlGeneral.js';
import * as vscodeHelperFunctions from '../../../../src/transformation/vscodeHelperFunctions.js';
import { vi } from 'vitest';
import { fail } from 'assert';

const baseArxml =
`<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_4-3-0.xsd">
<AR-PACKAGES>
</AR-PACKAGES>
</AUTOSAR>
`

afterEach(() => {
    initTransformationFlowHelpers();
});

describe('createArxmlInterface', () => {

    it ('Should create Sender Receiver Interface', async () => {
        const arxml = new DOMParser().parseFromString(baseArxml, 'text/xml');

        const arlangInterfaceType : ArlangInterfaceType = 'senderReceiver';
        const interfaceName = 'MySRInterface';

        const arlangContent =
`#package a
interface:${arlangInterfaceType} ${interfaceName} {
}
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangInterface = arlangModel.packages[0].elements[0] as ArlangInterface;

        const arxmlInterface = createArxmlInterface(arxml, arlangInterface);
        expect(arxmlInterface).not.toBeNull();

        checkInterfaceTypes(arlangInterfaceType, arxmlInterface!.tagName);

        const arxmlInterfaceChildNodes = arxmlInterface!.childNodes;
        expect(arxmlInterfaceChildNodes.length).toEqual(1);

        const arxmlInterfaceChildNode = arxmlInterfaceChildNodes[0];
        expect(arxmlInterfaceChildNode.nodeType).toEqual(1);
        checkShortName(arxmlInterfaceChildNode as Element, interfaceName);
    });

    it ('Should create Client Server Interface', async () => {
        const arxml = new DOMParser().parseFromString(baseArxml, 'text/xml');

        const arlangInterfaceType : ArlangInterfaceType = 'clientServer';
        const interfaceName = 'csi';

        const arlangContent =
`#package a
interface:${arlangInterfaceType} ${interfaceName} {
}
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangInterface = arlangModel.packages[0].elements[0] as ArlangInterface;

        const arxmlInterface = createArxmlInterface(arxml, arlangInterface);
        expect(arxmlInterface).not.toBeNull();

        checkInterfaceTypes(arlangInterfaceType, arxmlInterface!.tagName);

        const arxmlInterfaceChildNodes = arxmlInterface!.childNodes;
        expect(arxmlInterfaceChildNodes.length).toEqual(1);

        const arxmlInterfaceChildNode = arxmlInterfaceChildNodes[0];
        expect(arxmlInterfaceChildNode.nodeType).toEqual(1);
        checkShortName(arxmlInterfaceChildNode as Element, interfaceName);
    });

});

describe('modifyArxmlInterface', () => {

    it ('Should modify existing short name value', async () => {
        const arxmlContent =
`<AUTOSAR>
	<AR-PACKAGES>
		<AR-PACKAGE>
            <SHORT-NAME>p</SHORT-NAME>
            <ELEMENTS>
                <CLIENT-SERVER-INTERFACE>
                    <SHORT-NAME>InterfaceName1</SHORT-NAME>
                </CLIENT-SERVER-INTERFACE>
            </ELEMENTS>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>
`
		const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const arxmlInterface = arxml.getElementsByTagName('CLIENT-SERVER-INTERFACE')[0];

        const modifiedName = 'modifiedShortName';
        const arlangContent =
`#package p
    interface:clientServer ${modifiedName} {
    }
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangInterface = arlangModel.packages[0].elements[0] as ArlangInterface;

        modifyArxmlInterface(arxml, arxmlInterface, arlangInterface);

        const arxmlInterfaceShortNameValue = arxmlInterface.getElementsByTagName('SHORT-NAME')[0].childNodes[0].textContent;
        expect(arxmlInterfaceShortNameValue).toEqual(modifiedName);
    });

    it ('Should add new short name value if it does not exist', async () => {
        const arxmlContent =
`<AUTOSAR>
	<AR-PACKAGES>
		<AR-PACKAGE>
            <SHORT-NAME>p</SHORT-NAME>
            <ELEMENTS>
                <SENDER-RECEIVER-INTERFACE>
                    <SHORT-NAME></SHORT-NAME>
                </SENDER-RECEIVER-INTERFACE>
            </ELEMENTS>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>
`
		const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const arxmlInterface = arxml.getElementsByTagName('SENDER-RECEIVER-INTERFACE')[0];

        const shortNameValue = 'NewSRName5';
        const arlangContent =
`#package p
    interface:senderReceiver ${shortNameValue} {
    }
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangInterface = arlangModel.packages[0].elements[0] as ArlangInterface;

        modifyArxmlInterface(arxml, arxmlInterface, arlangInterface);

        const childNodes = arxmlInterface.getElementsByTagName('SHORT-NAME')[0].childNodes;
        expect(childNodes.length).toEqual(1);
        expect(childNodes[0].textContent).toEqual(shortNameValue);
    });

    it ('Should add new short name element when no childs exist', async () => {
        const arxmlContent =
`<AUTOSAR>
	<AR-PACKAGES>
		<AR-PACKAGE>
            <SHORT-NAME>p</SHORT-NAME>
            <ELEMENTS>
                <SENDER-RECEIVER-INTERFACE>
                </SENDER-RECEIVER-INTERFACE>
            </ELEMENTS>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>
`
		const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const arxmlInterface = arxml.getElementsByTagName('SENDER-RECEIVER-INTERFACE')[0];

        const shortNameValue = 'ExampleSN';
        const arlangContent =
`#package p
    interface:senderReceiver ${shortNameValue} {
    }
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangInterface = arlangModel.packages[0].elements[0] as ArlangInterface;

        modifyArxmlInterface(arxml, arxmlInterface, arlangInterface);

        const shortNameElements = arxmlInterface.getElementsByTagName('SHORT-NAME');
        expect(shortNameElements.length).toEqual(1);

        const childNodes = shortNameElements[0].childNodes;
        expect(childNodes.length).toEqual(1);
        expect(childNodes[0].textContent).toEqual(shortNameValue);
    });

    it ('Should add short name element at position 0 when at least one child exists', async () => {
        const arxmlContent =
`<AUTOSAR>
	<AR-PACKAGES>
		<AR-PACKAGE>
            <SHORT-NAME>p</SHORT-NAME>
            <ELEMENTS>
                <SENDER-RECEIVER-INTERFACE>
                    <ASD>
                    </ASD>
                </SENDER-RECEIVER-INTERFACE>
            </ELEMENTS>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>
`
		const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const arxmlInterface = arxml.getElementsByTagName('SENDER-RECEIVER-INTERFACE')[0];

        const shortNameValue = 'ExampleSN';
        const arlangContent =
`#package p
    interface:senderReceiver ${shortNameValue} {
    }
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangInterface = arlangModel.packages[0].elements[0] as ArlangInterface;

        modifyArxmlInterface(arxml, arxmlInterface, arlangInterface);

        const childNodes = arxmlInterface.childNodes;
        let children : Element[] = [];
        for (let i = 0; i < childNodes.length; i++) {
            const childNode = childNodes[i];

            if (childNode.nodeType === 1) { // 1 means that its of Element type
                children.push(childNode as Element);
            }
        }
        expect(children.length).toEqual(2);
        expect((children[0] as Element).tagName).toEqual('SHORT-NAME');
        expect((children[1] as Element).tagName).toEqual('ASD');

        const shortNameElements = arxmlInterface.getElementsByTagName('SHORT-NAME');
        expect(shortNameElements.length).toEqual(1);

        const shortNameChildNodes = shortNameElements[0].childNodes;
        expect(shortNameChildNodes.length).toEqual(1);
        expect(shortNameChildNodes[0].textContent).toEqual(shortNameValue);
    });

});

describe('copyOrModifyArxmlInterface', () => {

    it('Should report error when arxml reference object is not found', async () => {
        const arxml = new DOMParser().parseFromString(baseArxml, 'text/xml');
        const arlangContent =
`#package A
interface:senderReceiver i1 {
    arlangModId : "arlangModId@0"
}
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangInterface = arlangModel.packages[0].elements[0] as ArlangInterface;
        const arlangModId = arlangInterface.arlangModId!;

        vi.spyOn(vscodeHelperFunctions, "showNoArlangModIdFoundError").mockImplementation(() => {});

        metadataToArxmlTransformation.initMetadataToArxmlTransformation();
        copyOrModifyArxmlInterface(arxml, arlangInterface, arlangModId);

        expect(vscodeHelperFunctions.showNoArlangModIdFoundError).toHaveBeenCalledTimes(1);
    });

    it('Should report error when container FQN from metadata is not found', async () => {
        const arxml = new DOMParser().parseFromString(baseArxml, 'text/xml');
        const arlangContent =
`#package A
interface:senderReceiver i1 {
    arlangModId : "arlangModId@0"
}
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangInterface = arlangModel.packages[0].elements[0] as ArlangInterface;
        const arlangModId = arlangInterface.arlangModId!;

        vi.spyOn(metadataToArxmlTransformation, "getArxmlObject").mockImplementation(() => arxml.getElementsByTagName('AUTOSAR')[0]);
        vi.spyOn(vscodeHelperFunctions, "showNoArlangModIdFoundError").mockImplementation(() => {});

        metadataToArxmlTransformation.initMetadataToArxmlTransformation();
        copyOrModifyArxmlInterface(arxml, arlangInterface, arlangModId);

        expect(metadataToArxmlTransformation.getArxmlObject).toHaveBeenCalledTimes(1);
        expect(vscodeHelperFunctions.showNoArlangModIdFoundError).toHaveBeenCalledTimes(1);
    });

    /**
     * Modification means that element is added before the element that is supposed to be modified.
     * Element that is supposed to be modified is marked to be removed.
     * If element that is supposed to be modified contains any chidren that can not be represented in arlang, they should be copied to the 'new modified' element.
     */
    it('Should handle interface modification', async () => {
        const arxmlContent =
`<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_4-3-0.xsd">
<AR-PACKAGES>
    <AR-PACKAGE>
        <SHORT-NAME>p</SHORT-NAME>
        <ELEMENT>
            <SENDER-RECEIVER-INTERFACE>
                <SHORT-NAME>A</SHORT-NAME>
            </SENDER-RECEIVER-INTERFACE>
            <CLIENT-SERVER-INTERFACE>
                <SHORT-NAME>B</SHORT-NAME>
                <ABC>AbcValue</ABC>
            </CLIENT-SERVER-INTERFACE>
            <SENDER-RECEIVER-INTERFACE>
                <SHORT-NAME>C</SHORT-NAME>
            </SENDER-RECEIVER-INTERFACE>
        </ELEMENT>
    </AR-PACKAGE>
</AR-PACKAGES>
</AUTOSAR>
`
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');

        const newShortName = 'ICS';
        const arlangContent =
`#package p
interface:senderReceiver A {
    arlangModId : "arlangModId@0"
}

interface:clientServer ${newShortName} {
    arlangModId : "arangModId@1"
}

interface:senderReceiver C {
    arlangModId : "arlangModId@2"
}
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangInterface = arlangModel.packages[0].elements[1] as ArlangInterface;
        const arlangModId = arlangInterface.arlangModId!;

        initTransformationFlowHelpers();
        vi.spyOn(metadataToArxmlTransformation, "getArxmlObject").mockImplementation(() => arxml.getElementsByTagName('CLIENT-SERVER-INTERFACE')[0]);
        vi.spyOn(metadataToArxmlTransformation, "getContainerFQNFromMetadata").mockImplementation(() => 'p');
        vi.spyOn(arlangToArxmlGeneral, "checkSameContainerFQNAndRelativeFilePath").mockImplementation(() => true);

        const transformedInterface = copyOrModifyArxmlInterface(arxml, arlangInterface, arlangModId);

        expect(metadataToArxmlTransformation.getArxmlObject).toHaveBeenCalled();
        expect(metadataToArxmlTransformation.getContainerFQNFromMetadata).toHaveBeenCalled();
        expect(arlangToArxmlGeneral.checkSameContainerFQNAndRelativeFilePath).toHaveBeenCalled();

        expect(transformedInterface).toBeNull();

        /**
         * New modified element should be at the posotion of the original element (because modified element is inserted before original element).
         * Index of the original element should be +1 from the original index.
         */
        const newModifiedElement = arxml.getElementsByTagName('CLIENT-SERVER-INTERFACE')[0];
        expect(newModifiedElement.getElementsByTagName('SHORT-NAME')[0].childNodes[0].textContent).toEqual(newShortName);

        const nonArlangSupportedNodes = newModifiedElement.getElementsByTagName('ABC');
        expect(nonArlangSupportedNodes.length).toEqual(1);
        expect(nonArlangSupportedNodes[0].childNodes[0].textContent).toEqual('AbcValue');

        expect(arxmlObjectsToRemove.length).toEqual(1);
        /**
         * Index of the original element should be +1 from the original index.
         */
        expect(arxmlObjectsToRemove[0]).toBe(arxml.getElementsByTagName('CLIENT-SERVER-INTERFACE')[1]);
    });

    it('Should return new element when it is copied in the same package', async () => {
        const arxmlContent =
`<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_4-3-0.xsd">
<AR-PACKAGES>
    <AR-PACKAGE>
        <SHORT-NAME>p</SHORT-NAME>
        <ELEMENT>
            <SENDER-RECEIVER-INTERFACE>
                <SHORT-NAME>A</SHORT-NAME>
            </SENDER-RECEIVER-INTERFACE>
            <CLIENT-SERVER-INTERFACE>
                <SHORT-NAME>B</SHORT-NAME>
                <ABC>AbcValue</ABC>
            </CLIENT-SERVER-INTERFACE>
            <SENDER-RECEIVER-INTERFACE>
                <SHORT-NAME>C</SHORT-NAME>
            </SENDER-RECEIVER-INTERFACE>
            <CLIENT-SERVER-INTERFACE>
                <SHORT-NAME>D</SHORT-NAME>
            </CLIENT-SERVER-INTERFACE>
        </ELEMENT>
    </AR-PACKAGE>
</AR-PACKAGES>
</AUTOSAR>
`
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');

        const copiedElementShortName = 'CopiedElementShortName';
        const arlangContent =
`#package p
interface:senderReceiver A {
    arlangModId : "arlangModId@0"
}

interface:clientServer B {
    arlangModId : "arangModId@1"
}

interface:senderReceiver C {
    arlangModId : "arlangModId@2"
}

interface:clientServer ${copiedElementShortName} {
    arlangModId : "arangModId@1"
}

interface:clientServer D {
    arlangModId : "arangModId@3"
}

#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangInterface = arlangModel.packages[0].elements[3] as ArlangInterface;
        const arlangModId = arlangInterface.arlangModId!;

        initTransformationFlowHelpers();
        const originalElement = arxml.getElementsByTagName('CLIENT-SERVER-INTERFACE')[0];
        arxmlObjectsToRemove.push(originalElement);
        vi.spyOn(metadataToArxmlTransformation, "getArxmlObject").mockImplementation(() => originalElement);
        vi.spyOn(metadataToArxmlTransformation, "getContainerFQNFromMetadata").mockImplementation(() => 'p');
        vi.spyOn(arlangToArxmlGeneral, "checkSameContainerFQNAndRelativeFilePath").mockImplementation(() => true);

        const copiedArxmlInterface = copyOrModifyArxmlInterface(arxml, arlangInterface, arlangModId);

        expect(metadataToArxmlTransformation.getArxmlObject).toHaveBeenCalled();
        expect(metadataToArxmlTransformation.getContainerFQNFromMetadata).toHaveBeenCalled();
        expect(arlangToArxmlGeneral.checkSameContainerFQNAndRelativeFilePath).toHaveBeenCalled();

        expect(copiedArxmlInterface).not.toBeNull();

        expect(copiedArxmlInterface!.getElementsByTagName('SHORT-NAME')[0].childNodes[0].textContent).toEqual(copiedElementShortName);

        const nonArlangSupportedNodes = copiedArxmlInterface!.getElementsByTagName('ABC');
        expect(nonArlangSupportedNodes.length).toEqual(1);
        expect(nonArlangSupportedNodes[0].childNodes[0].textContent).toEqual('AbcValue');
    });

    it('Should return new element when it is copied in different package', async () => {
        const arxmlContent =
`<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_4-3-0.xsd">
<AR-PACKAGES>
    <AR-PACKAGE>
        <SHORT-NAME>p</SHORT-NAME>
        <ELEMENT>
            <SENDER-RECEIVER-INTERFACE>
                <SHORT-NAME>A</SHORT-NAME>
            </SENDER-RECEIVER-INTERFACE>
            <CLIENT-SERVER-INTERFACE>
                <SHORT-NAME>B</SHORT-NAME>
            </CLIENT-SERVER-INTERFACE>
            <SENDER-RECEIVER-INTERFACE attr1="val1" attr2="val2">
                <SHORT-NAME>C</SHORT-NAME>
                <EXAMPLE-TAG attr1="attr1Val">Value</EXAMPLE-TAG>
            </SENDER-RECEIVER-INTERFACE>
            <CLIENT-SERVER-INTERFACE>
                <SHORT-NAME>D</SHORT-NAME>
            </CLIENT-SERVER-INTERFACE>
        </ELEMENT>
    </AR-PACKAGE>
</AR-PACKAGES>
</AUTOSAR>
`
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');

        const copiedElementShortName = 'CopiedElementShortName';
        const arlangContent =
`#package p
interface:senderReceiver A {
    arlangModId : "arlangModId@0"
}

interface:clientServer B {
    arlangModId : "arangModId@1"
}

interface:senderReceiver C {
    arlangModId : "arlangModId@2"
}

interface:clientServer D {
    arlangModId : "arangModId@3"
}

#end

#package b

interface:senderReceiver ${copiedElementShortName} {
    arlangModId : "arangModId@2"
}

#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangInterface = arlangModel.packages[1].elements[0] as ArlangInterface;
        const arlangModId = arlangInterface.arlangModId!;

        initTransformationFlowHelpers();
        const originalElement = arxml.getElementsByTagName('SENDER-RECEIVER-INTERFACE')[1];
        arxmlObjectsToRemove.push(originalElement);
        vi.spyOn(metadataToArxmlTransformation, "getArxmlObject").mockImplementation(() => originalElement);
        vi.spyOn(metadataToArxmlTransformation, "getContainerFQNFromMetadata").mockImplementation(() => 'p');
        vi.spyOn(arlangToArxmlGeneral, "checkSameContainerFQNAndRelativeFilePath").mockImplementation(() => false);

        const copiedArxmlInterface = copyOrModifyArxmlInterface(arxml, arlangInterface, arlangModId);

        expect(metadataToArxmlTransformation.getArxmlObject).toHaveBeenCalled();
        expect(metadataToArxmlTransformation.getContainerFQNFromMetadata).toHaveBeenCalled();
        expect(arlangToArxmlGeneral.checkSameContainerFQNAndRelativeFilePath).toHaveBeenCalled();

        expect(copiedArxmlInterface).not.toBeNull();

        expect(copiedArxmlInterface!.getElementsByTagName('SHORT-NAME')[0].childNodes[0].textContent).toEqual(copiedElementShortName);

        const attributes = copiedArxmlInterface!.attributes;
        expect(attributes.length).toEqual(2);
        expect(attributes[0].name).toEqual('attr1');
        expect(attributes[0].value).toEqual('val1');
        expect(attributes[1].name).toEqual('attr2');
        expect(attributes[1].value).toEqual('val2');

        const nonArlangSupportedNodes = copiedArxmlInterface!.getElementsByTagName('EXAMPLE-TAG');
        expect(nonArlangSupportedNodes.length).toEqual(1);

        const exampleTagNode = nonArlangSupportedNodes[0];
        expect(exampleTagNode.childNodes[0].textContent).toEqual('Value');
    });

});

describe('transformArlangInterface - new element creation', () => {

    it('Should return new transformed Client Server Interface', async () => {
        await performTest('clientServer', 'MyName');
    });

    it('Should return new transformed Sender Receiver Interface', async () => {
        await performTest('senderReceiver', 'TcpConnection');
    });

    async function performTest(arlangInterfaceType: ArlangInterfaceType, interfaceName: string) {
        const arxml = new DOMParser().parseFromString(baseArxml, 'text/xml');

        const arlangContent =
`#package A
interface:${arlangInterfaceType} ${interfaceName} {

}
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangInterface = arlangModel.packages[0].elements[0] as ArlangInterface;

        const arxmlInterface = transformArlangInterface(arxml, arlangInterface);
        expect(arxmlInterface).not.toBeNull();

        checkInterfaceTypes(arlangInterfaceType, arxmlInterface!.tagName);

        const arxmlInterfaceChildNodes = arxmlInterface!.childNodes;
        expect(arxmlInterfaceChildNodes.length).toEqual(1);

        const arxmlInterfaceChildNode = arxmlInterfaceChildNodes[0];
        expect(arxmlInterfaceChildNode.nodeType).toEqual(1);
        checkShortName(arxmlInterfaceChildNode as Element, interfaceName);
    }

});

describe('transformArlangInterface - modification and copy', () => {

    it('Should report error when arxml reference object is not found', async () => {
        const arxml = new DOMParser().parseFromString(baseArxml, 'text/xml');
        const arlangContent =
`#package A
interface:senderReceiver i1 {
    arlangModId : "arlangModId@0"
}
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangInterface = arlangModel.packages[0].elements[0] as ArlangInterface;

        vi.spyOn(vscodeHelperFunctions, "showNoArlangModIdFoundError").mockImplementation(() => {});

        metadataToArxmlTransformation.initMetadataToArxmlTransformation();
        transformArlangInterface(arxml, arlangInterface);

        expect(vscodeHelperFunctions.showNoArlangModIdFoundError).toHaveBeenCalledTimes(1);
    });

    it('Should report error when container FQN from metadata is not found', async () => {
        const arxml = new DOMParser().parseFromString(baseArxml, 'text/xml');
        const arlangContent =
`#package A
interface:senderReceiver i1 {
    arlangModId : "arlangModId@0"
}
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangInterface = arlangModel.packages[0].elements[0] as ArlangInterface;

        vi.spyOn(metadataToArxmlTransformation, "getArxmlObject").mockImplementation(() => arxml.getElementsByTagName('AUTOSAR')[0]);
        vi.spyOn(vscodeHelperFunctions, "showNoArlangModIdFoundError").mockImplementation(() => {});

        metadataToArxmlTransformation.initMetadataToArxmlTransformation();
        transformArlangInterface(arxml, arlangInterface);

        expect(metadataToArxmlTransformation.getArxmlObject).toHaveBeenCalledTimes(1);
        expect(vscodeHelperFunctions.showNoArlangModIdFoundError).toHaveBeenCalledTimes(1);
    });

    /**
     * Modification means that element is added before the element that is supposed to be modified.
     * Element that is supposed to be modified is marked to be removed.
     * If element that is supposed to be modified contains any chidren that can not be represented in arlang, they should be copied to the 'new modified' element.
     */
    it('Should handle interface modification', async () => {
        const arxmlContent =
`<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_4-3-0.xsd">
<AR-PACKAGES>
    <AR-PACKAGE>
        <SHORT-NAME>p</SHORT-NAME>
        <ELEMENT>
            <SENDER-RECEIVER-INTERFACE>
                <SHORT-NAME>A</SHORT-NAME>
            </SENDER-RECEIVER-INTERFACE>
            <CLIENT-SERVER-INTERFACE>
                <SHORT-NAME>B</SHORT-NAME>
                <ABC>AbcValue</ABC>
            </CLIENT-SERVER-INTERFACE>
            <SENDER-RECEIVER-INTERFACE>
                <SHORT-NAME>C</SHORT-NAME>
            </SENDER-RECEIVER-INTERFACE>
        </ELEMENT>
    </AR-PACKAGE>
</AR-PACKAGES>
</AUTOSAR>
`
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');

        const newShortName = 'ICS';
        const arlangContent =
`#package p
interface:senderReceiver A {
    arlangModId : "arlangModId@0"
}

interface:clientServer ${newShortName} {
    arlangModId : "arangModId@1"
}

interface:senderReceiver C {
    arlangModId : "arlangModId@2"
}
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangInterface = arlangModel.packages[0].elements[1] as ArlangInterface;

        initTransformationFlowHelpers();
        vi.spyOn(metadataToArxmlTransformation, "getArxmlObject").mockImplementation(() => arxml.getElementsByTagName('CLIENT-SERVER-INTERFACE')[0]);
        vi.spyOn(metadataToArxmlTransformation, "getContainerFQNFromMetadata").mockImplementation(() => 'p');
        vi.spyOn(arlangToArxmlGeneral, "checkSameContainerFQNAndRelativeFilePath").mockImplementation(() => true);

        const transformedInterface = transformArlangInterface(arxml, arlangInterface);

        expect(metadataToArxmlTransformation.getArxmlObject).toHaveBeenCalled();
        expect(metadataToArxmlTransformation.getContainerFQNFromMetadata).toHaveBeenCalled();
        expect(arlangToArxmlGeneral.checkSameContainerFQNAndRelativeFilePath).toHaveBeenCalled();

        expect(transformedInterface).toBeNull();

        /**
         * New modified element should be at the posotion of the original element (because modified element is inserted before original element).
         * Index of the original element should be +1 from the original index.
         */
        const newModifiedElement = arxml.getElementsByTagName('CLIENT-SERVER-INTERFACE')[0];
        expect(newModifiedElement.getElementsByTagName('SHORT-NAME')[0].childNodes[0].textContent).toEqual(newShortName);

        const nonArlangSupportedNodes = newModifiedElement.getElementsByTagName('ABC');
        expect(nonArlangSupportedNodes.length).toEqual(1);
        expect(nonArlangSupportedNodes[0].childNodes[0].textContent).toEqual('AbcValue');

        expect(arxmlObjectsToRemove.length).toEqual(1);
        /**
         * Index of the original element should be +1 from the original index.
         */
        expect(arxmlObjectsToRemove[0]).toBe(arxml.getElementsByTagName('CLIENT-SERVER-INTERFACE')[1]);
    });

    it('Should return new element when it is copied in the same package', async () => {
        const arxmlContent =
`<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_4-3-0.xsd">
<AR-PACKAGES>
    <AR-PACKAGE>
        <SHORT-NAME>p</SHORT-NAME>
        <ELEMENT>
            <SENDER-RECEIVER-INTERFACE>
                <SHORT-NAME>A</SHORT-NAME>
            </SENDER-RECEIVER-INTERFACE>
            <CLIENT-SERVER-INTERFACE>
                <SHORT-NAME>B</SHORT-NAME>
                <ABC>AbcValue</ABC>
            </CLIENT-SERVER-INTERFACE>
            <SENDER-RECEIVER-INTERFACE>
                <SHORT-NAME>C</SHORT-NAME>
            </SENDER-RECEIVER-INTERFACE>
            <CLIENT-SERVER-INTERFACE>
                <SHORT-NAME>D</SHORT-NAME>
            </CLIENT-SERVER-INTERFACE>
        </ELEMENT>
    </AR-PACKAGE>
</AR-PACKAGES>
</AUTOSAR>
`
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');

        const copiedElementShortName = 'CopiedElementShortName';
        const arlangContent =
`#package p
interface:senderReceiver A {
    arlangModId : "arlangModId@0"
}

interface:clientServer B {
    arlangModId : "arangModId@1"
}

interface:senderReceiver C {
    arlangModId : "arlangModId@2"
}

interface:clientServer ${copiedElementShortName} {
    arlangModId : "arangModId@1"
}

interface:clientServer D {
    arlangModId : "arangModId@3"
}

#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangInterface = arlangModel.packages[0].elements[3] as ArlangInterface;

        initTransformationFlowHelpers();
        const originalElement = arxml.getElementsByTagName('CLIENT-SERVER-INTERFACE')[0];
        arxmlObjectsToRemove.push(originalElement);
        vi.spyOn(metadataToArxmlTransformation, "getArxmlObject").mockImplementation(() => originalElement);
        vi.spyOn(metadataToArxmlTransformation, "getContainerFQNFromMetadata").mockImplementation(() => 'p');
        vi.spyOn(arlangToArxmlGeneral, "checkSameContainerFQNAndRelativeFilePath").mockImplementation(() => true);

        const copiedArxmlInterface = transformArlangInterface(arxml, arlangInterface);

        expect(metadataToArxmlTransformation.getArxmlObject).toHaveBeenCalled();
        expect(metadataToArxmlTransformation.getContainerFQNFromMetadata).toHaveBeenCalled();
        expect(arlangToArxmlGeneral.checkSameContainerFQNAndRelativeFilePath).toHaveBeenCalled();

        expect(copiedArxmlInterface).not.toBeNull();

        expect(copiedArxmlInterface!.getElementsByTagName('SHORT-NAME')[0].childNodes[0].textContent).toEqual(copiedElementShortName);

        const nonArlangSupportedNodes = copiedArxmlInterface!.getElementsByTagName('ABC');
        expect(nonArlangSupportedNodes.length).toEqual(1);
        expect(nonArlangSupportedNodes[0].childNodes[0].textContent).toEqual('AbcValue');
    });

    it('Should return new element when it is copied in different package', async () => {
        const arxmlContent =
`<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_4-3-0.xsd">
<AR-PACKAGES>
    <AR-PACKAGE>
        <SHORT-NAME>p</SHORT-NAME>
        <ELEMENT>
            <SENDER-RECEIVER-INTERFACE>
                <SHORT-NAME>A</SHORT-NAME>
            </SENDER-RECEIVER-INTERFACE>
            <CLIENT-SERVER-INTERFACE>
                <SHORT-NAME>B</SHORT-NAME>
            </CLIENT-SERVER-INTERFACE>
            <SENDER-RECEIVER-INTERFACE attr1="val1" attr2="val2">
                <SHORT-NAME>C</SHORT-NAME>
                <EXAMPLE-TAG attr1="attr1Val">Value</EXAMPLE-TAG>
            </SENDER-RECEIVER-INTERFACE>
            <CLIENT-SERVER-INTERFACE>
                <SHORT-NAME>D</SHORT-NAME>
            </CLIENT-SERVER-INTERFACE>
        </ELEMENT>
    </AR-PACKAGE>
</AR-PACKAGES>
</AUTOSAR>
`
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');

        const copiedElementShortName = 'CopiedElementShortName';
        const arlangContent =
`#package p
interface:senderReceiver A {
    arlangModId : "arlangModId@0"
}

interface:clientServer B {
    arlangModId : "arangModId@1"
}

interface:senderReceiver C {
    arlangModId : "arlangModId@2"
}

interface:clientServer D {
    arlangModId : "arangModId@3"
}

#end

#package b

interface:senderReceiver ${copiedElementShortName} {
    arlangModId : "arangModId@2"
}

#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangInterface = arlangModel.packages[1].elements[0] as ArlangInterface;

        initTransformationFlowHelpers();
        const originalElement = arxml.getElementsByTagName('SENDER-RECEIVER-INTERFACE')[1];
        arxmlObjectsToRemove.push(originalElement);
        vi.spyOn(metadataToArxmlTransformation, "getArxmlObject").mockImplementation(() => originalElement);
        vi.spyOn(metadataToArxmlTransformation, "getContainerFQNFromMetadata").mockImplementation(() => 'p');
        vi.spyOn(arlangToArxmlGeneral, "checkSameContainerFQNAndRelativeFilePath").mockImplementation(() => false);

        const copiedArxmlInterface = transformArlangInterface(arxml, arlangInterface);

        expect(metadataToArxmlTransformation.getArxmlObject).toHaveBeenCalled();
        expect(metadataToArxmlTransformation.getContainerFQNFromMetadata).toHaveBeenCalled();
        expect(arlangToArxmlGeneral.checkSameContainerFQNAndRelativeFilePath).toHaveBeenCalled();

        expect(copiedArxmlInterface).not.toBeNull();

        expect(copiedArxmlInterface!.getElementsByTagName('SHORT-NAME')[0].childNodes[0].textContent).toEqual(copiedElementShortName);

        const attributes = copiedArxmlInterface!.attributes;
        expect(attributes.length).toEqual(2);
        expect(attributes[0].name).toEqual('attr1');
        expect(attributes[0].value).toEqual('val1');
        expect(attributes[1].name).toEqual('attr2');
        expect(attributes[1].value).toEqual('val2');

        const nonArlangSupportedNodes = copiedArxmlInterface!.getElementsByTagName('EXAMPLE-TAG');
        expect(nonArlangSupportedNodes.length).toEqual(1);

        const exampleTagNode = nonArlangSupportedNodes[0];
        expect(exampleTagNode.childNodes[0].textContent).toEqual('Value');
    });

});

function checkInterfaceTypes(arlangInterfaceType: ArlangInterfaceType, arxmlTagName: string) : void {
    if (arlangInterfaceType === 'clientServer') {
        expect(arxmlTagName).toEqual('CLIENT-SERVER-INTERFACE');
    } else if (arlangInterfaceType === 'senderReceiver') {
        expect(arxmlTagName).toEqual('SENDER-RECEIVER-INTERFACE');
    } else {
        fail(`TODO: Implement case for interface type '${arlangInterfaceType}'`);
    }
}
