import { describe, expect, it } from "vitest";
import { transformElementToArlangModId } from "../../../../src/transformation/arxmlToArlang/arlangModIdTransformation.js";
import * as arxmlToMetadataTransformation from "../../../../src/transformation/arxmlToMetadata/arxmlToMetadaTransformation.js";
import { DOMParser } from '@xmldom/xmldom';
import { vi } from 'vitest';

describe('transformElementToArlangModId', () => {

    it('Should transform element to arlangModId', () => {
        const arxmlContent =
`<AUTOSAR>
    <AR-PACKAGES>
        <AR-PACKAGE>
            <SHORT-NAME>p1</SHORT-NAME>
            <ELEMENTS>
                <SENDER-RECEIVER-INTERFACE>
                    <SHORT-NAME>i</SHORT-NAME>
                </SENDER-RECEIVER-INTERFACE>
            </ELEMENTS>
        </AR-PACKAGE>
    </AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const arInterface = arxml.getElementsByTagName('SENDER-RECEIVER-INTERFACE')[0];

        const testArlangModId = 'testArlangModId';
        vi.spyOn(arxmlToMetadataTransformation, "getArlangModId").mockImplementation(() => testArlangModId);

        const transformedArlangModId = transformElementToArlangModId(arInterface);
        expect(arxmlToMetadataTransformation.getArlangModId).toHaveBeenCalled();
        expect(transformedArlangModId).toEqual(`arlangModId : "${testArlangModId}"`);
    });

});
