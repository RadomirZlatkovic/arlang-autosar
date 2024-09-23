import { describe, expect, it } from "vitest";
import { transformArxmlApplicationSwc } from '../../../../src/transformation/arxmlToArlang/swcTransformation.js';
import { DOMParser } from '@xmldom/xmldom';
import * as arlangModIdTransformation from "../../../../src/transformation/arxmlToArlang/arlangModIdTransformation.js";
import { vi } from 'vitest';

describe('transformArxmlApplicationSwc', () => {

    it('Should transform application software component', () => {
        const shortName = 'ExampleSwc1';
        const arxmlContent =
`<AUTOSAR>
    <AR-PACKAGES>
        <AR-PACKAGE>
            <ELEMENTS>
                <APPLICATION-SW-COMPONENT-TYPE>
                    <SHORT-NAME>${shortName}</SHORT-NAME>
                </APPLICATION-SW-COMPONENT-TYPE>
            </ELEMENTS>
        </AR-PACKAGE>
    </AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const swc = arxml.getElementsByTagName('APPLICATION-SW-COMPONENT-TYPE')[0];

        const mockedArlangModId = `arlangModId : "mockedArlangModId"`;
        vi.spyOn(arlangModIdTransformation, "transformElementToArlangModId").mockImplementation(() => mockedArlangModId);

        const transformedSwc = transformArxmlApplicationSwc(swc);
		expect(arlangModIdTransformation.transformElementToArlangModId).toHaveBeenCalled();

        const expectedSwc =
`	swComponent:application ${shortName} {
		${mockedArlangModId}
	}`;

		expect(transformedSwc).toEqual(expectedSwc);
    });

});
