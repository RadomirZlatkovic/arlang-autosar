import { describe, expect, test } from "vitest";
import { AstNode, LangiumDocument, EmptyFileSystem, ParseResult } from 'langium';
import { parseDocument } from 'langium/test';
import { createArlangServices } from '../../src/language/arlang-module.js';
import { Model, Package } from '../../src/language/generated/ast.js';
import { expectNoError, expectAnyError } from '../test-helper.js';

const services = createArlangServices(EmptyFileSystem).Arlang;

describe('No package defined in file/model', () => {

    test ('No package should be parsed', async () => {
        const document : LangiumDocument<AstNode> = await parseDocument(services, ` `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        const packages : Package[] = model.packages;
        expect(packages.length).toEqual(0);
    });

});

describe('Parsing one package', () => {
    // one segment
    test ('Package with name of one segment of one letter should be parsed', async() => {
        await performTest('A');
    });

    test ('Package with name of one segment of multiple letters should be parsed', async() => {
        await performTest('NameTest');
    });

    test ('Package with name of one segment of multiple letters and numbers should be parsed', async() => {
        await performTest('NameTest1');
    });

    // multiple segments
    test ('Package with name of multiple segments of one letter should be parsed', async() => {
        await performTest('A.B.C');
    });

    test ('Package with name of multiple segments of multiple letters should be parsed', async() => {
        await performTest('My.Test');
    });

    test ('Package with name of multiple segments of multiple letters and numbers should be parsed', async() => {
        await performTest('test1.test2.test3.test4');
    });

    test ('Package with name of multiple segments mixed of one and multiple letters and numbers should be parsed', async() => {
        await performTest('t.Test.test3');
    });

    async function performTest(packageName : String) {
        const document : LangiumDocument<AstNode> = await parseDocument(services, `
        #package ${packageName}
        #end
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        const packages : Package[] = model.packages;
        expect(packages.length).toEqual(1);

        const arPackage : Package = packages[0];
        expect(arPackage.name).toEqual(packageName);
    }

});

describe('Parsing multiple packages', () => {
    // single segment
    test ('Packages with names of one letter single segment should be parsed', async () => {
        await performTest(['A', 'B']);
    });

    test ('Packages with names of multiple letters single segment should be parsed', async () => {
        await performTest(['first', 'Second', 'lAst']);
    });

    test ('Multiple letters and numbers single segment should be parsed', async () => {
        await performTest(['test1', 'test2', 'test3', 'test4']);
    });

    test ('Multiple mixed (one and multiple letters and numbers) single segment should be parsed', async () => {
        await performTest(['a', 'b65', 'exampleTest', 'another3Example']);
    });

    // multiple segments
    test ('One letter multiple segments should be parsed', async () => {
        await performTest(['A.B.C', 'E.F.G.H']);
    });

    test ('Multiple letters mingle segments should be parsed', async () => {
        await performTest(['first.second.third.fourth', 'beginning.middle.end', 'firstSegment.lastSegment']);
    });

    test ('Multiple letters and numbers multiple segments should be parsed', async () => {
        await performTest(['test1.test2', 'test3.test4.test5', 'test6.test7.test8.test9', 'test10.test11.test12.test13.test14']);
    });

    test ('Multiple mixed (one and multiple letters and numbers) multiple segments should be parsed', async () => {
        await performTest(['a.b65.exampleTest.another3Example', 'test1.Test2.A']);
    });

    async function performTest(packageNames : String[]) {
        expect(packageNames.length).toBeGreaterThan(1);

        const packageDeclarations : string = packageNames
            .map((packageName) => {
                return `
                    #package ${packageName}
                    #end
                `
            })
            .reduce(
                (predviousDeclarations, newDeclaration) => predviousDeclarations + ' ' + newDeclaration
            );
        const document : LangiumDocument<AstNode> = await parseDocument(services, packageDeclarations);

        await services.shared.workspace.DocumentBuilder.build([document]);
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        const model : Model = parseResult.value as Model;

        const packages : Package[] = model.packages;
        expect(packages.length).toEqual(packageNames.length);

        for (let i : number = 0; i < packageNames.length; i++) {
            expect(packages[i].name).toEqual(packageNames[i]);
        }
    }

});

describe('Lexical and syntax errors for package description', () => {

    test ('Error when package is not typed correctly', async () => {
        const document : LangiumDocument<AstNode> = await parseDocument(services,
            `#packkage RandomName
            #end`);
        await services.shared.workspace.DocumentBuilder.build([document]);

        expectAnyError(document);
    });

    test ('Error when # is not used in front of package', async () => {
        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            package RandomName
            #end
        `);
        await services.shared.workspace.DocumentBuilder.build([document]);

        expectAnyError(document);
    });

    test ('Error when end is not typed correctly', async () => {
        const document : LangiumDocument<AstNode> = await parseDocument(services,
            `#packkage RandomName
            #eend`);
        await services.shared.workspace.DocumentBuilder.build([document]);

        expectAnyError(document);
    });

    test ('Error when # is not used in front of end', async () => {
        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package RandomName
            end
        `);
        await services.shared.workspace.DocumentBuilder.build([document]);

        expectAnyError(document);
    });

    test ('Error when package is defined and end is not', async () => {
        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package RandomName
        `);
        await services.shared.workspace.DocumentBuilder.build([document]);

        expectAnyError(document);
    });

    test ('Error when end is defined and package is not', async () => {
        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            RandomName
            #end
        `);
        await services.shared.workspace.DocumentBuilder.build([document]);

        expectAnyError(document);
    });

    test ('Error when package name is not defined', async () => {
        const document : LangiumDocument<AstNode> = await parseDocument(services, `
            #package
            #end
        `);
        await services.shared.workspace.DocumentBuilder.build([document]);

        expectAnyError(document);
    });

});
