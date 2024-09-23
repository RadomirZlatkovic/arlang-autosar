import { describe, expect, it } from "vitest";
import { transformArxmlElementsFromARPackage, transformArxmlElements, transformArxmlElement } from '../../../../src/transformation/arxmlToArlang/elementsTransformation.js';
import * as interfaceTransformation from '../../../../src/transformation/arxmlToArlang/interfaceTransformation.js';
import * as swcTransformation from '../../../../src/transformation/arxmlToArlang/swcTransformation.js';
import { vi } from 'vitest';
import { DOMParser } from '@xmldom/xmldom';

describe('transformArxmlElementsFromARPackage', () => {

    it('Should return empty string when <ELEMENTS> does not exist in ARPackage', () => {
        const arxmlContent =
`<AUTOSAR>
	<AR-PACKAGES>
		<AR-PACKAGE>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const arPackage = arxml.getElementsByTagName('AR-PACKAGE')[0];

        const transformedElements = transformArxmlElementsFromARPackage(arPackage);

        expect(transformedElements.length).toEqual(0);
    });

    it('Should return empty string when no element can not be transformed (tag name not supported)', () => {
        const arxmlContent =
`<AUTOSAR>
    <AR-PACKAGES>
        <AR-PACKAGE>
            <ELEMENTS>
                <NST1>
                </NST1>
                <NST2>
                </NST2>
                <NST3>
                </NST3>
            </ELEMENTS>
        </AR-PACKAGE>
    </AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const arPackage = arxml.getElementsByTagName('AR-PACKAGE')[0];

        const transformedElements = transformArxmlElementsFromARPackage(arPackage);

        expect(transformedElements.length).toEqual(0);
    });

    it('Should call transformation of sender receiver interface', () => {
        const arxmlContent =
`<AUTOSAR>
	<AR-PACKAGES>
		<AR-PACKAGE>
			<ELEMENTS>
				<SENDER-RECEIVER-INTERFACE>
					<SHORT-NAME>shortName</SHORT-NAME>
				</SENDER-RECEIVER-INTERFACE>
			</ELEMENTS>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const arPackage = arxml.getElementsByTagName('AR-PACKAGE')[0];

        const mockedElement = 'mockedElement';
        vi.spyOn(interfaceTransformation, "transformArxmlSenderReceiverInterface").mockReturnValue(mockedElement);

        const transformedElements = transformArxmlElementsFromARPackage(arPackage);

        expect(interfaceTransformation.transformArxmlSenderReceiverInterface).toHaveBeenCalled();

        expect(transformedElements.length).toEqual(1);
        expect(transformedElements[0]).toEqual(mockedElement);
    });

    it('Should call transformation of client server interface', () => {
        const arxmlContent =
`<AUTOSAR>
	<AR-PACKAGES>
		<AR-PACKAGE>
			<ELEMENTS>
				<CLIENT-SERVER-INTERFACE>
					<SHORT-NAME>sn</SHORT-NAME>
				</CLIENT-SERVER-INTERFACE>
			</ELEMENTS>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const arPackage = arxml.getElementsByTagName('AR-PACKAGE')[0];

        const mockedElement = 'mockedElement';
        vi.spyOn(interfaceTransformation, "transformArxmlClientServerInterface").mockReturnValue(mockedElement);

        const transformedElements = transformArxmlElementsFromARPackage(arPackage);

        expect(interfaceTransformation.transformArxmlClientServerInterface).toHaveBeenCalled();

        expect(transformedElements.length).toEqual(1);
        expect(transformedElements[0]).toEqual(mockedElement);
    });

    it('Should call transformation of application software component', () => {
        const arxmlContent =
`<AUTOSAR>
	<AR-PACKAGES>
		<AR-PACKAGE>
			<ELEMENTS>
				<APPLICATION-SW-COMPONENT-TYPE>
					<SHORT-NAME>MySwc</SHORT-NAME>
				</APPLICATION-SW-COMPONENT-TYPE>
			</ELEMENTS>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const arPackage = arxml.getElementsByTagName('AR-PACKAGE')[0];

        const mockedElement = 'mockedElement';
        vi.spyOn(swcTransformation, "transformArxmlApplicationSwc").mockReturnValue(mockedElement);

        const transformedElements = transformArxmlElementsFromARPackage(arPackage);

        expect(swcTransformation.transformArxmlApplicationSwc).toHaveBeenCalled();

        expect(transformedElements.length).toEqual(1);
        expect(transformedElements[0]).toEqual(mockedElement);
    });

    it('Should call transformation of multiple elements subtypes', () => {
        const arxmlContent =
`<AUTOSAR>
	<AR-PACKAGES>
		<AR-PACKAGE>
			<ELEMENTS>
				<APPLICATION-SW-COMPONENT-TYPE>
					<SHORT-NAME>swc1</SHORT-NAME>
				</APPLICATION-SW-COMPONENT-TYPE>
				<CLIENT-SERVER-INTERFACE>
					<SHORT-NAME>i1</SHORT-NAME>
				</CLIENT-SERVER-INTERFACE>
				<SENDER-RECEIVER-INTERFACE>
					<SHORT-NAME>i2</SHORT-NAME>
				</SENDER-RECEIVER-INTERFACE>
				<SENDER-RECEIVER-INTERFACE>
					<SHORT-NAME>i3</SHORT-NAME>
				</SENDER-RECEIVER-INTERFACE>
				<CLIENT-SERVER-INTERFACE>
					<SHORT-NAME>i4</SHORT-NAME>
				</CLIENT-SERVER-INTERFACE>
				<APPLICATION-SW-COMPONENT-TYPE>
					<SHORT-NAME>swc2</SHORT-NAME>
				</APPLICATION-SW-COMPONENT-TYPE>
			</ELEMENTS>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const arPackage = arxml.getElementsByTagName('AR-PACKAGE')[0];

        const mockedInterfaceElements = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'];
        vi.spyOn(swcTransformation, "transformArxmlApplicationSwc")
            .mockReturnValueOnce(mockedInterfaceElements[0])
            .mockReturnValueOnce(mockedInterfaceElements[5]);
        vi.spyOn(interfaceTransformation, "transformArxmlClientServerInterface")
            .mockReturnValueOnce(mockedInterfaceElements[1])
            .mockReturnValueOnce(mockedInterfaceElements[4]);
        vi.spyOn(interfaceTransformation, "transformArxmlSenderReceiverInterface")
            .mockReturnValueOnce(mockedInterfaceElements[2])
            .mockReturnValueOnce(mockedInterfaceElements[3]);

        const transformedElements = transformArxmlElementsFromARPackage(arPackage);

        expect(swcTransformation.transformArxmlApplicationSwc).toHaveBeenCalledTimes(2);
        expect(interfaceTransformation.transformArxmlSenderReceiverInterface).toHaveBeenCalledTimes(2);
        expect(interfaceTransformation.transformArxmlClientServerInterface).toHaveBeenCalledTimes(2);

        expect(transformedElements.length).toEqual(6);
        for(let i = 0; i < 6; i++) {
            expect(transformedElements[i]).toEqual(mockedInterfaceElements[i]);
        }
    });

    it('Should call transformation only on elements that can be transformed', () => {
        const arxmlContent =
`<AUTOSAR>
	<AR-PACKAGES>
		<AR-PACKAGE>
			<ELEMENTS>
				<APPLICATION-SW-COMPONENT-TYPE>
					<SHORT-NAME>swc1</SHORT-NAME>
				</APPLICATION-SW-COMPONENT-TYPE>
				<SENDER-RECEIVER-INTERFACE>
					<SHORT-NAME>i1</SHORT-NAME>
				</SENDER-RECEIVER-INTERFACE>
                <NOT-SUPPORTED-TAG-1>
                </NOT-SUPPORTED-TAG-1>
				<CLIENT-SERVER-INTERFACE>
					<SHORT-NAME>i2</SHORT-NAME>
				</CLIENT-SERVER-INTERFACE>
				<SENDER-RECEIVER-INTERFACE>
					<SHORT-NAME>i3</SHORT-NAME>
				</SENDER-RECEIVER-INTERFACE>
				<CLIENT-SERVER-INTERFACE>
					<SHORT-NAME>i4</SHORT-NAME>
				</CLIENT-SERVER-INTERFACE>
                <NOT-SUPPORTED-TAG-2>
                </NOT-SUPPORTED-TAG-2>
				<APPLICATION-SW-COMPONENT-TYPE>
					<SHORT-NAME>swc2</SHORT-NAME>
				</APPLICATION-SW-COMPONENT-TYPE>
			</ELEMENTS>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const arPackage = arxml.getElementsByTagName('AR-PACKAGE')[0];

        const mockedElements = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'];
        vi.spyOn(swcTransformation, "transformArxmlApplicationSwc")
            .mockReturnValueOnce(mockedElements[0])
            .mockReturnValueOnce(mockedElements[5]);
        vi.spyOn(interfaceTransformation, "transformArxmlClientServerInterface")
            .mockReturnValueOnce(mockedElements[2])
            .mockReturnValueOnce(mockedElements[4]);
        vi.spyOn(interfaceTransformation, "transformArxmlSenderReceiverInterface")
            .mockReturnValueOnce(mockedElements[1])
            .mockReturnValueOnce(mockedElements[3]);

        const transformedElements = transformArxmlElementsFromARPackage(arPackage);

        expect(swcTransformation.transformArxmlApplicationSwc).toHaveBeenCalledTimes(2);
        expect(interfaceTransformation.transformArxmlSenderReceiverInterface).toHaveBeenCalledTimes(2);
        expect(interfaceTransformation.transformArxmlClientServerInterface).toHaveBeenCalledTimes(2);

        expect(transformedElements.length).toEqual(6);
        for(let i = 0; i < 6; i++) {
            expect(transformedElements[i]).toEqual(mockedElements[i]);
        }
    });

});

describe('transformArxmlElements', () => {

    it('Should return empty string when no element exists in <ELEMENTS>', () => {
        const arxmlContent =
`<AUTOSAR>
	<AR-PACKAGES>
		<AR-PACKAGE>
			<ELEMENTS>
			</ELEMENTS>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const elements = arxml.getElementsByTagName('ELEMENTS')[0];

        const transformedElements = transformArxmlElements(elements);

        expect(transformedElements.length).toEqual(0);
    });

    it('Should return empty string when no element can not be transformed (tag name not supported)', () => {
        const arxmlContent =
`<AUTOSAR>
    <AR-PACKAGES>
        <AR-PACKAGE>
            <ELEMENTS>
                <NST1>
                </NST1>
                <NST2>
                </NST2>
                <NST3>
                </NST3>
            </ELEMENTS>
        </AR-PACKAGE>
    </AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const elements = arxml.getElementsByTagName('ELEMENTS')[0];

        const transformedElements = transformArxmlElements(elements);

        expect(transformedElements.length).toEqual(0);
    });

    it('Should call transformation of sender receiver interface', () => {
        const arxmlContent =
`<AUTOSAR>
	<AR-PACKAGES>
		<AR-PACKAGE>
			<ELEMENTS>
				<SENDER-RECEIVER-INTERFACE>
					<SHORT-NAME>example</SHORT-NAME>
				</SENDER-RECEIVER-INTERFACE>
			</ELEMENTS>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const elements = arxml.getElementsByTagName('ELEMENTS')[0];

        const mockedElement = 'mockedElement';
        vi.spyOn(interfaceTransformation, "transformArxmlSenderReceiverInterface").mockReturnValue(mockedElement);

        const transformedElements = transformArxmlElements(elements);

        expect(interfaceTransformation.transformArxmlSenderReceiverInterface).toHaveBeenCalled();

        expect(transformedElements.length).toEqual(1);
        expect(transformedElements[0]).toEqual(mockedElement);
    });

    it('Should call transformation of client server interface', () => {
        const arxmlContent =
`<AUTOSAR>
	<AR-PACKAGES>
		<AR-PACKAGE>
			<ELEMENTS>
				<CLIENT-SERVER-INTERFACE>
					<SHORT-NAME>shortName1</SHORT-NAME>
				</CLIENT-SERVER-INTERFACE>
			</ELEMENTS>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const elements = arxml.getElementsByTagName('ELEMENTS')[0];

        const mockedElement = 'mockedElement';
        vi.spyOn(interfaceTransformation, "transformArxmlClientServerInterface").mockReturnValue(mockedElement);

        const transformedElements = transformArxmlElements(elements);

        expect(interfaceTransformation.transformArxmlClientServerInterface).toHaveBeenCalled();

        expect(transformedElements.length).toEqual(1);
        expect(transformedElements[0]).toEqual(mockedElement);
    });

    it('Should call transformation of application software component', () => {
        const arxmlContent =
`<AUTOSAR>
	<AR-PACKAGES>
		<AR-PACKAGE>
			<ELEMENTS>
				<APPLICATION-SW-COMPONENT-TYPE>
					<SHORT-NAME>MySwc</SHORT-NAME>
				</APPLICATION-SW-COMPONENT-TYPE>
			</ELEMENTS>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const elements = arxml.getElementsByTagName('ELEMENTS')[0];

        const mockedElement = 'mockedElement';
        vi.spyOn(swcTransformation, "transformArxmlApplicationSwc").mockReturnValue(mockedElement);

        const transformedElements = transformArxmlElements(elements);

        expect(swcTransformation.transformArxmlApplicationSwc).toHaveBeenCalled();

        expect(transformedElements.length).toEqual(1);
        expect(transformedElements[0]).toEqual(mockedElement);
    });

    it('Should call transformation of multiple elements subtypes', () => {
        const arxmlContent =
`<AUTOSAR>
	<AR-PACKAGES>
		<AR-PACKAGE>
			<ELEMENTS>
				<APPLICATION-SW-COMPONENT-TYPE>
					<SHORT-NAME>swc1</SHORT-NAME>
				</APPLICATION-SW-COMPONENT-TYPE>
				<SENDER-RECEIVER-INTERFACE>
					<SHORT-NAME>i1</SHORT-NAME>
				</SENDER-RECEIVER-INTERFACE>
				<CLIENT-SERVER-INTERFACE>
					<SHORT-NAME>i2</SHORT-NAME>
				</CLIENT-SERVER-INTERFACE>
				<SENDER-RECEIVER-INTERFACE>
					<SHORT-NAME>i3</SHORT-NAME>
				</SENDER-RECEIVER-INTERFACE>
				<CLIENT-SERVER-INTERFACE>
					<SHORT-NAME>i4</SHORT-NAME>
				</CLIENT-SERVER-INTERFACE>
				<APPLICATION-SW-COMPONENT-TYPE>
					<SHORT-NAME>swc2</SHORT-NAME>
				</APPLICATION-SW-COMPONENT-TYPE>
			</ELEMENTS>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const elements = arxml.getElementsByTagName('ELEMENTS')[0];

        const mockedElements = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'];
        vi.spyOn(swcTransformation, "transformArxmlApplicationSwc")
            .mockReturnValueOnce(mockedElements[0])
            .mockReturnValueOnce(mockedElements[5]);
        vi.spyOn(interfaceTransformation, "transformArxmlClientServerInterface")
            .mockReturnValueOnce(mockedElements[2])
            .mockReturnValueOnce(mockedElements[4]);
        vi.spyOn(interfaceTransformation, "transformArxmlSenderReceiverInterface")
            .mockReturnValueOnce(mockedElements[1])
            .mockReturnValueOnce(mockedElements[3]);

        const transformedElements = transformArxmlElements(elements);
        
        expect(swcTransformation.transformArxmlApplicationSwc).toHaveBeenCalledTimes(2);
        expect(interfaceTransformation.transformArxmlSenderReceiverInterface).toHaveBeenCalledTimes(2);
        expect(interfaceTransformation.transformArxmlClientServerInterface).toHaveBeenCalledTimes(2);
        
        expect(transformedElements.length).toEqual(6);
        for(let i = 0; i < 6; i++) {
            expect(transformedElements[i]).toEqual(mockedElements[i]);
        }
    });

    it('Should call transformation only on elements that can be transformed', () => {
        const arxmlContent =
`<AUTOSAR>
	<AR-PACKAGES>
		<AR-PACKAGE>
			<ELEMENTS>
				<APPLICATION-SW-COMPONENT-TYPE>
					<SHORT-NAME>swc1</SHORT-NAME>
				</APPLICATION-SW-COMPONENT-TYPE>
				<SENDER-RECEIVER-INTERFACE>
					<SHORT-NAME>i1</SHORT-NAME>
				</SENDER-RECEIVER-INTERFACE>
                <NOT-SUPPORTED-TAG-1>
                </NOT-SUPPORTED-TAG-1>
				<CLIENT-SERVER-INTERFACE>
					<SHORT-NAME>i2</SHORT-NAME>
				</CLIENT-SERVER-INTERFACE>
				<SENDER-RECEIVER-INTERFACE>
					<SHORT-NAME>i3</SHORT-NAME>
				</SENDER-RECEIVER-INTERFACE>
				<CLIENT-SERVER-INTERFACE>
					<SHORT-NAME>i4</SHORT-NAME>
				</CLIENT-SERVER-INTERFACE>
                <NOT-SUPPORTED-TAG-2>
                </NOT-SUPPORTED-TAG-2>
				<APPLICATION-SW-COMPONENT-TYPE>
					<SHORT-NAME>swc2</SHORT-NAME>
				</APPLICATION-SW-COMPONENT-TYPE>
			</ELEMENTS>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const elements = arxml.getElementsByTagName('ELEMENTS')[0];

        const mockedElements = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'];
        vi.spyOn(swcTransformation, "transformArxmlApplicationSwc")
            .mockReturnValueOnce(mockedElements[0])
            .mockReturnValueOnce(mockedElements[5]);
        vi.spyOn(interfaceTransformation, "transformArxmlClientServerInterface")
            .mockReturnValueOnce(mockedElements[2])
            .mockReturnValueOnce(mockedElements[4]);
        vi.spyOn(interfaceTransformation, "transformArxmlSenderReceiverInterface")
            .mockReturnValueOnce(mockedElements[1])
            .mockReturnValueOnce(mockedElements[3]);

        const transformedElements = transformArxmlElements(elements);

        expect(swcTransformation.transformArxmlApplicationSwc).toHaveBeenCalledTimes(2);
        expect(interfaceTransformation.transformArxmlSenderReceiverInterface).toHaveBeenCalledTimes(2);
        expect(interfaceTransformation.transformArxmlClientServerInterface).toHaveBeenCalledTimes(2);

        expect(transformedElements.length).toEqual(6);
        for(let i = 0; i < 6; i++) {
            expect(transformedElements[i]).toEqual(mockedElements[i]);
        }
    });

});

describe('transformArxmlElement', () => {

    it('Should return null when specified element can not be transformed (tag name not supported)', () => {
        const nonTransformableTagName = 'ELEMENT-CAN-NOT-BE-TRANSFORMED';

const arxmlContent =
`<AUTOSAR>
	<AR-PACKAGES>
		<AR-PACKAGE>
			<ELEMENTS>
				<${nonTransformableTagName}>
				</${nonTransformableTagName}>
			</ELEMENTS>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const element = arxml.getElementsByTagName(nonTransformableTagName)[0];

        const transformedElement = transformArxmlElement(element);

        expect(transformedElement).toBeNull();
    });

    it('Should call transformation of sender receiver interface', () => {
        const arxmlContent =
`<AUTOSAR>
	<AR-PACKAGES>
		<AR-PACKAGE>
			<ELEMENTS>
				<SENDER-RECEIVER-INTERFACE>
					<SHORT-NAME>SRI</SHORT-NAME>
				</SENDER-RECEIVER-INTERFACE>
			</ELEMENTS>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const element = arxml.getElementsByTagName('SENDER-RECEIVER-INTERFACE')[0];

        const mockedElement = 'mockedElement';
        vi.spyOn(interfaceTransformation, "transformArxmlSenderReceiverInterface").mockReturnValue(mockedElement);

        const transformedElement = transformArxmlElement(element);

        expect(interfaceTransformation.transformArxmlSenderReceiverInterface).toHaveBeenCalled();

        expect(transformedElement).toEqual(mockedElement);
    });

    it('Should call transformation of client server interface', () => {
        const arxmlContent =
`<AUTOSAR>
	<AR-PACKAGES>
		<AR-PACKAGE>
			<ELEMENTS>
				<CLIENT-SERVER-INTERFACE>
					<SHORT-NAME>CSI</SHORT-NAME>
				</CLIENT-SERVER-INTERFACE>
			</ELEMENTS>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const element = arxml.getElementsByTagName('CLIENT-SERVER-INTERFACE')[0];

        const mockedElement = 'mockedElement';
        vi.spyOn(interfaceTransformation, "transformArxmlClientServerInterface").mockReturnValue(mockedElement);

        const transformedElement = transformArxmlElement(element);

        expect(interfaceTransformation.transformArxmlClientServerInterface).toHaveBeenCalled();

        expect(transformedElement).toEqual(mockedElement);
    });

    it('Should call transformation of application software component', () => {
        const arxmlContent =
`<AUTOSAR>
	<AR-PACKAGES>
		<AR-PACKAGE>
			<ELEMENTS>
				<APPLICATION-SW-COMPONENT-TYPE>
					<SHORT-NAME>MySwc</SHORT-NAME>
				</APPLICATION-SW-COMPONENT-TYPE>
			</ELEMENTS>
		</AR-PACKAGE>
	</AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const element = arxml.getElementsByTagName('APPLICATION-SW-COMPONENT-TYPE')[0];

        const mockedElement = 'mockedElement';
        vi.spyOn(swcTransformation, "transformArxmlApplicationSwc").mockReturnValue(mockedElement);

        const transformedElement = transformArxmlElement(element);

        expect(swcTransformation.transformArxmlApplicationSwc).toHaveBeenCalled();

        expect(transformedElement).toEqual(mockedElement);
    });

});
