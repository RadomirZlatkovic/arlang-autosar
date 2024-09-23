import { describe, expect, it } from "vitest";
import { transformArxmlSenderReceiverInterface, transformArxmlClientServerInterface } from '../../../../src/transformation/arxmlToArlang/interfaceTransformation.js';
import { InterfaceType as ArlangInterfaceType } from '../../../../src/language/generated/ast.js';
import { DOMParser } from '@xmldom/xmldom';
import * as arlangModIdTransformation from "../../../../src/transformation/arxmlToArlang/arlangModIdTransformation.js";
import { vi } from 'vitest';

describe('transformArxmlSenderReceiverInterface', () => {

    it('Should transform Sender Receiver interface', () => {
        const shortName = 'h3';
        const arxmlContent =
`<AUTOSAR>
    <AR-PACKAGES>
        <AR-PACKAGE>
            <ELEMENTS>
                <SENDER-RECEIVER-INTERFACE>
                    <SHORT-NAME>${shortName}</SHORT-NAME>
                </SENDER-RECEIVER-INTERFACE>
            </ELEMENTS>
        </AR-PACKAGE>
    </AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const srInterface = arxml.getElementsByTagName('SENDER-RECEIVER-INTERFACE')[0];

        const mockedArlangModId = `arlangModId : "mockedArlangModId"`;
        vi.spyOn(arlangModIdTransformation, "transformElementToArlangModId").mockImplementation(() => mockedArlangModId);

        const transformedInterface = transformArxmlSenderReceiverInterface(srInterface);
		expect(arlangModIdTransformation.transformElementToArlangModId).toHaveBeenCalled();

        const expectedInterfaceType : ArlangInterfaceType = 'senderReceiver';
        const expectedInterface =
`	interface:${expectedInterfaceType} ${shortName} {
		${mockedArlangModId}
	}`;

		expect(transformedInterface).toEqual(expectedInterface);
    });

});

describe('transformArxmlClientServerInterface', () => {

    it('Should transform Client Server interface', () => {
		const shortName = 'Mapping';
        const arxmlContent =
`<AUTOSAR>
    <AR-PACKAGES>
        <AR-PACKAGE>
            <ELEMENTS>
                <CLIENT-SERVER-INTERFACE>
                    <SHORT-NAME>${shortName}</SHORT-NAME>
                </CLIENT-SERVER-INTERFACE>
            </ELEMENTS>
        </AR-PACKAGE>
    </AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const srInterface = arxml.getElementsByTagName('CLIENT-SERVER-INTERFACE')[0];

		const mockedArlangModId = `arlangModId : "mockedArlangModId"`;
        vi.spyOn(arlangModIdTransformation, "transformElementToArlangModId").mockImplementation(() => mockedArlangModId);

        const transformedInterface = transformArxmlClientServerInterface(srInterface);
		expect(arlangModIdTransformation.transformElementToArlangModId).toHaveBeenCalled();

        const expectedInterfaceType : ArlangInterfaceType = 'clientServer';
        const expectedInterface =
`	interface:${expectedInterfaceType} ${shortName} {
		${mockedArlangModId}
	}`;

		expect(transformedInterface).toEqual(expectedInterface);
    });

});
