import { describe, expect, it } from "vitest";
import { createArlangPort, transformArlangPorts } from '../../../../src/transformation/arlangToArxml/portTransformation.js';
import { InterfaceType as ArlangInterfaceType, SwComponent as ArlangSwComponent, PortType as ArlangPortType } from '../../../../src/language/generated/ast.js';
import { createArlangModel } from '../../../test-helper.js';
import { DOMParser } from '@xmldom/xmldom';
import { fail } from 'assert';

const baseArxml =
`<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_4-3-0.xsd">
<AR-PACKAGES>
</AR-PACKAGES>
</AUTOSAR>
`

describe('createArlangPort', () => {

    it('Should create port of provided type (sender receiver interface)', async () => {
        const interfaceType : ArlangInterfaceType = 'senderReceiver';
        const portType : ArlangPortType = 'provided';
        const portName = 'PSender';
        const interfaceName = "I5";

        const doc = new DOMParser().parseFromString(baseArxml, 'text/xml');

        const arlangContent =
`#package e1.a.test1.test2.tl
interface:${interfaceType} ${interfaceName} {
}

swComponent:application MySwc {
    port:${portType} ${portName} implements ${interfaceName} {
    }
}

#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangSwc = arlangModel.packages[0].elements[1] as ArlangSwComponent;
        const arlangPort = arlangSwc.ports[0];

        const arxmlPort = createArlangPort(doc, arlangPort);

        await performPortTest(arxmlPort!, portType, portName, interfaceType, interfaceName, '/e1/a/test1/test2/tl/');
    });

    it('Should create port of provided type (client server interface)', async () => {
        const interfaceType : ArlangInterfaceType = 'clientServer';
        const portType : ArlangPortType = 'provided';
        const portName = 'pReqResp';
        const interfaceName = "SPI";

        const doc = new DOMParser().parseFromString(baseArxml, 'text/xml');

        const arlangContent =
`#package TESTINGPACKAGE
interface:${interfaceType} ${interfaceName} {
}

swComponent:application MySwc {
    port:${portType} ${portName} implements ${interfaceName} {
    }
}

#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangSwc = arlangModel.packages[0].elements[1] as ArlangSwComponent;
        const arlangPort = arlangSwc.ports[0];

        const arxmlPort = createArlangPort(doc, arlangPort);

        await performPortTest(arxmlPort!, portType, portName, interfaceType, interfaceName, '/TESTINGPACKAGE/');
    });

    it('Should create port of required type (sender receiver interface)', async () => {
        const interfaceType : ArlangInterfaceType = 'senderReceiver';
        const portType : ArlangPortType = 'required';
        const portName = 'ConnectionPoint1';
        const interfaceName = "P";

        const doc = new DOMParser().parseFromString(baseArxml, 'text/xml');

        const arlangContent =
`#package s1.s2.s3.s4.s5
interface:${interfaceType} ${interfaceName} {
}

swComponent:application MySwc {
    port:${portType} ${portName} implements ${interfaceName} {
    }
}

#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangSwc = arlangModel.packages[0].elements[1] as ArlangSwComponent;
        const arlangPort = arlangSwc.ports[0];

        const arxmlPort = createArlangPort(doc, arlangPort);

        await performPortTest(arxmlPort!, portType, portName, interfaceType, interfaceName, '/s1/s2/s3/s4/s5/');
    });

    it('Should create port of required type (client server interface)', async () => {
        const interfaceType : ArlangInterfaceType = 'clientServer';
        const portType : ArlangPortType = 'required';
        const portName = 'cPlace';
        const interfaceName = "MyInterface";

        const doc = new DOMParser().parseFromString(baseArxml, 'text/xml');

        const arlangContent =
`#package j4
interface:${interfaceType} ${interfaceName} {
}

swComponent:application MySwc {
    port:${portType} ${portName} implements ${interfaceName} {
    }
}

#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangSwc = arlangModel.packages[0].elements[1] as ArlangSwComponent;
        const arlangPort = arlangSwc.ports[0];

        const arxmlPort = createArlangPort(doc, arlangPort);

        await performPortTest(arxmlPort!, portType, portName, interfaceType, interfaceName, '/j4/');
    });

});

describe('transformArlangPorts', () => {

    it('Should return null when no port is provided', async () => {
        const doc = new DOMParser().parseFromString(baseArxml, 'text/xml');

        const arlangContent =
`#package a
interface:clientServer iTemp {
}

swComponent:application MySwc {
}

#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangSwc = arlangModel.packages[0].elements[1] as ArlangSwComponent;
        const arlangPorts = arlangSwc.ports;

        const arxmlPortsCollection = transformArlangPorts(doc, arlangPorts, undefined);
        expect(arxmlPortsCollection).toBeNull();
    });

    it('Should return port collection with transformed provided port (sender receiver interface)', async () => {
        const interfaceType : ArlangInterfaceType = 'senderReceiver';
        const portType : ArlangPortType = 'provided';
        const portName = 'pProvidedSR';
        const interfaceName = 'MyInterface';

        const doc = new DOMParser().parseFromString(baseArxml, 'text/xml');

        const arlangContent =
`#package a.b.c
interface:${interfaceType} ${interfaceName} {
}

swComponent:application MySwc {
    port:${portType} ${portName} implements ${interfaceName} {
    }
}

#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangSwc = arlangModel.packages[0].elements[1] as ArlangSwComponent;
        const arlangPorts = arlangSwc.ports;

        const arxmlPortsCollection = transformArlangPorts(doc, arlangPorts, undefined);
        expect(arxmlPortsCollection).not.toBeNull();

        expect(arxmlPortsCollection!.tagName).toEqual('PORTS');

        const arxmlPorts = arxmlPortsCollection!.childNodes;
        expect(arxmlPorts.length).toEqual(1);

        await performPortTest(arxmlPorts[0] as Element, portType, portName, interfaceType, interfaceName, '/a/b/c/');
    });

    it('Should return port collection with transformed provided port (client server interface)', async () => {
        const interfaceType : ArlangInterfaceType = 'clientServer';
        const portType : ArlangPortType = 'provided';
        const portName = 'ReqResp';
        const interfaceName = 'IMyInterface3';

        const doc = new DOMParser().parseFromString(baseArxml, 'text/xml');

        const arlangContent =
`#package org.com
interface:${interfaceType} ${interfaceName} {
}

swComponent:application MySwc {
    port:${portType} ${portName} implements ${interfaceName} {
    }
}

#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangSwc = arlangModel.packages[0].elements[1] as ArlangSwComponent;
        const arlangPorts = arlangSwc.ports;

        const arxmlPortsCollection = transformArlangPorts(doc, arlangPorts, undefined);
        expect(arxmlPortsCollection).not.toBeNull();

        expect(arxmlPortsCollection!.tagName).toEqual('PORTS');

        const arxmlPorts = arxmlPortsCollection!.childNodes;
        expect(arxmlPorts.length).toEqual(1);

        await performPortTest(arxmlPorts[0] as Element, portType, portName, interfaceType, interfaceName, '/org/com/');
    });

    it('Should return port collection with transformed required port (sender receiver interface)', async () => {
        const interfaceType : ArlangInterfaceType = 'senderReceiver';
        const portType : ArlangPortType = 'required';
        const portName = 'PIInterface';
        const interfaceName = 'IInterface';

        const doc = new DOMParser().parseFromString(baseArxml, 'text/xml');

        const arlangContent =
`#package a1.b2.c3
interface:${interfaceType} ${interfaceName} {
}

swComponent:application MySwc {
    port:${portType} ${portName} implements ${interfaceName} {
    }
}

#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangSwc = arlangModel.packages[0].elements[1] as ArlangSwComponent;
        const arlangPorts = arlangSwc.ports;

        const arxmlPortsCollection = transformArlangPorts(doc, arlangPorts, undefined);
        expect(arxmlPortsCollection).not.toBeNull();

        expect(arxmlPortsCollection!.tagName).toEqual('PORTS');

        const arxmlPorts = arxmlPortsCollection!.childNodes;
        expect(arxmlPorts.length).toEqual(1);

        await performPortTest(arxmlPorts[0] as Element, portType, portName, interfaceType, interfaceName, '/a1/b2/c3/');
    });

    it('Should return port collection with transformed required port (client server interface)', async () => {
        const interfaceType : ArlangInterfaceType = 'clientServer';
        const portType : ArlangPortType = 'required';
        const portName = 'PIInterface';
        const interfaceName = 'IInterface';

        const doc = new DOMParser().parseFromString(baseArxml, 'text/xml');

        const arlangContent =
`#package a1.b2.c3
interface:${interfaceType} ${interfaceName} {
}

swComponent:application MySwc {
    port:${portType} ${portName} implements ${interfaceName} {
    }
}

#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangSwc = arlangModel.packages[0].elements[1] as ArlangSwComponent;
        const arlangPorts = arlangSwc.ports;

        const arxmlPortsCollection = transformArlangPorts(doc, arlangPorts, undefined);
        expect(arxmlPortsCollection).not.toBeNull();

        expect(arxmlPortsCollection!.tagName).toEqual('PORTS');

        const arxmlPorts = arxmlPortsCollection!.childNodes;
        expect(arxmlPorts.length).toEqual(1);

        await performPortTest(arxmlPorts[0] as Element, portType, portName, interfaceType, interfaceName, '/a1/b2/c3/');
    });

    it('Should return port collection with multiple transformed ports', async () => {
        const interfaceTypeClientServer : ArlangInterfaceType = 'clientServer';
        const interfaceTypeSenderReceiver : ArlangInterfaceType = 'senderReceiver';

        const portTypeRequired : ArlangPortType = 'required';
        const portTypeProvided : ArlangPortType = 'provided';

        const portNames = ['p1', 'p2', 'P3', 'P4'];
        const interfaceNames = ['i1', 'I2', 'i3', 'I4'];

        const doc = new DOMParser().parseFromString(baseArxml, 'text/xml');

        const arlangContent =
`#package a1.a2.a3
interface:${interfaceTypeClientServer} ${interfaceNames[0]} {
}

swComponent:application MySwc {
    port:${portTypeProvided} ${portNames[0]} implements ${interfaceNames[0]} {
    }
    port:${portTypeRequired} ${portNames[1]} implements ${interfaceNames[1]} {
    }
    port:${portTypeProvided} ${portNames[2]} implements ${interfaceNames[2]} {
    }
    port:${portTypeRequired} ${portNames[3]} implements ${interfaceNames[3]} {
    }
}

interface:${interfaceTypeSenderReceiver} ${interfaceNames[1]} {
}

#end

#package b

interface:${interfaceTypeSenderReceiver} ${interfaceNames[2]} {
}

interface:${interfaceTypeClientServer} ${interfaceNames[3]} {
}

#end
`

        const arlangModel = await createArlangModel(arlangContent);
        const arlangSwc = arlangModel.packages[0].elements[1] as ArlangSwComponent;
        const arlangPorts = arlangSwc.ports;

        const arxmlPortsCollection = transformArlangPorts(doc, arlangPorts, undefined);
        expect(arxmlPortsCollection).not.toBeNull();

        expect(arxmlPortsCollection!.tagName).toEqual('PORTS');

        const arxmlPorts = arxmlPortsCollection!.childNodes;
        expect(arxmlPorts.length).toEqual(4);

        await performPortTest(arxmlPorts[0] as Element, portTypeProvided, portNames[0], interfaceTypeClientServer, interfaceNames[0], '/a1/a2/a3/');
        await performPortTest(arxmlPorts[1] as Element, portTypeRequired, portNames[1], interfaceTypeSenderReceiver, interfaceNames[1], '/a1/a2/a3/');
        await performPortTest(arxmlPorts[2] as Element, portTypeProvided, portNames[2], interfaceTypeSenderReceiver, interfaceNames[2], '/b/');
        await performPortTest(arxmlPorts[3] as Element, portTypeRequired, portNames[3], interfaceTypeClientServer, interfaceNames[3], '/b/');
    });

});

async function performPortTest(arxmlPort: Element, portType : ArlangPortType, portName: string,
    interfaceType: ArlangInterfaceType, interfaceName : string, packageRefPrefix: string) {

    if (portType === 'provided') {
        expect(arxmlPort.tagName).toEqual('P-PORT-PROTOTYPE');
    } else if (portType === 'required') {
        expect(arxmlPort.tagName).toEqual('R-PORT-PROTOTYPE');
    } else {
        fail(`TODO: Implement case for port type '${portType}'`);
    }

    const arxmlPortChildNodes = arxmlPort.childNodes;
    expect(arxmlPortChildNodes.length).toEqual(2);

    const shortNameNode = arxmlPortChildNodes[0] as Element;
    expect(shortNameNode.tagName).toEqual('SHORT-NAME');

    const shortNameNodeNodes = shortNameNode.childNodes;
    expect(shortNameNodeNodes.length).toEqual(1);

    const shortNameTextNode = shortNameNodeNodes[0] as Text;
    expect(shortNameTextNode.data).toEqual(portName);

    const interfaceRef = arxmlPortChildNodes[1] as Element;
    if (portType === 'required') {
        expect(interfaceRef.tagName).toEqual('REQUIRED-INTERFACE-TREF');
    } else if (portType === 'provided') {
        expect(interfaceRef.tagName).toEqual('PROVIDED-INTERFACE-TREF');
    } else {
        fail(`TODO: Implement case for port type '${portType}'`);
    }

    const interfaceRefAttributes = interfaceRef.attributes;
    expect(interfaceRefAttributes.length).toEqual(1);

    const interfaceRefDest = interfaceRefAttributes[0];
    expect(interfaceRefDest.name).toEqual('DEST');

    if (interfaceType === 'senderReceiver') {
        expect(interfaceRefDest.value).toEqual('SENDER-RECEIVER-INTERFACE');
    } else if (interfaceType === 'clientServer') {
        expect(interfaceRefDest.value).toEqual('CLIENT-SERVER-INTERFACE');
    } else {
        fail(`TODO: Implement case for interface type '${interfaceType}'`);
    }

    const interfaceRefNodes = interfaceRef.childNodes;
    expect(interfaceRefNodes.length).toEqual(1);

    const interfaceRefNode = interfaceRefNodes[0] as Text;
    expect(interfaceRefNode.data).toEqual(`${packageRefPrefix}${interfaceName}`);
}
