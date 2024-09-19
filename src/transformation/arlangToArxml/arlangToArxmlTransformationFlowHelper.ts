import { isChildNodeElementNode } from "../transformationGeneral.js";

/**
 * Initialize holders to original state.
 * This should be called once per arlang to arxml transformation.
 */
export function initTransformationFlowHelpers() : void {
    errorOccurred = false;

    currentRelativeFilePath = '';
    elementsTracker.clear();
    transformedOriginalArlangModIds.clear();
    clonedChildsDataGlobalHolder = [];
    arxmlObjectsToRemove = [];
}

let errorOccurred = false;

export function setErrorOccurredIndication() : void{
    errorOccurred = true;
}

export function isErrorOccurred() : boolean {
    return errorOccurred;
}

/**
 * Relative file path of arlang file that is being transformed.
 * If arxml with the same relative file path exists, it means that corresponding arxml is being modified,
 * otherwise new arxml should be created.
 */
export let currentRelativeFilePath : string = '';

/**
 * set relative file path of arlang file that is being transformed
 */
export function setCurrentRelativeFilePath(relativeFilePath : string) : void {
    currentRelativeFilePath = relativeFilePath;
}

export const elementsTracker = new Map<Element, boolean>;

export let transformedOriginalArlangModIds = new Map<string, boolean>;

export function setOriginalArlangModIdAsTransformed(arlangModIdValue : string) : void {
    transformedOriginalArlangModIds.get(arlangModIdValue) ?? transformedOriginalArlangModIds.set(arlangModIdValue, true);
}

export type ClonedChildData = {
    "arlangModId" : string,
    "clonedArxmlObject" : Element,
    "transformed" : boolean
}

export let clonedChildsDataGlobalHolder : ClonedChildData[] = [];

export function addClonedChildsDataToGlobalHolder(clonedChildsData : ClonedChildData[]) : void {
    for (const clonedChildData of clonedChildsData) {
        clonedChildsDataGlobalHolder.push(clonedChildData);
    }
}

/**
 * arxml object that should no longer be on their original position should be added here
 */
export let arxmlObjectsToRemove : Element[] = [];

/**
 * Used during modification / copying / new element addition to determine position where arlang object should be placed
 */
export type InsertionData = {
    currentElementsInCollectionCounter : number,
    insertBeforeReference : Element | null // insertBefore function from xml (dom) needs node before it will insert new element.
}

export function createNewInsertionData() : InsertionData {
    return {
        currentElementsInCollectionCounter : 0,
        insertBeforeReference : null
    }
}

/**
 * Update reference that will be used as position in case of modification. Replacement element should be added before that position.
 */
export function updateInsertionData(insertionData : InsertionData, collection : Element, increment : number) : void {
    if (collection!.childNodes.length === 0) {
        return;
    }

    insertionData.currentElementsInCollectionCounter += increment;

    const collectionChildren : Element[] = [];
    for (let i = 0; i < collection!.childNodes.length; i++) {
        if (isChildNodeElementNode(collection!.childNodes[i])) { // nodeType 1 is Element node (not comment, whitespace or something like that)
            collectionChildren.push(collection!.childNodes[i] as Element);
        }
    }

    if (collectionChildren.length > insertionData.currentElementsInCollectionCounter) {
        insertionData.insertBeforeReference = collectionChildren[insertionData.currentElementsInCollectionCounter];
    } else {
        insertionData.insertBeforeReference = null;
    }
}

// TODO test this function
/**
 * Preserves order of ARLANG -> ARXML elements.
 * Exception is if element is copied and modified in previous position in the same file and same package, it will be created in ARXML bellow the copied element,
 * because it is not possible to detect which element is actually original only based on arlangModId.
 * Another exception is if existing element is copied in the same file and package, and original element is deleted, it will have the affect as modification - Copied element will be moved at the original position (original element will be deleted).
 */
export function insertElement(insertionData : InsertionData, collection : Element, transformedElement : Element, collectionAlreadyEncountered? : boolean) : void {
    const insertBeforeReference = insertionData.insertBeforeReference;
    if (insertBeforeReference !== null) {
        // we know where to insert it
        insertBeforeReference.parentNode!.insertBefore(transformedElement, insertBeforeReference);
    } else if (insertionData.currentElementsInCollectionCounter === 0 && !collectionAlreadyEncountered) {
        // insert at the beginning (or at the end if no child node exists)
        collection.insertBefore(transformedElement, collection.childNodes[0] ?? null);
    } else {
        // it should be added at the end
        collection.appendChild(transformedElement);
    }
}
