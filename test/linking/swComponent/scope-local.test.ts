import { describe, expect, test } from "vitest";
import { AstNode, LangiumDocument, EmptyFileSystem, AstNodeDescription, ParseResult, MultiMap } from 'langium';
import { parseDocument } from 'langium/test';
import { createArlangServices } from '../../../src/language/arlang-module.js';
import { Model, SwComponentType } from '../../../src/language/generated/ast.js';
import { expectNoError, expectAnyError } from '../../test-helper.js';
import { ArlangScopeComputation } from "../../../src/language/arlang-scope.js";

const services = createArlangServices(EmptyFileSystem).Arlang;

describe('Local SwComponent references', () => {

    const scopeComputation : ArlangScopeComputation = new ArlangScopeComputation(services);

    const applicationSwComponentType : SwComponentType = "application";

    test('Application SwComponent should be referenceable in the same file by its name', async () => {
        const packageName = "psw1.psw2.psw3";
        const swComponentName = "SoftwareComponentName";

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package ${packageName}
                swComponent:${applicationSwComponentType} ${swComponentName} {}
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
        expect(localObject.name).toEqual(swComponentName);
        expect(localObject.node).toBe(model.packages[0].elements[0]);
    });

    test ('SwComponents in the same file should be referenceable by their names (test of one package)', async () => {
        const packageName = "example.name";
        const swComponentNames = ["SWC1", "ExampleSwc", "TestSc", "swc2"];

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package ${packageName}
                swComponent:${applicationSwComponentType} ${swComponentNames[0]} {}
                swComponent:${applicationSwComponentType} ${swComponentNames[1]} {}
                swComponent:${applicationSwComponentType} ${swComponentNames[2]} {}
                swComponent:${applicationSwComponentType} ${swComponentNames[3]} {}
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
            expect(localObject.name).toEqual(swComponentNames[i]);
            expect(localObject.node).toBe(model.packages[0].elements[i]);
        }
    });

    test ('SwComponents in the same file should be referenceable by their names (test of multiple packages)', async () => {
        const packageNames = ["a1.b1.c1", "random.packageName", "ExamplePackage"];
        const swComponentNames = ["TrafficLightMonitoring", "SignDetection", "O2", "ABS"];

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package ${packageNames[0]}
                swComponent:${applicationSwComponentType} ${swComponentNames[0]} {}
                swComponent:${applicationSwComponentType} ${swComponentNames[1]} {}
            #end

            #package ${packageNames[1]}
            swComponent:${applicationSwComponentType} ${swComponentNames[2]}
                {
                }
            #end

            #package ${packageNames[2]}
                swComponent:${applicationSwComponentType} ${swComponentNames[3]} {
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

        expect(localObjects[0].name).toEqual(swComponentNames[0]);
        expect(localObjects[0].node).toBe(model.packages[0].elements[0]);

        expect(localObjects[1].name).toEqual(swComponentNames[1]);
        expect(localObjects[1].node).toBe(model.packages[0].elements[1]);

        expect(localObjects[2].name).toEqual(swComponentNames[2]);
        expect(localObjects[2].node).toBe(model.packages[1].elements[0]);

        expect(localObjects[3].name).toEqual(swComponentNames[3]);
        expect(localObjects[3].node).toBe(model.packages[2].elements[0]);
    });

});

describe('Software component not locally referenceable', () => {

    const scopeComputation : ArlangScopeComputation = new ArlangScopeComputation(services);

    const applicationSwComponentType : SwComponentType = "application";

    test('Application SwComponent should not be referenceable when name is not defined', async () => {
        const packageName = "b2.a1";

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package ${packageName}
                swComponent:${applicationSwComponentType} {}
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        expectAnyError(document);

        const nodeToDescription : MultiMap<AstNode, AstNodeDescription> = await scopeComputation.computeLocalScopes(document);
        expect(nodeToDescription.keys().count(),
            'No key should exist in map. Key represents a Model (file) where all local elements can be referenced by their name.'
        ).toEqual(0);
    });

    test ('Only SwComponents with defined name should be referenceable in the same file by their name (test of one package)', async () => {
        const packageName = "p1.p2.p3";
        const swComponentNames = ["MySwc1", "ProviderSoftwareComponent"];

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package ${packageName}
                swComponent:${applicationSwComponentType} {}
                swComponent:${applicationSwComponentType} ${swComponentNames[0]} {}
                swComponent:${applicationSwComponentType} {}
                swComponent:${applicationSwComponentType} ${swComponentNames[1]} {}
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

        expect(localObjects[0].name).toEqual(swComponentNames[0]);
        expect(localObjects[0].node).toBe(model.packages[0].elements[1]);

        expect(localObjects[1].name).toEqual(swComponentNames[1]);
        expect(localObjects[1].node).toBe(model.packages[0].elements[3]);
    });

    test ('Only SwComponents with defined name should be referenceable in the same file by their name (test of multiple packages)', async () => {
        const packageNames = ["e1.e2", "oem1.oem2.oem3", "tier1.tier2.tier3.tier4"];
        const swComponentNames = ["HeadupDisplay", "SeatBeltAllert"];

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package ${packageNames[0]}
                swComponent:${applicationSwComponentType} {}
                swComponent:${applicationSwComponentType} ${swComponentNames[0]} {}
            #end

            #package ${packageNames[1]}
                swComponent:${applicationSwComponentType} ${swComponentNames[1]}
                {
                }
            #end

            #package ${packageNames[2]}
            swComponent:${applicationSwComponentType} {
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

        expect(localObjects[0].name).toEqual(swComponentNames[0]);
        expect(localObjects[0].node).toBe(model.packages[0].elements[1]);

        expect(localObjects[1].name).toEqual(swComponentNames[1]);
        expect(localObjects[1].node).toBe(model.packages[1].elements[0]);
    });

});
