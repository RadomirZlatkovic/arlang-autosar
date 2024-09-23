import { describe, expect, test, it } from "vitest";
import { createARPackage, getARPackageInsideSpecifiedARPackages } from '../../../../src/transformation/arlangToArxml/packageTransformation.js';
import { DOMParser } from '@xmldom/xmldom';

describe('createARPackage', () => {

    const baseArxml =
`<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_4-3-0.xsd">
    <AR-PACKAGES>
    </AR-PACKAGES>
</AUTOSAR>
`

    test('AR-Package with specified shortName should be created', () => {
        const arxml = new DOMParser().parseFromString(baseArxml, 'text/xml');
        const shortName = "ExampleName";
        const arPackageElement = createARPackage(arxml, shortName);

        expect(arPackageElement.tagName).toEqual('AR-PACKAGE');

        const shortNameElements = arPackageElement.getElementsByTagName('SHORT-NAME');
        expect(shortNameElements.length).toEqual(1);

        const childNodes = shortNameElements[0].childNodes;
        expect(childNodes.length).toEqual(1);

        expect(childNodes[0].textContent).toEqual(shortName);
    });

});

describe('getARPackageInsideSpecifiedARPackages', () => {

    it('Should return null when AR-PACKAGES contains no element', () => {
        const arxmlContent =
`<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_4-3-0.xsd">
    <AR-PACKAGES>
    </AR-PACKAGES>
</AUTOSAR>
`

        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');

        let arPackageCollection = arxml.getElementsByTagName("AR-PACKAGES")[0];
        expect(getARPackageInsideSpecifiedARPackages(arPackageCollection, 'name')).toBe(null);
    });

    it('Should return null when AR-PACKAGES does not contain AR-PACKAGE with specified SHORT-NAME value', () => {
        const arxmlContent =
`<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_4-3-0.xsd">
    <AR-PACKAGES>
        <AR-PACKAGE>
            <SHORT-NAME>Name1</SHORT-NAME>
        </AR-PACKAGE>
        <AR-PACKAGE>
            <SHORT-NAME>p</SHORT-NAME>
        </AR-PACKAGE>
    </AR-PACKAGES>
</AUTOSAR>
`

        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');

        let arPackageCollection = arxml.getElementsByTagName("AR-PACKAGES")[0];
        expect(getARPackageInsideSpecifiedARPackages(arPackageCollection, 'name')).toBe(null);
    });

    it('Should return AR-PACKAGE in specified AR-PACKAGES of specified SHORT-NAME', () => {
        const arxmlContent =
`<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_4-3-0.xsd">
    <AR-PACKAGES>
        <AR-PACKAGE>
            <SHORT-NAME>Name1</SHORT-NAME>
            <AR-PACKAGES>
                <AR-PACKAGE>
                    <SHORT-NAME>SwcCollection</SHORT-NAME>
                </AR-PACKAGE>
            </AR-PACKAGES>
        </AR-PACKAGE>
        <AR-PACKAGE>
            <SHORT-NAME>SwcCollection</SHORT-NAME>
        </AR-PACKAGE>
        <AR-PACKAGE>
            <SHORT-NAME>v</SHORT-NAME>
        </AR-PACKAGE>
    </AR-PACKAGES>
</AUTOSAR>
`

        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');

        let arPackageCollection = arxml.getElementsByTagName("AR-PACKAGES")[0];
        expect(getARPackageInsideSpecifiedARPackages(arPackageCollection, 'SwcCollection')).toBe(arxml.getElementsByTagName('AR-PACKAGE')[2]);
    });

});
