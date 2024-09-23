import { describe, expect, test } from "vitest";
import { AstNode, LangiumDocument, EmptyFileSystem, ParseResult } from 'langium';
import { parseDocument } from 'langium/test';
import { createArlangServices } from '../../src/language/arlang-module.js';
import { Model, Package, Element, Interface, InterfaceType, isInterface} from '../../src/language/generated/ast.js';
import { expectNoError, expectAnyError } from '../test-helper.js';

const services = createArlangServices(EmptyFileSystem).Arlang;

describe('No interface defined in file/model', () => {

    test ('No interface should be parsed ', async () => {
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

});

describe('Parsing one SenderReceiver interface', () => {

    const interfaceType : InterfaceType = 'senderReceiver';

    test ('Interface with name of one letter should be parsed', async() => {
        await performTestForOneInterface(interfaceType, 'A');
    });

    test ('Interface with name of multiple letters should be parsed', async() => {
        await performTestForOneInterface(interfaceType, 'NameTest');
    });

    test ('Interface with name of one letter and number should be parsed', async() => {
        await performTestForOneInterface(interfaceType, 'B1');
    });

    test ('Interface with name of multiple letters and numbers should be parsed', async() => {
        await performTestForOneInterface(interfaceType, 'NameTest11');
    });

});

describe('Parsing one ClientServer interface', () => {

    const interfaceType : InterfaceType = 'clientServer'

    test ('Interface with name of one letter should be parsed', async() => {
        await performTestForOneInterface(interfaceType, 'P');
    });

    test ('Interface with name of multiple letters should be parsed', async() => {
        await performTestForOneInterface(interfaceType, 'ExampleName');
    });

    test ('Interface with name of one letter and number should be parsed', async() => {
        await performTestForOneInterface(interfaceType, 'C6');
    });

    test ('Interface with name of multiple letters and numbers should be parsed', async() => {
        await performTestForOneInterface(interfaceType, 'Random55Name');
    });

});

async function performTestForOneInterface(interfaceType : InterfaceType, interfaceName : String) {
    const document : LangiumDocument<AstNode> = await parseDocument(services, `
    #package A
        interface:${interfaceType} ${interfaceName} {}
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

    const element : Element = elements[0];
    expect(isInterface(element)).toBeTruthy();

    const arInterface : Interface = element as Interface;
    expect(arInterface.type).toEqual(interfaceType);
    expect(arInterface.name).toEqual(interfaceName);
    expect(arInterface.arlangModId).toBeUndefined();
}

describe('Parsing multiple SenderReceiver interfaces in different packages', () => {

    const interfaceType : InterfaceType = 'senderReceiver';

    test ('Interfaces with names of one letter should be parsed', async () => {
        await performTest(interfaceType, ['A', 'B']);
    });

    test ('Interfaces with names of multiple letters should be parsed', async () => {
        await performTest(interfaceType, ['first', 'Second', 'lAst']);
    });

    test ('Interfaces with names of multiple letters and numbers should be parsed', async () => {
        await performTest(interfaceType, ['test1', 'Test2', 'test3', 'test4']);
    });

    test ('Interfaces with names of multiple mixed letters and numbers should be parsed', async () => {
        await performTest(interfaceType, ['a', 'b65', 'ExampleTest', 'another3Example']);
    });

});

describe('Parsing multiple ClientServer interfaces in different packages', () => {

    const interfaceType : InterfaceType = 'clientServer';

    test ('Interfaces with names of one letter should be parsed', async () => {
        await performTest(interfaceType, ['a', 'B']);
    });

    test ('Interfaces with names of multiple letters should be parsed', async () => {
        await performTest(interfaceType, ['first', 'Second', 'lAst']);
    });

    test ('Interfaces with names of multiple letters and numbers should be parsed', async () => {
        await performTest(interfaceType, ['test1', 'Test2', 'test3', 'teSt4']);
    });

    test ('Interfaces with names of multiple mixed letters and numbers should be parsed', async () => {
        await performTest(interfaceType, ['C', 'p38', 'ExampleTest', 'another3Example']);
    });

});

async function performTest(interfaceType : InterfaceType, interfaceNames : String[]) {
    expect(interfaceNames.length).toBeGreaterThan(1);

    const interfaceDeclarations : string = interfaceNames
        .map((interfaceName) => {
            return `
                #package A
                    interface:${interfaceType} ${interfaceName} {
                    }
                #end
            `
        })
        .reduce(
            (predviousDeclarations, newDeclaration) => predviousDeclarations + ' ' + newDeclaration
        );
    const document : LangiumDocument<AstNode> = await parseDocument(services, interfaceDeclarations);

    await services.shared.workspace.DocumentBuilder.build([document]);
    const parseResult : ParseResult<AstNode> = document.parseResult;
    expectNoError(parseResult);

    const model : Model = parseResult.value as Model;

    const packages : Package[] = model.packages;
    expect(packages.length).toEqual(interfaceNames.length);

    for (let i : number = 0; i < packages.length; i++) {
        const elements : Element[] = packages[i].elements;
        expect(elements.length).toEqual(1);

        const element : Element = elements[0];
        expect(isInterface(element)).toBeTruthy();

        const arInterface : Interface = element as Interface;
        expect(arInterface.type).toEqual(interfaceType);
        expect(arInterface.name).toEqual(interfaceNames[i]);
        expect(arInterface.arlangModId).toBeUndefined();
    }
}

describe('Parsing multiple interfaces of different type in same/different package', () => {

    const clientServerType : InterfaceType = 'clientServer';
    const senderReceiverType : InterfaceType = 'senderReceiver';

    test ('Interfaces of different types in same package should be passed', async () => {
        const interfaceNames = ['MyInterface0', 'MyInterface1', 'MyInterface2', 'MyInterface3'];

        const interfacesDeclarations : string = `
            #package A
                interface:${clientServerType} ${interfaceNames[0]} {
                }

                interface:${senderReceiverType} ${interfaceNames[1]} {
                }

                interface:${senderReceiverType} ${interfaceNames[2]} {
                }

                interface:${clientServerType} ${interfaceNames[3]} {
                }
            #end
        `
        const document : LangiumDocument<AstNode> = await parseDocument(services, interfacesDeclarations);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        const packages : Package[] = model.packages;
        expect(packages.length).toEqual(1);

        const elements : Element[] = packages[0].elements;
        expect(elements.length).toEqual(4);

        for (let i = 0; i < 4; i++) {
            expect(isInterface(elements[i])).toBeTruthy();
        }

        let arInterface : Interface = elements[0] as Interface;
        expect(arInterface.type).toEqual(clientServerType);
        expect(arInterface.name).toEqual(interfaceNames[0]);

        arInterface = elements[1] as Interface;
        expect(arInterface.type).toEqual(senderReceiverType);
        expect(arInterface.name).toEqual(interfaceNames[1]);
        expect(arInterface.arlangModId).toBeUndefined();

        arInterface = elements[2] as Interface;
        expect(arInterface.type).toEqual(senderReceiverType);
        expect(arInterface.name).toEqual(interfaceNames[2]);
        expect(arInterface.arlangModId).toBeUndefined();

        arInterface = elements[3] as Interface;
        expect(arInterface.type).toEqual(clientServerType);
        expect(arInterface.name).toEqual(interfaceNames[3]);
        expect(arInterface.arlangModId).toBeUndefined();
    });

    test ('Interfaces of different types in different packages should be passed', async () => {
        const interfaceNames = ['MyInterface0', 'MyInterface1', 'MyInterface2', 'MyInterface3'];

        const interfacesDeclarations : string = `
            #package A
                interface:${clientServerType} ${interfaceNames[0]} {
                }

                interface:${senderReceiverType} ${interfaceNames[1]} {
                }
            #end

            #package B
                interface:${senderReceiverType} ${interfaceNames[2]} {
                }

                interface:${clientServerType} ${interfaceNames[3]} {}
            #end
        `
        const document : LangiumDocument<AstNode> = await parseDocument(services, interfacesDeclarations);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        const packages : Package[] = model.packages;
        expect(packages.length).toEqual(2);

        let elements : Element[] = packages[0].elements;
        expect(elements.length).toEqual(2);
        for (let i = 0; i < 2; i++) {
            expect(isInterface(elements[i])).toBeTruthy();
        }

        let arInterfaces : Interface[] = elements.map((element) => {
            return element as Interface;
        });

        expect(arInterfaces[0].type).toEqual(clientServerType);
        expect(arInterfaces[0].name).toEqual(interfaceNames[0]);

        expect(arInterfaces[1].type).toEqual(senderReceiverType);
        expect(arInterfaces[1].name).toEqual(interfaceNames[1]);

        elements = packages[1].elements;
        expect(elements.length).toEqual(2);
        for (let i = 0; i < 2; i++) {
            expect(isInterface(elements[i])).toBeTruthy();
        }

        arInterfaces = elements.map((element) => {
            return element as Interface;
        });

        expect(arInterfaces[0].type).toEqual(senderReceiverType);
        expect(arInterfaces[0].name).toEqual(interfaceNames[2]);
        expect(arInterfaces[0].arlangModId).toBeUndefined();

        expect(arInterfaces[1].type).toEqual(clientServerType);
        expect(arInterfaces[1].name).toEqual(interfaceNames[3]);
        expect(arInterfaces[1].arlangModId).toBeUndefined();
    });

});

describe('Parsing interface fields', () => {

    test ('ArlangModId should be parsed correctly in client server interface', async () => {
        await performTestForArlangModId('clientServer', 'asdfghjkl123456789');
    });

    test ('ArlangModId should be parsed correctly in server receiver interface', async () => {
        await performTestForArlangModId('senderReceiver', 'qwertyuiop987654321');
    });

    test ('Interface fields should be parsed correctly in multiple interfaces', async () => {
        const clientServerInterfaceType : InterfaceType = 'clientServer';
        const senderReceiverInterfaceType : InterfaceType = 'senderReceiver';

        const arlangModIds = ['zxcv0', 'bnm'];

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
        #package A
            interface:${senderReceiverInterfaceType} MyInterface1 {
                arlangModId : "${arlangModIds[0]}"
            }

            interface:${clientServerInterfaceType} MyInterface2 {
                arlangModId : "${arlangModIds[1]}"
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

        for (const element of elements) {
            expect(isInterface(element)).toBeTruthy();
        }

        let element : Element = elements[0];
        let arInterface : Interface = element as Interface;
        expect(arInterface.arlangModId).toBeDefined();
        expect(arInterface.arlangModId!.id).toEqual(arlangModIds[0]);

        element = elements[1];
        arInterface = element as Interface;
        expect(arInterface.arlangModId).toBeDefined();
        expect(arInterface.arlangModId!.id).toEqual(arlangModIds[1]);
    });

    async function performTestForArlangModId(interfaceType : InterfaceType, arlangModId : string) {
        const document : LangiumDocument<AstNode> = await parseDocument(services, `
        #package A
            interface:${interfaceType} MyInterface {
                arlangModId : "${arlangModId}"
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

        const element : Element = elements[0];
        expect(isInterface(element)).toBeTruthy();

        const arInterface : Interface = element as Interface;
        expect(arInterface.arlangModId).toBeDefined();
        expect(arInterface.arlangModId!.id).toEqual(arlangModId);
    }

});

describe('Lexical and syntax errors for interface description', () => {

    test ('Error when interface is not typed correctly', async () => {
        const interfaceType : InterfaceType = 'senderReceiver';

        const document : LangiumDocument<AstNode> = await parseDocument(services,
            `#package packageName
                intterface:${interfaceType} IMyInterface {
                }
            #end`);
        await services.shared.workspace.DocumentBuilder.build([document]);

        expectAnyError(document);
    });

    test ('Error when interface type is not typed correctly', async () => {
        const document : LangiumDocument<AstNode> = await parseDocument(services,
            `#package packageName
                interface:randomType IMyInterface {
                }
            #end`);
        await services.shared.workspace.DocumentBuilder.build([document]);

        expectAnyError(document);
    });

    test ('Error when interface type is not defined', async () => {
        const document : LangiumDocument<AstNode> = await parseDocument(services,
            `#package packageName
                interface IMyInterface {
                }
            #end`);
        await services.shared.workspace.DocumentBuilder.build([document]);

        expectAnyError(document);
    });

    test ('Error when interface name is not defined', async () => {
        const interfaceType : InterfaceType = 'clientServer';

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package myPackage
                interface:${interfaceType} {}
            #end
        `);
        await services.shared.workspace.DocumentBuilder.build([document]);

        expectAnyError(document);
    });

    test ('Error when opening curly bracket is not defined', async () => {
        const interfaceType : InterfaceType = 'clientServer';

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package myPackage
                interface:${interfaceType} }
            #end
        `);
        await services.shared.workspace.DocumentBuilder.build([document]);

        expectAnyError(document);
    });

    test ('Error when closing curly bracket is not defined', async () => {
        const interfaceType : InterfaceType = 'clientServer';

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package myPackage
                interface:${interfaceType} {
            #end
        `);
        await services.shared.workspace.DocumentBuilder.build([document]);

        expectAnyError(document);
    });

    test ('Error when no curly bracket is defined', async () => {
        const interfaceType : InterfaceType = 'clientServer';

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package myPackage
                interface:${interfaceType}
            #end
        `);
        await services.shared.workspace.DocumentBuilder.build([document]);

        expectAnyError(document);
    });

    test ('Error when arlangModId is not typed correctly', async () => {
        const interfaceType : InterfaceType = 'senderReceiver';

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package myPackage
                interface:${interfaceType} {
                    arlangModdId = "zxcvbnm1234567890"
                }
            #end
        `);
        await services.shared.workspace.DocumentBuilder.build([document]);

        expectAnyError(document);
    });

});
