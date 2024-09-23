import { describe, expect, it } from "vitest";
import { transformArlangElements, transformArlangElement } from '../../../../src/transformation/arlangToArxml/elementTransformation.js';
import * as interfaceTransformation from '../../../../src/transformation/arlangToArxml/interfaceTransformation.js';
import * as swComponentTransformation from '../../../../src/transformation/arlangToArxml/swComponentTransformation.js';
import { vi } from 'vitest';
import { DOMParser } from '@xmldom/xmldom';
import { createArlangModel } from '../../../test-helper.js';

const baseArxml =
`<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_4-3-0.xsd">
<AR-PACKAGES>
</AR-PACKAGES>
</AUTOSAR>
`

describe('transformArlangElement', () => {

    it('Should call interface transformation', async () => {
        const doc = new DOMParser().parseFromString(baseArxml, 'text/xml');

        const arlangContent =
`#package A
interface:senderReceiver I {
}
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangInterface = arlangModel.packages[0].elements[0];

        const mockedElement = doc.createElement('MOCKED-ELEMENT');
        vi.spyOn(interfaceTransformation, "transformArlangInterface").mockReturnValue(mockedElement);

        const arxmlElement = transformArlangElement(doc, arlangInterface);
        expect(interfaceTransformation.transformArlangInterface).toHaveBeenCalled();
        expect(arxmlElement).toBe(mockedElement);
    });

    it('Should call software component transformation', async () => {
        const doc = new DOMParser().parseFromString(baseArxml, 'text/xml');

        const arlangContent =
`#package A
swComponent:application MySwc {}
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangSwc = arlangModel.packages[0].elements[0];

        const mockedElement = doc.createElement('MOCKED-ELEMENT');
        vi.spyOn(swComponentTransformation, "transformArlangSwComponent").mockReturnValue(mockedElement);

        const arxmlElement = transformArlangElement(doc, arlangSwc);
        expect(swComponentTransformation.transformArlangSwComponent).toHaveBeenCalled();
        expect(arxmlElement).toBe(mockedElement);
    });

});

describe('transformArlangElements', () => {

    it('Should return null when alang elements are empty', async () => {
        const doc = new DOMParser().parseFromString(baseArxml, 'text/xml');

        const arlangContent =
`#package A
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangElements = arlangModel.packages[0].elements;

        const arxmlElementsCollection = transformArlangElements(doc, arlangElements);
        expect(arxmlElementsCollection).toBeNull();
    });

    it('Should add 3 mocked elements for 3 mocked transformed interfaces', async () => {
        const numberOfInterfaces = 3;

        const doc = new DOMParser().parseFromString(baseArxml, 'text/xml');

        const arlangContent =
`#package A
interface:clientServer A {}
interface:senderReceiver B {}
interface:clientServer C {}
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangElements = arlangModel.packages[0].elements;

        const mockedElements = [doc.createElement('MOCKED-ELEMENT-ONE'),
                                doc.createElement('MOCKED-ELEMENT-TWO'),
                                doc.createElement('MOCKED-ELEMENT-THREE')];
        vi.spyOn(interfaceTransformation, "transformArlangInterface").mockReturnValueOnce(mockedElements[0])
                                                                    .mockReturnValueOnce(mockedElements[1])
                                                                    .mockReturnValueOnce(mockedElements[2]);

        const arxmlElementsCollection = transformArlangElements(doc, arlangElements);

        expect(arxmlElementsCollection).not.toBeNull();

        expect(interfaceTransformation.transformArlangInterface).toBeCalledTimes(numberOfInterfaces);

        expect(arxmlElementsCollection!.tagName).toEqual('ELEMENTS');

        const elementsChildNodes = arxmlElementsCollection!.childNodes;
        expect(elementsChildNodes.length).toEqual(3);

        for (let i = 0; i < numberOfInterfaces; i++) {
            expect(elementsChildNodes[i]).toBe(mockedElements[i]);
        }

    });

    it('Should add 3 mocked elements for 3 mocked transformed software components', async () => {
        const numberOfSwcs = 3;

        const doc = new DOMParser().parseFromString(baseArxml, 'text/xml');

        const arlangContent =
`#package A
swComponent:application swc1 {}
swComponent:application swc2 {}
swComponent:application swc3 {}
#end
`
        const arlangModel = await createArlangModel(arlangContent);
        const arlangElements = arlangModel.packages[0].elements;

        const mockedElements = [doc.createElement('MOCKED-ELEMENT-ONE'),
                                doc.createElement('MOCKED-ELEMENT-TWO'),
                                doc.createElement('MOCKED-ELEMENT-THREE')];
        vi.spyOn(swComponentTransformation, "transformArlangSwComponent").mockReturnValueOnce(mockedElements[0])
                                                                .mockReturnValueOnce(mockedElements[1])
                                                                .mockReturnValueOnce(mockedElements[2]);

        const arxmlElementsCollection = transformArlangElements(doc, arlangElements);

        expect(arxmlElementsCollection).not.toBeNull();

        expect(swComponentTransformation.transformArlangSwComponent).toBeCalledTimes(numberOfSwcs);

        expect(arxmlElementsCollection!.tagName).toEqual('ELEMENTS');

        const elementsChildNodes = arxmlElementsCollection!.childNodes;
        expect(elementsChildNodes.length).toEqual(3);

        for (let i = 0; i < numberOfSwcs; i++) {
            expect(elementsChildNodes[i]).toBe(mockedElements[i]);
        }

    });

});
