import { describe, expect, test } from "vitest";
import { AstNode, LangiumDocument, EmptyFileSystem, ParseResult } from 'langium';
import { parseDocument } from 'langium/test';
import { createArlangServices } from '../../src/language/arlang-module.js';
import { Model, Package, Element, SwComponent, SwComponentType, isSwComponent} from '../../src/language/generated/ast.js';
import { expectNoError, expectAnyError } from '../test-helper.js';

const services = createArlangServices(EmptyFileSystem).Arlang;

describe('No software component defined in file/model', () => {

    test ('No component should be parsed ', async () => {
        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package S
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

describe('Parsing one Application software component', () => {

    const swComponentType : SwComponentType = 'application'

    test ('SwComponent with name of one letter should be parsed', async() => {
        await performTestForOneSwComponent(swComponentType, 'C');
    });

    test ('SwComponent with name of multiple letters should be parsed', async() => {
        await performTestForOneSwComponent(swComponentType, 'MyComponent');
    });

    test ('SwComponent with name of one letter and number should be parsed', async() => {
        await performTestForOneSwComponent(swComponentType, 'K1');
    });

    test ('SwComponent with name of multiple letters and numbers should be parsed', async() => {
        await performTestForOneSwComponent(swComponentType, 'Number108');
    });

});

async function performTestForOneSwComponent(swComponentType : SwComponentType, swComponentName : String) {
    const document : LangiumDocument<AstNode> = await parseDocument(services, `
    #package A
        swComponent:${swComponentType} ${swComponentName} {}
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
    expect(isSwComponent(element)).toBeTruthy();

    const swComponent : SwComponent = element as SwComponent;
    expect(swComponent.type).toEqual(swComponentType);
    expect(swComponent.name).toEqual(swComponentName);
    expect(swComponent.arlangModId).toBeUndefined();
}

describe('Parsing multiple Application software components in different packages', () => {

    const swComponentType : SwComponentType = 'application';

    test ('SwComponents with names of one letter should be parsed', async () => {
        await performTest(swComponentType, ['M', 'n']);
    });

    test ('SwComponents with names of multiple letters should be parsed', async () => {
        await performTest(swComponentType, ['temperature', 'speEd', 'Pressure']);
    });

    test ('SwComponents with names of multiple letters and numbers should be parsed', async () => {
        await performTest(swComponentType, ['wheel1', 'Mirror2', 'sEET3', 'screen4']);
    });

    test ('SwComponents with names of multiple mixed letters and numbers should be parsed', async () => {
        await performTest(swComponentType, ['v', 'z18', 'ComponentName', 'proxy1Internal']);
    });

});

async function performTest(swComponentType : SwComponentType, swComponentNames : String[]) {
    expect(swComponentNames.length).toBeGreaterThan(1);

    const swComponentDeclaration : string = swComponentNames
        .map((swComponentName) => {
            return `
                #package A
                    swComponent:${swComponentType} ${swComponentName} {
                    }
                #end
            `
        })
        .reduce(
            (predviousDeclarations, newDeclaration) => predviousDeclarations + ' ' + newDeclaration
        );
    const document : LangiumDocument<AstNode> = await parseDocument(services, swComponentDeclaration);

    await services.shared.workspace.DocumentBuilder.build([document]);
    const parseResult : ParseResult<AstNode> = document.parseResult;
    expectNoError(parseResult);

    const model : Model = parseResult.value as Model;

    const packages : Package[] = model.packages;
    expect(packages.length).toEqual(swComponentNames.length);

    for (let i : number = 0; i < packages.length; i++) {
        const elements : Element[] = packages[i].elements;
        expect(elements.length).toEqual(1);

        const element : Element = elements[0];
        expect(isSwComponent(element)).toBeTruthy();

        const swComponent : SwComponent = element as SwComponent;
        expect(swComponent.type).toEqual(swComponentType);
        expect(swComponent.name).toEqual(swComponentNames[i]);
        expect(swComponent.arlangModId).toBeUndefined();
    }
}

describe('Parsing multiple Application software components in the same package', () => {

    const applicationSwComponentType : SwComponentType = 'application';

    test ('SwComponents in the same package should be passed', async () => {
        const swComponentNames = ['MySwComponent0', 'MyComponent1', 'MyComponent2', 'MyComponent3'];

        const swComponentDeclarations : string = `
            #package T
                swComponent:${applicationSwComponentType} ${swComponentNames[0]} {
                }

                swComponent:${applicationSwComponentType} ${swComponentNames[1]} {
                }
            #end
        `
        const document : LangiumDocument<AstNode> = await parseDocument(services, swComponentDeclarations);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        const packages : Package[] = model.packages;
        expect(packages.length).toEqual(1);

        const elements : Element[] = packages[0].elements;
        expect(elements.length).toEqual(2);

        for (let i = 0; i < 2; i++) {
            expect(isSwComponent(elements[i])).toBeTruthy();
        }

        let swComponent : SwComponent = elements[0] as SwComponent;
        expect(swComponent.type).toEqual(applicationSwComponentType);
        expect(swComponent.name).toEqual(swComponentNames[0]);

        swComponent = elements[1] as SwComponent;
        expect(swComponent.type).toEqual(applicationSwComponentType);
        expect(swComponent.name).toEqual(swComponentNames[1]);
        expect(swComponent.arlangModId).toBeUndefined();
    });

});

describe('Parsing software components fields', () => {

    const applicationSwComponentType : SwComponentType = 'application';

    test('ArlangModId should be parsed correctly in application software component', async () => {
        const swComponentName = 'MySWC';
        const arlangModId = "lkjhgfdsa123498765";

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
        #package A
            swComponent:${applicationSwComponentType} ${swComponentName} {
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
        expect(isSwComponent(elements[0])).toBeTruthy();

        const element : Element = elements[0];
        const arSwc : SwComponent = element as SwComponent;
        expect(arSwc.arlangModId).toBeDefined();
        expect(arSwc.arlangModId!.id).toEqual(arlangModId);
    });

    test('Software component fields should be parsed correctly in multiple software components', async () => {
        const swComponentNames = ['MySWC1', 'MySWC2'];
        const arlangModIds = ['lkjhgfdsa123498765', 'dfghj45678'];

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
        #package A
            swComponent:${applicationSwComponentType} ${swComponentNames[0]} {
                arlangModId : "${arlangModIds[0]}"
            }
            swComponent:${applicationSwComponentType} ${swComponentNames[1]} {
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
            expect(isSwComponent(element)).toBeTruthy();
        }

        let element : Element = elements[0];
        let arSwc : SwComponent = element as SwComponent;
        expect(arSwc.arlangModId).toBeDefined();
        expect(arSwc.arlangModId!.id).toEqual(arlangModIds[0]);

        element = elements[1];
        arSwc = element as SwComponent;
        expect(arSwc.arlangModId).toBeDefined();
        expect(arSwc.arlangModId!.id).toEqual(arlangModIds[1]);
    });

});

describe('Lexical and syntax errors for SwComponent description', () => {

    test ('Error when swComponent is not typed correctly', async () => {
        const swComponentType : SwComponentType = 'application';

        const document : LangiumDocument<AstNode> = await parseDocument(services,
            `#package packageName
                swwComponent:${swComponentType} ComplexComponent {
                }
            #end`);
        await services.shared.workspace.DocumentBuilder.build([document]);

        expectAnyError(document);
    });

    test ('Error when SwComponent type is not typed correctly', async () => {
        const document : LangiumDocument<AstNode> = await parseDocument(services,
            `#package packageName
                swComponent:UndefinedType ComplexComponent {
                }
            #end`);
        await services.shared.workspace.DocumentBuilder.build([document]);

        expectAnyError(document);
    });

    test ('Error when SwComponent type is not defined', async () => {
        const document : LangiumDocument<AstNode> = await parseDocument(services,
            `#package packageName
                swComponent ComplexComponent {
                }
            #end`);
        await services.shared.workspace.DocumentBuilder.build([document]);

        expectAnyError(document);
    });

    test ('Error when SwComponent name is not defined', async () => {
        const swComponentType : SwComponentType = 'application';

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package myPackage
                swComponent:${swComponentType} {}
            #end
        `);
        await services.shared.workspace.DocumentBuilder.build([document]);

        expectAnyError(document);
    });

    test ('Error when opening curly bracket is not defined', async () => {
        const swComponentType : SwComponentType = 'application';

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package myPackage
                swComponent:${swComponentType} MySwc }
            #end
        `);
        await services.shared.workspace.DocumentBuilder.build([document]);

        expectAnyError(document);
    });

    test ('Error when closing curly bracket is not defined', async () => {
        const swComponentType : SwComponentType = 'application';

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package myPackage
                swComponent:${swComponentType} MySwc {
            #end
        `);
        await services.shared.workspace.DocumentBuilder.build([document]);

        expectAnyError(document);
    });

    test ('Error when no curly bracket is defined', async () => {
        const swComponentType : SwComponentType = 'application';

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package myPackage
                swComponent:${swComponentType} MySwc
            #end
        `);
        await services.shared.workspace.DocumentBuilder.build([document]);

        expectAnyError(document);
    });

    test ('Error when arlangModId is not typed correctly', async () => {
        const swComponentType : SwComponentType = 'application';

        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package myPackage
            swComponent:${swComponentType} MySwc {
                arlangModIid : "uuid1"
            }
            #end
        `);
        await services.shared.workspace.DocumentBuilder.build([document]);

        expectAnyError(document);
    });

});
