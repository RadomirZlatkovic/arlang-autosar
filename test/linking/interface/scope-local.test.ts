import { describe, expect, test } from "vitest";
import { AstNode, LangiumDocument, EmptyFileSystem, AstNodeDescription, ParseResult, MultiMap } from 'langium';
import { parseDocument } from 'langium/test';
import { createArlangServices } from '../../../src/language/arlang-module.js';
import { Model, InterfaceType} from '../../../src/language/generated/ast.js';
import { expectNoError, expectAnyError } from '../../test-helper.js';
import { ArlangScopeComputation } from "../../../src/language/arlang-scope.js";

const services = createArlangServices(EmptyFileSystem).Arlang;

describe('Local interface references', () => {

    const scopeComputation : ArlangScopeComputation = new ArlangScopeComputation(services);

    const clientServerType : InterfaceType = "clientServer";
    const senderReceiverType : InterfaceType = "senderReceiver";

    test('ClientServer interface should be referenceable in the same file by its name', async () => {
        const packageName = "a1.a2";
        const interfaceName = "ExampleName";

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package ${packageName}
                interface:${clientServerType} ${interfaceName} {}
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        const nodeToDescription : MultiMap<AstNode, AstNodeDescription> = await scopeComputation.computeLocalScopes(document);
        expect(nodeToDescription.keys().count(),
            'One key should exist in map, which represents a Model (file) where all local elements can be referenced by their name.'
        ).toEqual(1);

        const localObjects : readonly AstNodeDescription[] = nodeToDescription.get(model);
        expect(localObjects.length,
            'model should be the only existing key, and it should contain all elements (1 in this case) that can be referenced locally.'
        ).toEqual(1);

        const localObject : AstNodeDescription = localObjects[0];
        expect(localObject.name).toEqual(interfaceName);
        expect(localObject.node).toBe(model.packages[0].elements[0]);
    });

    test('SenderReceiver interface should be referenceable in the same file by its name', async () => {
        const packageName = "b2.c3.d4";
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

        const nodeToDescription : MultiMap<AstNode, AstNodeDescription> = await scopeComputation.computeLocalScopes(document);
        expect(nodeToDescription.keys().count(),
            'One key should exist in map, which represents a Model (file) where all local elements can be referenced by their name.'
        ).toEqual(1);

        const localObjects : readonly AstNodeDescription[] = nodeToDescription.get(model);
        expect(localObjects.length,
            'model should be the only existing key, and it should contain all elements (1 in this case) that can be referenced locally.'
        ).toEqual(1);

        const localObject : AstNodeDescription = localObjects[0];
        expect(localObject.name).toEqual(interfaceName);
        expect(localObject.node).toBe(model.packages[0].elements[0]);
    });

    test ('Interfaces in the same file should be referenceable by their names (test of one package)', async () => {
        const packageName = "p1.secondSegment.lastSegment";
        const interfaceNames = ["RandomName", "MyInterface", "IMyInterface", "testname"];

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package ${packageName}
                interface:${clientServerType} ${interfaceNames[0]} {}
                interface:${senderReceiverType} ${interfaceNames[1]} {}
                interface:${senderReceiverType} ${interfaceNames[2]} {}
                interface:${clientServerType} ${interfaceNames[3]} {}
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        const nodeToDescription : MultiMap<AstNode, AstNodeDescription> = await scopeComputation.computeLocalScopes(document);
        expect(nodeToDescription.keys().count(),
            'One key should exist in map, which represents a Model (file) where all local elements can be referenced by their name.'
        ).toEqual(1);

        const localObjects : readonly AstNodeDescription[] = nodeToDescription.get(model);
        expect(localObjects.length,
            'model should be the only existing key, and it should contain all elements (4 in this case) that can be referenced locally.'
        ).toEqual(4);

        for (let i = 0; i < localObjects.length; i++) {
            const localObject : AstNodeDescription = localObjects[i];
            expect(localObject.name).toEqual(interfaceNames[i]);
            expect(localObject.node).toBe(model.packages[0].elements[i]);
        }
    });

    test ('Interfaces in the same file should be referenceable by their names (test of multiple packages)', async () => {
        const packageNames = ["p1.p2.p3.p4", "my.package.example", "PName"];
        const interfaceNames = ["firstPackageFirstInterface", "TestClass", "i3", "I_External"];

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package ${packageNames[0]}
                interface:${clientServerType} ${interfaceNames[0]} {}
                interface:${senderReceiverType} ${interfaceNames[1]} {}
            #end

            #package ${packageNames[1]}
                interface:${senderReceiverType} ${interfaceNames[2]}
                {
                }
            #end

            #package ${packageNames[2]}
                interface:${clientServerType} ${interfaceNames[3]} {
                }
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        const nodeToDescription : MultiMap<AstNode, AstNodeDescription> = await scopeComputation.computeLocalScopes(document);
        expect(nodeToDescription.keys().count(),
            'One key should exist in map, which represents a Model (file) where all local elements can be referenced by their name.'
        ).toEqual(1);

        const localObjects : readonly AstNodeDescription[] = nodeToDescription.get(model);
        expect(localObjects.length,
            'model should be the only existing key, and it should contain all elements (4 in this case) that can be referenced locally.'
        ).toEqual(4);

        expect(localObjects[0].name).toEqual(interfaceNames[0]);
        expect(localObjects[0].node).toBe(model.packages[0].elements[0]);

        expect(localObjects[1].name).toEqual(interfaceNames[1]);
        expect(localObjects[1].node).toBe(model.packages[0].elements[1]);

        expect(localObjects[2].name).toEqual(interfaceNames[2]);
        expect(localObjects[2].node).toBe(model.packages[1].elements[0]);

        expect(localObjects[3].name).toEqual(interfaceNames[3]);
        expect(localObjects[3].node).toBe(model.packages[2].elements[0]);
    });

});

describe('Interface not locally referenceable', () => {

    const scopeComputation : ArlangScopeComputation = new ArlangScopeComputation(services);

    const clientServerType : InterfaceType = "clientServer";
    const senderReceiverType : InterfaceType = "senderReceiver";

    test('ClientServer interface should not be referenceable when name is not defined', async () => {
        const packageName = "b2.a1";

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package ${packageName}
                interface:${clientServerType} {}
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        expectAnyError(document);

        const nodeToDescription : MultiMap<AstNode, AstNodeDescription> = await scopeComputation.computeLocalScopes(document);
        expect(nodeToDescription.keys().count(),
            'No key should exist in map. Key represents a Model (file) where all local elements can be referenced by their name.'
        ).toEqual(0);
    });

    test('SenderReceiver interface should not be referenceable when name is not defined', async () => {
        const packageName = "first.second.third";

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package ${packageName}
                interface:${senderReceiverType} {}
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        expectAnyError(document);

        const nodeToDescription : MultiMap<AstNode, AstNodeDescription> = await scopeComputation.computeLocalScopes(document);
        expect(nodeToDescription.keys().count(),
            'No key should exist in map. Key represents a Model (file) where all local elements can be referenced by their name.'
        ).toEqual(0);
    });

    test ('Only interfaces with defined name should be referenceable in the same file by their name (test of one package)', async () => {
        const packageName = "a.b.c.d.e";
        const interfaceNames = ["ExampleName1", "ExampleName2"];

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package ${packageName}
                interface:${senderReceiverType} {}
                interface:${clientServerType} {}
                interface:${senderReceiverType} ${interfaceNames[0]} {}
                interface:${clientServerType} ${interfaceNames[1]} {}
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        expectAnyError(document);

        const parseResult : ParseResult<AstNode> = document.parseResult;
        const model : Model = parseResult.value as Model;

        const nodeToDescription : MultiMap<AstNode, AstNodeDescription> = await scopeComputation.computeLocalScopes(document);
        expect(nodeToDescription.keys().count(),
            'One key should exist in map, which represents a Model (file) where all local elements can be referenced by their name.'
        ).toEqual(1);

        const localObjects : readonly AstNodeDescription[] = nodeToDescription.get(model);
        expect(localObjects.length,
            'model should be the only existing key, and it should contain all elements (2 in this case) that can be referenced locally.'
        ).toEqual(2);

        expect(localObjects[0].name).toEqual(interfaceNames[0]);
        expect(localObjects[0].node).toBe(model.packages[0].elements[2]);

        expect(localObjects[1].name).toEqual(interfaceNames[1]);
        expect(localObjects[1].node).toBe(model.packages[0].elements[3]);
    });

    test ('Only interfaces with defined name should be referenceable in the same file by their name (test of multiple packages)', async () => {
        const packageNames = ["com.mycompany", "org.organisation.sector", "gov.domain.name"];
        const interfaceNames = ["ISurroundView", "IDriverMonitoring"];

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package ${packageNames[0]}
                interface:${clientServerType} {}
                interface:${senderReceiverType} ${interfaceNames[0]} {}
            #end

            #package ${packageNames[1]}
                interface:${senderReceiverType} ${interfaceNames[1]}
                {
                }
            #end

            #package ${packageNames[2]}
                interface:${clientServerType} {
                }
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        expectAnyError(document);

        const parseResult : ParseResult<AstNode> = document.parseResult;
        const model : Model = parseResult.value as Model;

        const nodeToDescription : MultiMap<AstNode, AstNodeDescription> = await scopeComputation.computeLocalScopes(document);
        expect(nodeToDescription.keys().count(),
            'One key should exist in map, which represents a Model (file) where all local elements can be referenced by their name.'
        ).toEqual(1);

        const localObjects : readonly AstNodeDescription[] = nodeToDescription.get(model);
        expect(localObjects.length,
            'model should be the only existing key, and it should contain all elements (2 in this case) that can be referenced locally.'
        ).toEqual(2);

        expect(localObjects[0].name).toEqual(interfaceNames[0]);
        expect(localObjects[0].node).toBe(model.packages[0].elements[1]);

        expect(localObjects[1].name).toEqual(interfaceNames[1]);
        expect(localObjects[1].node).toBe(model.packages[1].elements[0]);
    });

});
