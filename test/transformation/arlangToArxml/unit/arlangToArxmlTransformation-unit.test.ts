import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { formatXml } from '../../../../src/transformation/arlangToArxml/arlangToArxmlTransformation.js';
import { initTransformationFlowHelpers } from '../../../../src/transformation/arlangToArxml/arlangToArxmlTransformationFlowHelper.js';
import { DOMParser } from '@xmldom/xmldom';

beforeEach(() => {
	initTransformationFlowHelpers();
});

afterEach(() => {
	initTransformationFlowHelpers();
});

describe('formatXml', () => {

    it('Should format xml', () => {
        const arxmlContent =
`<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_4-3-0.xsd">
<AR-PACKAGES>
                <A><B>some text 1 23
</B>
                            </A></AR-PACKAGES>
</AUTOSAR>
`

        const expectedFormattedArxmlContent =
`<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_4-3-0.xsd">
	<AR-PACKAGES>
		<A>
			<B>some text 1 23</B>
		</A>
	</AR-PACKAGES>
</AUTOSAR>`

		const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
		const formattedArxmlContent = formatXml(arxml).replace(/\r\n/g, "\n");

		expect(formattedArxmlContent).toEqual(expectedFormattedArxmlContent);
    });

});
