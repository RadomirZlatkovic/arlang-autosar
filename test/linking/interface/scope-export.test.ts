import { describe, expect, test } from "vitest";
import { AstNode, LangiumDocument, EmptyFileSystem, AstNodeDescription, ParseResult } from 'langium';
import { parseDocument } from 'langium/test';
import { createArlangServices } from '../../../src/language/arlang-module.js';
import { Model, InterfaceType} from '../../../src/language/generated/ast.js';
import { expectNoError, expectAnyError } from '../../test-helper.js';
import { ArlangScopeComputation } from "../../../src/language/arlang-scope.js";

const services = createArlangServices(EmptyFileSystem).Arlang;

describe('Exporting interfaces', () => {

    const scopeComputation : ArlangScopeComputation = new ArlangScopeComputation(services);

    const clientServerType : InterfaceType = "clientServer";
    const senderReceiverType : InterfaceType = "senderReceiver";

    test ('Exported ClientServer interface should have package name as prefix', async () => {
        const packageName = "p1.p2.p3";
        const interfaceName = "MyInterface";

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package ${packageName}
                interface:${clientServerType} ${interfaceName} {}
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        scopeComputation.computeExports(document).then((exportedObjects) => {
            expect(exportedObjects.length).toEqual(1);

            const exportedObject = exportedObjects[0];
            expect(exportedObject.name).toEqual(packageName + "." + interfaceName);
            expect(exportedObject.node).toBe(model.packages[0].elements[0]);
        });
    });

    test ('Exported SenderReceiver interface should have package name as prefix', async () => {
        const packageName = "a1.a2";
        const interfaceName = "iName";

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package ${packageName}
                interface:${senderReceiverType} ${interfaceName} {}
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        scopeComputation.computeExports(document).then((exportedObjects) => {
            expect(exportedObjects.length).toEqual(1);

            const exportedObject = exportedObjects[0];
            expect(exportedObject.name).toEqual(packageName + "." + interfaceName);
            expect(exportedObject.node).toBe(model.packages[0].elements[0]);
        });
    });

    test ('Exported interfaces inside one package should have package name as prefix', async () => {
        const packageName = "first.second";
        const interfaceNames = ["IMyName", "iName", "TestingName", "ARInterface"];

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package ${packageName}
                interface:${senderReceiverType} ${interfaceNames[0]} { }
                interface:${clientServerType} ${interfaceNames[1]} { }
                interface:${senderReceiverType} ${interfaceNames[2]} { }
                interface:${clientServerType} ${interfaceNames[3]} { }
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        scopeComputation.computeExports(document).then((exportedObjects) => {
            expect(exportedObjects.length).toEqual(4);

            for (let i = 0; i < exportedObjects.length; i++) {
                const exportedObject = exportedObjects[i];
                expect(exportedObject.name).toEqual(packageName + "." + interfaceNames[i]);
                expect(exportedObject.node).toBe(model.packages[0].elements[i]);
            }
        });
    });

    test ('Exported interfaces inside multiple packages should have package name as prefix', async () => {
        const packageNames = ["first.second", "a1.b2.c3", "examplePackageName"];
        const interfaceNames = ["firstPackageFirstInterface", "TestClass", "i3", "I_External"];

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package ${packageNames[0]}
                interface:${senderReceiverType} ${interfaceNames[0]} {}
                interface:${clientServerType} ${interfaceNames[1]} {}
            #end

            #package ${packageNames[1]}
                interface:${clientServerType} ${interfaceNames[2]}
                {
                }
            #end

            #package ${packageNames[2]}
                interface:${senderReceiverType} ${interfaceNames[3]} {
                }
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        const exportedObjects : AstNodeDescription[] = await scopeComputation.computeExports(document);
        expect(exportedObjects.length).toEqual(4);

        expect(exportedObjects[0].name).toEqual(packageNames[0] + "." + interfaceNames[0]);
        expect(exportedObjects[0].node).toBe(model.packages[0].elements[0]);

        expect(exportedObjects[1].name).toEqual(packageNames[0] + "." + interfaceNames[1]);
        expect(exportedObjects[1].node).toBe(model.packages[0].elements[1]);

        expect(exportedObjects[2].name).toEqual(packageNames[1] + "." + interfaceNames[2]);
        expect(exportedObjects[2].node).toBe(model.packages[1].elements[0]);

        expect(exportedObjects[3].name).toEqual(packageNames[2] + "." + interfaceNames[3]);
        expect(exportedObjects[3].node).toBe(model.packages[2].elements[0]);
    });

});

describe('Not exporting interface because of undefined name', () => {

    const scopeComputation : ArlangScopeComputation = new ArlangScopeComputation(services);

    const clientServerType : InterfaceType = "clientServer";
    const senderReceiverType : InterfaceType = "senderReceiver";

    test('ClientServer interface should not be exported when name is not defined', async () => {
        const packageName = "MyPackage";

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package ${packageName}
                interface:${clientServerType} {}
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        expectAnyError(document);

        scopeComputation.computeExports(document).then((exportedObjects) => {
            expect(exportedObjects.length).toEqual(0);
        });
    });

    test('SenderReceiver interface should not be exported when name is not defined', async () => {
        const packageName = "my.package";

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package ${packageName}
                interface:${senderReceiverType} {}
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        expectAnyError(document);

        scopeComputation.computeExports(document).then((exportedObjects) => {
            expect(exportedObjects.length).toEqual(0);
        });
    });

    test('Only interfaces with defined name should be exported (test of one package)', async () => {
        const packageName = "first.second";
        const interfaceNames = ["iName1", "Name2"];

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package ${packageName}
                interface:${clientServerType} {}
                interface:${senderReceiverType} ${interfaceNames[0]} {}
                interface:${senderReceiverType} {}
                interface:${clientServerType} ${interfaceNames[1]} {}
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        expectAnyError(document);

        const parseResult : ParseResult<AstNode> = document.parseResult;
        const model : Model = parseResult.value as Model;

        const exportedObjects : AstNodeDescription[] = await scopeComputation.computeExports(document);
        expect(exportedObjects.length).toEqual(2);

        expect(exportedObjects[0].name).toEqual(packageName + "." + interfaceNames[0]);
        expect(exportedObjects[0].node).toBe(model.packages[0].elements[1]);

        expect(exportedObjects[1].name).toEqual(packageName + "." + interfaceNames[1]);
        expect(exportedObjects[1].node).toBe(model.packages[0].elements[3]);
    });

    test('Only interfaces with defined name should be exported (test of multiple packages)', async() => {
        const packageNames = ["first.second", "a1.b2.c3", "examplePackageName"];
        const interfaceNames = ["Monitoring", "Control"];

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package ${packageNames[0]}
                interface:${senderReceiverType} ${interfaceNames[0]} {}
                interface:${clientServerType} {}
            #end

            #package ${packageNames[1]}
                interface:${clientServerType} ${interfaceNames[1]}
                {
                }
            #end

            #package ${packageNames[2]}
                interface:${senderReceiverType} {
                }
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        expectAnyError(document);

        const parseResult : ParseResult<AstNode> = document.parseResult;
        const model : Model = parseResult.value as Model;

        const exportedObjects : AstNodeDescription[] = await scopeComputation.computeExports(document);
        expect(exportedObjects.length).toEqual(2);

        expect(exportedObjects[0].name).toEqual(packageNames[0] + "." + interfaceNames[0]);
        expect(exportedObjects[0].node).toBe(model.packages[0].elements[0]);

        expect(exportedObjects[1].name).toEqual(packageNames[1] + "." + interfaceNames[1]);
        expect(exportedObjects[1].node).toBe(model.packages[1].elements[0]);
    });

});

describe('Not exporting interface because of undefined package name', () => {

    const scopeComputation : ArlangScopeComputation = new ArlangScopeComputation(services);

    const clientServerType : InterfaceType = "clientServer";
    const senderReceiverType : InterfaceType = "senderReceiver";

    test('ClientServer interface should not be exported when package name is not defined', async () => {
        const interfaceName = "MyInterface";

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package
                interface:${clientServerType} ${interfaceName} {}
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        expectAnyError(document);

        scopeComputation.computeExports(document).then((exportedObjects) => {
            expect(exportedObjects.length).toEqual(0);
        });
    });

    test('SenderReceiver interface should not be exported when package name is not defined', async () => {
        const interfaceName = "MyInterface";

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package
                interface:${senderReceiverType} ${interfaceName} {}
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        expectAnyError(document);

        scopeComputation.computeExports(document).then((exportedObjects) => {
            expect(exportedObjects.length).toEqual(0);
        });
    });

    test('Interfaces inside one package should not be exported when package name is not defined', async () => {
        const interfaceNames = ["name1", "Name2", "IListener", "Listener"];

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package
                interface:${senderReceiverType} ${interfaceNames[0]} {}
                interface:${clientServerType} ${interfaceNames[1]} {}
                interface:${senderReceiverType} ${interfaceNames[2]} {}
                interface:${clientServerType} ${interfaceNames[3]} {}
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        expectAnyError(document);

        scopeComputation.computeExports(document).then((exportedObjects) => {
            expect(exportedObjects.length).toEqual(0);
        });
    });

    test('Only interfaces inside package that has defined name should be exported', async () => {
        const packageName = "a1.b2.c3";
        const interfaceNames = ["firstPackageFirstInterface", "TestClass", "i3", "I_External"];

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package
                interface:${clientServerType} ${interfaceNames[0]}
                {
                }
            #end

            #package ${packageName}
                interface:${senderReceiverType} ${interfaceNames[1]} {}
                interface:${clientServerType} ${interfaceNames[2]} {}
            #end

            #package
                interface:${senderReceiverType} ${interfaceNames[3]} {
                }
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        expectAnyError(document);

        const parseResult : ParseResult<AstNode> = document.parseResult;
        const model : Model = parseResult.value as Model;

        const exportedObjects : AstNodeDescription[] = await scopeComputation.computeExports(document);
        expect(exportedObjects.length).toEqual(2);

        expect(exportedObjects[0].name).toEqual(packageName + "." + interfaceNames[1]);
        expect(exportedObjects[0].node).toBe(model.packages[1].elements[0]);

        expect(exportedObjects[1].name).toEqual(packageName + "." + interfaceNames[2]);
        expect(exportedObjects[1].node).toBe(model.packages[1].elements[1]);
    });

});
