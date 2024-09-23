import { beforeEach, afterAll, describe, expect, it } from "vitest";
import { transformArxmlElementToMetadata, initArxmlToMetadataTransformation, transformArxmlElementsToMetadata, getArlangModId } from '../../../../src/transformation/arxmlToMetadata/arxmlToMetadaTransformation.js';
import { ArlangMetadata } from '../../../../src/transformation/typesAndConstants.js';
import { DOMParser } from '@xmldom/xmldom';

beforeEach(() => {
    initArxmlToMetadataTransformation();
});

afterAll(() => {
    initArxmlToMetadataTransformation();
});

describe('getArlangModId', () => {

    it('Should return "undefined", when arlangModId is not created for given element because transformArxmlElementsToMetadata is not called for that element', () => {
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

        initArxmlToMetadataTransformation();
        expect(getArlangModId(arInterface)).toEqual("undefined");
    });

    it('Should return arlangModId when it is created for given element (when transformArxmlElementsToMetadata is called)', () => {
        const arxmlContent =
`<AUTOSAR>
    <AR-PACKAGES>
        <AR-PACKAGE>
            <SHORT-NAME>p1</SHORT-NAME>
            <ELEMENTS>
                <CLIENT-SERVER-INTERFACE>
                    <SHORT-NAME>i1</SHORT-NAME>
                </CLIENT-SERVER-INTERFACE>
                <SENDER-RECEIVER-INTERFACE>
                    <SHORT-NAME>i2</SHORT-NAME>
                </SENDER-RECEIVER-INTERFACE>
            </ELEMENTS>
        </AR-PACKAGE>
    </AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');

        const metadataHolder : ArlangMetadata = [];
        initArxmlToMetadataTransformation();

        transformArxmlElementsToMetadata(arxml, 'CLIENT-SERVER-INTERFACE', metadataHolder);
        let arInterface = arxml.getElementsByTagName('CLIENT-SERVER-INTERFACE')[0];
        expect(getArlangModId(arInterface)).toEqual('arlangModId@0');

        transformArxmlElementsToMetadata(arxml, 'SENDER-RECEIVER-INTERFACE', metadataHolder);
        arInterface = arxml.getElementsByTagName('SENDER-RECEIVER-INTERFACE')[0];
        expect(getArlangModId(arInterface)).toEqual('arlangModId@1');
    });

});

describe('transformArxmlElementToMetadata', () => {

    /**
     * arlangModId increment will be tested in transformArxmlElementsToMetadata.
     */

    it('Should transform Sender Receiver Interface to metadata', () => {
        const packageNames = ['a1', 'b2', 'c3'];
        const arxmlContent =
`<AUTOSAR>
    <AR-PACKAGES>
        <AR-PACKAGE>
            <SHORT-NAME>${packageNames[0]}</SHORT-NAME>
            <AR-PACKAGES>
                <AR-PACKAGE>
                    <SHORT-NAME>${packageNames[1]}</SHORT-NAME>
                    <AR-PACKAGES>
                        <AR-PACKAGE>
                            <SHORT-NAME>${packageNames[2]}</SHORT-NAME>
                            <ELEMENTS>
                                <SENDER-RECEIVER-INTERFACE>
                                    <SHORT-NAME>SRI</SHORT-NAME>
                                </SENDER-RECEIVER-INTERFACE>
                            </ELEMENTS>
                        </AR-PACKAGE>
                    </AR-PACKAGES>
                </AR-PACKAGE>
            </AR-PACKAGES>
        </AR-PACKAGE>
    </AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const arInterface = arxml.getElementsByTagName('SENDER-RECEIVER-INTERFACE')[0];

        const testIndex = 18;

        initArxmlToMetadataTransformation();
        const srInterfaceMetadata = transformArxmlElementToMetadata(arInterface, testIndex);

		expect(srInterfaceMetadata['arlangModId']).toEqual('arlangModId@0');
        expect(srInterfaceMetadata['containerFQN']).toEqual(packageNames[0] + '.' + packageNames[1] + '.' + packageNames[2]);
        expect(srInterfaceMetadata['tagName']).toEqual('SENDER-RECEIVER-INTERFACE');
        expect(srInterfaceMetadata['index']).toEqual(testIndex);
    });

    it('Should transform Client Server Interface to metadata', () => {
        const packageNames = ['P1', 'P2'];
        const arxmlContent =
`<AUTOSAR>
    <AR-PACKAGES>
        <AR-PACKAGE>
            <SHORT-NAME>${packageNames[0]}</SHORT-NAME>
            <AR-PACKAGES>
                <AR-PACKAGE>
                    <SHORT-NAME>${packageNames[1]}</SHORT-NAME>
                    <ELEMENTS>
                        <CLIENT-SERVER-INTERFACE>
                            <SHORT-NAME>SRI</SHORT-NAME>
                        </CLIENT-SERVER-INTERFACE>
                    </ELEMENTS>
                </AR-PACKAGE>
            </AR-PACKAGES>
        </AR-PACKAGE>
    </AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const arInterface = arxml.getElementsByTagName('CLIENT-SERVER-INTERFACE')[0];

        const testArlangModId = 'arlangModId@5';
        const testIndex = 0;

        initArxmlToMetadataTransformation();
        const csInterfaceMetadata = transformArxmlElementToMetadata(arInterface, testIndex, testArlangModId);

		expect(csInterfaceMetadata['arlangModId']).toEqual(testArlangModId);
        expect(csInterfaceMetadata['containerFQN']).toEqual(packageNames[0] + '.' + packageNames[1]);
        expect(csInterfaceMetadata['tagName']).toEqual('CLIENT-SERVER-INTERFACE');
        expect(csInterfaceMetadata['index']).toEqual(testIndex);
    });

    it('Should transform Application SWC to metadata', () => {
        const packageNames = ['example1', 'Test'];
        const arxmlContent =
`<AUTOSAR>
    <AR-PACKAGES>
        <AR-PACKAGE>
            <SHORT-NAME>${packageNames[0]}</SHORT-NAME>
            <AR-PACKAGES>
                <AR-PACKAGE>
                    <SHORT-NAME>${packageNames[1]}</SHORT-NAME>
                    <ELEMENTS>
                        <APPLICATION-SW-COMPONENT-TYPE>
                            <SHORT-NAME>SWC</SHORT-NAME>
                        </APPLICATION-SW-COMPONENT-TYPE>
                    </ELEMENTS>
                </AR-PACKAGE>
            </AR-PACKAGES>
        </AR-PACKAGE>
    </AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const arInterface = arxml.getElementsByTagName('APPLICATION-SW-COMPONENT-TYPE')[0];

        const testIndex = 3;

        initArxmlToMetadataTransformation();
        const csInterfaceMetadata = transformArxmlElementToMetadata(arInterface, testIndex);

		expect(csInterfaceMetadata['arlangModId']).toEqual('arlangModId@0');
        expect(csInterfaceMetadata['containerFQN']).toEqual(packageNames[0] + '.' + packageNames[1]);
        expect(csInterfaceMetadata['tagName']).toEqual('APPLICATION-SW-COMPONENT-TYPE');
        expect(csInterfaceMetadata['index']).toEqual(testIndex);
    });

    it('Should transform Provide Port to metadata', () => {
        const packageNames = ['p1', 'p2', 'P3'];
        const swcName = 'swc';
        const interfaceName = 'I';
        const arxmlContent =
`<AUTOSAR>
    <AR-PACKAGES>
        <AR-PACKAGE>
            <SHORT-NAME>${packageNames[0]}</SHORT-NAME>
            <AR-PACKAGES>
                <AR-PACKAGE>
                    <SHORT-NAME>${packageNames[1]}</SHORT-NAME>
                    <AR-PACKAGES>
                        <AR-PACKAGE>
                            <SHORT-NAME>${packageNames[2]}</SHORT-NAME>
                            <ELEMENTS>
                                <APPLICATION-SW-COMPONENT-TYPE>
                                    <SHORT-NAME>${swcName}</SHORT-NAME>
                                    <PORTS>
                                        <P-PORT-PROTOTYPE>
                                            <SHORT-NAME>P</SHORT-NAME>
                                            <PROVIDED-INTERFACE-TREF DEST="CLIENT-SERVER-INTERFACE">/${packageNames[0]}/${interfaceName}</PROVIDED-INTERFACE-TREF>
                                        </P-PORT-PROTOTYPE>
                                    </PORTS>
                                </APPLICATION-SW-COMPONENT-TYPE>
                            </ELEMENTS>
                        </AR-PACKAGE>
                    </AR-PACKAGES>
                </AR-PACKAGE>
            </AR-PACKAGES>
            <ELEMENTS>
                <CLIENT-SERVER-INTERFACE>
                    <SHORT-NAME>${interfaceName}</SHORT-NAME>
                </CLIENT-SERVER-INTERFACE>
            </ELEMENTS>
        </AR-PACKAGE>
    </AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const arInterface = arxml.getElementsByTagName('P-PORT-PROTOTYPE')[0];

        const testArlangModId = 'arlangModId@0';
        const testIndex = 58;

        initArxmlToMetadataTransformation();
        const srInterfaceMetadata = transformArxmlElementToMetadata(arInterface, testIndex, testArlangModId);

		expect(srInterfaceMetadata['arlangModId']).toEqual(testArlangModId);
        expect(srInterfaceMetadata['containerFQN']).toEqual(packageNames[0] + '.' + packageNames[1] + '.' + packageNames[2] + '.' + swcName);
        expect(srInterfaceMetadata['tagName']).toEqual('P-PORT-PROTOTYPE');
        expect(srInterfaceMetadata['index']).toEqual(testIndex);
    });

    it('Should transform Require Port to metadata', () => {
        const packageNames = ['A', 'B', 'c'];
        const swcName = 'SWComponent';
        const interfaceName = 'I';
        const arxmlContent =
`<AUTOSAR>
    <AR-PACKAGES>
        <AR-PACKAGE>
            <SHORT-NAME>${packageNames[0]}</SHORT-NAME>
            <AR-PACKAGES>
                <AR-PACKAGE>
                    <SHORT-NAME>${packageNames[1]}</SHORT-NAME>
                    <AR-PACKAGES>
                        <AR-PACKAGE>
                            <SHORT-NAME>${packageNames[2]}</SHORT-NAME>
                            <ELEMENTS>
                                <APPLICATION-SW-COMPONENT-TYPE>
                                    <SHORT-NAME>${swcName}</SHORT-NAME>
                                    <PORTS>
                                        <R-PORT-PROTOTYPE>
                                            <SHORT-NAME>R</SHORT-NAME>
                                            <REQUIRED-INTERFACE-TREF DEST="SENDER-RECEIVER-INTERFACE">/${packageNames[0]}/${interfaceName}</REQUIRED-INTERFACE-TREF>
                                        </R-PORT-PROTOTYPE>
                                    </PORTS>
                                </APPLICATION-SW-COMPONENT-TYPE>
                            </ELEMENTS>
                        </AR-PACKAGE>
                    </AR-PACKAGES>
                </AR-PACKAGE>
            </AR-PACKAGES>
            <ELEMENTS>
                <SENDER-RECEIVER-INTERFACE>
                    <SHORT-NAME>${interfaceName}</SHORT-NAME>
                </SENDER-RECEIVER-INTERFACE>
            </ELEMENTS>
        </AR-PACKAGE>
    </AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const arInterface = arxml.getElementsByTagName('R-PORT-PROTOTYPE')[0];

        const testIndex = 100;

        initArxmlToMetadataTransformation();
        const srInterfaceMetadata = transformArxmlElementToMetadata(arInterface, testIndex);

		expect(srInterfaceMetadata['arlangModId']).toEqual('arlangModId@0');
        expect(srInterfaceMetadata['containerFQN']).toEqual(packageNames[0] + '.' + packageNames[1] + '.' + packageNames[2] + '.' + swcName);
        expect(srInterfaceMetadata['tagName']).toEqual('R-PORT-PROTOTYPE');
        expect(srInterfaceMetadata['index']).toEqual(testIndex);
    });

});

describe('transformArxmlElementsToMetadata', () => {

    it('Should transform multiple Client Server Interfaces', () => {
        const packageNames = ['a1', 'b2', 'c3'];
        const arxmlContent =
`<AUTOSAR>
    <AR-PACKAGES>
        <AR-PACKAGE>
            <SHORT-NAME>${packageNames[0]}</SHORT-NAME>
            <AR-PACKAGES>
                <AR-PACKAGE>
                    <SHORT-NAME>${packageNames[1]}</SHORT-NAME>
                    <AR-PACKAGES>
                        <AR-PACKAGE>
                            <SHORT-NAME>${packageNames[2]}</SHORT-NAME>
                            <ELEMENTS>
                                <CLIENT-SERVER-INTERFACE>
                                    <SHORT-NAME>csi0</SHORT-NAME>
                                </CLIENT-SERVER-INTERFACE>
                                <CLIENT-SERVER-INTERFACE>
                                    <SHORT-NAME>csi1</SHORT-NAME>
                                </CLIENT-SERVER-INTERFACE>
                            </ELEMENTS>
                        </AR-PACKAGE>
                    </AR-PACKAGES>
                    <ELEMENTS>
                        <CLIENT-SERVER-INTERFACE>
                            <SHORT-NAME>csi2</SHORT-NAME>
                        </CLIENT-SERVER-INTERFACE>
                    </ELEMENTS>
                </AR-PACKAGE>
            </AR-PACKAGES>
        </AR-PACKAGE>
    </AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');

        const metadataHolder : ArlangMetadata = [];
        initArxmlToMetadataTransformation();
        transformArxmlElementsToMetadata(arxml, 'CLIENT-SERVER-INTERFACE', metadataHolder);

        expect(metadataHolder.length).toEqual(3);

        for (let i = 0; i < 3; i++) {
            const csiInterfaceMetadata = metadataHolder[i];
            expect(csiInterfaceMetadata.arlangModId).toEqual('arlangModId@' + i);
            expect(csiInterfaceMetadata.tagName).toEqual('CLIENT-SERVER-INTERFACE');
            expect(csiInterfaceMetadata.index).toEqual(i);
        }

        expect(metadataHolder[0].containerFQN).toEqual(packageNames[0] + '.' + packageNames[1] + '.' + packageNames[2]);
        expect(metadataHolder[1].containerFQN).toEqual(packageNames[0] + '.' + packageNames[1] + '.' + packageNames[2]);
        expect(metadataHolder[2].containerFQN).toEqual(packageNames[0] + '.' + packageNames[1]);
    });

    it('Should transform multiple Sender Receiver Interfaces', () => {
        const packageNames = ['P1', 'P2', 'P3'];
        const arxmlContent =
`<AUTOSAR>
    <AR-PACKAGES>
        <AR-PACKAGE>
            <SHORT-NAME>${packageNames[0]}</SHORT-NAME>
            <AR-PACKAGES>
                <AR-PACKAGE>
                    <SHORT-NAME>${packageNames[1]}</SHORT-NAME>
                    <AR-PACKAGES>
                        <AR-PACKAGE>
                            <SHORT-NAME>${packageNames[2]}</SHORT-NAME>
                            <ELEMENTS>
                                <SENDER-RECEIVER-INTERFACE>
                                    <SHORT-NAME>sri0</SHORT-NAME>
                                </SENDER-RECEIVER-INTERFACE>
                            </ELEMENTS>
                        </AR-PACKAGE>
                    </AR-PACKAGES>
                    <ELEMENTS>
                        <SENDER-RECEIVER-INTERFACE>
                            <SHORT-NAME>sri1</SHORT-NAME>
                        </SENDER-RECEIVER-INTERFACE>
                        <SENDER-RECEIVER-INTERFACE>
                            <SHORT-NAME>sri2</SHORT-NAME>
                        </SENDER-RECEIVER-INTERFACE>
                    </ELEMENTS>
                </AR-PACKAGE>
            </AR-PACKAGES>
        </AR-PACKAGE>
    </AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');

        const metadataHolder : ArlangMetadata = [];
        initArxmlToMetadataTransformation();
        transformArxmlElementsToMetadata(arxml, 'SENDER-RECEIVER-INTERFACE', metadataHolder);

        expect(metadataHolder.length).toEqual(3);

        for (let i = 0; i < 3; i++) {
            const sriInterfaceMetadata = metadataHolder[i];
            expect(sriInterfaceMetadata.arlangModId).toEqual('arlangModId@' + i);
            expect(sriInterfaceMetadata.tagName).toEqual('SENDER-RECEIVER-INTERFACE');
            expect(sriInterfaceMetadata.index).toEqual(i);
        }

        expect(metadataHolder[0].containerFQN).toEqual(packageNames[0] + '.' + packageNames[1] + '.' + packageNames[2]);
        expect(metadataHolder[1].containerFQN).toEqual(packageNames[0] + '.' + packageNames[1]);
        expect(metadataHolder[2].containerFQN).toEqual(packageNames[0] + '.' + packageNames[1]);
    });

    it('Should transform multiple Application Swcs', () => {
        const packageNames = ['m1', 'm2'];
        const arxmlContent =
`<AUTOSAR>
    <AR-PACKAGES>
        <AR-PACKAGE>
            <SHORT-NAME>${packageNames[0]}</SHORT-NAME>
            <ELEMENTS>
                <APPLICATION-SW-COMPONENT-TYPE>
                    <SHORT-NAME>swc</SHORT-NAME>
                </APPLICATION-SW-COMPONENT-TYPE>
                <APPLICATION-SW-COMPONENT-TYPE>
                    <SHORT-NAME>swc2</SHORT-NAME>
                </APPLICATION-SW-COMPONENT-TYPE>
            </ELEMENTS>
        </AR-PACKAGE>
        <AR-PACKAGE>
            <SHORT-NAME>${packageNames[1]}</SHORT-NAME>
            <ELEMENTS>
                <APPLICATION-SW-COMPONENT-TYPE>
                    <SHORT-NAME>swc3</SHORT-NAME>
                </APPLICATION-SW-COMPONENT-TYPE>
                <APPLICATION-SW-COMPONENT-TYPE>
                    <SHORT-NAME>swc4</SHORT-NAME>
                </APPLICATION-SW-COMPONENT-TYPE>
            </ELEMENTS>
        </AR-PACKAGE>
    </AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');

        const metadataHolder : ArlangMetadata = [];
        initArxmlToMetadataTransformation();
        transformArxmlElementsToMetadata(arxml, 'APPLICATION-SW-COMPONENT-TYPE', metadataHolder);

        expect(metadataHolder.length).toEqual(4);

        for (let i = 0; i < 3; i++) {
            const swcMetadata = metadataHolder[i];
            expect(swcMetadata.arlangModId).toEqual('arlangModId@' + i);
            expect(swcMetadata.tagName).toEqual('APPLICATION-SW-COMPONENT-TYPE');
            expect(swcMetadata.index).toEqual(i);
        }

        expect(metadataHolder[0].containerFQN).toEqual(packageNames[0]);
        expect(metadataHolder[1].containerFQN).toEqual(packageNames[0]);
        expect(metadataHolder[2].containerFQN).toEqual(packageNames[1]);
        expect(metadataHolder[3].containerFQN).toEqual(packageNames[1]);
    });

    it('Should transform multiple Provide ports', () => {
        const packageNames = ['A', 'B'];
        const swcNames = ['swc0', 'swc1'];
        const arxmlContent =
`<AUTOSAR>
    <AR-PACKAGES>
        <AR-PACKAGE>
            <SHORT-NAME>${packageNames[0]}</SHORT-NAME>
            <ELEMENTS>
                <CLIENT-SERVER-INTERFACE>
                    <SHORT-NAME>E1</SHORT-NAME>
                </CLIENT-SERVER-INTERFACE>
                <APPLICATION-SW-COMPONENT-TYPE>
                    <SHORT-NAME>${swcNames[0]}</SHORT-NAME>
                    <PORTS>
                        <P-PORT-PROTOTYPE>
                            <SHORT-NAME>P</SHORT-NAME>
                            <PROVIDED-INTERFACE-TREF DEST="CLIENT-SERVER-INTERFACE">/${packageNames[0]}/E1</PROVIDED-INTERFACE-TREF>
                        </P-PORT-PROTOTYPE>
                        <P-PORT-PROTOTYPE>
                            <SHORT-NAME>P1</SHORT-NAME>
                            <PROVIDED-INTERFACE-TREF DEST="CLIENT-SERVER-INTERFACE">/${packageNames[0]}/E1</PROVIDED-INTERFACE-TREF>
                        </P-PORT-PROTOTYPE>
                    </PORTS>
                </APPLICATION-SW-COMPONENT-TYPE>
            </ELEMENTS>
        </AR-PACKAGE>
        <AR-PACKAGE>
            <SHORT-NAME>${packageNames[1]}</SHORT-NAME>
            <ELEMENTS>
                <CLIENT-SERVER-INTERFACE>
                    <SHORT-NAME>E1</SHORT-NAME>
                </CLIENT-SERVER-INTERFACE>
                <APPLICATION-SW-COMPONENT-TYPE>
                    <SHORT-NAME>${swcNames[1]}</SHORT-NAME>
                    <PORTS>
                        <P-PORT-PROTOTYPE>
                            <SHORT-NAME>P</SHORT-NAME>
                            <PROVIDED-INTERFACE-TREF DEST="CLIENT-SERVER-INTERFACE">/${packageNames[1]}/E1</PROVIDED-INTERFACE-TREF>
                        </P-PORT-PROTOTYPE>
                    </PORTS>
                </APPLICATION-SW-COMPONENT-TYPE>
            </ELEMENTS>
        </AR-PACKAGE>
    </AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');

        const metadataHolder : ArlangMetadata = [];
        initArxmlToMetadataTransformation();
        transformArxmlElementsToMetadata(arxml, 'P-PORT-PROTOTYPE', metadataHolder);

        expect(metadataHolder.length).toEqual(3);

        for (let i = 0; i < 3; i++) {
            const portMetadata = metadataHolder[i];
            expect(portMetadata.arlangModId).toEqual('arlangModId@' + i);
            expect(portMetadata.tagName).toEqual('P-PORT-PROTOTYPE');
            expect(portMetadata.index).toEqual(i);
        }

        expect(metadataHolder[0].containerFQN).toEqual(packageNames[0] + '.' + swcNames[0]);
        expect(metadataHolder[1].containerFQN).toEqual(packageNames[0] + '.' + swcNames[0]);
        expect(metadataHolder[2].containerFQN).toEqual(packageNames[1] + '.' + swcNames[1]);
    });

    it('Should transform multiple Require ports', () => {
        const packageNames = ['PackageName', 'subpackage']
        const swcNames = ['MySwc', 'SWC'];
        const arxmlContent =
`<AUTOSAR>
    <AR-PACKAGES>
        <AR-PACKAGE>
            <SHORT-NAME>${packageNames[0]}</SHORT-NAME>
            <AR-PACKAGES>
                <AR-PACKAGE>
                    <SHORT-NAME>${packageNames[1]}</SHORT-NAME>
                    <ELEMENTS>
                        <APPLICATION-SW-COMPONENT-TYPE>
                            <SHORT-NAME>${swcNames[0]}</SHORT-NAME>
                            <PORTS>
                                <R-PORT-PROTOTYPE>
                                    <SHORT-NAME>port1</SHORT-NAME>
                                    <REQUIRED-INTERFACE-TREF DEST="SENDER-RECEIVER-INTERFACE">/${packageNames[0]}/E1</REQUIRED-INTERFACE-TREF>
                                </R-PORT-PROTOTYPE>
                            </PORTS>
                        </APPLICATION-SW-COMPONENT-TYPE>
                    </ELEMENTS>
                </AR-PACKAGE>
            </AR-PACKAGES>
            <ELEMENTS>
                <SENDER-RECEIVER-INTERFACE>
                    <SHORT-NAME>E1</SHORT-NAME>
                </SENDER-RECEIVER-INTERFACE>
                <APPLICATION-SW-COMPONENT-TYPE>
                    <SHORT-NAME>${swcNames[1]}</SHORT-NAME>
                    <PORTS>
                        <R-PORT-PROTOTYPE>
                            <SHORT-NAME>port1</SHORT-NAME>
                            <REQUIRED-INTERFACE-TREF DEST="SENDER-RECEIVER-INTERFACE">/${packageNames[0]}/E1</REQUIRED-INTERFACE-TREF>
                        </R-PORT-PROTOTYPE>
                        <R-PORT-PROTOTYPE>
                            <SHORT-NAME>port2</SHORT-NAME>
                            <REQUIRED-INTERFACE-TREF DEST="SENDER-RECEIVER-INTERFACE">/${packageNames[0]}/E1</REQUIRED-INTERFACE-TREF>
                        </R-PORT-PROTOTYPE>
                        <R-PORT-PROTOTYPE>
                            <SHORT-NAME>port3</SHORT-NAME>
                            <REQUIRED-INTERFACE-TREF DEST="SENDER-RECEIVER-INTERFACE">/${packageNames[0]}/E1</REQUIRED-INTERFACE-TREF>
                        </R-PORT-PROTOTYPE>
                    </PORTS>
                </APPLICATION-SW-COMPONENT-TYPE>
            </ELEMENTS>
        </AR-PACKAGE>
    </AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');

        const metadataHolder : ArlangMetadata = [];
        initArxmlToMetadataTransformation();
        transformArxmlElementsToMetadata(arxml, 'R-PORT-PROTOTYPE', metadataHolder);

        expect(metadataHolder.length).toEqual(4);

        for (let i = 0; i < 4; i++) {
            const portMetadata = metadataHolder[i];
            expect(portMetadata.arlangModId).toEqual('arlangModId@' + i);
            expect(portMetadata.tagName).toEqual('R-PORT-PROTOTYPE');
            expect(portMetadata.index).toEqual(i);
        }

        expect(metadataHolder[0].containerFQN).toEqual(packageNames[0] + '.' + packageNames[1] + '.' + swcNames[0]);
        expect(metadataHolder[1].containerFQN).toEqual(packageNames[0] + '.' + swcNames[1]);
        expect(metadataHolder[2].containerFQN).toEqual(packageNames[0] + '.' + swcNames[1]);
        expect(metadataHolder[3].containerFQN).toEqual(packageNames[0] + '.' + swcNames[1]);
    });

});
