import { describe, expect, test } from "vitest";
import { AstNode, LangiumDocument, EmptyFileSystem, ParseResult } from 'langium';
import { parseDocument } from 'langium/test';
import { createArlangServices } from '../../src/language/arlang-module.js';
import { Model, Package, Element, SwComponentType, SwComponent, Port, PortType, Interface, InterfaceType, isSwComponent, isInterface} from '../../src/language/generated/ast.js';
import { expectNoError, expectAnyError } from '../test-helper.js';

const services = createArlangServices(EmptyFileSystem).Arlang;

describe('No port defined in software component', () => {

    test ('No port should be parsed when swComponent is not defined', async () => {
        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package A
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        const packages : Package[] = model.packages;
        expect(packages.length).toEqual(1);

        const elements : Element[] = packages[0].elements;
        expect(elements.length).toEqual(0);
    });

    test ('No port should be parsed when it is not defined in swComponent', async () => {
        const swComponentType : SwComponentType = 'application';
        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package A
                swComponent:${swComponentType} MySwc {

                }
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        const packages : Package[] = model.packages;
        expect(packages.length).toEqual(1);

        const elements : Element[] = packages[0].elements;
        expect(elements.length).toEqual(1);

        const swComponent = elements[0] as SwComponent;
        expect(swComponent.ports.length).toEqual(0);
    });

});

describe('Parsing one provided port and referenced client server interface', () => {

    const swComponentType : SwComponentType = 'application';
    const portType : PortType = 'provided';
    const interfaceType : InterfaceType = 'clientServer';

    test('Provided port that references clientServer interface in the same package should be parsed', async () => {
        const interfaceName = 'MyInterface';
        const portName = 'MyPort';

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package A
                interface:${interfaceType} ${interfaceName} {
                }
                swComponent:${swComponentType} MySwc {
                    port:${portType} ${portName} implements ${interfaceName} {}
                }
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        const packages : Package[] = model.packages;
        expect(packages.length).toEqual(1);

        const elements : Element[] = packages[0].elements;
        expect(elements.length).toEqual(2);

        let arInterface : Interface;
        let swComponent : SwComponent;

        if (isSwComponent(elements[0])) {
            swComponent = elements[0];
            arInterface = elements[1] as Interface;
        } else {
            swComponent = elements[1] as SwComponent;
            arInterface = elements[0] as Interface;
        }

        const ports : Port[] = swComponent.ports;
        expect(ports.length).toEqual(1);

        const port : Port = ports[0];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portName);
        expect(port.interfaceRef.ref).toBe(arInterface);
        expect(port.arlangModId).toBeUndefined();
    });

    test('Provided port that references clientServer interface in the same file should be parsed', async () => {
        const interfaceName = 'I1';
        const portName = 'P1';

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package A
                swComponent:${swComponentType} S3 {
                    port:${portType} ${portName} implements ${interfaceName}{
                    }
                }
            #end
            #package A.B
                interface:${interfaceType} ${interfaceName} {
                }
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        const packages : Package[] = model.packages;
        expect(packages.length).toEqual(2);

        const firstPackageElements : Element[] = packages[0].elements;
        expect(firstPackageElements.length).toEqual(1);

        const secondPackageElements : Element[] = packages[1].elements;
        expect(secondPackageElements.length).toEqual(1);

        expect(isSwComponent(firstPackageElements[0])).toBeTruthy();
        const swComponent = firstPackageElements[0] as SwComponent;

        expect(isInterface(secondPackageElements[0])).toBeTruthy();
        const arInterface = secondPackageElements[0] as Interface;

        const ports : Port[] = swComponent.ports;
        expect(ports.length).toEqual(1);

        const port : Port = ports[0];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portName);
        expect(port.interfaceRef.ref).toBe(arInterface);
        expect(port.arlangModId).toBeUndefined();
    });

    test('Provided port that references clientServer interface in different file should be parsed', async () => {
        const interfacePackageName = 'I';
        const interfaceName = 'INumber5';
        const portName = 'PProvided1';

        const documentInterface = await parseDocument(services, `
            #package ${interfacePackageName}
                interface:${interfaceType} ${interfaceName} {
                }
            #end
        `);
        const documentPort : LangiumDocument<AstNode> = await parseDocument(services, `
            #package A
                swComponent:${swComponentType} SWC10 {
                    port:${portType} ${portName} implements ${interfacePackageName}.${interfaceName} 
                    {
                    }
                }
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([documentInterface, documentPort]);

        const parseResultInterface : ParseResult<AstNode> = documentInterface.parseResult;
        expectNoError(parseResultInterface);

        const parseResultPort : ParseResult<AstNode> = documentPort.parseResult;
        expectNoError(parseResultPort);

        // get interface
        let model : Model = parseResultInterface.value as Model;

        let packages : Package[] = model.packages;
        expect(packages.length).toEqual(1);

        let elements : Element[] = packages[0].elements;
        expect(elements.length).toEqual(1);

        let element : Element = elements[0];
        expect(isInterface(element)).toBeTruthy();
        const arInterface : Interface = element as Interface;

        // check port
        model = parseResultPort.value as Model;

        packages = model.packages;
        expect(packages.length).toEqual(1);

        elements = packages[0].elements;
        expect(elements.length).toEqual(1);

        element = elements[0];
        expect(isSwComponent(element)).toBeTruthy();

        const ports : Port[] = (element as SwComponent).ports;
        expect(ports.length).toEqual(1);

        const port : Port = ports[0];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portName);
        expect(port.interfaceRef.ref).toBe(arInterface);
        expect(port.arlangModId).toBeUndefined();
    });

});

describe('Parsing one provided port and referenced sender receiver interface', () => {

    const swComponentType : SwComponentType = 'application';
    const portType : PortType = 'provided';
    const interfaceType : InterfaceType = 'senderReceiver';

    test('Provided port that references senderReceiver interface in the same package should be parsed', async () => {
        const interfaceName = 'ExampleInterface';
        const portName = 'ExamplePort';

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package A
                swComponent:${swComponentType} ExampleSwc {
                    port:${portType} ${portName} implements ${interfaceName}
                    {}
                }
                interface:${interfaceType} ${interfaceName} {
                }
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        const packages : Package[] = model.packages;
        expect(packages.length).toEqual(1);

        const elements : Element[] = packages[0].elements;
        expect(elements.length).toEqual(2);

        let arInterface : Interface;
        let swComponent : SwComponent;

        if (isSwComponent(elements[0])) {
            swComponent = elements[0];
            arInterface = elements[1] as Interface;
        } else {
            swComponent = elements[1] as SwComponent;
            arInterface = elements[0] as Interface;
        }

        const ports : Port[] = swComponent.ports;
        expect(ports.length).toEqual(1);

        const port : Port = ports[0];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portName);
        expect(port.interfaceRef.ref).toBe(arInterface);
        expect(port.arlangModId).toBeUndefined();
    });

    test('Provided port that references senderReceiver interface in the same file should be parsed', async () => {
        const interfaceName = 'A1';
        const portName = 'P61';

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package B
                interface:${interfaceType} ${interfaceName} {
                }
            #end
            #package A
                swComponent:${swComponentType} C5 {
                    port:${portType} ${portName} implements ${interfaceName} {
                    }
                }
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        const packages : Package[] = model.packages;
        expect(packages.length).toEqual(2);

        const firstPackageElements : Element[] = packages[0].elements;
        expect(firstPackageElements.length).toEqual(1);

        const secondPackageElements : Element[] = packages[1].elements;
        expect(secondPackageElements.length).toEqual(1);

        expect(isInterface(firstPackageElements[0])).toBeTruthy();
        const arInterface = firstPackageElements[0] as Interface;

        expect(isSwComponent(secondPackageElements[0])).toBeTruthy();
        const swComponent = secondPackageElements[0] as SwComponent;

        const ports : Port[] = swComponent.ports;
        expect(ports.length).toEqual(1);

        const port : Port = ports[0];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portName);
        expect(port.interfaceRef.ref).toBe(arInterface);
        expect(port.arlangModId).toBeUndefined();
    });

    test('Provided port that references senderReceiver interface in different file should be parsed', async () => {
        const interfacePackageName = 'P';
        const interfaceName = 'In6Ref';
        const portName = 'PPInternal2';

        const documentInterface = await parseDocument(services, `
            #package ${interfacePackageName}
                interface:${interfaceType} ${interfaceName} {
                }
            #end
        `);
        const documentPort : LangiumDocument<AstNode> = await parseDocument(services, `
            #package A
                swComponent:${swComponentType} SWC15 {
                    port:${portType} ${portName} implements ${interfacePackageName}.${interfaceName} { }
                }
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([documentPort, documentInterface]);

        const parseResultPort : ParseResult<AstNode> = documentPort.parseResult;
        expectNoError(parseResultPort);

        const parseResultInterface : ParseResult<AstNode> = documentInterface.parseResult;
        expectNoError(parseResultInterface);

        // get interface
        let model : Model = parseResultInterface.value as Model;

        let packages : Package[] = model.packages;
        expect(packages.length).toEqual(1);

        let elements : Element[] = packages[0].elements;
        expect(elements.length).toEqual(1);

        let element : Element = elements[0];
        expect(isInterface(element)).toBeTruthy();
        const arInterface : Interface = element as Interface;

        // check port
        model = parseResultPort.value as Model;

        packages = model.packages;
        expect(packages.length).toEqual(1);

        elements = packages[0].elements;
        expect(elements.length).toEqual(1);

        element = elements[0];
        expect(isSwComponent(element)).toBeTruthy();

        const ports : Port[] = (element as SwComponent).ports;
        expect(ports.length).toEqual(1);

        const port : Port = ports[0];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portName);
        expect(port.interfaceRef.ref).toBe(arInterface);
        expect(port.arlangModId).toBeUndefined();
    });

});

describe('Parsing one required port and referenced client server interface', () => {

    const swComponentType : SwComponentType = 'application';
    const portType : PortType = 'required';
    const interfaceType : InterfaceType = 'clientServer';

    test('Required port that references clientServer interface in the same package should be parsed', async () => {
        const interfaceName = 'ExampleI';
        const portName = 'ExampleP';

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
        #package A
            swComponent:${swComponentType} ExampleS {
                port:${portType} ${portName} implements ${interfaceName}
                {}
            }
            interface:${interfaceType} ${interfaceName} {
            }
        #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        const packages : Package[] = model.packages;
        expect(packages.length).toEqual(1);

        const elements : Element[] = packages[0].elements;
        expect(elements.length).toEqual(2);

        let arInterface : Interface;
        let swComponent : SwComponent;

        if (isSwComponent(elements[0])) {
            swComponent = elements[0];
            arInterface = elements[1] as Interface;
        } else {
            swComponent = elements[1] as SwComponent;
            arInterface = elements[0] as Interface;
        }

        const ports : Port[] = swComponent.ports;
        expect(ports.length).toEqual(1);

        const port : Port = ports[0];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portName);
        expect(port.interfaceRef.ref).toBe(arInterface);
        expect(port.arlangModId).toBeUndefined();
    });

    test('Required port that references clientServer interface in the same file should be parsed', async () => {
        const interfaceName = 'TestingInterface1';
        const portName = 'PPortTest2';

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package A.B
                interface:${interfaceType} ${interfaceName}
                {
                }
            #end
            #package A
                swComponent:${swComponentType} S9 {
                    port:${portType} ${portName} implements ${interfaceName} {
                    }
                }
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        const packages : Package[] = model.packages;
        expect(packages.length).toEqual(2);

        const firstPackageElements : Element[] = packages[0].elements;
        expect(firstPackageElements.length).toEqual(1);

        const secondPackageElements : Element[] = packages[1].elements;
        expect(secondPackageElements.length).toEqual(1);

        expect(isInterface(firstPackageElements[0])).toBeTruthy();
        const arInterface = firstPackageElements[0] as Interface;

        expect(isSwComponent(secondPackageElements[0])).toBeTruthy();
        const swComponent = secondPackageElements[0] as SwComponent;

        const ports : Port[] = swComponent.ports;
        expect(ports.length).toEqual(1);

        const port : Port = ports[0];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portName);
        expect(port.interfaceRef.ref).toBe(arInterface);
        expect(port.arlangModId).toBeUndefined();
    });

    test('Required port that references clientServer interface in different file should be parsed', async () => {
        const interfacePackageName = 'i';
        const interfaceName = 'I7';
        const portName = 'P5';

        const documentInterface = await parseDocument(services, `
            #package ${interfacePackageName}
                interface:${interfaceType} ${interfaceName}{}
            #end
        `);
        const documentPort : LangiumDocument<AstNode> = await parseDocument(services, `
            #package A
                swComponent:${swComponentType} SWC {
                    port:${portType} ${portName} implements ${interfacePackageName}.${interfaceName} {
                    }
                }
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([documentInterface, documentPort]);

        const parseResultInterface : ParseResult<AstNode> = documentInterface.parseResult;
        expectNoError(parseResultInterface);

        const parseResultPort : ParseResult<AstNode> = documentPort.parseResult;
        expectNoError(parseResultPort);

        // get interface
        let model : Model = parseResultInterface.value as Model;

        let packages : Package[] = model.packages;
        expect(packages.length).toEqual(1);

        let elements : Element[] = packages[0].elements;
        expect(elements.length).toEqual(1);

        let element : Element = elements[0];
        expect(isInterface(element)).toBeTruthy();
        const arInterface : Interface = element as Interface;

        // check port
        model = parseResultPort.value as Model;

        packages = model.packages;
        expect(packages.length).toEqual(1);

        elements = packages[0].elements;
        expect(elements.length).toEqual(1);

        element = elements[0];
        expect(isSwComponent(element)).toBeTruthy();

        const ports : Port[] = (element as SwComponent).ports;
        expect(ports.length).toEqual(1);

        const port : Port = ports[0];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portName);
        expect(port.interfaceRef.ref).toBe(arInterface);
        expect(port.arlangModId).toBeUndefined();
    });

});

describe('Parsing one required port and referenced sender receiver interface', () => {

    const swComponentType : SwComponentType = 'application';
    const portType : PortType = 'required';
    const interfaceType : InterfaceType = 'senderReceiver';

    test('Required port that references senderReceiver interface in the same package should be parsed', async () => {
        const interfaceName = 'ITestingInterface';
        const portName = 'PTestingPortName';

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package T
                interface:${interfaceType} ${interfaceName} {
                }
                swComponent:${swComponentType} TestingSwc {
                    port:${portType} ${portName} implements ${interfaceName}
                    {
                    }
                }
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        const packages : Package[] = model.packages;
        expect(packages.length).toEqual(1);

        const elements : Element[] = packages[0].elements;
        expect(elements.length).toEqual(2);

        let arInterface : Interface;
        let swComponent : SwComponent;

        if (isSwComponent(elements[0])) {
            swComponent = elements[0];
            arInterface = elements[1] as Interface;
        } else {
            swComponent = elements[1] as SwComponent;
            arInterface = elements[0] as Interface;
        }

        const ports : Port[] = swComponent.ports;
        expect(ports.length).toEqual(1);

        const port : Port = ports[0];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portName);
        expect(port.interfaceRef.ref).toBe(arInterface);
        expect(port.arlangModId).toBeUndefined();
    });

    test('Required port that references senderReceiver interface in the same file should be parsed', async () => {
        const interfaceName = 'Name1';
        const portName = 'Name2';

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package V.N
                swComponent:${swComponentType} Name3 {
                    port:${portType} ${portName} implements ${interfaceName} {
                    }
                }
            #end
            #package C
                interface:${interfaceType} ${interfaceName}
                {
                }
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        const packages : Package[] = model.packages;
        expect(packages.length).toEqual(2);

        const firstPackageElements : Element[] = packages[0].elements;
        expect(firstPackageElements.length).toEqual(1);

        const secondPackageElements : Element[] = packages[1].elements;
        expect(secondPackageElements.length).toEqual(1);

        expect(isSwComponent(firstPackageElements[0])).toBeTruthy();
        const swComponent = firstPackageElements[0] as SwComponent;

        expect(isInterface(secondPackageElements[0])).toBeTruthy();
        const arInterface = secondPackageElements[0] as Interface;

        const ports : Port[] = swComponent.ports;
        expect(ports.length).toEqual(1);

        const port : Port = ports[0];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portName);
        expect(port.interfaceRef.ref).toBe(arInterface);
        expect(port.arlangModId).toBeUndefined();
    });

    test('Required port that references senderReceiver interface in different file should be parsed', async () => {
        const interfacePackageName = 'HP2.H1';
        const interfaceName = 'M3';
        const portName = 'Pp1';
        const documentInterface = await parseDocument(services, `
            #package ${interfacePackageName}
                interface:${interfaceType} ${interfaceName}
                {}
            #end
        `);
        const documentPort : LangiumDocument<AstNode> = await parseDocument(services, `
            #package A
                swComponent:${swComponentType} SWC {
                    port:${portType} ${portName} implements ${interfacePackageName}.${interfaceName} {}
                }
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([documentInterface, documentPort]);

        const parseResultInterface : ParseResult<AstNode> = documentInterface.parseResult;
        expectNoError(parseResultInterface);

        const parseResultPort : ParseResult<AstNode> = documentPort.parseResult;
        expectNoError(parseResultPort);

        // get interface
        let model : Model = parseResultInterface.value as Model;

        let packages : Package[] = model.packages;
        expect(packages.length).toEqual(1);

        let elements : Element[] = packages[0].elements;
        expect(elements.length).toEqual(1);

        let element : Element = elements[0];
        expect(isInterface(element)).toBeTruthy();
        const arInterface : Interface = element as Interface;

        // check port
        model = parseResultPort.value as Model;

        packages = model.packages;
        expect(packages.length).toEqual(1);

        elements = packages[0].elements;
        expect(elements.length).toEqual(1);

        element = elements[0];
        expect(isSwComponent(element)).toBeTruthy();

        const ports : Port[] = (element as SwComponent).ports;
        expect(ports.length).toEqual(1);

        const port : Port = ports[0];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portName);
        expect(port.interfaceRef.ref).toBe(arInterface);
        expect(port.arlangModId).toBeUndefined();
    });

});

describe('Parsing multiple provided ports and referenced client server interfaces', () => {

    const swComponentType : SwComponentType = 'application';
    const portType : PortType = 'provided';
    const interfaceType : InterfaceType = 'clientServer';

    test('Multiple provided ports and referenced clientServer interfaces in same package should be parsed', async () => {
        const interfaceNames = ['MyInterface', 'ExampleInterface1', 'I2', 'AnotherInterface'];
        const portNames = ['MyPort', 'Pp1', 'InternalP3'];

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package name1.name2.name3
                interface:${interfaceType} ${interfaceNames[0]} {
                }
                swComponent:${swComponentType} SWC1 {
                    port:${portType} ${portNames[0]} implements ${interfaceNames[0]} {
                    }
                    port:${portType} ${portNames[1]} implements ${interfaceNames[1]}
                    {}
                    port:${portType} ${portNames[2]} implements ${interfaceNames[2]} {

                    }
                }
                interface:${interfaceType} ${interfaceNames[1]} {
                }
                interface:${interfaceType} ${interfaceNames[2]} {
                }
                interface:${interfaceType} ${interfaceNames[3]} {
                }
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        const packages : Package[] = model.packages;
        expect(packages.length).toEqual(1);

        const elements : Element[] = packages[0].elements;
        expect(elements.length).toEqual(5);

        expect(isSwComponent(elements[1])).toBeTruthy();
        const swComponent : SwComponent = elements[1] as SwComponent;

        const ports : Port[] = swComponent.ports;
        expect(ports.length).toEqual(3);

        let port : Port = ports[0];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[0]);
        expect(port.interfaceRef.ref).toBe(elements[0]);
        expect(port.arlangModId).toBeUndefined();

        port = ports[1];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[1]);
        expect(port.interfaceRef.ref).toBe(elements[2]);
        expect(port.arlangModId).toBeUndefined();

        port = ports[2];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[2]);
        expect(port.interfaceRef.ref).toBe(elements[3]);
        expect(port.arlangModId).toBeUndefined();
    });

    test('Multiple provided ports and referenced clientServer interfaces in same file should be parsed', async () => {
        const interfaceNames = ['I1', 'IController', 'Sensor1', 'Actuator', 'IExampleInterface'];
        const portNames = ['P1', 'ExampleName', 'Pp3'];

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package C
                interface:${interfaceType} ${interfaceNames[0]} {
                }
                interface:${interfaceType} ${interfaceNames[1]} {
                }
                interface:${interfaceType} ${interfaceNames[2]}
                {
                }
            #end
            #package A
                swComponent:${swComponentType} S3 {
                    port:${portType} ${portNames[0]} implements ${interfaceNames[0]} {
                    }
                    port:${portType} ${portNames[1]} implements ${interfaceNames[2]}
                    {

                    }
                    port:${portType} ${portNames[2]} implements ${interfaceNames[4]} {}
                }
            #end
            #package A.B
                interface:${interfaceType} ${interfaceNames[3]} { }
                interface:${interfaceType} ${interfaceNames[4]} {
                }
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        const packages : Package[] = model.packages;
        expect(packages.length).toEqual(3);

        const firstPackageElements : Element[] = packages[0].elements;
        expect(firstPackageElements.length).toEqual(3);

        const secondPackageElements : Element[] = packages[1].elements;
        expect(secondPackageElements.length).toEqual(1);

        const thirdPackageElements : Element[] = packages[2].elements;
        expect(thirdPackageElements.length).toEqual(2);

        for (let i = 0; i < firstPackageElements.length; i++) {
            expect(isInterface(firstPackageElements[i])).toBeTruthy();
        }

        expect(isSwComponent(secondPackageElements[0])).toBeTruthy();
        const swComponent = secondPackageElements[0] as SwComponent;

        for (let i = 0; i < thirdPackageElements.length; i++) {
            expect(isInterface(thirdPackageElements[i])).toBeTruthy();
        }

        const ports : Port[] = swComponent.ports;
        expect(ports.length).toEqual(3);

        let port : Port = ports[0];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[0]);
        expect(port.interfaceRef.ref).toBe(firstPackageElements[0]);
        expect(port.arlangModId).toBeUndefined();

        port = ports[1];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[1]);
        expect(port.interfaceRef.ref).toBe(firstPackageElements[2]);
        expect(port.arlangModId).toBeUndefined();

        port = ports[2];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[2]);
        expect(port.interfaceRef.ref).toBe(thirdPackageElements[1]);
        expect(port.arlangModId).toBeUndefined();
    });

    test('Multiple provided ports and referenced clientServer interfaces in different files should be parsed', async () => {
        const interfacePackageNames = ['I', 'I.I2', 'exampleName1', 'p1.p2.p3'];
        const interfaceNames = ['iNumber5', 'ExampleInterface', 'IMyInterface2', 'NameOfUnusedInterface', 'name'];
        const portNames = ['PProvided1', 'pInternal', 'ExternalPort', 'P6'];

        const documentInterface1 = await parseDocument(services, `
            #package ${interfacePackageNames[0]}
                interface:${interfaceType} ${interfaceNames[0]} {
                }
                interface:${interfaceType} ${interfaceNames[3]} {
                }
                interface:${interfaceType} ${interfaceNames[1]} {
                }
            #end
        `);
        const documentInterface2 = await parseDocument(services, `
            #package ${interfacePackageNames[1]}
                interface:${interfaceType} ${interfaceNames[2]} {
                }
            #end
            #package ${interfacePackageNames[2]}
                interface:${interfaceType} ${interfaceNames[4]} {
                }
            #end
        `);
        const documentPort : LangiumDocument<AstNode> = await parseDocument(services, `
            #package A
                swComponent:${swComponentType} SWC10 {
                    port:${portType} ${portNames[0]} implements ${interfacePackageNames[0]}.${interfaceNames[0]} {
                    }
                    port:${portType} ${portNames[1]} implements ${interfacePackageNames[0]}.${interfaceNames[1]} {}
                    port:${portType} ${portNames[2]} implements ${interfacePackageNames[1]}.${interfaceNames[2]}
                    {
                    }
                    port:${portType} ${portNames[3]} implements ${interfacePackageNames[2]}.${interfaceNames[4]}
                    { }
                }
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([documentInterface1, documentInterface2, documentPort]);

        const parseResultInterface1 : ParseResult<AstNode> = documentInterface1.parseResult;
        expectNoError(parseResultInterface1);

        const parseResultInterface2 : ParseResult<AstNode> = documentInterface2.parseResult;
        expectNoError(parseResultInterface2);

        const parseResultPort : ParseResult<AstNode> = documentPort.parseResult;
        expectNoError(parseResultPort);

        // get elements from first package
        let model : Model = parseResultInterface1.value as Model;

        let packages : Package[] = model.packages;
        expect(packages.length).toEqual(1);

        const firstPackageElements : Element[] = packages[0].elements;
        expect(firstPackageElements.length).toEqual(3);

        // get elements from second and third package
        model = parseResultInterface2.value as Model;

        packages = model.packages;
        expect(packages.length).toEqual(2);

        const secondPackageElements : Element[] = packages[0].elements;
        expect(secondPackageElements.length).toEqual(1);

        const thirdPackageElements : Element[] = packages[1].elements;
        expect(thirdPackageElements.length).toEqual(1);

        // check ports
        model = parseResultPort.value as Model;

        packages = model.packages;
        expect(packages.length).toEqual(1);

        const elements : Element[] = packages[0].elements;
        expect(elements.length).toEqual(1);

        let element : Element = elements[0];
        expect(isSwComponent(element)).toBeTruthy();

        const ports : Port[] = (element as SwComponent).ports;
        expect(ports.length).toEqual(4);

        let port : Port = ports[0];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[0]);
        expect(port.interfaceRef.ref).toBe(firstPackageElements[0]);
        expect(port.arlangModId).toBeUndefined();

        port = ports[1];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[1]);
        expect(port.interfaceRef.ref).toBe(firstPackageElements[2]);
        expect(port.arlangModId).toBeUndefined();

        port = ports[2];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[2]);
        expect(port.interfaceRef.ref).toBe(secondPackageElements[0]);
        expect(port.arlangModId).toBeUndefined();

        port = ports[3];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[3]);
        expect(port.interfaceRef.ref).toBe(thirdPackageElements[0]);
        expect(port.arlangModId).toBeUndefined();
    });

});

describe('Parsing multiple provided ports and referenced sender receiver interfaces', () => {

    const swComponentType : SwComponentType = 'application';
    const portType : PortType = 'provided';
    const interfaceType : InterfaceType = 'senderReceiver';

    test('Multiple provided ports and referenced senderReceiver interfaces in same package should be parsed', async () => {
        const interfaceNames = ['EMonitoring', 'Sensor1', 'A2', 'BrakeAssist', 'LastInterfaceName'];
        const portNames = ['Read', 'Write', 'Reserved'];

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package p1.p2.p3.p4.p5
                interface:${interfaceType} ${interfaceNames[0]} {
                }
                interface:${interfaceType} ${interfaceNames[1]}
                {
                }
                interface:${interfaceType} ${interfaceNames[4]} {}
                swComponent:${swComponentType} Component {
                    port:${portType} ${portNames[0]} implements ${interfaceNames[0]}{ }
                    port:${portType} ${portNames[1]} implements ${interfaceNames[1]}
                    {
                    }
                    port:${portType} ${portNames[2]} implements ${interfaceNames[2]} {
                    }
                }
                interface:${interfaceType} ${interfaceNames[2]} {}
                interface:${interfaceType} ${interfaceNames[3]} {
                }
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        const packages : Package[] = model.packages;
        expect(packages.length).toEqual(1);

        const elements : Element[] = packages[0].elements;
        expect(elements.length).toEqual(6);

        expect(isSwComponent(elements[3])).toBeTruthy();
        const swComponent : SwComponent = elements[3] as SwComponent;

        const ports : Port[] = swComponent.ports;
        expect(ports.length).toEqual(3);

        let port : Port = ports[0];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[0]);
        expect(port.interfaceRef.ref).toBe(elements[0]);
        expect(port.arlangModId).toBeUndefined();

        port = ports[1];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[1]);
        expect(port.interfaceRef.ref).toBe(elements[1]);
        expect(port.arlangModId).toBeUndefined();

        port = ports[2];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[2]);
        expect(port.interfaceRef.ref).toBe(elements[4]);
        expect(port.arlangModId).toBeUndefined();
    });

    test('Multiple provided ports and referenced senderReceiver interfaces in same file should be parsed', async () => {
        const interfaceNames = ['I1', 'IController', 'Sensor1', 'Actuator', 'IExampleInterface'];
        const portNames = ['P1', 'ExampleName', 'Pp3'];

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package A.B
                interface:${interfaceType} ${interfaceNames[3]} { }
                interface:${interfaceType} ${interfaceNames[4]} {
                }
            #end
            #package A
                swComponent:${swComponentType} S3 {
                    port:${portType} ${portNames[0]} implements ${interfaceNames[1]} {
                    }
                    port:${portType} ${portNames[1]} implements ${interfaceNames[2]} {
                    }
                    port:${portType} ${portNames[2]} implements ${interfaceNames[3]} {
                    }
                }
            #end
            #package C
                interface:${interfaceType} ${interfaceNames[0]} {
                }
                interface:${interfaceType} ${interfaceNames[1]} {
                }
                interface:${interfaceType} ${interfaceNames[2]}
                {
                }
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        const packages : Package[] = model.packages;
        expect(packages.length).toEqual(3);

        const firstPackageElements : Element[] = packages[0].elements;
        expect(firstPackageElements.length).toEqual(2);

        const secondPackageElements : Element[] = packages[1].elements;
        expect(secondPackageElements.length).toEqual(1);

        const thirdPackageElements : Element[] = packages[2].elements;
        expect(thirdPackageElements.length).toEqual(3);

        for (let i = 0; i < firstPackageElements.length; i++) {
            expect(isInterface(firstPackageElements[i])).toBeTruthy();
        }

        expect(isSwComponent(secondPackageElements[0])).toBeTruthy();
        const swComponent = secondPackageElements[0] as SwComponent;

        for (let i = 0; i < thirdPackageElements.length; i++) {
            expect(isInterface(thirdPackageElements[i])).toBeTruthy();
        }

        const ports : Port[] = swComponent.ports;
        expect(ports.length).toEqual(3);

        let port : Port = ports[0];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[0]);
        expect(port.interfaceRef.ref).toBe(thirdPackageElements[1]);
        expect(port.arlangModId).toBeUndefined();

        port = ports[1];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[1]);
        expect(port.interfaceRef.ref).toBe(thirdPackageElements[2]);
        expect(port.arlangModId).toBeUndefined();

        port = ports[2];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[2]);
        expect(port.interfaceRef.ref).toBe(firstPackageElements[0]);
        expect(port.arlangModId).toBeUndefined();
    });

    test('Multiple provided ports and referenced senderReceiver interfaces in different files should be parsed', async () => {
        const interfacePackageNames = ['myPackage', 'group.of.elements', 'q7'];
        const interfaceNames = ['Gear2', 'LaunchControl', 'NamedElement', 'NamedElement2', 'ne3'];
        const portNames = ['l1', 'CommunicationPoint', 'MessageProvider', 'mr'];

        const documentInterface1 = await parseDocument(services, `
            #package ${interfacePackageNames[1]}
                interface:${interfaceType} ${interfaceNames[4]} {
                }
            #end
            #package ${interfacePackageNames[2]}
                interface:${interfaceType} ${interfaceNames[4]} {
                }
            #end
        `);
        const documentInterface2 = await parseDocument(services, `
            #package ${interfacePackageNames[0]}
                interface:${interfaceType} ${interfaceNames[0]} {
                }
                interface:${interfaceType} ${interfaceNames[1]} {
                }
                interface:${interfaceType} ${interfaceNames[2]} {
                }
            #end
        `);
        const documentPort : LangiumDocument<AstNode> = await parseDocument(services, `
            #package A
                swComponent:${swComponentType} S {
                    port:${portType} ${portNames[0]} implements ${interfacePackageNames[0]}.${interfaceNames[2]} {
                    }
                    port:${portType} ${portNames[1]} implements ${interfacePackageNames[0]}.${interfaceNames[0]} {
                    }
                    port:${portType} ${portNames[2]} implements ${interfacePackageNames[1]}.${interfaceNames[4]} {
                    }
                    port:${portType} ${portNames[3]} implements ${interfacePackageNames[2]}.${interfaceNames[4]} {
                    }
                }
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([documentInterface1, documentInterface2, documentPort]);

        const parseResultInterface1 : ParseResult<AstNode> = documentInterface1.parseResult;
        expectNoError(parseResultInterface1);

        const parseResultInterface2 : ParseResult<AstNode> = documentInterface2.parseResult;
        expectNoError(parseResultInterface2);

        const parseResultPort : ParseResult<AstNode> = documentPort.parseResult;
        expectNoError(parseResultPort);

        // get elements from first package
        let model : Model = parseResultInterface1.value as Model;

        let packages : Package[] = model.packages;
        expect(packages.length).toEqual(2);

        const firstPackageElements : Element[] = packages[0].elements;
        expect(firstPackageElements.length).toEqual(1);

        // get elements from second package
        const secondPackageElements : Element[] = packages[1].elements;
        expect(secondPackageElements.length).toEqual(1);

        // get elements from third package
        model = parseResultInterface2.value as Model;

        packages = model.packages;
        expect(packages.length).toEqual(1);

        const thirdPackageElements : Element[] = packages[0].elements;
        expect(thirdPackageElements.length).toEqual(3);

        // check ports
        model = parseResultPort.value as Model;

        packages = model.packages;
        expect(packages.length).toEqual(1);

        const elements : Element[] = packages[0].elements;
        expect(elements.length).toEqual(1);

        let element : Element = elements[0];
        expect(isSwComponent(element)).toBeTruthy();

        const ports : Port[] = (element as SwComponent).ports;
        expect(ports.length).toEqual(4);

        let port : Port = ports[0];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[0]);
        expect(port.interfaceRef.ref).toBe(thirdPackageElements[2]);
        expect(port.arlangModId).toBeUndefined();

        port = ports[1];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[1]);
        expect(port.interfaceRef.ref).toBe(thirdPackageElements[0]);
        expect(port.arlangModId).toBeUndefined();

        port = ports[2];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[2]);
        expect(port.interfaceRef.ref).toBe(firstPackageElements[0]);
        expect(port.arlangModId).toBeUndefined();

        port = ports[3];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[3]);
        expect(port.interfaceRef.ref).toBe(secondPackageElements[0]);
        expect(port.arlangModId).toBeUndefined();
    });

});

describe('Parsing multiple required ports and referenced client server interfaces', () => {

    const swComponentType : SwComponentType = 'application';
    const portType : PortType = 'required';
    const interfaceType : InterfaceType = 'clientServer';

    test('Multiple required ports and referenced clientServer interfaces in same package should be parsed', async () => {
        const interfaceNames = ['TestingI1', 'j4', 'ForwardCollisionWarning', 'TestingI2'];
        const portNames = ['Point', 'PpPoint', 'target'];

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package h
                interface:${interfaceType} ${interfaceNames[0]} {
                }
                interface:${interfaceType} ${interfaceNames[1]} { }
                interface:${interfaceType} ${interfaceNames[2]}
                {

                }
                swComponent:${swComponentType} SWC1 {
                    port:${portType} ${portNames[0]} implements ${interfaceNames[0]}{
                    }
                    port:${portType} ${portNames[1]} implements ${interfaceNames[1]}
                    {}
                    port:${portType} ${portNames[2]} implements ${interfaceNames[2]} {
                    }
                }
                interface:${interfaceType} ${interfaceNames[3]}{}
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        const packages : Package[] = model.packages;
        expect(packages.length).toEqual(1);

        const elements : Element[] = packages[0].elements;
        expect(elements.length).toEqual(5);

        expect(isSwComponent(elements[3])).toBeTruthy();
        const swComponent : SwComponent = elements[3] as SwComponent;

        const ports : Port[] = swComponent.ports;
        expect(ports.length).toEqual(3);

        let port : Port = ports[0];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[0]);
        expect(port.interfaceRef.ref).toBe(elements[0]);
        expect(port.arlangModId).toBeUndefined();

        port = ports[1];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[1]);
        expect(port.interfaceRef.ref).toBe(elements[1]);
        expect(port.arlangModId).toBeUndefined();

        port = ports[2];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[2]);
        expect(port.interfaceRef.ref).toBe(elements[2]);
        expect(port.arlangModId).toBeUndefined();
    });

    test('Multiple required ports and referenced clientServer interfaces in same file should be parsed', async () => {
        const interfaceNames = ['NameToTest', 'NameToTest0', 'NameToTest1', 'ntt', 'NTT2'];
        const portNames = ['pipe', 'PipeLine', 'Tunnel'];

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package C
                interface:${interfaceType} ${interfaceNames[0]} {}
            #end
            #package A
                swComponent:${swComponentType} S3 {
                    port:${portType} ${portNames[0]} implements ${interfaceNames[0]} {
                    }
                    port:${portType} ${portNames[1]} implements ${interfaceNames[2]}
                    {

                    }
                    port:${portType} ${portNames[2]} implements ${interfaceNames[3]} {}
                }
            #end
            #package A.B
                interface:${interfaceType} ${interfaceNames[1]} {
                }
                interface:${interfaceType} ${interfaceNames[2]}
                { }
                interface:${interfaceType} ${interfaceNames[3]} { }
                interface:${interfaceType} ${interfaceNames[4]} {
                }
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        const packages : Package[] = model.packages;
        expect(packages.length).toEqual(3);

        const firstPackageElements : Element[] = packages[0].elements;
        expect(firstPackageElements.length).toEqual(1);

        const secondPackageElements : Element[] = packages[1].elements;
        expect(secondPackageElements.length).toEqual(1);

        const thirdPackageElements : Element[] = packages[2].elements;
        expect(thirdPackageElements.length).toEqual(4);

        expect(isInterface(firstPackageElements[0])).toBeTruthy();

        expect(isSwComponent(secondPackageElements[0])).toBeTruthy();
        const swComponent = secondPackageElements[0] as SwComponent;

        for (let i = 0; i < thirdPackageElements.length; i++) {
            expect(isInterface(thirdPackageElements[i])).toBeTruthy();
        }

        const ports : Port[] = swComponent.ports;
        expect(ports.length).toEqual(3);

        let port : Port = ports[0];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[0]);
        expect(port.interfaceRef.ref).toBe(firstPackageElements[0]);
        expect(port.arlangModId).toBeUndefined();

        port = ports[1];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[1]);
        expect(port.interfaceRef.ref).toBe(thirdPackageElements[1]);
        expect(port.arlangModId).toBeUndefined();

        port = ports[2];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[2]);
        expect(port.interfaceRef.ref).toBe(thirdPackageElements[2]);
        expect(port.arlangModId).toBeUndefined();
    });

    test('Multiple required ports and referenced clientServer interfaces in different files should be parsed', async () => {
        const interfacePackageNames = ['b', 'b.a.c3', 'sector.group', 'anotherPackageName'];
        const interfaceNames = ['MyInterfaceName', 'IMyInterfaceName', 'T1', 'OdometerValue', 'ImplementationSpecific'];
        const portNames = ['Sender', 'Provider', 'Receiver', 'r3'];

        const documentInterface1 = await parseDocument(services, `
            #package ${interfacePackageNames[0]}
                interface:${interfaceType} ${interfaceNames[0]} {
                }
                interface:${interfaceType} ${interfaceNames[3]} {
                }
            #end
        `);
        const documentInterface2 = await parseDocument(services, `
            #package ${interfacePackageNames[1]}
                interface:${interfaceType} ${interfaceNames[2]} {
                }
            #end
            #package ${interfacePackageNames[2]}
                interface:${interfaceType} ${interfaceNames[4]} {
                }
                interface:${interfaceType} ${interfaceNames[1]} {
                }
            #end
        `);
        const documentPort : LangiumDocument<AstNode> = await parseDocument(services, `
            #package A
                swComponent:${swComponentType} SWC10 {
                    port:${portType} ${portNames[0]} implements ${interfacePackageNames[0]}.${interfaceNames[0]} {
                    }
                    port:${portType} ${portNames[1]} implements ${interfacePackageNames[2]}.${interfaceNames[1]} {
                    }
                    port:${portType} ${portNames[2]} implements ${interfacePackageNames[1]}.${interfaceNames[2]} {
                    }
                    port:${portType} ${portNames[3]} implements ${interfacePackageNames[0]}.${interfaceNames[3]} {
                    }
                }
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([documentInterface1, documentInterface2, documentPort]);

        const parseResultInterface1 : ParseResult<AstNode> = documentInterface1.parseResult;
        expectNoError(parseResultInterface1);

        const parseResultInterface2 : ParseResult<AstNode> = documentInterface2.parseResult;
        expectNoError(parseResultInterface2);

        const parseResultPort : ParseResult<AstNode> = documentPort.parseResult;
        expectNoError(parseResultPort);

        // get elements from first package
        let model : Model = parseResultInterface1.value as Model;

        let packages : Package[] = model.packages;
        expect(packages.length).toEqual(1);

        const firstPackageElements : Element[] = packages[0].elements;
        expect(firstPackageElements.length).toEqual(2);

        // get elements from second and third package
        model = parseResultInterface2.value as Model;

        packages = model.packages;
        expect(packages.length).toEqual(2);

        const secondPackageElements : Element[] = packages[0].elements;
        expect(secondPackageElements.length).toEqual(1);

        const thirdPackageElements : Element[] = packages[1].elements;
        expect(thirdPackageElements.length).toEqual(2);

        // check ports
        model = parseResultPort.value as Model;

        packages = model.packages;
        expect(packages.length).toEqual(1);

        const elements : Element[] = packages[0].elements;
        expect(elements.length).toEqual(1);

        let element : Element = elements[0];
        expect(isSwComponent(element)).toBeTruthy();

        const ports : Port[] = (element as SwComponent).ports;
        expect(ports.length).toEqual(4);

        let port : Port = ports[0];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[0]);
        expect(port.interfaceRef.ref).toBe(firstPackageElements[0]);
        expect(port.arlangModId).toBeUndefined();

        port = ports[1];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[1]);
        expect(port.interfaceRef.ref).toBe(thirdPackageElements[1]);
        expect(port.arlangModId).toBeUndefined();

        port = ports[2];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[2]);
        expect(port.interfaceRef.ref).toBe(secondPackageElements[0]);
        expect(port.arlangModId).toBeUndefined();

        port = ports[3];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[3]);
        expect(port.interfaceRef.ref).toBe(firstPackageElements[1]);
        expect(port.arlangModId).toBeUndefined();
    });

});

describe('Parsing multiple required ports and referenced sender receiver interfaces', () => {

    const swComponentType : SwComponentType = 'application';
    const portType : PortType = 'required';
    const interfaceType : InterfaceType = 'senderReceiver';

    test('Multiple required ports and referenced senderReceiver interfaces in same package should be parsed', async () => {
        const interfaceNames = ['ExampleIName1', 'U7', 'BackupCamera', 'airsuspension'];
        const portNames = ['communicationPath', 'PBroadcast', 'r9'];

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package k
                interface:${interfaceType} ${interfaceNames[0]} {}
                interface:${interfaceType} ${interfaceNames[1]} {
                }
                swComponent:${swComponentType} SWC1 {
                    port:${portType} ${portNames[0]} implements ${interfaceNames[0]}{
                    }
                    port:${portType} ${portNames[1]} implements ${interfaceNames[2]}
                    {}
                    port:${portType} ${portNames[2]} implements ${interfaceNames[3]} {
                    }
                }
                interface:${interfaceType} ${interfaceNames[2]}{
                }
                interface:${interfaceType} ${interfaceNames[3]}{}
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        const packages : Package[] = model.packages;
        expect(packages.length).toEqual(1);

        const elements : Element[] = packages[0].elements;
        expect(elements.length).toEqual(5);

        expect(isSwComponent(elements[2])).toBeTruthy();
        const swComponent : SwComponent = elements[2] as SwComponent;

        const ports : Port[] = swComponent.ports;
        expect(ports.length).toEqual(3);

        let port : Port = ports[0];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[0]);
        expect(port.interfaceRef.ref).toBe(elements[0]);
        expect(port.arlangModId).toBeUndefined();

        port = ports[1];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[1]);
        expect(port.interfaceRef.ref).toBe(elements[3]);
        expect(port.arlangModId).toBeUndefined();

        port = ports[2];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[2]);
        expect(port.interfaceRef.ref).toBe(elements[4]);
        expect(port.arlangModId).toBeUndefined();
    });

    test('Multiple required ports and referenced senderReceiver interfaces in same file should be parsed', async () => {
        const interfaceNames = ['ABS', 'brakeByWire', 'Z8', 'engineFailure', 'SensorFusion'];
        const portNames = ['TestingProvider', 'TR', 'TestingReceiver0'];

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package B.A
                interface:${interfaceType} ${interfaceNames[0]} {
                }
                interface:${interfaceType} ${interfaceNames[1]} {}
                interface:${interfaceType} ${interfaceNames[2]}
                {}
            #end
            #package A
                swComponent:${swComponentType} S3 {
                    port:${portType} ${portNames[0]} implements ${interfaceNames[0]} 
                    {

                    }
                    port:${portType} ${portNames[1]} implements ${interfaceNames[1]} {
                    }
                    port:${portType} ${portNames[2]} implements ${interfaceNames[4]}
                    {
                        
                    }
                }
            #end
            #package A.B
                interface:${interfaceType} ${interfaceNames[3]} { }
                interface:${interfaceType} ${interfaceNames[4]} {
                }
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        const packages : Package[] = model.packages;
        expect(packages.length).toEqual(3);

        const firstPackageElements : Element[] = packages[0].elements;
        expect(firstPackageElements.length).toEqual(3);

        const secondPackageElements : Element[] = packages[1].elements;
        expect(secondPackageElements.length).toEqual(1);

        const thirdPackageElements : Element[] = packages[2].elements;
        expect(thirdPackageElements.length).toEqual(2);

        for (let i = 0; i < firstPackageElements.length; i++) {
            expect(isInterface(firstPackageElements[i])).toBeTruthy();
        }

        expect(isSwComponent(secondPackageElements[0])).toBeTruthy();
        const swComponent = secondPackageElements[0] as SwComponent;

        for (let i = 0; i < thirdPackageElements.length; i++) {
            expect(isInterface(thirdPackageElements[i])).toBeTruthy();
        }

        const ports : Port[] = swComponent.ports;
        expect(ports.length).toEqual(3);

        let port : Port = ports[0];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[0]);
        expect(port.interfaceRef.ref).toBe(firstPackageElements[0]);
        expect(port.arlangModId).toBeUndefined();

        port = ports[1];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[1]);
        expect(port.interfaceRef.ref).toBe(firstPackageElements[1]);
        expect(port.arlangModId).toBeUndefined();

        port = ports[2];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[2]);
        expect(port.interfaceRef.ref).toBe(thirdPackageElements[1]);
        expect(port.arlangModId).toBeUndefined();
    });

    test('Multiple required ports and referenced senderReceiver interfaces in different files should be parsed', async () => {
        const interfacePackageNames = ['z1.z2.z3', 'z3.z4', 'examplePackageName', 'last.p.name'];
        const interfaceNames = ['TestingProvider', 'TestingReceiver', 'tp0', 'myinterfacename', 'BodyControl'];
        const portNames = ['connector', 'C1', 'interfaceDataFlow', 'o'];

        const documentInterface1 = await parseDocument(services, `
            #package ${interfacePackageNames[0]}
                interface:${interfaceType} ${interfaceNames[0]} {
                }
                interface:${interfaceType} ${interfaceNames[3]} 
                {   }
            #end
        `);
        const documentInterface2 = await parseDocument(services, `
            #package ${interfacePackageNames[1]}
                interface:${interfaceType} ${interfaceNames[1]} {}
                interface:${interfaceType} ${interfaceNames[2]} {
                }
            #end
            #package ${interfacePackageNames[2]}
                interface:${interfaceType} ${interfaceNames[4]} {
                }
            #end
        `);
        const documentPort : LangiumDocument<AstNode> = await parseDocument(services, `
            #package A
                swComponent:${swComponentType} SWC10 {
                    port:${portType} ${portNames[0]} implements ${interfacePackageNames[0]}.${interfaceNames[3]} {
                    }
                    port:${portType} ${portNames[1]} implements ${interfacePackageNames[1]}.${interfaceNames[1]} {
                    }
                    port:${portType} ${portNames[2]} implements ${interfacePackageNames[1]}.${interfaceNames[2]} {
                    }
                    port:${portType} ${portNames[3]} implements ${interfacePackageNames[2]}.${interfaceNames[4]} {
                    }
                }
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([documentInterface1, documentInterface2, documentPort]);

        const parseResultInterface1 : ParseResult<AstNode> = documentInterface1.parseResult;
        expectNoError(parseResultInterface1);

        const parseResultInterface2 : ParseResult<AstNode> = documentInterface2.parseResult;
        expectNoError(parseResultInterface2);

        const parseResultPort : ParseResult<AstNode> = documentPort.parseResult;
        expectNoError(parseResultPort);

        // get elements from first package
        let model : Model = parseResultInterface1.value as Model;

        let packages : Package[] = model.packages;
        expect(packages.length).toEqual(1);

        const firstPackageElements : Element[] = packages[0].elements;
        expect(firstPackageElements.length).toEqual(2);

        // get elements from second and third package
        model = parseResultInterface2.value as Model;

        packages = model.packages;
        expect(packages.length).toEqual(2);

        const secondPackageElements : Element[] = packages[0].elements;
        expect(secondPackageElements.length).toEqual(2);

        const thirdPackageElements : Element[] = packages[1].elements;
        expect(thirdPackageElements.length).toEqual(1);

        // check ports
        model = parseResultPort.value as Model;

        packages = model.packages;
        expect(packages.length).toEqual(1);

        const elements : Element[] = packages[0].elements;
        expect(elements.length).toEqual(1);

        let element : Element = elements[0];
        expect(isSwComponent(element)).toBeTruthy();

        const ports : Port[] = (element as SwComponent).ports;
        expect(ports.length).toEqual(4);

        let port : Port = ports[0];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[0]);
        expect(port.interfaceRef.ref).toBe(firstPackageElements[1]);
        expect(port.arlangModId).toBeUndefined();

        port = ports[1];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[1]);
        expect(port.interfaceRef.ref).toBe(secondPackageElements[0]);
        expect(port.arlangModId).toBeUndefined();

        port = ports[2];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[2]);
        expect(port.interfaceRef.ref).toBe(secondPackageElements[1]);
        expect(port.arlangModId).toBeUndefined();

        port = ports[3];
        expect(port.type).toEqual(portType);
        expect(port.name).toEqual(portNames[3]);
        expect(port.interfaceRef.ref).toBe(thirdPackageElements[0]);
        expect(port.arlangModId).toBeUndefined();
    });

});

describe('Parsing multiple ports of different type and referenced interfaces of different type', () => {

    const swComponentType : SwComponentType = 'application';

    const providedPortType : PortType = 'provided';
    const requiredPortType : PortType = 'required';

    const clientServerInterfaceType : InterfaceType = 'clientServer';
    const senderReceiverInterfaceType : InterfaceType = 'senderReceiver';

    test ('Multiple ports of different type and referenced interfaces of different type should be parsed (test 1)', async () => {
        const packageNames = ['A.B', 'A.C', 'example.p.name1.subname2'];
        const interfaceNames = ['FuelLevel', 'V2VCommunication', 'BatteryPercentage', 'G6', 'iTestingInterface'];
        const portNames = ['pP1', 'RPName', 'PpVehicleSpeed', 'Door1State', 'door2State'];

        const document1 = await parseDocument(services, `
            #package ${packageNames[0]}
                interface:${senderReceiverInterfaceType} ${interfaceNames[0]} {}
                interface:${clientServerInterfaceType} ExampleInterfaceName2 {}
                interface:${senderReceiverInterfaceType} ${interfaceNames[1]} {}
                interface:${clientServerInterfaceType} ${interfaceNames[2]} {}
            #end
        `);
        const document2 = await parseDocument(services, `
            #package ${packageNames[1]}
                interface:${clientServerInterfaceType} ExampleInterfaceName1
                {}
                swComponent:${swComponentType} SwcName
                {
                    port:${providedPortType} ${portNames[0]} implements ${packageNames[1]}.${interfaceNames[3]} {
                    }
                    port:${requiredPortType} ${portNames[1]} implements ${packageNames[2]}.${interfaceNames[4]} {
                    }
                    port:${providedPortType} ${portNames[2]} implements ${packageNames[0]}.${interfaceNames[0]} {
                    }
                    port:${providedPortType} ${portNames[3]} implements ${packageNames[0]}.${interfaceNames[1]} {
                    }
                    port:${requiredPortType} ${portNames[4]} implements ${packageNames[0]}.${interfaceNames[2]} {
                    }
                }
                interface:${senderReceiverInterfaceType} ${interfaceNames[3]} {
                }
            #end
            #package ${packageNames[2]}
                interface:${clientServerInterfaceType} ${interfaceNames[4]} {}
                interface:${clientServerInterfaceType} ExampleInterfaceName2 {}
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document1, document2]);

        const document1Result : ParseResult<AstNode> = document1.parseResult;
        expectNoError(document1Result);

        const document2Result : ParseResult<AstNode> = document2.parseResult;
        expectNoError(document2Result);

        // get elements from third package
        let model : Model = document1Result.value as Model;

        let packages : Package[] = model.packages;
        expect(packages.length).toEqual(1);

        const firstPackageElements : Element[] = packages[0].elements;
        expect(firstPackageElements.length).toEqual(4);

        // get elements from first and second package
        model = document2Result.value as Model;

        packages = model.packages;
        expect(packages.length).toEqual(2);

        const secondPackageElements : Element[] = packages[0].elements;
        expect(secondPackageElements.length).toEqual(3);

        const thirdPackageElements : Element[] = packages[1].elements;
        expect(thirdPackageElements.length).toEqual(2);

        // get ports
        expect(isSwComponent(secondPackageElements[1])).toBeTruthy();
        const swc = secondPackageElements[1] as SwComponent;

        const ports : Port[] = swc.ports;
        expect(ports.length).toEqual(5);

        let port : Port = ports[0];
        expect(port.type).toEqual(providedPortType);
        expect(port.name).toEqual(portNames[0]);
        expect(port.interfaceRef.ref).toBe(secondPackageElements[2]);
        expect(port.arlangModId).toBeUndefined();

        port = ports[1];
        expect(port.type).toEqual(requiredPortType);
        expect(port.name).toEqual(portNames[1]);
        expect(port.interfaceRef.ref).toBe(thirdPackageElements[0]);
        expect(port.arlangModId).toBeUndefined();

        port = ports[2];
        expect(port.type).toEqual(providedPortType);
        expect(port.name).toEqual(portNames[2]);
        expect(port.interfaceRef.ref).toBe(firstPackageElements[0]);
        expect(port.arlangModId).toBeUndefined();

        port = ports[3];
        expect(port.type).toEqual(providedPortType);
        expect(port.name).toEqual(portNames[3]);
        expect(port.interfaceRef.ref).toBe(firstPackageElements[2]);
        expect(port.arlangModId).toBeUndefined();

        port = ports[4];
        expect(port.type).toEqual(requiredPortType);
        expect(port.name).toEqual(portNames[4]);
        expect(port.interfaceRef.ref).toBe(firstPackageElements[3]);
        expect(port.arlangModId).toBeUndefined();
    });

    test ('Multiple ports of different type and referenced interfaces of different type should be parsed (test 2)', async () => {
        const packageNames = ['p.sb.subpackage', 'p.sb.subpackage1', 'a.b.c.d.e.f', 'singlePackageName'];
        const interfaceNames = ['Windshield', 'airbag', 'Heater3', 's1', 'SteeringWheel'];
        const portNames = ['TemperatureSensorProvider', 'actuatorStarter', 'U4', 'msgexchangepoint', 'Pp7', 'LastPortName0'];

        const document1 = await parseDocument(services, `
            #package ${packageNames[0]}
                interface:${senderReceiverInterfaceType} ExampleInterfaceName2 {}

                swComponent:${swComponentType} swc1 {
                    port:${requiredPortType} ${portNames[0]} implements ${packageNames[0]}.${interfaceNames[4]} {
                    }
                    port:${providedPortType} ${portNames[1]} implements ${packageNames[1]}.${interfaceNames[0]} {
                    }
                    port:${requiredPortType} ${portNames[2]} implements ${packageNames[1]}.${interfaceNames[0]} {
                    }
                }

                interface:${senderReceiverInterfaceType} ${interfaceNames[4]} {}
            #end
            #package ${packageNames[1]}
                interface:${senderReceiverInterfaceType} ${interfaceNames[0]} {}
                interface:${clientServerInterfaceType} ExampleInterfaceName2 {}
                interface:${senderReceiverInterfaceType} ${interfaceNames[1]} {}
                interface:${clientServerInterfaceType} ${interfaceNames[2]} {}
            #end
        `);
        const document2 = await parseDocument(services, `
            #package ${packageNames[2]}
                interface:${senderReceiverInterfaceType} ${interfaceNames[3]} {
                }
                swComponent:${swComponentType} swc2
                {
                    port:${requiredPortType} ${portNames[2]} implements ${packageNames[2]}.${interfaceNames[3]} {
                    }
                    port:${providedPortType} ${portNames[3]} implements ${packageNames[1]}.${interfaceNames[1]} {
                    }
                    port:${providedPortType} ${portNames[4]} implements ${packageNames[1]}.${interfaceNames[2]} {
                    }
                    port:${requiredPortType} ${portNames[5]} implements ${packageNames[3]}.${interfaceNames[4]} {
                    }
                }
                interface:${clientServerInterfaceType} ExampleInterfaceName1{}
            #end
            #package ${packageNames[3]}
                interface:${clientServerInterfaceType} ${interfaceNames[4]}{ }
                interface:${clientServerInterfaceType} ExampleInterfaceName2 {}
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document1, document2]);

        const document1Result : ParseResult<AstNode> = document1.parseResult;
        expectNoError(document1Result);

        const document2Result : ParseResult<AstNode> = document2.parseResult;
        expectNoError(document2Result);

        // get elements from first and second package
        let model : Model = document1Result.value as Model;

        let packages : Package[] = model.packages;
        expect(packages.length).toEqual(2);

        const firstPackageElements : Element[] = packages[0].elements;
        expect(firstPackageElements.length).toEqual(3);

        const secondPackageElements : Element[] = packages[1].elements;
        expect(secondPackageElements.length).toEqual(4);

        // get elements from third and fourth package
        model = document2Result.value as Model;

        packages = model.packages;
        expect(packages.length).toEqual(2);

        const thirdPackageElements : Element[] = packages[0].elements;
        expect(thirdPackageElements.length).toEqual(3);

        const fourthPackageElements : Element[] = packages[1].elements;
        expect(fourthPackageElements.length).toEqual(2);

        // check swc1 ports
        expect(isSwComponent(firstPackageElements[1])).toBeTruthy();
        let swc : SwComponent = firstPackageElements[1] as SwComponent;

        let ports : Port[] = swc.ports;
        expect(ports.length).toEqual(3);

        let port : Port = ports[0];
        expect(port.type).toEqual(requiredPortType);
        expect(port.name).toEqual(portNames[0]);
        expect(port.interfaceRef.ref).toBe(firstPackageElements[2]);

        port = ports[1];
        expect(port.type).toEqual(providedPortType);
        expect(port.name).toEqual(portNames[1]);
        expect(port.interfaceRef.ref).toBe(secondPackageElements[0]);

        port = ports[2];
        expect(port.type).toEqual(requiredPortType);
        expect(port.name).toEqual(portNames[2]);
        expect(port.interfaceRef.ref).toBe(secondPackageElements[0]);

        // check swc2 ports
        expect(isSwComponent(thirdPackageElements[1])).toBeTruthy();
        swc = thirdPackageElements[1] as SwComponent;

        ports = swc.ports;
        expect(ports.length).toEqual(4);

        port = ports[0];
        expect(port.type).toEqual(requiredPortType);
        expect(port.name).toEqual(portNames[2]);
        expect(port.interfaceRef.ref).toBe(thirdPackageElements[0]);
        expect(port.arlangModId).toBeUndefined();

        port = ports[1];
        expect(port.type).toEqual(providedPortType);
        expect(port.name).toEqual(portNames[3]);
        expect(port.interfaceRef.ref).toBe(secondPackageElements[2]);
        expect(port.arlangModId).toBeUndefined();

        port = ports[2];
        expect(port.type).toEqual(providedPortType);
        expect(port.name).toEqual(portNames[4]);
        expect(port.interfaceRef.ref).toBe(secondPackageElements[3]);
        expect(port.arlangModId).toBeUndefined();

        port = ports[3];
        expect(port.type).toEqual(requiredPortType);
        expect(port.name).toEqual(portNames[5]);
        expect(port.interfaceRef.ref).toBe(fourthPackageElements[0]);
        expect(port.arlangModId).toBeUndefined();
    });

});

describe('Undefined interface reference when such interface is not defined', () => {

    const swComponentType = 'application';

    const providedPortType : PortType = 'provided';
    const requiredPortType : PortType = 'required';

    test('Interface reference should be undefined when such interface is not defined for provided port', async () => {
        performTest(providedPortType);
    });

    test('Interface reference should be undefined when such interface is not defined for required port', async () => {
        performTest(requiredPortType);
    });

    async function performTest(portType: PortType) {
        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package A
                swComponent:${swComponentType} MySwc {
                    port:${providedPortType} PpName implements NotDefined {
                    }
                }
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        const packages : Package[] = model.packages;
        expect(packages.length).toEqual(1);

        const elements : Element[] = packages[0].elements;
        expect(elements.length).toEqual(1);

        expect(isSwComponent(elements[0])).toBeTruthy();
        const swComponent = elements[0] as SwComponent;

        const ports : Port[] = swComponent.ports;
        expect(ports.length).toEqual(1);

        const port : Port = ports[0];
        expect(port.interfaceRef.ref).toBeUndefined();
    }

});

describe('Parsing port fields', () => {

    const swComponentType = 'application';

    test('ArlangModId should be parsed correctly in provided port that reference client server interface', async () => {
        await performTestForArlangModId('provided', 'clientServer', 'asd123');
    });

    test('ArlangModId should be parsed correctly in provided port that reference sender receiver interface', async () => {
        await performTestForArlangModId('provided', 'senderReceiver', '456fgh');
    });

    test('ArlangModId should be parsed correctly in required port that reference client server interface', async () => {
        await performTestForArlangModId('required', 'clientServer', '123asd');
    });

    test('ArlangModId should be parsed correctly in required port that reference sender receiver interface', async () => {
        await performTestForArlangModId('required', 'senderReceiver', 'fgh456');
    });

    test('Port fields should be parsed correctly in multiple ports', async () => {
        const clientServerInterfaceType : InterfaceType = 'clientServer';
        const senderReceiverInterfaceType : InterfaceType = 'senderReceiver';

        const providedPortType : PortType = 'provided';
        const requiredPortType : PortType = 'required';

        const interfaceNames = ['MyInterface1', 'MyInterface2'];

        const arlangModIds = ['qw12', 'er34', '56ty', '78ui'];

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package A
                interface:${clientServerInterfaceType} ${interfaceNames[0]} {
                }
                interface:${senderReceiverInterfaceType} ${interfaceNames[1]} {
                }

                swComponent:${swComponentType} MySwc {
                    port:${providedPortType} P1 implements ${interfaceNames[0]} {
                        arlangModId : "${arlangModIds[0]}"
                    }

                    port:${providedPortType} P2 implements ${interfaceNames[1]} {
                        arlangModId : "${arlangModIds[1]}"
                    }

                    port:${requiredPortType} P3 implements ${interfaceNames[2]} {
                        arlangModId : "${arlangModIds[2]}"
                    }

                    port:${requiredPortType} P4 implements ${interfaceNames[3]} {
                        arlangModId : "${arlangModIds[3]}"
                    }
                }
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        const packages : Package[] = model.packages;
        expect(packages.length).toEqual(1);

        const elements : Element[] = packages[0].elements;
        expect(elements.length).toEqual(3);

        expect(isSwComponent(elements[2])).toBeTruthy();
        const swComponent = elements[2] as SwComponent;

        const ports : Port[] = swComponent.ports;
        expect(ports.length).toEqual(4);

        for (let i = 0; i < ports.length; i++) {
            const port = ports[i];
            expect(port.arlangModId).toBeDefined();
            expect(port.arlangModId!.id).toEqual(arlangModIds[i]);
        }
    });

    async function performTestForArlangModId(portType : PortType, interfaceType : InterfaceType, arlangModId : string) {
        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package A
                interface:${interfaceType} MyInterface {
                }

                swComponent:${swComponentType} MySwc {
                    port:${portType} PpName implements MyInterface {
                        arlangModId : "${arlangModId}"
                    }
                }
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        const packages : Package[] = model.packages;
        expect(packages.length).toEqual(1);

        const elements : Element[] = packages[0].elements;
        expect(elements.length).toEqual(2);

        expect(isSwComponent(elements[1])).toBeTruthy();
        const swComponent = elements[1] as SwComponent;

        const ports : Port[] = swComponent.ports;
        expect(ports.length).toEqual(1);

        const port : Port = ports[0];
        expect(port.arlangModId).toBeDefined();
        expect(port.arlangModId!.id).toEqual(arlangModId);
    }

});

describe('Lexical, syntax and reference errors for port description', () => {
    const swComponentType : SwComponentType = 'application';

    const clientServerInterfaceType : InterfaceType = 'clientServer';
    const senderReceiverInterfaceType : InterfaceType = 'senderReceiver';

    const providedPortType : PortType = 'provided';
    const requiredPortType : PortType = 'required';

    test('Error when port keyword of provided type is not typed correctly', async () => {
        const interfaceName = "iName";

        const document : LangiumDocument<AstNode> = await parseDocument(services,
            `#package packageName
                interface:${clientServerInterfaceType} ${interfaceName} {
                }

                swComponent:${swComponentType} swcName {
                    pot:${providedPortType} portName implements ${interfaceName} {
                    }
                }
            #end`);
        await services.shared.workspace.DocumentBuilder.build([document]);

        expectAnyError(document);
    });

    test('Error when port keyword of required type is not typed correctly', async () => {
        const interfaceName = "iName";

        const document : LangiumDocument<AstNode> = await parseDocument(services,
            `#package packageName
                interface:${clientServerInterfaceType} ${interfaceName} {
                }

                swComponent:${swComponentType} swcName {
                    pot:${requiredPortType} portName implements ${interfaceName} {
                    }
                }
            #end`);
        await services.shared.workspace.DocumentBuilder.build([document]);

        expectAnyError(document);
    });

    test('Error when port name of provided type is not defined', async () => {
        const interfaceName = "exampleName";

        const document : LangiumDocument<AstNode> = await parseDocument(services,
            `#package packageName
                interface:${senderReceiverInterfaceType} ${interfaceName} {
                }

                swComponent:${swComponentType} swcName {
                    port:${requiredPortType} implements ${interfaceName} {
                    }
                }
            #end`);
        await services.shared.workspace.DocumentBuilder.build([document]);

        expectAnyError(document);
    });

    test('Error when port name of required type is not defined', async () => {
        const interfaceName = "exampleName";

        const document : LangiumDocument<AstNode> = await parseDocument(services,
            `#package packageName
                interface:${senderReceiverInterfaceType} ${interfaceName} {
                }

                swComponent:${swComponentType} swcName {
                    port:${requiredPortType} implements ${interfaceName} {
                    }
                }
            #end`);
        await services.shared.workspace.DocumentBuilder.build([document]);

        expectAnyError(document);
    });

    test('Error when implements keyword of provided port type is not typed correctly', async () => {
        const interfaceName = "rn";

        const document : LangiumDocument<AstNode> = await parseDocument(services,
            `#package packageName
                interface:${senderReceiverInterfaceType} ${interfaceName} {
                }

                swComponent:${swComponentType} swcName {
                    port:${providedPortType} portName implemnts ${interfaceName} {
                    }
                }
            #end`);
        await services.shared.workspace.DocumentBuilder.build([document]);

        expectAnyError(document);
    });

    test('Error when implements keyword of required port type is not typed correctly', async () => {
        const interfaceName = "rn";

        const document : LangiumDocument<AstNode> = await parseDocument(services,
            `#package packageName
                interface:${clientServerInterfaceType} ${interfaceName} {
                }

                swComponent:${swComponentType} swcName {
                    port:${requiredPortType} portName imlements ${interfaceName} {
                    }
                }
            #end`);
        await services.shared.workspace.DocumentBuilder.build([document]);

        expectAnyError(document);
    });

    test('Error when provided port referenced interface name is not given', async () => {
        const interfaceName = "TestingIName";

        const document : LangiumDocument<AstNode> = await parseDocument(services,
            `#package packageName
                interface:${clientServerInterfaceType} ${interfaceName} {
                }

                swComponent:${swComponentType} swcName {
                    port:${providedPortType} portName implements {
                    }
                }
            #end`);
        await services.shared.workspace.DocumentBuilder.build([document]);

        expectAnyError(document);
    });

    test('Error when required port referenced interface name is not given', async () => {
        const interfaceName = "TestingIName";

        const document : LangiumDocument<AstNode> = await parseDocument(services,
            `#package packageName
                interface:${clientServerInterfaceType} ${interfaceName} {
                }

                swComponent:${swComponentType} swcName {
                    port:${requiredPortType} portName implements {
                    }
                }
            #end`);
        await services.shared.workspace.DocumentBuilder.build([document]);

        expectAnyError(document);
    });

    test ('Error when opening curly bracket is not defined', async () => {
        const interfaceName = "TestingIName";

        const document : LangiumDocument<AstNode> = await parseDocument(services,
            `#package packageName
                interface:${clientServerInterfaceType} ${interfaceName} {
                }

                swComponent:${swComponentType} swcName {
                    port:${requiredPortType} portName implements ${interfaceName}
                    }
                }
            #end`
        );
        await services.shared.workspace.DocumentBuilder.build([document]);

        expectAnyError(document);
    });

    test ('Error when closing curly bracket is not defined', async () => {
        const interfaceName = "TestingIName";

        const document : LangiumDocument<AstNode> = await parseDocument(services,
            `#package packageName
                interface:${senderReceiverInterfaceType} ${interfaceName} {
                }

                swComponent:${swComponentType} swcName {
                    port:${providedPortType} portName implements ${interfaceName} {
                }
            #end`
        );
        await services.shared.workspace.DocumentBuilder.build([document]);

        expectAnyError(document);
    });

    test ('Error when no curly bracket is defined', async () => {
        const interfaceName = "TestingIName";

        const document : LangiumDocument<AstNode> = await parseDocument(services,
            `#package packageName
                interface:${clientServerInterfaceType} ${interfaceName} {
                }

                swComponent:${swComponentType} swcName {
                    port:${providedPortType} portName implements ${interfaceName}
                }
            #end`
        );
        await services.shared.workspace.DocumentBuilder.build([document]);

        expectAnyError(document);
    });

    test ('Error when arlangModId is not typed correctly (= instead of :)', async () => {
        const swComponentType : SwComponentType = 'application';
        const interfaceName = "TestingIName";

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package myPackage
            swComponent:${swComponentType} MySwc {
                interface:${clientServerInterfaceType} ${interfaceName} {
                }

                swComponent:${swComponentType} swcName {
                    port:${providedPortType} portName implements ${interfaceName} {
                        arlangModId = "uuid"
                    }
                }
            }
            #end
        `);
        await services.shared.workspace.DocumentBuilder.build([document]);

        expectAnyError(document);
    });

});
