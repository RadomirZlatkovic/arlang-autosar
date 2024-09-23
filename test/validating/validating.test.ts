import { describe, expect, test } from "vitest";
import { AstNode, LangiumDocument, EmptyFileSystem, ParseResult } from 'langium';
import { parseDocument } from 'langium/test';
import { createArlangServices } from '../../src/language/arlang-module.js';
import { expectNoError } from '../test-helper.js';

const services = createArlangServices(EmptyFileSystem).Arlang;

describe('SwComponent validation', () => {

    test('Error should be reported for same port names inside SwComponent', async () => {
        const document : LangiumDocument<AstNode> = await parseDocument(services, `
#package p
    interface:senderReceiver MyInterface {}

    swComponent:application MySwc {
        port:provided PPort1 implements MyInterface {}
        port:required PPort1 implements MyInterface {}
        port:provided PPort2 implements MyInterface {}
        port:provided RPort2 implements MyInterface {}
    }
#end
        `);

        await services.shared.workspace.DocumentBuilder.build([document], { validation: true });
        const parseResult : ParseResult<AstNode> = document.parseResult;
        expectNoError(parseResult);

        expect(document.diagnostics ?? []).toHaveLength(1);
        expect(document.diagnostics).toEqual(expect.arrayContaining([
            expect.objectContaining({
                message: expect.stringMatching('Duplication port name "PPort1" inside SwComponent "MySwc"'),
                range: expect.objectContaining({start:expect.objectContaining({
                    // zero based indexes
                    line: 6,
                    character: 22
                })})
            })
        ]));
    });

});
