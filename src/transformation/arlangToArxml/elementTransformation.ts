import { Element as ArlangElement, isInterface as isArlangInterface } from '../../language/generated/ast.js';
import { transformArlangInterface } from './interfaceTransformation.js';
import { transformArlangSwComponent } from './swComponentTransformation.js';
import { elementsTracker, updateInsertionData, insertElement, createNewInsertionData, InsertionData } from './arlangToArxmlTransformationFlowHelper.js';

/**
 * @returns Element (xml) if new xml element is created, otherwise null (arlangElements is empty or arxmlElementsCollection is defined, therefore new ELEMENTS does not need to be created)
 */
export function transformArlangElements(arxml : Document, arlangElements: ArlangElement[], arxmlElementsCollection? : Element) : Element | null {
    if (arlangElements.length === 0) {
        return null;
    }

    const elementsCollection = arxmlElementsCollection ?? arxml.createElement('ELEMENTS');

    const insertionData = createNewInsertionData();

    performArlangElementsTransformation(arxml, arlangElements,
                                        elementsCollection, isElementsCollectionEncountered(elementsCollection),
                                        insertionData);

    return arxmlElementsCollection === undefined ? elementsCollection : null;
}

function performArlangElementsTransformation(arxml : Document, arlangElements : ArlangElement[],
    elementsCollection : Element, isElementsCollectionEncountered : boolean,
    insertionData : InsertionData
    ) : void {

    for (const arlangElement of arlangElements) {
        const transformedElement = transformArlangElement(arxml, arlangElement);
        insertElementIfNeeded(insertionData, elementsCollection, isElementsCollectionEncountered, transformedElement);
    }
}

function insertElementIfNeeded(insertionData : InsertionData, elementsCollection : Element, isElementsCollectionEncountered : boolean, transformedElement : Element | null) : void {
    let referenceIncrement : number;
    if (transformedElement !== null) {
        insertElement(insertionData, elementsCollection, transformedElement, isElementsCollectionEncountered);
        referenceIncrement = 1; // new element is added or element is copied, therefore increase by one
    } else {
        referenceIncrement = 2; // element is modified which means that new element is inserted before the original element, therefore there are 2 same elements, one next to another
    }

    updateInsertionData(insertionData, elementsCollection, referenceIncrement);
}

/**
 * @returns Element (xml) if it should be added to ELEMENTS, otherwise null (null means that element transformation of that type is not yet supported, or element is modified, so it should not be added in this module).
 */
export function transformArlangElement(arxml : Document, element : ArlangElement) : Element | null {
    if (isArlangInterface(element)) {
        return transformArlangInterface(arxml, element);
    } else { // isArlangSwComponent(element)
        return transformArlangSwComponent(arxml, element);
    }
}

function isElementsCollectionEncountered(elementsCollection : Element) : boolean {
    let isElementsCollectionEncountered = elementsTracker.get(elementsCollection);
    if (isElementsCollectionEncountered === undefined) {
        elementsTracker.set(elementsCollection, false);
        isElementsCollectionEncountered = false;
    } else if (isElementsCollectionEncountered === false) {
        elementsTracker.set(elementsCollection, true);
        isElementsCollectionEncountered = true;
    }

    return isElementsCollectionEncountered;
}
