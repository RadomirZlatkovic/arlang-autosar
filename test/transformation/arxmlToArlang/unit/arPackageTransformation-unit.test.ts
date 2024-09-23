import { describe, expect, it } from "vitest";
import { transformArxmlARPackage, getFQNFromARPackage } from '../../../../src/transformation/arxmlToArlang/arPackageTransformation.js';
import { DOMParser } from '@xmldom/xmldom';

describe('getFQNFromARPackage', () => {

    it('Should return fully qualified name of ARPackage (test 1)', () => {
        const packageNames = ['p1', 'p2', 'p3'];

        const arxmlContent =
`<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR>
    <AR-PACKAGES>
        <AR-PACKAGE>
            <SHORT-NAME>${packageNames[0]}</SHORT-NAME>
                <AR-PACKAGES>
                    <AR-PACKAGE>
                        <SHORT-NAME>${packageNames[1]}</SHORT-NAME>
                        <AR-PACKAGES>
                            <AR-PACKAGE>
                                <SHORT-NAME>${packageNames[2]}</SHORT-NAME>
                            </AR-PACKAGE>
                        </AR-PACKAGES>
                    </AR-PACKAGE>
                </AR-PACKAGES>
        </AR-PACKAGE>
    </AR-PACKAGES>
</AUTOSAR>`;

        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');

        const arPackage = arxml.getElementsByTagName("AR-PACKAGE")[2];
        const fqn = getFQNFromARPackage(arPackage);

        expect(fqn).toEqual('p1.p2.p3');
    });

    it('Should return fully qualified name of ARPackage (test 2)', () => {
        const packageNames = ['p1', 'p2', 'p3'];

        const arxmlContent =
`<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR>
    <AR-PACKAGES>
        <AR-PACKAGE>
            <SHORT-NAME>${packageNames[0]}</SHORT-NAME>
            <AR-PACKAGES>
                <AR-PACKAGE>
                    <SHORT-NAME>${packageNames[1]}</SHORT-NAME>
                    <AR-PACKAGES>
                        <AR-PACKAGE>
                            <SHORT-NAME>${packageNames[2]}</SHORT-NAME>
                        </AR-PACKAGE>
                    </AR-PACKAGES>
                    <ELEMENTS>
                        <SENDER-RECEIVER-INTERFACE>
                            <SHORT-NAME>sri</SHORT-NAME>
                        </SENDER-RECEIVER-INTERFACE>
                    </ELEMENTS>
                </AR-PACKAGE>
            </AR-PACKAGES>
            <ELEMENTS>
                <APPLICATION-SW-COMPONENT-TYPE>
                    <SHORT-NAME>swc</SHORT-NAME>
                </APPLICATION-SW-COMPONENT-TYPE>
                <CLIENT-SERVER-INTERFACE>
                    <SHORT-NAME>csi</SHORT-NAME>
                </CLIENT-SERVER-INTERFACE>
            </ELEMENTS>
        </AR-PACKAGE>
    </AR-PACKAGES>
</AUTOSAR>`;

        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');

        const arPackage = arxml.getElementsByTagName("AR-PACKAGE")[1];
        const fqn = getFQNFromARPackage(arPackage);

        expect(fqn).toEqual('p1.p2');
    });

});

describe('transformArxmlARPackage', () => {

    it('Should transform single ARPackage', () => {
        const shortName = 'TestName';

        const arxmlContent =
`<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR>
    <AR-PACKAGES>
        <AR-PACKAGE>
            <SHORT-NAME>${shortName}</SHORT-NAME>
        </AR-PACKAGE>
    </AR-PACKAGES>
</AUTOSAR>`;

        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');

        const arPackage = arxml.getElementsByTagName("AR-PACKAGE")[0];
        const transformedPackage = transformArxmlARPackage(arPackage);

        const expectedTransformedPackage =
`#package ${shortName}
#end`

        expect(transformedPackage).toEqual(expectedTransformedPackage);
    });

    it('Should transform ARPackage with fully qualified name', () => {
        const fqn = ['e', 'w2', 'Implementation', 'types'];

        const arxmlContent =
`<AUTOSAR>
    <AR-PACKAGES>
        <AR-PACKAGE>
            <SHORT-NAME>${fqn[0]}</SHORT-NAME>
            <AR-PACKAGES>
                <AR-PACKAGE>
                    <SHORT-NAME>${fqn[1]}</SHORT-NAME>
                    <AR-PACKAGES>
                        <AR-PACKAGE>
                            <SHORT-NAME>${fqn[2]}</SHORT-NAME>
                            <AR-PACKAGES>
                                <AR-PACKAGE>
                                    <SHORT-NAME>${fqn[3]}</SHORT-NAME>
                                </AR-PACKAGE>
                            </AR-PACKAGES>
                        </AR-PACKAGE>
                    </AR-PACKAGES>
                </AR-PACKAGE>
            </AR-PACKAGES>
        </AR-PACKAGE>
    </AR-PACKAGES>
</AUTOSAR>`;

        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const arPackage = arxml.getElementsByTagName("AR-PACKAGE")[3];

        const transformedPackage = transformArxmlARPackage(arPackage);

        const expectedTransformedPackage =
`#package ${fqn[0]}.${fqn[1]}.${fqn[2]}.${fqn[3]}
#end`

        expect(transformedPackage).toEqual(expectedTransformedPackage);
    });

});
