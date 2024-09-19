import { ArlangModificationId, Port as ArlangPort, PortType as ArlangPortType, Interface as ArlangInterface } from '../../language/generated/ast.js';
import { getArxmlObject, getContainerFQNFromMetadata, getRelativeFilePathWithoutExtension } from '../metadataToArxml/metadataToArxmlTransformation.js';
import { isChildNodeElementNode } from '../transformationGeneral.js';
import { showNoArlangModIdFoundError } from '../vscodeHelperFunctions.js';
import { getArxmlReferencePath, createShortNameElement, getArxmlTagNameFromArlangInterfaceType, cloneElement, checkSameContainerFQNAndRelativeFilePath, getArxmlInterfaceTrefTagNameFromArlangPortType, getArxmlTagNameFromArlangPortType, getElementAfterShortName } from './arlangToArxmlGeneral.js';
import { InsertionData, arxmlObjectsToRemove, createNewInsertionData, currentRelativeFilePath, insertElement, updateInsertionData } from './arlangToArxmlTransformationFlowHelper.js';

/**
 * @returns Element (xml) if new xml element is created or copied,
 * otherwise null (existing arxml element corresponding to arlangPorts is found at the exact location, therefore arxml ports is modified, or no port is found to be transformed)
 */
export function transformArlangPorts(arxml : Document, arlangPorts : ArlangPort[], arxmlPortsCollection : Element | undefined,
    arlangModIdToClonedArxmlObjects ?: {"arlangModId" : string, "clonedArxmlObject" : Element, "transformed" : boolean}[]) : Element | null {

    if (arlangPorts.length === 0) {
        return null;
    }

    const portsCollection = arxmlPortsCollection ?? arxml.createElement('PORTS');

    const insertionData = createNewInsertionData();

    performArlangPortsTransformation(arxml, arlangPorts, portsCollection, insertionData, arlangModIdToClonedArxmlObjects);

    return arxmlPortsCollection === undefined ? portsCollection : null;
}

function performArlangPortsTransformation(arxml : Document, arlangPorts : ArlangPort[], portsCollection : Element, insertionData : InsertionData,
    arlangModIdToClonedArxmlObjects ?: {"arlangModId" : string, "clonedArxmlObject" : Element, "transformed" : boolean}[]) : void {

    for (const arlangPort of arlangPorts) {
        let transformedPort : Element | null = null;

        const arlangModId = arlangPort.arlangModId;
        if (arlangModId === undefined) {
            transformedPort = createArlangPort(arxml, arlangPort);
        } else {
            transformedPort = copyOrModifyArxmlPort(arxml, arlangPort, arlangModId, arlangModIdToClonedArxmlObjects!);
        }

        insertPortIfNeeded(insertionData, portsCollection, transformedPort);
    }
}

function insertPortIfNeeded(insertionData : InsertionData, portsCollection: Element, transformedPort : Element | null) : void {
    let referenceIncrement : number;
    if (transformedPort !== null) {
        insertElement(insertionData, portsCollection, transformedPort);
        referenceIncrement = 1; // new element is added or element is copied, therefore increase by one
    } else {
        referenceIncrement = 2; // element is modified which means that new element is inserted before the original element, therefore there are 2 same elements, one next to another
    }

    updateInsertionData(insertionData, portsCollection, referenceIncrement);
}

export function createArlangPort(arxml: Document, arlangPort: ArlangPort) : Element | null {
    const arlangInterface = arlangPort.interfaceRef.ref!;
    const arlangPortType = arlangPort.type

    const arxmlPort = arxml.createElement(getArxmlTagNameFromArlangPortType(arlangPortType));
    arxmlPort.appendChild(createShortNameElement(arxml, arlangPort.name));

    const interfaceRefElement = createInterfaceTref(arxml, arlangPortType, arlangInterface);
    arxmlPort.appendChild(interfaceRefElement);

    return arxmlPort;
}

function createInterfaceTref(arxml: Document, arlangPortType : ArlangPortType, arlangInterface : ArlangInterface) : Element{
    const interfaceTRefElement = arxml.createElement(getArxmlInterfaceTrefTagNameFromArlangPortType(arlangPortType));
    interfaceTRefElement.setAttribute('DEST', getArxmlTagNameFromArlangInterfaceType(arlangInterface.type));

    const interfaceRefElementValue = arxml.createTextNode(getArxmlReferencePath([arlangInterface.name], arlangInterface.$container));
    interfaceTRefElement.appendChild(interfaceRefElementValue);

    return interfaceTRefElement;
}

// TODO test this function?
/**
 * @returns Element (xml) if element is copied,
 * otherwise null (existing arxml element corresponding to arlangPort is found at the exact location, therefore arxml port is modified)
 */
export function copyOrModifyArxmlPort(arxml : Document, arlangPort : ArlangPort, arlangModId : ArlangModificationId,
    arlangModIdToClonedArxmlObjects ?: {"arlangModId" : string, "clonedArxmlObject" : Element, "transformed" : boolean}[]) : Element | null {

    const arlangModIdValue = arlangModId.id;

    const arxmlContainerFQN = getContainerFQNFromMetadata(arlangModIdValue);
    if (arxmlContainerFQN === undefined) {
        showNoArlangModIdFoundError(arlangModIdValue);
        return null;
    }

    if (checkSameContainerFQNAndRelativeFilePath(getContainerFQN(arlangPort), currentRelativeFilePath,
        arxmlContainerFQN, getRelativeFilePathWithoutExtension(arlangModIdValue)) === true) {

        const arlangModIdToClonedArxmlObject = arlangModIdToClonedArxmlObjects?.find(iterator => iterator.arlangModId === arlangModIdValue);
        const arxmlObject = arlangModIdToClonedArxmlObject?.clonedArxmlObject;
        if (arxmlObject === undefined) {
            showNoArlangModIdFoundError(arlangModIdValue);
            return null;
        }

        // if arxmlObject is not added in arxmlObjectsToRemove list, element needs to be modified (it needs to be added before original arxml element, and original arxml element needs to be marked to be removed)
        if (arxmlObjectsToRemove.find(arxmlObjectToRemove => arxmlObjectToRemove === arxmlObject) === undefined) {

            const transformedPort = cloneElement(arxml, arxmlObject, getArxmlTagNameFromArlangPortType(arlangPort.type));
            modifyArxmlPort(arxml, transformedPort, arlangPort);

            // TODO - future optimization - if element is actually the same (same children attributes etc), do not insert and push to remove
            arxmlObject.parentNode!.insertBefore(transformedPort, arxmlObject);
            arxmlObjectsToRemove.push(arxmlObject);

            arlangModIdToClonedArxmlObject!.transformed = true;

            return null;
        }
    }

    const arxmlObject = getArxmlObject(arlangModIdValue);
    if (arxmlObject === undefined) {
        showNoArlangModIdFoundError(arlangModIdValue);
        return null;
    }

    const transformedPort = cloneElement(arxml, arxmlObject, getArxmlTagNameFromArlangPortType(arlangPort.type));
    modifyArxmlPort(arxml, transformedPort, arlangPort);

    return transformedPort;
}

function getContainerFQN(arlangPort : ArlangPort) : string {
    const swc = arlangPort.$container;
    const swcPackage = swc.$container;

    return swcPackage.name + '.' + swc.name;
}

// TODO test this function
export function modifyArxmlPort(arxml : Document, arxmlObject : Element, arlangPort : ArlangPort) : void {
    const arxmlPortChilds = arxmlObject.childNodes;

    let shortNameElement : Element | undefined;
    let foundPortInterfaceTref = false;

    let increment : number = 1;
    for (let i = 0; i < arxmlPortChilds.length; i += increment) {
        if (!isChildNodeElementNode(arxmlPortChilds[i]))
            continue;

        const arxmlPortChild = arxmlPortChilds[i] as Element;

        if (arxmlPortChild.tagName === 'PROVIDED-INTERFACE-TREF' || arxmlPortChild.tagName === 'REQUIRED-INTERFACE-TREF') {
            modifyInterfaceTref(arxml, arxmlPortChild, arlangPort);

            increment = 2;

            foundPortInterfaceTref = true;
        } else {
            increment = 1;

            if (arxmlPortChild.tagName === 'SHORT-NAME') {
                shortNameElement = arxmlPortChild;
                modifyShortName(arxml, shortNameElement, arlangPort.name);
            }
        }
    }

    if (shortNameElement === undefined) {
        addNewShortNameElement(arxml, arxmlObject, arlangPort.name);
    }

    if (!foundPortInterfaceTref) {
        addNewInterfaceTrefElement(arxml, arxmlObject, arlangPort);
    }
}

function modifyInterfaceTref(arxml : Document, arxmlPortChild : Element, arlangPort : ArlangPort) {
    const portInterfaceTrefTagName = getArxmlInterfaceTrefTagNameFromArlangPortType(arlangPort.type);

    const clonedInterfaceTref = cloneElement(arxml, arxmlPortChild, portInterfaceTrefTagName);

    const arlangInterface = arlangPort.interfaceRef.ref!
    // TODO getArxmlReferencePath should be renamed to createArxmlReferencePath
    const arxmlReferencePath = getArxmlReferencePath([arlangInterface.name], arlangInterface.$container)
    if (clonedInterfaceTref.childNodes.length > 0) {
        clonedInterfaceTref.childNodes[0].textContent = arxmlReferencePath;
    } else {
        clonedInterfaceTref.appendChild(arxml.createTextNode(arxmlReferencePath));
    }

    const attributes = clonedInterfaceTref.attributes;
    for (let i = 0; i < attributes.length; i++) {
        if (attributes[i].name === 'DEST') {
            attributes[i].value = getArxmlTagNameFromArlangInterfaceType(arlangInterface.type);
        }
    }

    arxmlPortChild.parentNode!.insertBefore(clonedInterfaceTref, arxmlPortChild);
    arxmlObjectsToRemove.push(arxmlPortChild);
}

// TODO MOVE TO arlangToArxmlGeneral.ts and use this function in other modifications
function modifyShortName(arxml : Document, shortNameElement : Element, newShortName : string) {
    // TODO HANDLE THIS CASE ? IS THIS VALID ARXML?
    if (shortNameElement.childNodes.length > 0) {
        shortNameElement.childNodes[0].textContent = newShortName;
    } else {
        shortNameElement.appendChild(arxml.createTextNode(newShortName));
    }
}

// TODO MOVE TO arlangToArxmlGeneral.ts and use this function in other modifications
function addNewShortNameElement(arxml : Document, arxmlObject : Element, shortNameValue : string) {
    const shortNameElement = createShortNameElement(arxml, shortNameValue);

    const arxmlChilds = arxmlObject.childNodes;
    if (arxmlChilds.length === 0) {
        arxmlObject.appendChild(shortNameElement);
    } else {
        arxmlObject.insertBefore(shortNameElement, arxmlChilds[0]);
    }
}

function addNewInterfaceTrefElement(arxml : Document, arxmlObject : Element, arlangPort : ArlangPort) {
    const interfaceTref = createInterfaceTref(arxml, arlangPort.type, arlangPort.interfaceRef.ref!);
    const elementAfterShortName = getElementAfterShortName(arxmlObject);

    if (elementAfterShortName === null) {
        arxmlObject.appendChild(interfaceTref);
    } else {
        arxmlObject.insertBefore(interfaceTref, elementAfterShortName);
    }
}
