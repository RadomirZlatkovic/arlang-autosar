import { describe, expect, test, it } from "vitest";
import { initTransformationFlowHelpers, currentRelativeFilePath, elementsTracker, transformedOriginalArlangModIds, arxmlObjectsToRemove,
    setCurrentRelativeFilePath,
    createNewInsertionData, updateInsertionData,
    setErrorOccurredIndication,
    isErrorOccurred,
    setOriginalArlangModIdAsTransformed,
    ClonedChildData,
    addClonedChildsDataToGlobalHolder,
    clonedChildsDataGlobalHolder} from '../../../../src/transformation/arlangToArxml/arlangToArxmlTransformationFlowHelper.js';
import { DOMParser } from '@xmldom/xmldom';
import path from 'path';

describe('Error indication', () => {

    test('Error indication should be set and init should reset error indication', () => {
        setErrorOccurredIndication();
        expect(isErrorOccurred()).toEqual(true);

        initTransformationFlowHelpers();
        expect(isErrorOccurred()).toEqual(false);

        setErrorOccurredIndication();
        expect(isErrorOccurred()).toEqual(true);
    });

});

describe('currentRelativeFilePath and init', () => {

    it('Should be set to given value and reset after init', () => {
        const relativeFilePathToSet = `relative${path.sep}path${path.sep}example`;
        setCurrentRelativeFilePath(relativeFilePathToSet);
        expect(currentRelativeFilePath).toEqual(relativeFilePathToSet);

        initTransformationFlowHelpers();
        expect(currentRelativeFilePath).toEqual('');
    });

});

describe('transformedOriginalArlangModIds and init', () => {

    it('Should add unique arlangModId and clear collection after init', () => {
        const arlangModId1 = 'arlangModId@0';
        const sameArlangModId1 = 'arlangModId@0';
        const arlangModId2 = 'arlangModId@1'

        setOriginalArlangModIdAsTransformed(arlangModId1);
        setOriginalArlangModIdAsTransformed(arlangModId2);
        setOriginalArlangModIdAsTransformed(sameArlangModId1);

        expect(transformedOriginalArlangModIds.size).toEqual(2);
        expect(transformedOriginalArlangModIds.get(arlangModId1)).toEqual(true);
        expect(transformedOriginalArlangModIds.get(arlangModId2)).toEqual(true);

        initTransformationFlowHelpers();
        expect(transformedOriginalArlangModIds.size).toEqual(0);

        setOriginalArlangModIdAsTransformed(arlangModId1);
        setOriginalArlangModIdAsTransformed(arlangModId2);
        setOriginalArlangModIdAsTransformed(sameArlangModId1);

        expect(transformedOriginalArlangModIds.size).toEqual(2);
        expect(transformedOriginalArlangModIds.get(arlangModId1)).toEqual(true);
        expect(transformedOriginalArlangModIds.get(arlangModId2)).toEqual(true);
    });

});

describe('clonedChildsDataGlobalHolder and init', () => {

    it('Should add cloned childs data to global holder and clear collection after init', () => {
        const arxmlContent =
`<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_4-3-0.xsd">
<AR-PACKAGES>
    <AR-PACKAGE>
        <SHORT-NAME>p</SHORT-NAME>
        <ELEMENTS>
            <SENDER-RECEIVER-INTERFACE>
                <SHORT-NAME>ExampleElement1</SHORT-NAME>
            </SENDER-RECEIVER-INTERFACE>
            <SENDER-RECEIVER-INTERFACE>
                <SHORT-NAME>ExampleElement2</SHORT-NAME>
            </SENDER-RECEIVER-INTERFACE>
            <SENDER-RECEIVER-INTERFACE>
                <SHORT-NAME>ExampleElement3</SHORT-NAME>
            </SENDER-RECEIVER-INTERFACE>
        </ELEMENTS>
    </AR-PACKAGE>
</AR-PACKAGES>
</AUTOSAR>
`;

        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const exampleElement1 = arxml.getElementsByTagName('SENDER-RECEIVER-INTERFACE')[0];
        const exampleElement2 = arxml.getElementsByTagName('SENDER-RECEIVER-INTERFACE')[1];
        const exampleElement3 = arxml.getElementsByTagName('SENDER-RECEIVER-INTERFACE')[2];

        const exampleData : ClonedChildData[] = [
            {"arlangModId" : 'arlangModId0', "clonedArxmlObject" : exampleElement1, "transformed" : false},
            {"arlangModId" : 'arlangModId1', "clonedArxmlObject" : exampleElement2, "transformed" : true},
            {"arlangModId" : 'arlangModId2', "clonedArxmlObject" : exampleElement3, "transformed" : false}
        ]

        addClonedChildsDataToGlobalHolder(exampleData);
        expect(clonedChildsDataGlobalHolder.length).toEqual(3);
        for (let i = 0; i < 3; i++) {
            expect(clonedChildsDataGlobalHolder[i]).toBe(exampleData[i]);
        }

        initTransformationFlowHelpers();
        expect(clonedChildsDataGlobalHolder.length).toEqual(0);

        addClonedChildsDataToGlobalHolder(exampleData);
        expect(clonedChildsDataGlobalHolder.length).toEqual(3);
        for (let i = 0; i < 3; i++) {
            expect(clonedChildsDataGlobalHolder[i]).toBe(exampleData[i]);
        }
    });

});

describe('InsertionData', () => {

    test('Element should be inserted at the correct position', () => {
        const arxmlContent =
`<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_4-3-0.xsd">
<AR-PACKAGES>
    <AR-PACKAGE>
        <SHORT-NAME>p</SHORT-NAME>
        <ELEMENTS>
            <SENDER-RECEIVER-INTERFACE>
                <SHORT-NAME>InterfaceSR</SHORT-NAME>
            </SENDER-RECEIVER-INTERFACE>
            <SENDER-RECEIVER-INTERFACE>
                <SHORT-NAME>InterfaceSR1</SHORT-NAME>
            </SENDER-RECEIVER-INTERFACE>
            <SENDER-RECEIVER-INTERFACE>
                <SHORT-NAME>InterfaceSR2</SHORT-NAME>
            </SENDER-RECEIVER-INTERFACE>
            <SENDER-RECEIVER-INTERFACE>
                <SHORT-NAME>InterfaceSR3</SHORT-NAME>
            </SENDER-RECEIVER-INTERFACE>
        </ELEMENTS>
    </AR-PACKAGE>
</AR-PACKAGES>
</AUTOSAR>
`;

        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const elementsCollection = arxml.getElementsByTagName('ELEMENTS')[0];

        let insertionData = createNewInsertionData();
        expect(insertionData.currentElementsInCollectionCounter).toEqual(0);
        expect(insertionData.insertBeforeReference).toBeNull();

        updateInsertionData(insertionData, elementsCollection, 1);
        expect(insertionData.insertBeforeReference).toEqual(arxml.getElementsByTagName('SENDER-RECEIVER-INTERFACE')[1]);

        insertionData = createNewInsertionData();
        expect(insertionData.currentElementsInCollectionCounter).toEqual(0);
        expect(insertionData.insertBeforeReference).toBeNull();

        updateInsertionData(insertionData, elementsCollection, 1);
        updateInsertionData(insertionData, elementsCollection, 1);
        expect(insertionData.insertBeforeReference).toEqual(arxml.getElementsByTagName('SENDER-RECEIVER-INTERFACE')[2]);
    });

});

describe('elementsTracker and init', () => {

    it ('Should be reset after init', () => {
        const arxmlContent =
`<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_4-3-0.xsd">
<AR-PACKAGES>
    <AR-PACKAGE>
        <SHORT-NAME>p</SHORT-NAME>
        <ELEMENTS>
        </ELEMENTS>
    </AR-PACKAGE>
</AR-PACKAGES>
</AUTOSAR>
`;

        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const arxmlElements = arxml.getElementsByTagName('ELEMENTS')[0];

        initTransformationFlowHelpers();

        elementsTracker.set(arxmlElements, false);

        initTransformationFlowHelpers();
        expect(elementsTracker.size).toEqual(0);
    });

});

describe('transformedOriginalArlangModIds and init', () => {

    it ('Should be reset after init', () => {
        initTransformationFlowHelpers();

        transformedOriginalArlangModIds.set('arlangModId@0', true);

        initTransformationFlowHelpers();
        expect(transformedOriginalArlangModIds.size).toEqual(0);
    });

});

describe('arxmlObjectsToRemove and init', () => {

    it ('Should be reset after init', () => {
        const arxmlContent =
`<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://autosar.org/schema/r4.0 AUTOSAR_4-3-0.xsd">
<AR-PACKAGES>
    <AR-PACKAGE>
        <SHORT-NAME>p</SHORT-NAME>
        <ELEMENTS>
            <SENDER-RECEIVER-INTERFACE>
                <SHORT-NAME>InterfaceSR</SHORT-NAME>
            </SENDER-RECEIVER-INTERFACE>
        </ELEMENTS>
    </AR-PACKAGE>
</AR-PACKAGES>
</AUTOSAR>
`;

        const arxml = new DOMParser().parseFromString(arxmlContent, 'text/xml');
        const arxmlObject = arxml.getElementsByTagName('SENDER-RECEIVER-INTERFACE')[0];

        initTransformationFlowHelpers();

        arxmlObjectsToRemove.push(arxmlObject);

        initTransformationFlowHelpers();
        expect(arxmlObjectsToRemove.length).toEqual(0);
    });

});
