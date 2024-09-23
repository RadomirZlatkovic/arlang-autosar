import { afterEach, describe, expect, it } from "vitest";
import { copyOrModifyArxmlSwComponent, createArxmlSwComponent, modifyArxmlSwComponent, transformArlangSwComponent } from '../../../../src/transformation/arlangToArxml/swComponentTransformation.js';
import * as portTransformation from '../../../../src/transformation/arlangToArxml/portTransformation.js';
import { DOMParser } from '@xmldom/xmldom';
import { SwComponentType as ArlangSwComponentType, SwComponent as ArlangSwComponent } from '../../../../src/language/generated/ast.js';
import { initTransformationFlowHelpers , arxmlObjectsToRemove } from '../../../../src/transformation/arlangToArxml/arlangToArxmlTransformationFlowHelper.js';
import { createArlangModel, checkShortName } from '../../../test-helper.js';
import * as metadataToArxmlTransformation from '../../../../src/transformation/metadataToArxml/metadataToArxmlTransformation.js';
import * as vscodeHelperFunctions from '../../../../src/transformation/vscodeHelperFunctions.js';
import * as arlangToArxmlGeneral from '../../../../src/transformation/arlangToArxml/arlangToArxmlGeneral.js';
import { fail } from 'assert';
import { vi } from 'vitest';

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

describe('createArxmlSwComponent', () => {

    it('Should create ARXML Application Software Component without ports', async () => {
        const arlangSwComponentType : ArlangSwComponentType = 'application';
        const swComponentName = 'TestSwShortName';

        const arxml = new DOMParser().parseFromString(baseArxml, 'text/xml');

        const arlangContent =
`#package A
swComponent:${arlangSwComponentType} ${swComponentName} {

}
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangSwComponent = arlangModel.packages[0].elements[0] as ArlangSwComponent;

        const arxmlSwComponent = createArxmlSwComponent(arxml, arlangSwComponent);
        expect(arxmlSwComponent).not.toBeNull();

        checkSwComponentTypes(arlangSwComponentType, arxmlSwComponent!.tagName);

        const arxmlSwComponentChildNodes = arxmlSwComponent!.childNodes;
        expect(arxmlSwComponentChildNodes.length).toEqual(1);

        const arxmlInterfaceChildNode = arxmlSwComponentChildNodes[0];
        expect(arxmlInterfaceChildNode.nodeType).toEqual(1);
        checkShortName(arxmlInterfaceChildNode as Element, swComponentName);
    });

    it('Should create ARXML Application Software Component with ports', async () => {
        const arlangSwComponentType : ArlangSwComponentType = 'application';
        const swComponentName = 'ExampleSwComponentName';

        const arxml = new DOMParser().parseFromString(baseArxml, 'text/xml');

        const arlangContent =
`#package A
swComponent:${arlangSwComponentType} ${swComponentName} {

}
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangSwComponent = arlangModel.packages[0].elements[0] as ArlangSwComponent;

        const mockedPorts = arxml.createElement('PORTS');
        vi.spyOn(portTransformation, "transformArlangPorts").mockImplementation(() => mockedPorts);

        const arxmlSwComponent = createArxmlSwComponent(arxml, arlangSwComponent);
        expect(arxmlSwComponent).not.toBeNull();

        expect(portTransformation.transformArlangPorts).toHaveBeenCalled();

        checkSwComponentTypes(arlangSwComponentType, arxmlSwComponent!.tagName);

        const arxmlSwComponentChildNodes = arxmlSwComponent!.childNodes;
        expect(arxmlSwComponentChildNodes.length).toEqual(2);

        const arxmlSwComponentChildNode = arxmlSwComponentChildNodes[0];
        expect(arxmlSwComponentChildNode.nodeType).toEqual(1);
        checkShortName(arxmlSwComponentChildNode as Element, swComponentName);

        expect(arxmlSwComponentChildNodes[1]).toBe(mockedPorts);
    });

});

describe('modifyArxmlSwComponent - shortName modification', () => {

    it ('Should modify existing short name value', async () => {
        const arxmlContent =
`<AUTOSAR>
	<AR-PACKAGES>
		<AR-PACKAGE>
            <SHORT-NAME>p</SHORT-NAME>
            <ELEMENTS>
                <APPLICATION-SW-COMPONENT-TYPE>
                    <SHORT-NAME>swc1</SHORT-NAME>
                </APPLICATION-SW-COMPONENT-TYPE>
            </ELEMENTS>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>
`
		const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const arxmlSwComponent = arxml.getElementsByTagName('APPLICATION-SW-COMPONENT-TYPE')[0];

        const modifiedName = 'modifiedShortName';
        const arlangContent =
`#package p
    swComponent:application ${modifiedName} {
    }
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangSwComponent = arlangModel.packages[0].elements[0] as ArlangSwComponent;

        modifyArxmlSwComponent(arxml, arxmlSwComponent, arlangSwComponent, []);

        const arxmlSwComponentShortNameValue = arxmlSwComponent.getElementsByTagName('SHORT-NAME')[0].childNodes[0].textContent;
        expect(arxmlSwComponentShortNameValue).toEqual(modifiedName);
    });

    it ('Should add new short name value if it does not exist', async () => {
        const arxmlContent =
`<AUTOSAR>
	<AR-PACKAGES>
		<AR-PACKAGE>
            <SHORT-NAME>p</SHORT-NAME>
            <ELEMENTS>
                <APPLICATION-SW-COMPONENT-TYPE>
                    <SHORT-NAME></SHORT-NAME>
                </APPLICATION-SW-COMPONENT-TYPE>
            </ELEMENTS>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>
`
		const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const arxmlSwComponent = arxml.getElementsByTagName('APPLICATION-SW-COMPONENT-TYPE')[0];

        const shortNameValue = 'NewShortName';
        const arlangContent =
`#package p
    swComponent:application ${shortNameValue} {
    }
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangSwComponent = arlangModel.packages[0].elements[0] as ArlangSwComponent;

        modifyArxmlSwComponent(arxml, arxmlSwComponent, arlangSwComponent, []);

        const childNodes = arxmlSwComponent.getElementsByTagName('SHORT-NAME')[0].childNodes;
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
                <APPLICATION-SW-COMPONENT-TYPE>
                </APPLICATION-SW-COMPONENT-TYPE>
            </ELEMENTS>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>
`
		const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const arxmlSwComponent = arxml.getElementsByTagName('APPLICATION-SW-COMPONENT-TYPE')[0];

        const shortNameValue = 'ExampleSN';
        const arlangContent =
`#package p
    swComponent:application ${shortNameValue} {
    }
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangSwComponent = arlangModel.packages[0].elements[0] as ArlangSwComponent;

        modifyArxmlSwComponent(arxml, arxmlSwComponent, arlangSwComponent, []);

        const shortNameElements = arxmlSwComponent.getElementsByTagName('SHORT-NAME');
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
                <APPLICATION-SW-COMPONENT-TYPE>
                    <ASD>
                    </ASD>
                </APPLICATION-SW-COMPONENT-TYPE>
            </ELEMENTS>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>
`
		const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const arxmlSwComponent = arxml.getElementsByTagName('APPLICATION-SW-COMPONENT-TYPE')[0];

        const shortNameValue = 'ExampleSN';
        const arlangContent =
`#package p
    swComponent:application ${shortNameValue} {
    }
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangSwComponent = arlangModel.packages[0].elements[0] as ArlangSwComponent;

        modifyArxmlSwComponent(arxml, arxmlSwComponent, arlangSwComponent, []);

        const childNodes = arxmlSwComponent.childNodes;
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

        const shortNameElements = arxmlSwComponent.getElementsByTagName('SHORT-NAME');
        expect(shortNameElements.length).toEqual(1);

        const shortNameChildNodes = shortNameElements[0].childNodes;
        expect(shortNameChildNodes.length).toEqual(1);
        expect(shortNameChildNodes[0].textContent).toEqual(shortNameValue);
    });

});

describe('modifyAxmlSwComponent - ports modification', () => {

    it ('Should modify existing ports collection', async () => {
        const arxmlContent =
`<AUTOSAR>
	<AR-PACKAGES>
		<AR-PACKAGE>
            <SHORT-NAME>p</SHORT-NAME>
            <ELEMENTS>
                <APPLICATION-SW-COMPONENT-TYPE>
                    <SHORT-NAME>swc1</SHORT-NAME>
                    <PORTS>
                        <P-PORT-PROTOTYPE>
                        </P-PORT-PROTOTYPE>
                        <R-PORT-PROTOTYPE>
                        </R-PORT-PROTOTYPE>
                    </PORTS>
                </APPLICATION-SW-COMPONENT-TYPE>
            </ELEMENTS>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>
`
		const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const arxmlSwComponent = arxml.getElementsByTagName('APPLICATION-SW-COMPONENT-TYPE')[0];

        const arlangContent =
`#package p
    interface:senderReceiver SRI {}

    swComponent:application swc1 {
        port:provided PPort implements SRI {} 
        port:required RPort implements SRI {} 
    }
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangSwComponent = arlangModel.packages[0].elements[0] as ArlangSwComponent;

        vi.spyOn(portTransformation, "transformArlangPorts").mockImplementation(() => {return arxml.createElement('PORTS')});

        modifyArxmlSwComponent(arxml, arxmlSwComponent, arlangSwComponent, []);

        expect(portTransformation.transformArlangPorts).toHaveBeenCalled();

        /**
         * If this check fails, it means that new ports collection is added (instead of modifying existing collection)
         */
        expect(arxmlSwComponent.getElementsByTagName('PORTS').length).toEqual(1);
    });

    it ('Should add new ports collection', async () => {
        const arxmlContent =
`<AUTOSAR>
	<AR-PACKAGES>
		<AR-PACKAGE>
            <SHORT-NAME>p</SHORT-NAME>
            <ELEMENTS>
                <APPLICATION-SW-COMPONENT-TYPE>
                    <SHORT-NAME>swc1</SHORT-NAME>
                </APPLICATION-SW-COMPONENT-TYPE>
            </ELEMENTS>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>
`
		const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const arxmlSwComponent = arxml.getElementsByTagName('APPLICATION-SW-COMPONENT-TYPE')[0];

        const arlangContent =
`#package p
    interface:senderReceiver SRI {}

    swComponent:application swc1 {
    }
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangSwComponent = arlangModel.packages[0].elements[0] as ArlangSwComponent;

        vi.spyOn(portTransformation, "transformArlangPorts").mockImplementation(() => {return arxml.createElement('PORTS')});

        modifyArxmlSwComponent(arxml, arxmlSwComponent, arlangSwComponent, []);

        expect(portTransformation.transformArlangPorts).toHaveBeenCalled();

        expect(arxmlSwComponent.getElementsByTagName('PORTS').length).toEqual(1);
    });

});

describe('copyOrModifyArxmlSwComponent', () => {

    it('Should report error when arxml reference object is not found', async () => {
        const arxml = new DOMParser().parseFromString(baseArxml, 'text/xml');
        const arlangContent =
`#package A
swComponent:application swc {
    arlangModId : "arlangModId@0"
}
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangSwComponent = arlangModel.packages[0].elements[0] as ArlangSwComponent;

        vi.spyOn(vscodeHelperFunctions, "showNoArlangModIdFoundError").mockImplementation(() => {});

        metadataToArxmlTransformation.initMetadataToArxmlTransformation();
        copyOrModifyArxmlSwComponent(arxml, arlangSwComponent, 'arlangModId@1');

        expect(vscodeHelperFunctions.showNoArlangModIdFoundError).toHaveBeenCalledTimes(1);
    });

    it('Should report error when container FQN from metadata is not found', async () => {
        const arxml = new DOMParser().parseFromString(baseArxml, 'text/xml');
        const arlangContent =
`#package A
swComponent:application swc {
    arlangModId : "arlangModId@0"
}
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangSwComponent = arlangModel.packages[0].elements[0] as ArlangSwComponent;

        vi.spyOn(metadataToArxmlTransformation, "getArxmlObject").mockImplementation(() => arxml.getElementsByTagName('AUTOSAR')[0]);
        vi.spyOn(vscodeHelperFunctions, "showNoArlangModIdFoundError").mockImplementation(() => {});

        metadataToArxmlTransformation.initMetadataToArxmlTransformation();
        copyOrModifyArxmlSwComponent(arxml, arlangSwComponent, 'arlangModId@1');

        expect(metadataToArxmlTransformation.getArxmlObject).toHaveBeenCalledTimes(1);
        expect(vscodeHelperFunctions.showNoArlangModIdFoundError).toHaveBeenCalledTimes(1);
    });

    /**
     * Modification means that element is added before the element that is supposed to be modified.
     * Element that is supposed to be modified is marked to be removed.
     * If element that is supposed to be modified contains any chidren that can not be represented in arlang, they should be copied to the 'new modified' element.
     */
    it('Should handle Application Software Component modification', async () => {
        const arxmlContent =
`<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_4-3-0.xsd">
<AR-PACKAGES>
    <AR-PACKAGE>
        <SHORT-NAME>p</SHORT-NAME>
        <ELEMENT>
            <APPLICATION-SW-COMPONENT-TYPE>
                <SHORT-NAME>A</SHORT-NAME>
            </APPLICATION-SW-COMPONENT-TYPE>
            <APPLICATION-SW-COMPONENT-TYPE>
                <SHORT-NAME>B</SHORT-NAME>
                <E1>
                    <E2 attr1="attrVal1" attr2="attrVal2">
                    </E2>
                </E1>
                <E1>
                </E1>
            </APPLICATION-SW-COMPONENT-TYPE>
            <APPLICATION-SW-COMPONENT-TYPE>
                <SHORT-NAME>C</SHORT-NAME>
            </APPLICATION-SW-COMPONENT-TYPE>
        </ELEMENT>
    </AR-PACKAGE>
</AR-PACKAGES>
</AUTOSAR>
`
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');

        const newShortName = 'SWC';
        const arlangContent =
`#package p
swComponent:application A {
    arlangModId : "arlangModId@0"
}

swComponent:application ${newShortName} {
    arlangModId : "arangModId@1"
}

swComponent:application C {
    arlangModId : "arlangModId@2"
}
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangSwComponent = arlangModel.packages[0].elements[1] as ArlangSwComponent;

        initTransformationFlowHelpers();
        vi.spyOn(metadataToArxmlTransformation, "getArxmlObject").mockImplementation(() => arxml.getElementsByTagName('APPLICATION-SW-COMPONENT-TYPE')[1]);
        vi.spyOn(metadataToArxmlTransformation, "getContainerFQNFromMetadata").mockImplementation(() => 'p');
        vi.spyOn(arlangToArxmlGeneral, "checkSameContainerFQNAndRelativeFilePath").mockImplementation(() => true);
        vi.spyOn(metadataToArxmlTransformation, "getArlangModIdFromArxmlObject").mockImplementation(() => "");

        const copyOrModifyRetVal = copyOrModifyArxmlSwComponent(arxml, arlangSwComponent, 'arlangModId@1');

        expect(metadataToArxmlTransformation.getArxmlObject).toHaveBeenCalled();
        expect(metadataToArxmlTransformation.getContainerFQNFromMetadata).toHaveBeenCalled();
        expect(arlangToArxmlGeneral.checkSameContainerFQNAndRelativeFilePath).toHaveBeenCalled();
        expect(metadataToArxmlTransformation.getArlangModIdFromArxmlObject).toHaveBeenCalled();

        expect(copyOrModifyRetVal).toBeNull();

        /**
         * New modified element should be at the posotion of the original element (because modified element is inserted before original element).
         * Index of the original element should be +1 from the original index.
         */
        const newModifiedElement = arxml.getElementsByTagName('APPLICATION-SW-COMPONENT-TYPE')[1];
        expect(newModifiedElement.getElementsByTagName('SHORT-NAME')[0].childNodes[0].textContent).toEqual(newShortName);

        const e1Nodes = newModifiedElement.getElementsByTagName('E1');
        expect(e1Nodes.length).toEqual(2);
        const e2Nodes = e1Nodes[0].getElementsByTagName('E2');
        expect(e2Nodes.length).toEqual(1);
        const e2NodeAttrs = e2Nodes[0].attributes;
        expect(e2NodeAttrs.length).toEqual(2);
        expect(e2NodeAttrs[0].name).toEqual('attr1');
        expect(e2NodeAttrs[0].value).toEqual('attrVal1');
        expect(e2NodeAttrs[1].name).toEqual('attr2');
        expect(e2NodeAttrs[1].value).toEqual('attrVal2');

        expect(arxmlObjectsToRemove.length).toEqual(1);
        /**
         * Index of the original element should be +1 from the original index.
         */
        expect(arxmlObjectsToRemove[0]).toBe(arxml.getElementsByTagName('APPLICATION-SW-COMPONENT-TYPE')[2]);
    });

    it('Should return new element when it is copied in the same package', async () => {
        const arxmlContent =
`<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_4-3-0.xsd">
<AR-PACKAGES>
    <AR-PACKAGE>
        <SHORT-NAME>p</SHORT-NAME>
        <ELEMENT>
            <APPLICATION-SW-COMPONENT-TYPE>
                <SHORT-NAME>A</SHORT-NAME>
                <EXAMPLE-ELEMENT>Value</EXAMPLE-ELEMENT>
            </APPLICATION-SW-COMPONENT-TYPE>
        </ELEMENT>
    </AR-PACKAGE>
</AR-PACKAGES>
</AUTOSAR>
`
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');

        const copiedElementShortName = 'CopyElementShortName';
        const arlangContent =
`#package p
swComponent:application A {
    arlangModId : "arlangModId@0"
}
swComponent:application ${copiedElementShortName} {
    arlangModId : "arlangModId@0"
}
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangSwComponent = arlangModel.packages[0].elements[1] as ArlangSwComponent;

        initTransformationFlowHelpers();
        const originalElement = arxml.getElementsByTagName('APPLICATION-SW-COMPONENT-TYPE')[0];
        arxmlObjectsToRemove.push(originalElement);
        vi.spyOn(metadataToArxmlTransformation, "getArxmlObject").mockImplementation(() => originalElement);
        vi.spyOn(metadataToArxmlTransformation, "getContainerFQNFromMetadata").mockImplementation(() => 'p');
        vi.spyOn(arlangToArxmlGeneral, "checkSameContainerFQNAndRelativeFilePath").mockImplementation(() => true);
        vi.spyOn(metadataToArxmlTransformation, "getArlangModIdFromArxmlObject").mockImplementation(() => "");

        const copyOrModifyRetVal = copyOrModifyArxmlSwComponent(arxml, arlangSwComponent, "arlangModId@0");

        expect(metadataToArxmlTransformation.getArxmlObject).toHaveBeenCalled();
        expect(metadataToArxmlTransformation.getContainerFQNFromMetadata).toHaveBeenCalled();
        expect(arlangToArxmlGeneral.checkSameContainerFQNAndRelativeFilePath).toHaveBeenCalled();
        expect(metadataToArxmlTransformation.getArlangModIdFromArxmlObject).toHaveBeenCalled();

        expect(copyOrModifyRetVal).not.toBeNull();

        expect(copyOrModifyRetVal!.getElementsByTagName('SHORT-NAME')[0].childNodes[0].textContent).toEqual(copiedElementShortName);

        const nonArlangSupportedNodes = copyOrModifyRetVal!.getElementsByTagName('EXAMPLE-ELEMENT');
        expect(nonArlangSupportedNodes.length).toEqual(1);
        expect(nonArlangSupportedNodes[0].childNodes[0].textContent).toEqual('Value');
    });

    it('Should return new element when it is copied in different package', async () => {
        const arxmlContent =
`<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_4-3-0.xsd">
<AR-PACKAGES>
    <AR-PACKAGE>
        <SHORT-NAME>p</SHORT-NAME>
        <ELEMENT>
            <APPLICATION-SW-COMPONENT-TYPE>
                <SHORT-NAME>A</SHORT-NAME>
                <EXAMPLE-ELEMENT>Value</EXAMPLE-ELEMENT>
            </APPLICATION-SW-COMPONENT-TYPE>
        </ELEMENT>
    </AR-PACKAGE>
</AR-PACKAGES>
</AUTOSAR>
`
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');

        const copiedElementShortName = 'CopyElementShortName';
        const arlangContent =
`#package p
swComponent:application A {
    arlangModId : "arlangModId@0"
}
#end

#package b
swComponent:application ${copiedElementShortName} {
    arlangModId : "arlangModId@0"
}
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangSwComponent = arlangModel.packages[1].elements[0] as ArlangSwComponent;

        vi.spyOn(metadataToArxmlTransformation, "getArxmlObject").mockImplementation(() => arxml.getElementsByTagName('APPLICATION-SW-COMPONENT-TYPE')[0]);
        vi.spyOn(metadataToArxmlTransformation, "getContainerFQNFromMetadata").mockImplementation(() => 'p');
        vi.spyOn(arlangToArxmlGeneral, "checkSameContainerFQNAndRelativeFilePath").mockImplementation(() => false);
        vi.spyOn(metadataToArxmlTransformation, "getArlangModIdFromArxmlObject").mockImplementation(() => "");

        const copyOrModifyRetVal = copyOrModifyArxmlSwComponent(arxml, arlangSwComponent, "arlangModId@0");

        expect(metadataToArxmlTransformation.getArxmlObject).toHaveBeenCalled();
        expect(metadataToArxmlTransformation.getContainerFQNFromMetadata).toHaveBeenCalled();
        expect(arlangToArxmlGeneral.checkSameContainerFQNAndRelativeFilePath).toHaveBeenCalled();
        expect(metadataToArxmlTransformation.getArlangModIdFromArxmlObject).toHaveBeenCalled();

        expect(copyOrModifyRetVal).not.toBeNull();

        expect(copyOrModifyRetVal!.getElementsByTagName('SHORT-NAME')[0].childNodes[0].textContent).toEqual(copiedElementShortName);

        const nonArlangSupportedNodes = copyOrModifyRetVal!.getElementsByTagName('EXAMPLE-ELEMENT');
        expect(nonArlangSupportedNodes.length).toEqual(1);
        expect(nonArlangSupportedNodes[0].childNodes[0].textContent).toEqual('Value');
    });

});

describe('transformArlangSwComponent - new element creation', () => {

    it('Should return new transformed Application Software Component', async () => {
        const applicationSwComponentType = 'application';
        await performTest(applicationSwComponentType, 'ExampleSwcName1');
    });

    async function performTest(arlangSwComponentType: ArlangSwComponentType, swComponentName: string) {
        const doc = new DOMParser().parseFromString(baseArxml, 'text/xml');

        const arlangContent =
`#package A
swComponent:${arlangSwComponentType} ${swComponentName} {

}
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangSwComponent = arlangModel.packages[0].elements[0] as ArlangSwComponent;

        const arxmlSwComponent = transformArlangSwComponent(doc, arlangSwComponent);
        expect(arxmlSwComponent).not.toBeNull();

        checkSwComponentTypes(arlangSwComponentType, arxmlSwComponent!.tagName);

        const arxmlInterfaceChildNodes = arxmlSwComponent!.childNodes;
        expect(arxmlInterfaceChildNodes.length).toEqual(1);

        const shortNameNode = arxmlInterfaceChildNodes[0] as Element;
        expect(shortNameNode.tagName).toEqual('SHORT-NAME');

        const shortNameNodeNodes = shortNameNode.childNodes;
        expect(shortNameNodeNodes.length).toEqual(1);

        const shortNameTextNode = shortNameNodeNodes[0] as Text;
        expect(shortNameTextNode.data).toEqual(swComponentName);
    }

});

describe('transformArlangSwComponent - modification and copy', () => {

    it('Should report error when arxml reference object is not found', async () => {
        const arxml = new DOMParser().parseFromString(baseArxml, 'text/xml');
        const arlangContent =
`#package A
swComponent:application swc {
    arlangModId : "arlangModId@0"
}
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangSwComponent = arlangModel.packages[0].elements[0] as ArlangSwComponent;

        vi.spyOn(vscodeHelperFunctions, "showNoArlangModIdFoundError").mockImplementation(() => {});

        metadataToArxmlTransformation.initMetadataToArxmlTransformation();
        transformArlangSwComponent(arxml, arlangSwComponent);

        expect(vscodeHelperFunctions.showNoArlangModIdFoundError).toHaveBeenCalledTimes(1);
    });

    it('Should report error when container FQN from metadata is not found', async () => {
        const arxml = new DOMParser().parseFromString(baseArxml, 'text/xml');
        const arlangContent =
`#package A
swComponent:application swc {
    arlangModId : "arlangModId@0"
}
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangSwComponent = arlangModel.packages[0].elements[0] as ArlangSwComponent;

        vi.spyOn(metadataToArxmlTransformation, "getArxmlObject").mockImplementation(() => arxml.getElementsByTagName('AUTOSAR')[0]);
        vi.spyOn(vscodeHelperFunctions, "showNoArlangModIdFoundError").mockImplementation(() => {});

        metadataToArxmlTransformation.initMetadataToArxmlTransformation();
        transformArlangSwComponent(arxml, arlangSwComponent);

        expect(metadataToArxmlTransformation.getArxmlObject).toHaveBeenCalledTimes(1);
        expect(vscodeHelperFunctions.showNoArlangModIdFoundError).toHaveBeenCalledTimes(1);
    });

    /**
     * Modification means that element is added before the element that is supposed to be modified.
     * Element that is supposed to be modified is marked to be removed.
     * If element that is supposed to be modified contains any chidren that can not be represented in arlang, they should be copied to the 'new modified' element.
     */
    it('Should handle Application Software Component modification', async () => {
        const arxmlContent =
`<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_4-3-0.xsd">
<AR-PACKAGES>
    <AR-PACKAGE>
        <SHORT-NAME>p</SHORT-NAME>
        <ELEMENT>
            <APPLICATION-SW-COMPONENT-TYPE>
                <SHORT-NAME>A</SHORT-NAME>
            </APPLICATION-SW-COMPONENT-TYPE>
            <APPLICATION-SW-COMPONENT-TYPE>
                <SHORT-NAME>B</SHORT-NAME>
                <E1>
                    <E2 attr1="attrVal1" attr2="attrVal2">
                    </E2>
                </E1>
                <E1>
                </E1>
            </APPLICATION-SW-COMPONENT-TYPE>
            <APPLICATION-SW-COMPONENT-TYPE>
                <SHORT-NAME>C</SHORT-NAME>
            </APPLICATION-SW-COMPONENT-TYPE>
        </ELEMENT>
    </AR-PACKAGE>
</AR-PACKAGES>
</AUTOSAR>
`
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');

        const newShortName = 'SWC';
        const arlangContent =
`#package p
swComponent:application A {
    arlangModId : "arlangModId@0"
}

swComponent:application ${newShortName} {
    arlangModId : "arangModId@1"
}

swComponent:application C {
    arlangModId : "arlangModId@2"
}
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangSwComponent = arlangModel.packages[0].elements[1] as ArlangSwComponent;

        initTransformationFlowHelpers();
        vi.spyOn(metadataToArxmlTransformation, "getArxmlObject").mockImplementation(() => arxml.getElementsByTagName('APPLICATION-SW-COMPONENT-TYPE')[1]);
        vi.spyOn(metadataToArxmlTransformation, "getContainerFQNFromMetadata").mockImplementation(() => 'p');
        vi.spyOn(arlangToArxmlGeneral, "checkSameContainerFQNAndRelativeFilePath").mockImplementation(() => true);
        vi.spyOn(metadataToArxmlTransformation, "getArlangModIdFromArxmlObject").mockImplementation(() => "");

        const transformedArlangSwComponent = transformArlangSwComponent(arxml, arlangSwComponent);

        expect(metadataToArxmlTransformation.getArxmlObject).toHaveBeenCalled();
        expect(metadataToArxmlTransformation.getContainerFQNFromMetadata).toHaveBeenCalled();
        expect(arlangToArxmlGeneral.checkSameContainerFQNAndRelativeFilePath).toHaveBeenCalled();
        expect(metadataToArxmlTransformation.getArlangModIdFromArxmlObject).toHaveBeenCalled();

        expect(transformedArlangSwComponent).toBeNull();

        /**
         * New modified element should be at the posotion of the original element (because modified element is inserted before original element).
         * Index of the original element should be +1 from the original index.
         */
        const newModifiedElement = arxml.getElementsByTagName('APPLICATION-SW-COMPONENT-TYPE')[1];
        expect(newModifiedElement.getElementsByTagName('SHORT-NAME')[0].childNodes[0].textContent).toEqual(newShortName);

        const e1Nodes = newModifiedElement.getElementsByTagName('E1');
        expect(e1Nodes.length).toEqual(2);
        const e2Nodes = e1Nodes[0].getElementsByTagName('E2');
        expect(e2Nodes.length).toEqual(1);
        const e2NodeAttrs = e2Nodes[0].attributes;
        expect(e2NodeAttrs.length).toEqual(2);
        expect(e2NodeAttrs[0].name).toEqual('attr1');
        expect(e2NodeAttrs[0].value).toEqual('attrVal1');
        expect(e2NodeAttrs[1].name).toEqual('attr2');
        expect(e2NodeAttrs[1].value).toEqual('attrVal2');

        expect(arxmlObjectsToRemove.length).toEqual(1);
        /**
         * Index of the original element should be +1 from the original index.
         */
        expect(arxmlObjectsToRemove[0]).toBe(arxml.getElementsByTagName('APPLICATION-SW-COMPONENT-TYPE')[2]);
    });

    it('Should return new element when it is copied in the same package', async () => {
        const arxmlContent =
`<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_4-3-0.xsd">
<AR-PACKAGES>
    <AR-PACKAGE>
        <SHORT-NAME>p</SHORT-NAME>
        <ELEMENT>
            <APPLICATION-SW-COMPONENT-TYPE>
                <SHORT-NAME>A</SHORT-NAME>
                <EXAMPLE-ELEMENT>Value</EXAMPLE-ELEMENT>
            </APPLICATION-SW-COMPONENT-TYPE>
        </ELEMENT>
    </AR-PACKAGE>
</AR-PACKAGES>
</AUTOSAR>
`
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');

        const copiedElementShortName = 'CopyElementShortName';
        const arlangContent =
`#package p
swComponent:application A {
    arlangModId : "arlangModId@0"
}
swComponent:application ${copiedElementShortName} {
    arlangModId : "arlangModId@0"
}
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangSwComponent = arlangModel.packages[0].elements[1] as ArlangSwComponent;

        initTransformationFlowHelpers();
        const originalElement = arxml.getElementsByTagName('APPLICATION-SW-COMPONENT-TYPE')[0];
        arxmlObjectsToRemove.push(originalElement);
        vi.spyOn(metadataToArxmlTransformation, "getArxmlObject").mockImplementation(() => originalElement);
        vi.spyOn(metadataToArxmlTransformation, "getContainerFQNFromMetadata").mockImplementation(() => 'p');
        vi.spyOn(arlangToArxmlGeneral, "checkSameContainerFQNAndRelativeFilePath").mockImplementation(() => true);
        vi.spyOn(metadataToArxmlTransformation, "getArlangModIdFromArxmlObject").mockImplementation(() => "");

        const copiedArxmlSwComponent = transformArlangSwComponent(arxml, arlangSwComponent);

        expect(metadataToArxmlTransformation.getArxmlObject).toHaveBeenCalled();
        expect(metadataToArxmlTransformation.getContainerFQNFromMetadata).toHaveBeenCalled();
        expect(arlangToArxmlGeneral.checkSameContainerFQNAndRelativeFilePath).toHaveBeenCalled();
        expect(metadataToArxmlTransformation.getArlangModIdFromArxmlObject).toHaveBeenCalled();

        expect(copiedArxmlSwComponent).not.toBeNull();

        expect(copiedArxmlSwComponent!.getElementsByTagName('SHORT-NAME')[0].childNodes[0].textContent).toEqual(copiedElementShortName);

        const nonArlangSupportedNodes = copiedArxmlSwComponent!.getElementsByTagName('EXAMPLE-ELEMENT');
        expect(nonArlangSupportedNodes.length).toEqual(1);
        expect(nonArlangSupportedNodes[0].childNodes[0].textContent).toEqual('Value');
    });

    it('Should return new element when it is copied in different package', async () => {
        const arxmlContent =
`<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_4-3-0.xsd">
<AR-PACKAGES>
    <AR-PACKAGE>
        <SHORT-NAME>p</SHORT-NAME>
        <ELEMENT>
            <APPLICATION-SW-COMPONENT-TYPE>
                <SHORT-NAME>A</SHORT-NAME>
                <EXAMPLE-ELEMENT>Value</EXAMPLE-ELEMENT>
            </APPLICATION-SW-COMPONENT-TYPE>
        </ELEMENT>
    </AR-PACKAGE>
</AR-PACKAGES>
</AUTOSAR>
`
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');

        const copiedElementShortName = 'CopyElementShortName';
        const arlangContent =
`#package p
swComponent:application A {
    arlangModId : "arlangModId@0"
}
#end

#package b
swComponent:application ${copiedElementShortName} {
    arlangModId : "arlangModId@0"
}
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangSwComponent = arlangModel.packages[1].elements[0] as ArlangSwComponent;

        vi.spyOn(metadataToArxmlTransformation, "getArxmlObject").mockImplementation(() => arxml.getElementsByTagName('APPLICATION-SW-COMPONENT-TYPE')[0]);
        vi.spyOn(metadataToArxmlTransformation, "getContainerFQNFromMetadata").mockImplementation(() => 'p');
        vi.spyOn(arlangToArxmlGeneral, "checkSameContainerFQNAndRelativeFilePath").mockImplementation(() => false);
        vi.spyOn(metadataToArxmlTransformation, "getArlangModIdFromArxmlObject").mockImplementation(() => "");

        const copiedArxmlSwComponent = transformArlangSwComponent(arxml, arlangSwComponent);

        expect(metadataToArxmlTransformation.getArxmlObject).toHaveBeenCalled();
        expect(metadataToArxmlTransformation.getContainerFQNFromMetadata).toHaveBeenCalled();
        expect(arlangToArxmlGeneral.checkSameContainerFQNAndRelativeFilePath).toHaveBeenCalled();
        expect(metadataToArxmlTransformation.getArlangModIdFromArxmlObject).toHaveBeenCalled();

        expect(copiedArxmlSwComponent).not.toBeNull();

        expect(copiedArxmlSwComponent!.getElementsByTagName('SHORT-NAME')[0].childNodes[0].textContent).toEqual(copiedElementShortName);

        const nonArlangSupportedNodes = copiedArxmlSwComponent!.getElementsByTagName('EXAMPLE-ELEMENT');
        expect(nonArlangSupportedNodes.length).toEqual(1);
        expect(nonArlangSupportedNodes[0].childNodes[0].textContent).toEqual('Value');
    });

});

function checkSwComponentTypes(arlangSwComponentType: ArlangSwComponentType, arxmlTagName: string) {
    const application : ArlangSwComponentType = 'application';

    if (arlangSwComponentType === application) {
        expect(arxmlTagName).toEqual('APPLICATION-SW-COMPONENT-TYPE');
    } else {
        fail(`TODO: Implement case for '${arlangSwComponentType}'`);
    }
}
