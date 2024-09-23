import { describe, expect, test } from "vitest";
import { AstNode, LangiumDocument, EmptyFileSystem, AstNodeDescription, ParseResult } from 'langium';
import { parseDocument } from 'langium/test';
import { createArlangServices } from '../../../src/language/arlang-module.js';
import { Model, SwComponentType} from '../../../src/language/generated/ast.js';
import { expectNoError, expectAnyError } from '../../test-helper.js';
import { ArlangScopeComputation } from "../../../src/language/arlang-scope.js";

const services = createArlangServices(EmptyFileSystem).Arlang;

describe('Exporting software components', () => {

    const scopeComputation : ArlangScopeComputation = new ArlangScopeComputation(services);

    const applicationSwComponentType : SwComponentType = "application";

    test ('Exported Application SwComponent should have package name as prefix', async () => {
        const packageName = "a1.b2.c3";
        const swComponentName = "MyComponent";

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package ${packageName}
                swComponent:${applicationSwComponentType} ${swComponentName} {}
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        scopeComputation.computeExports(document).then((exportedObjects) => {
            expect(exportedObjects.length).toEqual(1);

            const exportedObject = exportedObjects[0];
            expect(exportedObject.name).toEqual(packageName + "." + swComponentName);
            expect(exportedObject.node).toBe(model.packages[0].elements[0]);
        });
    });

    test ('Exported SwComponents inside one package should have package name as prefix', async () => {
        const packageName = "com.dep.group";
        const swComponentName = ["NameOne", "C1", "componentExample", "UserDefinedName"];

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package ${packageName}
                swComponent:${applicationSwComponentType} ${swComponentName[0]} {}
                swComponent:${applicationSwComponentType} ${swComponentName[1]} {}
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        scopeComputation.computeExports(document).then((exportedObjects) => {
            expect(exportedObjects.length).toEqual(2);

            for (let i = 0; i < exportedObjects.length; i++) {
                const exportedObject = exportedObjects[i];
                expect(exportedObject.name).toEqual(packageName + "." + swComponentName[i]);
                expect(exportedObject.node).toBe(model.packages[0].elements[i]);
            }
        });
    });

    test ('Exported SwComponents inside multiple packages should have package name as prefix', async () => {
        const packageNames = ["partOne", "PartTwo", "p1.p2.p3", "oneSegment"];
        const swComponentNames = ["firstComponent", "SkeletonProvider", "p1", "Proxy1Receiver"];

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package ${packageNames[0]}
                swComponent:${applicationSwComponentType} ${swComponentNames[0]} {}
            #end

            #package ${packageNames[1]}
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

        const exportedObjects : AstNodeDescription[] = await scopeComputation.computeExports(document);
        expect(exportedObjects.length).toEqual(2);

        expect(exportedObjects[0].name).toEqual(packageNames[0] + "." + swComponentNames[0]);
        expect(exportedObjects[0].node).toBe(model.packages[0].elements[0]);

        expect(exportedObjects[1].name).toEqual(packageNames[2] + "." + swComponentNames[3]);
        expect(exportedObjects[1].node).toBe(model.packages[2].elements[0]);
    });

});

describe('Not exporting software components because of undefined name', () => {

    const scopeComputation : ArlangScopeComputation = new ArlangScopeComputation(services);

    const applicationSwComponentType : SwComponentType = "application";

    test('Application SwComponent should not be exported when name is not defined', async () => {
        const packageName = "nameOfThePackage";

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package ${packageName}
                swComponent:${applicationSwComponentType} {}
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        expectAnyError(document);

        scopeComputation.computeExports(document).then((exportedObjects) => {
            expect(exportedObjects.length).toEqual(0);
        });
    });

    test('Only SwComponents with defined name should be exported (test of one package)', async () => {
        const packageName = "td1.h2";
        const swComponentNames = ["SW1", "sw2"];

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

        const exportedObjects : AstNodeDescription[] = await scopeComputation.computeExports(document);
        expect(exportedObjects.length).toEqual(2);

        expect(exportedObjects[0].name).toEqual(packageName + "." + swComponentNames[0]);
        expect(exportedObjects[0].node).toBe(model.packages[0].elements[1]);

        expect(exportedObjects[1].name).toEqual(packageName + "." + swComponentNames[1]);
        expect(exportedObjects[1].node).toBe(model.packages[0].elements[3]);
    });

    test('Only SwComponents with defined name should be exported (test of multiple packages)', async() => {
        const packageNames = ["p1", "p1.p2", "p1.p2.p3"];
        const swComponentNames = ["GearBox", "AdaptiveCruiseControl"];

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package ${packageNames[0]}
                swComponent:${applicationSwComponentType} ${swComponentNames[0]} {}
            #end

            #package ${packageNames[1]}
                swComponent:${applicationSwComponentType} ${swComponentNames[1]}
                {
                }
                swComponent:${applicationSwComponentType} {}
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

        const exportedObjects : AstNodeDescription[] = await scopeComputation.computeExports(document);
        expect(exportedObjects.length).toEqual(2);

        expect(exportedObjects[0].name).toEqual(packageNames[0] + "." + swComponentNames[0]);
        expect(exportedObjects[0].node).toBe(model.packages[0].elements[0]);

        expect(exportedObjects[1].name).toEqual(packageNames[1] + "." + swComponentNames[1]);
        expect(exportedObjects[1].node).toBe(model.packages[1].elements[0]);
    });

});

describe('Not exporting software components because of undefined package name', () => {

    const scopeComputation : ArlangScopeComputation = new ArlangScopeComputation(services);

    const applicationSwComponentType : SwComponentType = "application";

    test('Application SwComponent should not be exported when package name is not defined', async () => {
        const swComponentName = "MyComponent";

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package
                swComponent:${applicationSwComponentType} ${swComponentName} {}
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        expectAnyError(document);

        scopeComputation.computeExports(document).then((exportedObjects) => {
            expect(exportedObjects.length).toEqual(0);
        });
    });

    test('SwComponents inside one package should not be exported when package name is not defined', async () => {
        const swComponentNames = ["SWC1", "sWC5", "HWMonitoring", "ParkingAssist"];

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package
                swComponent:${applicationSwComponentType} ${swComponentNames[0]} { }
                swComponent:${applicationSwComponentType} ${swComponentNames[1]} { }
                swComponent:${applicationSwComponentType} ${swComponentNames[2]} { }
                swComponent:${applicationSwComponentType} ${swComponentNames[3]} { }
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        expectAnyError(document);

        scopeComputation.computeExports(document).then((exportedObjects) => {
            expect(exportedObjects.length).toEqual(0);
        });
    });

    test('Only SwComponents inside package that has defined name should be exported', async () => {
        const packageName = "com.company.sector.product";
        const swComponentNames = ["SoftwareComponent1", "Component15", "H1", "MirrorLights"];

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package
                swComponent:${applicationSwComponentType} ${swComponentNames[0]}
                {
                }
            #end

            #package
                swComponent:${applicationSwComponentType} ${swComponentNames[1]} {}
            #end

            #package ${packageName}
                swComponent:${applicationSwComponentType} ${swComponentNames[2]} {
                }
                swComponent:${applicationSwComponentType} ${swComponentNames[3]} {}
            #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        expectAnyError(document);

        const parseResult : ParseResult<AstNode> = document.parseResult;
        const model : Model = parseResult.value as Model;

        const exportedObjects : AstNodeDescription[] = await scopeComputation.computeExports(document);
        expect(exportedObjects.length).toEqual(2);

        expect(exportedObjects[0].name).toEqual(packageName + "." + swComponentNames[2]);
        expect(exportedObjects[0].node).toBe(model.packages[2].elements[0]);

        expect(exportedObjects[1].name).toEqual(packageName + "." + swComponentNames[3]);
        expect(exportedObjects[1].node).toBe(model.packages[2].elements[1]);
    });

});
