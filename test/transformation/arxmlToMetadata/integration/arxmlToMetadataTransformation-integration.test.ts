import { describe, expect, it } from "vitest";
import { initArxmlToMetadataTransformation, transformArxmlToMetadata } from '../../../../src/transformation/arxmlToMetadata/arxmlToMetadaTransformation.js';
import { DOMParser } from '@xmldom/xmldom';

describe('transformArxmlToMetadata', () => {

    it('Should transform client server interfaces to metadata', () => {
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
                                    <SHORT-NAME>csI2</SHORT-NAME>
                                </CLIENT-SERVER-INTERFACE>
                            </ELEMENTS>
                        </AR-PACKAGE>
                    </AR-PACKAGES>
                    <ELEMENTS>
                        <CLIENT-SERVER-INTERFACE>
                            <SHORT-NAME>csI1</SHORT-NAME>
                        </CLIENT-SERVER-INTERFACE>
                    </ELEMENTS>
                </AR-PACKAGE>
            </AR-PACKAGES>
            <ELEMENTS>
                <CLIENT-SERVER-INTERFACE>
                    <SHORT-NAME>csI0</SHORT-NAME>
                </CLIENT-SERVER-INTERFACE>
            </ELEMENTS>
        </AR-PACKAGE>
    </AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');

        initArxmlToMetadataTransformation();
        const metadata = transformArxmlToMetadata(arxml);

        expect(metadata.length).toEqual(3);
        for (let i = 0; i < 3; i++) {
            const metadataObject = metadata[i];
            expect(metadataObject.arlangModId).toEqual('arlangModId@' + i);
            expect(metadataObject.tagName).toEqual('CLIENT-SERVER-INTERFACE');
            expect(metadataObject.index).toEqual(i);
        }

        expect(metadata[0].containerFQN).toEqual(packageNames[0] + '.' + packageNames[1] + '.' + packageNames[2]);
        expect(metadata[1].containerFQN).toEqual(packageNames[0] + '.' + packageNames[1]);
        expect(metadata[2].containerFQN).toEqual(packageNames[0]);
    });

    it('Should transform sender receiver interfaces to metadata', () => {
        const packageNames = ['p0', 'p1', 'p2'];
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
                                    <SHORT-NAME>sri2</SHORT-NAME>
                                </SENDER-RECEIVER-INTERFACE>
                            </ELEMENTS>
                        </AR-PACKAGE>
                    </AR-PACKAGES>
                    <ELEMENTS>
                        <SENDER-RECEIVER-INTERFACE>
                            <SHORT-NAME>sri1</SHORT-NAME>
                        </SENDER-RECEIVER-INTERFACE>
                    </ELEMENTS>
                </AR-PACKAGE>
            </AR-PACKAGES>
            <ELEMENTS>
                <SENDER-RECEIVER-INTERFACE>
                    <SHORT-NAME>sri0</SHORT-NAME>
                </SENDER-RECEIVER-INTERFACE>
            </ELEMENTS>
        </AR-PACKAGE>
    </AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');

        initArxmlToMetadataTransformation();
        const metadata = transformArxmlToMetadata(arxml);

        expect(metadata.length).toEqual(3);
        for (let i = 0; i < 3; i++) {
            const metadataObject = metadata[i];
            expect(metadataObject.arlangModId).toEqual('arlangModId@' + i);
            expect(metadataObject.tagName).toEqual('SENDER-RECEIVER-INTERFACE');
            expect(metadataObject.index).toEqual(i);
        }

        expect(metadata[0].containerFQN).toEqual(packageNames[0] + '.' + packageNames[1] + '.' + packageNames[2]);
        expect(metadata[1].containerFQN).toEqual(packageNames[0] + '.' + packageNames[1]);
        expect(metadata[2].containerFQN).toEqual(packageNames[0]);
    });

    it('Should transform application software components to metadata', () => {
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

        initArxmlToMetadataTransformation();
        const metadata = transformArxmlToMetadata(arxml);

        expect(metadata.length).toEqual(4);
        for (let i = 0; i < 4; i++) {
            const metadataObject = metadata[i];
            expect(metadataObject.arlangModId).toEqual('arlangModId@' + i);
            expect(metadataObject.tagName).toEqual('APPLICATION-SW-COMPONENT-TYPE');
            expect(metadataObject.index).toEqual(i);
        }

        expect(metadata[0].containerFQN).toEqual(packageNames[0]);
        expect(metadata[1].containerFQN).toEqual(packageNames[0]);
        expect(metadata[2].containerFQN).toEqual(packageNames[1]);
        expect(metadata[3].containerFQN).toEqual(packageNames[1]);
    });

    it('Should transform provide ports to metadata', () => {
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

        initArxmlToMetadataTransformation();
        const metadata = transformArxmlToMetadata(arxml);

        const portMetadata = metadata.filter(metadata => metadata.tagName === 'P-PORT-PROTOTYPE');
        expect(portMetadata.length).toEqual(3);
        for (let i = 0; i < 3; i++) {
            const portMetadataObject = portMetadata[i];
            expect(portMetadataObject.index).toEqual(i);
            expect(portMetadataObject.arlangModId).toEqual('arlangModId@' + (4 + i));
        }

        expect(portMetadata[0].containerFQN).toEqual(packageNames[0] + '.' + swcNames[0]);
        expect(portMetadata[1].containerFQN).toEqual(packageNames[0] + '.' + swcNames[0]);
        expect(portMetadata[2].containerFQN).toEqual(packageNames[1] + '.' + swcNames[1]);
    });

    it('Should transform require ports to metadata', () => {
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

        initArxmlToMetadataTransformation();
        const metadata = transformArxmlToMetadata(arxml);

        const portMetadata = metadata.filter(metadata => metadata.tagName === 'R-PORT-PROTOTYPE');
        expect(portMetadata.length).toEqual(4);
        for (let i = 0; i < 4; i++) {
            const portMetadataObject = portMetadata[i];
            expect(portMetadataObject.index).toEqual(i);
            expect(portMetadataObject.arlangModId).toEqual('arlangModId@' + (3 + i));
        }

        expect(portMetadata[0].containerFQN).toEqual(packageNames[0] + '.' + packageNames[1] + '.' + swcNames[0]);
        expect(portMetadata[1].containerFQN).toEqual(packageNames[0] + '.' + swcNames[1]);
        expect(portMetadata[2].containerFQN).toEqual(packageNames[0] + '.' + swcNames[1]);
        expect(portMetadata[3].containerFQN).toEqual(packageNames[0] + '.' + swcNames[1]);
    });

    it('Should transform elements to metadata', () => {
        const packageNames = ['PackageName1', 'p2', 'StandalonePackage'];
        const srInterfaceNames = ['SenderReceiverInterface1', 'SenderReceiverInterface2'];
        const csInterfaceNames = ['CSI0', 'CSI1'];
        const swcNames = ['ExampleSWC', 'MySwc', 'AppSwc'];
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
                                    <REQUIRED-INTERFACE-TREF DEST="SENDER-RECEIVER-INTERFACE">/${packageNames[0]}/${packageNames[1]}/${srInterfaceNames[0]}</REQUIRED-INTERFACE-TREF>
                                </R-PORT-PROTOTYPE>
                                <R-PORT-PROTOTYPE>
                                    <SHORT-NAME>port2</SHORT-NAME>
                                    <REQUIRED-INTERFACE-TREF DEST="CLIENT-SERVER-INTERFACE">/${packageNames[0]}/${csInterfaceNames[0]}</REQUIRED-INTERFACE-TREF>
                                </R-PORT-PROTOTYPE>
                                <P-PORT-PROTOTYPE>
                                    <SHORT-NAME>port3</SHORT-NAME>
                                    <PROVIDED-INTERFACE-TREF DEST="SENDER-RECEIVER-INTERFACE">/${packageNames[0]}/${srInterfaceNames[1]}</PROVIDED-INTERFACE-TREF>
                                </P-PORT-PROTOTYPE>
                            </PORTS>
                        </APPLICATION-SW-COMPONENT-TYPE>
                        <SENDER-RECEIVER-INTERFACE>
                            <SHORT-NAME>${srInterfaceNames[0]}</SHORT-NAME>
                        </SENDER-RECEIVER-INTERFACE>
                    </ELEMENTS>
                </AR-PACKAGE>
            </AR-PACKAGES>
            <ELEMENTS>
                <CLIENT-SERVER-INTERFACE>
                    <SHORT-NAME>${csInterfaceNames[0]}</SHORT-NAME>
                </CLIENT-SERVER-INTERFACE>
                <SENDER-RECEIVER-INTERFACE>
                    <SHORT-NAME>${srInterfaceNames[1]}</SHORT-NAME>
                </SENDER-RECEIVER-INTERFACE>
                <APPLICATION-SW-COMPONENT-TYPE>
                    <SHORT-NAME>${swcNames[1]}</SHORT-NAME>
                    <PORTS>
                        <R-PORT-PROTOTYPE>
                            <SHORT-NAME>port1</SHORT-NAME>
                            <REQUIRED-INTERFACE-TREF DEST="SENDER-RECEIVER-INTERFACE">/${packageNames[0]}/${srInterfaceNames[1]}</REQUIRED-INTERFACE-TREF>
                        </R-PORT-PROTOTYPE>
                        <P-PORT-PROTOTYPE>
                            <SHORT-NAME>P</SHORT-NAME>
                            <PROVIDED-INTERFACE-TREF DEST="CLIENT-SERVER-INTERFACE">/${packageNames[0]}/${csInterfaceNames[0]}</PROVIDED-INTERFACE-TREF>
                        </P-PORT-PROTOTYPE>
                    </PORTS>
                </APPLICATION-SW-COMPONENT-TYPE>
            </ELEMENTS>
        </AR-PACKAGE>
        <AR-PACKAGE>
            <SHORT-NAME>${packageNames[2]}</SHORT-NAME>
            <ELEMENTS>
                <CLIENT-SERVER-INTERFACE>
                    <SHORT-NAME>${csInterfaceNames[1]}</SHORT-NAME>
                </CLIENT-SERVER-INTERFACE>
                <APPLICATION-SW-COMPONENT-TYPE>
                    <SHORT-NAME>${swcNames[2]}</SHORT-NAME>
                    <PORTS>
                        <R-PORT-PROTOTYPE>
                            <SHORT-NAME>port1</SHORT-NAME>
                            <REQUIRED-INTERFACE-TREF DEST="CLIENT-SERVER-INTERFACE">/${packageNames[2]}/${csInterfaceNames[1]}</REQUIRED-INTERFACE-TREF>
                        </R-PORT-PROTOTYPE>
                        <P-PORT-PROTOTYPE>
                            <SHORT-NAME>P</SHORT-NAME>
                            <PROVIDED-INTERFACE-TREF DEST="CLIENT-SERVER-INTERFACE">/${packageNames[2]}/${csInterfaceNames[1]}</PROVIDED-INTERFACE-TREF>
                        </P-PORT-PROTOTYPE>
                        <P-PORT-PROTOTYPE>
                            <SHORT-NAME>P</SHORT-NAME>
                            <PROVIDED-INTERFACE-TREF DEST="SENDER-RECEIVER-INTERFACE">/${packageNames[0]}/${packageNames[1]}/${srInterfaceNames[0]}</PROVIDED-INTERFACE-TREF>
                        </P-PORT-PROTOTYPE>
                    </PORTS>
                </APPLICATION-SW-COMPONENT-TYPE>
            </ELEMENTS>
        </AR-PACKAGE>
    </AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');

        initArxmlToMetadataTransformation();
        const metadata = transformArxmlToMetadata(arxml);

        expect(metadata[0]).toEqual(
            {
                "arlangModId" : "arlangModId@0",
                "containerFQN" : packageNames[0] + '.' + packageNames[1],
                "tagName": 'SENDER-RECEIVER-INTERFACE',
                "index": 0
            }
        );

        expect(metadata[1]).toEqual(
            {
                "arlangModId" : "arlangModId@1",
                "containerFQN" : packageNames[0],
                "tagName": 'SENDER-RECEIVER-INTERFACE',
                "index": 1
            }
        );

        expect(metadata[2]).toEqual(
            {
                "arlangModId" : "arlangModId@2",
                "containerFQN" : packageNames[0],
                "tagName": 'CLIENT-SERVER-INTERFACE',
                "index": 0
            }
        );

        expect(metadata[3]).toEqual(
            {
                "arlangModId" : "arlangModId@3",
                "containerFQN" : packageNames[2],
                "tagName": 'CLIENT-SERVER-INTERFACE',
                "index": 1
            }
        );

        expect(metadata[4]).toEqual(
            {
                "arlangModId" : "arlangModId@4",
                "containerFQN" : packageNames[0] + '.' + packageNames[1],
                "tagName": 'APPLICATION-SW-COMPONENT-TYPE',
                "index": 0
            }
        );

        expect(metadata[5]).toEqual(
            {
                "arlangModId" : "arlangModId@5",
                "containerFQN" : packageNames[0],
                "tagName": 'APPLICATION-SW-COMPONENT-TYPE',
                "index": 1
            }
        );

        expect(metadata[6]).toEqual(
            {
                "arlangModId" : "arlangModId@6",
                "containerFQN" : packageNames[2],
                "tagName": 'APPLICATION-SW-COMPONENT-TYPE',
                "index": 2
            }
        );

        expect(metadata[7]).toEqual(
            {
                "arlangModId" : "arlangModId@7",
                "containerFQN" : packageNames[0] + '.' + packageNames[1] + '.' + swcNames[0],
                "tagName": 'P-PORT-PROTOTYPE',
                "index": 0
            }
        );

        expect(metadata[8]).toEqual(
            {
                "arlangModId" : "arlangModId@8",
                "containerFQN" : packageNames[0] + '.' + swcNames[1],
                "tagName": 'P-PORT-PROTOTYPE',
                "index": 1
            }
        );

        expect(metadata[9]).toEqual(
            {
                "arlangModId" : "arlangModId@9",
                "containerFQN" : packageNames[2] + '.' + swcNames[2],
                "tagName": 'P-PORT-PROTOTYPE',
                "index": 2
            }
        );

        expect(metadata[10]).toEqual(
            {
                "arlangModId" : "arlangModId@10",
                "containerFQN" : packageNames[2] + '.' + swcNames[2],
                "tagName": 'P-PORT-PROTOTYPE',
                "index": 3
            }
        );

        expect(metadata[11]).toEqual(
            {
                "arlangModId" : "arlangModId@11",
                "containerFQN" : packageNames[0] + '.' + packageNames[1] + '.' + swcNames[0],
                "tagName": 'R-PORT-PROTOTYPE',
                "index": 0
            }
        );

        expect(metadata[12]).toEqual(
            {
                "arlangModId" : "arlangModId@12",
                "containerFQN" : packageNames[0] + '.' + packageNames[1] + '.' + swcNames[0],
                "tagName": 'R-PORT-PROTOTYPE',
                "index": 1
            }
        );

        expect(metadata[13]).toEqual(
            {
                "arlangModId" : "arlangModId@13",
                "containerFQN" : packageNames[0] + '.' + swcNames[1],
                "tagName": 'R-PORT-PROTOTYPE',
                "index": 2
            }
        );

        expect(metadata[14]).toEqual(
            {
                "arlangModId" : "arlangModId@14",
                "containerFQN" : packageNames[2] + '.' + swcNames[2],
                "tagName": 'R-PORT-PROTOTYPE',
                "index": 3
            }
        );
    });

});
