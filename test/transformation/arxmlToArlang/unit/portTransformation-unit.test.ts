import { describe, expect, it } from "vitest";
import { transformArxmlPortsFromSwc, transformArxmlPorts, transformArxmlPort,
transformArxmlProvidePort, transformArxmlRequirePort } from '../../../../src/transformation/arxmlToArlang/portTransformation.js';
import { PortType as ArlangPortType } from '../../../../src/language/generated/ast.js';
import { DOMParser } from '@xmldom/xmldom';
import * as arlangModIdTransformation from "../../../../src/transformation/arxmlToArlang/arlangModIdTransformation.js";
import { vi } from 'vitest';

describe('transformArxmlPortsFromSwc', () => {

    it('Should return empty string when <PORTS> does not exist in Swc', () => {
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
        const swc = arxml.getElementsByTagName('APPLICATION-SW-COMPONENT-TYPE')[0];

        const transformedPorts = transformArxmlPortsFromSwc(swc);

		expect(transformedPorts.length).toEqual(0);
    });

    it('Should return empty string when no port exists in <PORTS>', () => {
        const arxmlContent =
`<AUTOSAR>
    <AR-PACKAGES>
        <AR-PACKAGE>
            <ELEMENTS>
                <APPLICATION-SW-COMPONENT-TYPE>
                    <SHORT-NAME>MySwc1</SHORT-NAME>
                    <PORTS>
                    </PORTS>
                </APPLICATION-SW-COMPONENT-TYPE>
            </ELEMENTS>
        </AR-PACKAGE>
    </AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const swc = arxml.getElementsByTagName('APPLICATION-SW-COMPONENT-TYPE')[0];

        const transformedPorts = transformArxmlPortsFromSwc(swc);

		expect(transformedPorts.length).toEqual(0);
    });

    it('Should transform provide port of sender receiver interface', () => {
        const portData = {
			tagName : 'P-PORT-PROTOTYPE',
			shortName : 'PPMyPort1',
			interfaceType : 'SENDER-RECEIVER-INTERFACE',
			interfaceRef : '/example/short/Name/ExampleInterface'
		};

        const arxml = createArxml([portData]);
        const arxmlSwc = arxml.getElementsByTagName('APPLICATION-SW-COMPONENT-TYPE')[0];

		const mockedArlangModId = `arlangModId : "mockedArlangModId"`;
		vi.spyOn(arlangModIdTransformation, "transformElementToArlangModId").mockImplementation(() => mockedArlangModId);

        const transformedPorts = transformArxmlPortsFromSwc(arxmlSwc);
		expect(arlangModIdTransformation.transformElementToArlangModId).toHaveBeenCalled();

		const expectedPortType : ArlangPortType = 'provided';
        const expectedPort =
`		port:${expectedPortType} ${portData.shortName} implements example.short.Name.ExampleInterface {
			${mockedArlangModId}
		}`;

		expect(transformedPorts.length).toEqual(1);
        expect(transformedPorts[0]).toEqual(expectedPort);
    });

    it('Should transform provide port of client server interface', () => {
        const portData = {
			tagName : 'P-PORT-PROTOTYPE',
			shortName : 'MyPort',
			interfaceType : 'CLIENT-SERVER-INTERFACE',
			interfaceRef : '/p1/p2/ei'
		};

        const arxml = createArxml([portData]);
        const arxmlSwc = arxml.getElementsByTagName('APPLICATION-SW-COMPONENT-TYPE')[0];

		const mockedArlangModId = `arlangModId : "mockedArlangModId"`;
		vi.spyOn(arlangModIdTransformation, "transformElementToArlangModId").mockImplementation(() => mockedArlangModId);

        const transformedPorts = transformArxmlPortsFromSwc(arxmlSwc);
		expect(arlangModIdTransformation.transformElementToArlangModId).toHaveBeenCalled();

		const expectedPortType : ArlangPortType = 'provided';
        const expectedPort =
`		port:${expectedPortType} ${portData.shortName} implements p1.p2.ei {
			${mockedArlangModId}
		}`;

		expect(transformedPorts.length).toEqual(1);
        expect(transformedPorts[0]).toEqual(expectedPort);
    });

    it('Should transform require port of sender receiver interface', () => {
		const portData = {
			tagName : 'R-PORT-PROTOTYPE',
			shortName : 'examplePort',
			interfaceType : 'SENDER-RECEIVER-INTERFACE',
			interfaceRef : '/sender/receiver/interface/package/TestInterface'
		};

        const arxml = createArxml([portData]);
        const arxmlSwc = arxml.getElementsByTagName('APPLICATION-SW-COMPONENT-TYPE')[0];

		const mockedArlangModId = `arlangModId : "mockedArlangModId"`;
		vi.spyOn(arlangModIdTransformation, "transformElementToArlangModId").mockImplementation(() => mockedArlangModId);

        const transformedPorts = transformArxmlPortsFromSwc(arxmlSwc);
		expect(arlangModIdTransformation.transformElementToArlangModId).toHaveBeenCalled();

		const expectedPortType : ArlangPortType = 'required';
        const expectedPort =
`		port:${expectedPortType} ${portData.shortName} implements sender.receiver.interface.package.TestInterface {
			${mockedArlangModId}
		}`;

		expect(transformedPorts.length).toEqual(1);
        expect(transformedPorts[0]).toEqual(expectedPort);
	});

    it('Should transform require port of client server interface', () => {
		const portData = {
			tagName : 'R-PORT-PROTOTYPE',
			shortName : 'examplePort',
			interfaceType : 'CLIENT-SERVER-INTERFACE',
			interfaceRef : '/client/server/interface/package/TestInterface'
		};

        const arxml = createArxml([portData]);
        const arxmlSwc = arxml.getElementsByTagName('APPLICATION-SW-COMPONENT-TYPE')[0];

		const mockedArlangModId = `arlangModId : "mockedArlangModId"`;
		vi.spyOn(arlangModIdTransformation, "transformElementToArlangModId").mockImplementation(() => mockedArlangModId);

        const transformedPorts = transformArxmlPortsFromSwc(arxmlSwc);
		expect(arlangModIdTransformation.transformElementToArlangModId).toHaveBeenCalled();

		const expectedPortType : ArlangPortType = 'required';
        const expectedPort =
`		port:${expectedPortType} ${portData.shortName} implements client.server.interface.package.TestInterface {
			${mockedArlangModId}
		}`;

		expect(transformedPorts.length).toEqual(1);
        expect(transformedPorts[0]).toEqual(expectedPort);
	});

    it('Should transform multiple ports', () => {
		const portData = [
			{
				tagName : 'R-PORT-PROTOTYPE',
				shortName : 'p1',
				interfaceType : 'CLIENT-SERVER-INTERFACE',
				interfaceRef : '/A/B/C/i1'
			},
			{
				tagName : 'P-PORT-PROTOTYPE',
				shortName : 'P2',
				interfaceType : 'SENDER-RECEIVER-INTERFACE',
				interfaceRef : '/a/b/c/i2'
			},
			{
				tagName : 'R-PORT-PROTOTYPE',
				shortName : 'p3',
				interfaceType : 'SENDER-RECEIVER-INTERFACE',
				interfaceRef : '/IP/i3'
			},
			{
				tagName : 'P-PORT-PROTOTYPE',
				shortName : 'P4',
				interfaceType : 'CLIENT-SERVER-INTERFACE',
				interfaceRef : '/IP/i4'
			}
		];

        const arxml = createArxml(portData);
        const arxmlSwc = arxml.getElementsByTagName('APPLICATION-SW-COMPONENT-TYPE')[0];

		const mockedArlangModId = `arlangModId : "mockedArlangModId"`;
		vi.spyOn(arlangModIdTransformation, "transformElementToArlangModId").mockImplementation(() => mockedArlangModId);

        const transformedPorts = transformArxmlPortsFromSwc(arxmlSwc);
		expect(arlangModIdTransformation.transformElementToArlangModId).toHaveBeenCalled();

		const requiredPortType : ArlangPortType = 'required';
		const providedPortType : ArlangPortType = 'provided';

        const expectedPorts = [
`		port:${requiredPortType} ${portData[0].shortName} implements A.B.C.i1 {
			${mockedArlangModId}
		}`,
`		port:${providedPortType} ${portData[1].shortName} implements a.b.c.i2 {
			${mockedArlangModId}
		}`,
`		port:${requiredPortType} ${portData[2].shortName} implements IP.i3 {
			${mockedArlangModId}
		}`,
`		port:${providedPortType} ${portData[3].shortName} implements IP.i4 {
			${mockedArlangModId}
		}`
		];

		expect(transformedPorts.length).toEqual(expectedPorts.length);

		for (let i = 0; i < expectedPorts.length; i++) {
			expect(transformedPorts[i]).toEqual(expectedPorts[i]);
		}
	});

    it('Should not transform unsupported ports', () => {
		const portData = [
			{
				tagName : 'NOT-SUPPORTED-PORT-PROTOTYPE',
				shortName : 'p1',
				interfaceType : 'CLIENT-SERVER-INTERFACE',
				interfaceRef : '/package1/interface1'
			},
			{
				tagName : 'NS-PORT-PROTOTYPE',
				shortName : 'p2',
				interfaceType : 'CLIENT-SERVER-INTERFACE',
				interfaceRef : '/package2/interface2'
			},
			{
				tagName : 'R-PORT-PROTOTYPE',
				shortName : 'Port1',
				interfaceType : 'NOT-SUPPORTED-INTERFACE',
				interfaceRef : '/p/i1'
			},
		];

        const arxml = createArxml(portData);
        const arxmlSwc = arxml.getElementsByTagName('APPLICATION-SW-COMPONENT-TYPE')[0];

        const transformedPorts = transformArxmlPortsFromSwc(arxmlSwc);

		expect(transformedPorts.length).toEqual(0);
	});

    it('Should transform supported and not transform unsupported ports', () => {
		const portData = [
			{
				tagName : 'A-PORT-PROTOTYPE',
				shortName : 'PortA',
				interfaceType : 'SENDER-RECEIVER-INTERFACE',
				interfaceRef : '/p/iA'
			},
			{
				tagName : 'R-PORT-PROTOTYPE',
				shortName : 'Port1',
				interfaceType : 'SENDER-RECEIVER-INTERFACE',
				interfaceRef : '/p/i1'
			},
			{
				tagName : 'R-PORT-PROTOTYPE',
				shortName : 'PortNS',
				interfaceType : 'NOT-SUPPORTED-INTERFACE',
				interfaceRef : '/p/iNS'
			},
			{
				tagName : 'P-PORT-PROTOTYPE',
				shortName : 'Port2',
				interfaceType : 'CLIENT-SERVER-INTERFACE',
				interfaceRef : '/p/i2'
			},
			{
				tagName : 'B-PORT-PROTOTYPE',
				shortName : 'PortB',
				interfaceType : 'CLIENT-SERVER-INTERFACE',
				interfaceRef : '/p/iB'
			},
		];

        const arxml = createArxml(portData);
        const arxmlSwc = arxml.getElementsByTagName('APPLICATION-SW-COMPONENT-TYPE')[0];

		const mockedArlangModId = `arlangModId : "mockedArlangModId"`;
		vi.spyOn(arlangModIdTransformation, "transformElementToArlangModId").mockImplementation(() => mockedArlangModId);

        const transformedPorts = transformArxmlPortsFromSwc(arxmlSwc);
		expect(arlangModIdTransformation.transformElementToArlangModId).toHaveBeenCalled();

		const requiredPortType : ArlangPortType = 'required';
		const providedPortType : ArlangPortType = 'provided';

        const expectedPorts = [
`		port:${requiredPortType} ${portData[1].shortName} implements p.i1 {
			${mockedArlangModId}
		}`,
`		port:${providedPortType} ${portData[3].shortName} implements p.i2 {
			${mockedArlangModId}
		}`
		];

		expect(transformedPorts.length).toEqual(expectedPorts.length);

		for (let i = 0; i < expectedPorts.length; i++) {
			expect(transformedPorts[i]).toEqual(expectedPorts[i]);
		}
	});

});

describe('transformArxmlPorts', () => {

    it('Should return empty string when no port exists in <PORTS>', () => {
        const arxmlContent =
`<AUTOSAR>
    <AR-PACKAGES>
        <AR-PACKAGE>
            <ELEMENTS>
                <APPLICATION-SW-COMPONENT-TYPE>
                    <SHORT-NAME>MySwc</SHORT-NAME>
                    <PORTS>
                    </PORTS>
                </APPLICATION-SW-COMPONENT-TYPE>
            </ELEMENTS>
        </AR-PACKAGE>
    </AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const ports = arxml.getElementsByTagName('PORTS')[0];

        const transformedPorts = transformArxmlPorts(ports);

		expect(transformedPorts.length).toEqual(0);
    });

    it('Should transform provide port of sender receiver interface', () => {
		const portData = {
			tagName : 'P-PORT-PROTOTYPE',
			shortName : 'PPMyPort1',
			interfaceType : 'SENDER-RECEIVER-INTERFACE',
			interfaceRef : '/example/short/Name/ExampleInterface'
		};

        const arxml = createArxml([portData]);
        const arxmlPorts = arxml.getElementsByTagName('PORTS')[0];

		const mockedArlangModId = `arlangModId : "mockedArlangModId"`;
		vi.spyOn(arlangModIdTransformation, "transformElementToArlangModId").mockImplementation(() => mockedArlangModId);

        const transformedPorts = transformArxmlPorts(arxmlPorts);
		expect(arlangModIdTransformation.transformElementToArlangModId).toHaveBeenCalled();

		const expectedPortType : ArlangPortType = 'provided';
        const expectedPort =
`		port:${expectedPortType} ${portData.shortName} implements example.short.Name.ExampleInterface {
			${mockedArlangModId}
		}`;

		expect(transformedPorts.length).toEqual(1);
        expect(transformedPorts[0]).toEqual(expectedPort);
	});

    it('Should transform provide port of client server interface', () => {
		const portData = {
			tagName : 'P-PORT-PROTOTYPE',
			shortName : 'MyPort',
			interfaceType : 'CLIENT-SERVER-INTERFACE',
			interfaceRef : '/p1/p2/ei'
		};

        const arxml = createArxml([portData]);
        const arxmlPorts = arxml.getElementsByTagName('PORTS')[0];

		const mockedArlangModId = `arlangModId : "mockedArlangModId"`;
		vi.spyOn(arlangModIdTransformation, "transformElementToArlangModId").mockImplementation(() => mockedArlangModId);

        const transformedPorts = transformArxmlPorts(arxmlPorts);
		expect(arlangModIdTransformation.transformElementToArlangModId).toHaveBeenCalled();

		const expectedPortType : ArlangPortType = 'provided';
        const expectedPort =
`		port:${expectedPortType} ${portData.shortName} implements p1.p2.ei {
			${mockedArlangModId}
		}`;

		expect(transformedPorts.length).toEqual(1);
        expect(transformedPorts[0]).toEqual(expectedPort);
	});

    it('Should transform require port of sender receiver interface', () => {
		const portData = {
			tagName : 'R-PORT-PROTOTYPE',
			shortName : 'examplePort',
			interfaceType : 'SENDER-RECEIVER-INTERFACE',
			interfaceRef : '/sender/receiver/interface/package/TestInterface'
		};

        const arxml = createArxml([portData]);
        const arxmlPorts = arxml.getElementsByTagName('PORTS')[0];

		const mockedArlangModId = `arlangModId : "mockedArlangModId"`;
		vi.spyOn(arlangModIdTransformation, "transformElementToArlangModId").mockImplementation(() => mockedArlangModId);

        const transformedPorts = transformArxmlPorts(arxmlPorts);
		expect(arlangModIdTransformation.transformElementToArlangModId).toHaveBeenCalled();

		const expectedPortType : ArlangPortType = 'required';
        const expectedPort =
`		port:${expectedPortType} ${portData.shortName} implements sender.receiver.interface.package.TestInterface {
			${mockedArlangModId}
		}`;

		expect(transformedPorts.length).toEqual(1);
        expect(transformedPorts[0]).toEqual(expectedPort);
	});

    it('Should transform require port of client server interface', () => {
		const portData = {
			tagName : 'R-PORT-PROTOTYPE',
			shortName : 'examplePort',
			interfaceType : 'CLIENT-SERVER-INTERFACE',
			interfaceRef : '/client/server/interface/package/TestInterface'
		};

        const arxml = createArxml([portData]);
        const arxmlPorts = arxml.getElementsByTagName('PORTS')[0];

		const mockedArlangModId = `arlangModId : "mockedArlangModId"`;
		vi.spyOn(arlangModIdTransformation, "transformElementToArlangModId").mockImplementation(() => mockedArlangModId);

        const transformedPorts = transformArxmlPorts(arxmlPorts);
		expect(arlangModIdTransformation.transformElementToArlangModId).toHaveBeenCalled();

		const expectedPortType : ArlangPortType = 'required';
        const expectedPort =
`		port:${expectedPortType} ${portData.shortName} implements client.server.interface.package.TestInterface {
			${mockedArlangModId}
		}`;

		expect(transformedPorts.length).toEqual(1);
        expect(transformedPorts[0]).toEqual(expectedPort);
	});

    it('Should transform multiple ports', () => {
		const portData = [
			{
				tagName : 'R-PORT-PROTOTYPE',
				shortName : 'p1',
				interfaceType : 'CLIENT-SERVER-INTERFACE',
				interfaceRef : '/A/B/C/i1'
			},
			{
				tagName : 'P-PORT-PROTOTYPE',
				shortName : 'P2',
				interfaceType : 'SENDER-RECEIVER-INTERFACE',
				interfaceRef : '/a/b/c/i2'
			},
			{
				tagName : 'R-PORT-PROTOTYPE',
				shortName : 'p3',
				interfaceType : 'SENDER-RECEIVER-INTERFACE',
				interfaceRef : '/IP/i3'
			},
			{
				tagName : 'P-PORT-PROTOTYPE',
				shortName : 'P4',
				interfaceType : 'CLIENT-SERVER-INTERFACE',
				interfaceRef : '/IP/i4'
			}
		];

        const arxml = createArxml(portData);
        const arxmlPorts = arxml.getElementsByTagName('PORTS')[0];

		const mockedArlangModId = `arlangModId : "mockedArlangModId"`;
		vi.spyOn(arlangModIdTransformation, "transformElementToArlangModId").mockImplementation(() => mockedArlangModId);

        const transformedPorts = transformArxmlPorts(arxmlPorts);
		expect(arlangModIdTransformation.transformElementToArlangModId).toHaveBeenCalled();

		const requiredPortType : ArlangPortType = 'required';
		const providedPortType : ArlangPortType = 'provided';

        const expectedPorts = [
`		port:${requiredPortType} ${portData[0].shortName} implements A.B.C.i1 {
			${mockedArlangModId}
		}`,
`		port:${providedPortType} ${portData[1].shortName} implements a.b.c.i2 {
			${mockedArlangModId}
		}`,
`		port:${requiredPortType} ${portData[2].shortName} implements IP.i3 {
			${mockedArlangModId}
		}`,
`		port:${providedPortType} ${portData[3].shortName} implements IP.i4 {
			${mockedArlangModId}
		}`
		];

		expect(transformedPorts.length).toEqual(expectedPorts.length);

		for (let i = 0; i < expectedPorts.length; i++) {
			expect(transformedPorts[i]).toEqual(expectedPorts[i]);
		}
	});

    it('Should not transform unsupported ports', () => {
		const portData = [
			{
				tagName : 'NOT-SUPPORTED-PORT-PROTOTYPE',
				shortName : 'p1',
				interfaceType : 'CLIENT-SERVER-INTERFACE',
				interfaceRef : '/package1/interface1'
			},
			{
				tagName : 'NS-PORT-PROTOTYPE',
				shortName : 'p2',
				interfaceType : 'CLIENT-SERVER-INTERFACE',
				interfaceRef : '/package2/interface2'
			},
			{
				tagName : 'R-PORT-PROTOTYPE',
				shortName : 'Port1',
				interfaceType : 'NOT-SUPPORTED-INTERFACE',
				interfaceRef : '/p/i1'
			},
		];

        const arxml = createArxml(portData);
        const arxmlSwc = arxml.getElementsByTagName('APPLICATION-SW-COMPONENT-TYPE')[0];

        const transformedPorts = transformArxmlPortsFromSwc(arxmlSwc);

		expect(transformedPorts.length).toEqual(0);
	});

    it('Should transform supported and not transform unsupported ports', () => {
		const portData = [
			{
				tagName : 'A-PORT-PROTOTYPE',
				shortName : 'PortA',
				interfaceType : 'SENDER-RECEIVER-INTERFACE',
				interfaceRef : '/p/iA'
			},
			{
				tagName : 'R-PORT-PROTOTYPE',
				shortName : 'Port1',
				interfaceType : 'SENDER-RECEIVER-INTERFACE',
				interfaceRef : '/p/i1'
			},
			{
				tagName : 'R-PORT-PROTOTYPE',
				shortName : 'PortNS',
				interfaceType : 'NOT-SUPPORTED-INTERFACE',
				interfaceRef : '/p/iNS'
			},
			{
				tagName : 'P-PORT-PROTOTYPE',
				shortName : 'Port2',
				interfaceType : 'CLIENT-SERVER-INTERFACE',
				interfaceRef : '/p/i2'
			},
			{
				tagName : 'B-PORT-PROTOTYPE',
				shortName : 'PortB',
				interfaceType : 'CLIENT-SERVER-INTERFACE',
				interfaceRef : '/p/iB'
			},
		];

        const arxml = createArxml(portData);
        const arxmlSwc = arxml.getElementsByTagName('APPLICATION-SW-COMPONENT-TYPE')[0];

		const mockedArlangModId = `arlangModId : "mockedArlangModId"`;
		vi.spyOn(arlangModIdTransformation, "transformElementToArlangModId").mockImplementation(() => mockedArlangModId);

        const transformedPorts = transformArxmlPortsFromSwc(arxmlSwc);
		expect(arlangModIdTransformation.transformElementToArlangModId).toHaveBeenCalled();

		const requiredPortType : ArlangPortType = 'required';
		const providedPortType : ArlangPortType = 'provided';

        const expectedPorts = [
`		port:${requiredPortType} ${portData[1].shortName} implements p.i1 {
			${mockedArlangModId}
		}`,
`		port:${providedPortType} ${portData[3].shortName} implements p.i2 {
			${mockedArlangModId}
		}`
		];

		expect(transformedPorts.length).toEqual(expectedPorts.length);

		for (let i = 0; i < expectedPorts.length; i++) {
			expect(transformedPorts[i]).toEqual(expectedPorts[i]);
		}
	});

});

describe('transformArxmlPort', () => {

    it('Should return null if specified port can not be transformed (tag name not supported)', () => {
        const tagName = 'UNKNOWN-PORT-PROTOTYPE';
        const arxmlContent =
`<AUTOSAR>
    <AR-PACKAGES>
        <AR-PACKAGE>
            <ELEMENTS>
                <APPLICATION-SW-COMPONENT-TYPE>
                    <SHORT-NAME>MySwc</SHORT-NAME>
                    <PORTS>
                        <${tagName}>
                            <SHORT-NAME>Upp</SHORT-NAME>
                        </${tagName}>
                    </PORTS>
                </APPLICATION-SW-COMPONENT-TYPE>
            </ELEMENTS>
        </AR-PACKAGE>
    </AR-PACKAGES>
</AUTOSAR>`;
        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const tag = arxml.getElementsByTagName(tagName)[0];

        const transformedPort = transformArxmlPort(tag);

		expect(transformedPort).toBeNull();
    });

    it('Should transform provide port of sender receiver interface', () => {
		const portData = {
			tagName : 'P-PORT-PROTOTYPE',
			shortName : 'PPMyPort1',
			interfaceType : 'SENDER-RECEIVER-INTERFACE',
			interfaceRef : '/example/short/Name/ExampleInterface'
		};

        const arxml = createArxml([portData]);
        const arxmlPort = arxml.getElementsByTagName('P-PORT-PROTOTYPE')[0];

		const mockedArlangModId = `arlangModId : "mockedArlangModId"`;
		vi.spyOn(arlangModIdTransformation, "transformElementToArlangModId").mockImplementation(() => mockedArlangModId);

        const transformedPort = transformArxmlPort(arxmlPort);
		expect(arlangModIdTransformation.transformElementToArlangModId).toHaveBeenCalled();

		const expectedPortType : ArlangPortType = 'provided';
        const expectedPort =
`		port:${expectedPortType} ${portData.shortName} implements example.short.Name.ExampleInterface {
			${mockedArlangModId}
		}`;

        expect(transformedPort).toEqual(expectedPort);
	});

    it('Should transform provide port of client server interface', () => {
		const portData = {
			tagName : 'P-PORT-PROTOTYPE',
			shortName : 'MyPort',
			interfaceType : 'CLIENT-SERVER-INTERFACE',
			interfaceRef : '/p1/p2/ei'
		};

        const arxml = createArxml([portData]);
        const arxmlPort = arxml.getElementsByTagName('P-PORT-PROTOTYPE')[0];

		const mockedArlangModId = `arlangModId : "mockedArlangModId"`;
		vi.spyOn(arlangModIdTransformation, "transformElementToArlangModId").mockImplementation(() => mockedArlangModId);

        const transformedPort = transformArxmlPort(arxmlPort);
		expect(arlangModIdTransformation.transformElementToArlangModId).toHaveBeenCalled();

		const expectedPortType : ArlangPortType = 'provided';
        const expectedPort =
`		port:${expectedPortType} ${portData.shortName} implements p1.p2.ei {
			${mockedArlangModId}
		}`;

        expect(transformedPort).toEqual(expectedPort);
	});

    it('Should transform require port of sender receiver interface', () => {
		const portData = {
			tagName : 'R-PORT-PROTOTYPE',
			shortName : 'examplePort',
			interfaceType : 'SENDER-RECEIVER-INTERFACE',
			interfaceRef : '/sender/receiver/interface/package/TestInterface'
		};

        const arxml = createArxml([portData]);
        const arxmlPort = arxml.getElementsByTagName('R-PORT-PROTOTYPE')[0];

		const mockedArlangModId = `arlangModId : "mockedArlangModId"`;
		vi.spyOn(arlangModIdTransformation, "transformElementToArlangModId").mockImplementation(() => mockedArlangModId);

        const transformedPort = transformArxmlPort(arxmlPort);
		expect(arlangModIdTransformation.transformElementToArlangModId).toHaveBeenCalled();

		const expectedPortType : ArlangPortType = 'required';
        const expectedPort =
`		port:${expectedPortType} ${portData.shortName} implements sender.receiver.interface.package.TestInterface {
			${mockedArlangModId}
		}`;

        expect(transformedPort).toEqual(expectedPort);
	});

    it('Should transform require port of client server interface', () => {
		const portData = {
			tagName : 'R-PORT-PROTOTYPE',
			shortName : 'examplePort',
			interfaceType : 'CLIENT-SERVER-INTERFACE',
			interfaceRef : '/client/server/interface/package/TestInterface'
		};

        const arxml = createArxml([portData]);
        const arxmlPort = arxml.getElementsByTagName('R-PORT-PROTOTYPE')[0];

		const mockedArlangModId = `arlangModId : "mockedArlangModId"`;
		vi.spyOn(arlangModIdTransformation, "transformElementToArlangModId").mockImplementation(() => mockedArlangModId);

        const transformedPort = transformArxmlPort(arxmlPort);
		expect(arlangModIdTransformation.transformElementToArlangModId).toHaveBeenCalled();

		const expectedPortType : ArlangPortType = 'required';
        const expectedPort =
`		port:${expectedPortType} ${portData.shortName} implements client.server.interface.package.TestInterface {
			${mockedArlangModId}
		}`;

        expect(transformedPort).toEqual(expectedPort);
	});

    it('Should not transform unsupported port (port tag name not supported)', () => {
		const portData = [
			{
				tagName : 'NOT-SUPPORTED-PORT-PROTOTYPE',
				shortName : 'p1',
				interfaceType : 'CLIENT-SERVER-INTERFACE',
				interfaceRef : '/package1/interface1'
			}
		];

        const arxml = createArxml(portData);
        const arxmlPort = arxml.getElementsByTagName('NOT-SUPPORTED-PORT-PROTOTYPE')[0];

        const transformedPort = transformArxmlPort(arxmlPort);

		expect(transformedPort).toBeNull();
	});

	it('Should not transform unsupported port (interface type not supported)', () => {
		const portData = [
			{
				tagName : 'R-PORT-PROTOTYPE',
				shortName : 'PortNS',
				interfaceType : 'NOT-SUPPORTED-INTERFACE',
				interfaceRef : '/p/iNS'
			}
		];

        const arxml = createArxml(portData);
        const arxmlPort = arxml.getElementsByTagName('R-PORT-PROTOTYPE')[0];

        const transformedPort = transformArxmlPort(arxmlPort);

		expect(transformedPort).toBeNull();
	});

});

describe('transformArxmlProvidePort', () => {

    it('Should transform provide port of sender receiver interface', () => {
		const portData = {
			tagName : 'P-PORT-PROTOTYPE',
			shortName : 'Pport1',
			interfaceType : 'SENDER-RECEIVER-INTERFACE',
			interfaceRef : '/a/b/c/RandomInterface5'
		};

        const arxml = createArxml([portData]);
        const arxmlPort = arxml.getElementsByTagName('P-PORT-PROTOTYPE')[0];

		const mockedArlangModId = `arlangModId : "mockedArlangModId"`;
		vi.spyOn(arlangModIdTransformation, "transformElementToArlangModId").mockImplementation(() => mockedArlangModId);

        const transformedPort = transformArxmlProvidePort(arxmlPort);
		expect(arlangModIdTransformation.transformElementToArlangModId).toHaveBeenCalled();

		const expectedPortType : ArlangPortType = 'provided';
        const expectedPort =
`		port:${expectedPortType} ${portData.shortName} implements a.b.c.RandomInterface5 {
			${mockedArlangModId}
		}`;

		expect(transformedPort).toEqual(expectedPort);
    });

    it('Should transform provide port of client server interface', () => {
        const portData = {
			tagName : 'P-PORT-PROTOTYPE',
			shortName : 'ExamplePort1',
			interfaceType : 'CLIENT-SERVER-INTERFACE',
			interfaceRef : '/i1/i2/SRI'
		};

        const arxml = createArxml([portData]);
        const arxmlPort = arxml.getElementsByTagName('P-PORT-PROTOTYPE')[0];

		const mockedArlangModId = `arlangModId : "mockedArlangModId"`;
		vi.spyOn(arlangModIdTransformation, "transformElementToArlangModId").mockImplementation(() => mockedArlangModId);

        const transformedPort = transformArxmlProvidePort(arxmlPort);
		expect(arlangModIdTransformation.transformElementToArlangModId).toHaveBeenCalled();

		const expectedPortType : ArlangPortType = 'provided';
        const expectedPort =
`		port:${expectedPortType} ${portData.shortName} implements i1.i2.SRI {
			${mockedArlangModId}
		}`;

		expect(transformedPort).toEqual(expectedPort);
    });

    it('Should not transform provide port with unsupported interface type', () => {
		const portData = {
			tagName : 'P-PORT-PROTOTYPE',
			shortName : 'ExamplePort1',
			interfaceType : 'UNSUPPORTED-INTERFACE',
			interfaceRef : '/i1/i2/SRI'
		};

        const arxml = createArxml([portData]);
        const arxmlPort = arxml.getElementsByTagName('P-PORT-PROTOTYPE')[0];

        const transformedPort = transformArxmlProvidePort(arxmlPort);

		expect(transformedPort).toBeNull();
	});

});

describe('transformArxmlRequirePort', () => {

    it('Should transform require port of sender receiver interface', () => {
		const portData = {
			tagName : 'R-PORT-PROTOTYPE',
			shortName : 'RP',
			interfaceType : 'SENDER-RECEIVER-INTERFACE',
			interfaceRef : '/example/package/of/interfaces/MyInterface'
		};

        const arxml = createArxml([portData]);
        const arxmlPort = arxml.getElementsByTagName('R-PORT-PROTOTYPE')[0];

		const mockedArlangModId = `arlangModId : "mockedArlangModId"`;
		vi.spyOn(arlangModIdTransformation, "transformElementToArlangModId").mockImplementation(() => mockedArlangModId);

        const transformedPort = transformArxmlRequirePort(arxmlPort);
		expect(arlangModIdTransformation.transformElementToArlangModId).toHaveBeenCalled();

		const expectedPortType : ArlangPortType = 'required';
        const expectedPort =
`		port:${expectedPortType} ${portData.shortName} implements example.package.of.interfaces.MyInterface {
			${mockedArlangModId}
		}`;

		expect(transformedPort).toEqual(expectedPort);
	});

    it('Should transform require port of client server interface', () => {
		const portData = {
			tagName : 'R-PORT-PROTOTYPE',
			shortName : 'r',
			interfaceType : 'CLIENT-SERVER-INTERFACE',
			interfaceRef : '/p1/Ei'
		};

        const arxml = createArxml([portData]);
        const arxmlPort = arxml.getElementsByTagName('R-PORT-PROTOTYPE')[0];

		const mockedArlangModId = `arlangModId : "mockedArlangModId"`;
		vi.spyOn(arlangModIdTransformation, "transformElementToArlangModId").mockImplementation(() => mockedArlangModId);

        const transformedPort = transformArxmlRequirePort(arxmlPort);
		expect(arlangModIdTransformation.transformElementToArlangModId).toHaveBeenCalled();

		const expectedPortType : ArlangPortType = 'required';
        const expectedPort =
`		port:${expectedPortType} ${portData.shortName} implements p1.Ei {
			${mockedArlangModId}
		}`;

		expect(transformedPort).toEqual(expectedPort);
	});

    it('Should not transform require port with unsupported interface type', () => {
		const portData = {
			tagName : 'R-PORT-PROTOTYPE',
			shortName : 'ExampleShortName',
			interfaceType : 'UNKNOWN-INTERFACE',
			interfaceRef : '/irefp/Example'
		};

        const arxml = createArxml([portData]);
        const arxmlPort = arxml.getElementsByTagName('R-PORT-PROTOTYPE')[0];

        const transformedPort = transformArxmlRequirePort(arxmlPort);

		expect(transformedPort).toBeNull();
	});

});

function createArxml(ports : {	tagName : string,
                                shortName : string,
                                interfaceType: string,
                                interfaceRef : string } []) : Document {

    const arxmlPorts = ports.map((port) => {
        const interfaceRefTag = port.tagName === 'P-PORT-PROTOTYPE' ? 'PROVIDED-INTERFACE-TREF' : 'REQUIRED-INTERFACE-TREF';
        const interfaceRefSection =
`<${interfaceRefTag} DEST="${port.interfaceType}">${port.interfaceRef}</${interfaceRefTag}>`;

        const arxmlPort =
`<${port.tagName}>
<SHORT-NAME>${port.shortName}</SHORT-NAME>
${interfaceRefSection}
</${port.tagName}>`;

        return arxmlPort;
    }).join('\n');

    const arxmlContent =
`<AUTOSAR>
    <AR-PACKAGES>
        <AR-PACKAGE>
            <ELEMENTS>
                <APPLICATION-SW-COMPONENT-TYPE>
                    <SHORT-NAME>MySwc</SHORT-NAME>
                    <PORTS>
${arxmlPorts}
                    </PORTS>
                </APPLICATION-SW-COMPONENT-TYPE>
            </ELEMENTS>
        </AR-PACKAGE>
    </AR-PACKAGES>
</AUTOSAR>`;

    return new DOMParser().parseFromString(arxmlContent, 'text/xml');
}
