import { SwComponent as ArlangSwComponent } from '../../language/generated/ast.js';
import { transformArlangPorts } from './portTransformation.js';
import { createShortNameElement, cloneElement, checkSameContainerFQNAndRelativeFilePath } from './arlangToArxmlGeneral.js';
import { getArxmlObject, getContainerFQNFromMetadata, getRelativeFilePathWithoutExtension } from '../metadataToArxml/metadataToArxmlTransformation.js';
import { currentRelativeFilePath, arxmlObjectsToRemove, setOriginalArlangModIdAsTransformed, addClonedChildsDataToGlobalHolder, ClonedChildData } from './arlangToArxmlTransformationFlowHelper.js';
import { showNoArlangModIdFoundError } from '../vscodeHelperFunctions.js';
import { isChildNodeElementNode } from '../transformationGeneral.js';

/**
 * @returns Element (xml) if new xml element is created or copied,
 * otherwise null (existing arxml element corresponding to arlangSwComponent is found at the exact location, therefore arxml swc is modified)
 */
export function transformArlangSwComponent(arxml: Document, arlangSwComponent : ArlangSwComponent) : Element | null {
    const arlangModId = arlangSwComponent.arlangModId;
    if (arlangModId === undefined) {
        return createArxmlSwComponent(arxml, arlangSwComponent);
    } else {
        return copyOrModifyArxmlSwComponent(arxml, arlangSwComponent, arlangModId.id);
    }
}

/**
 * Creates ARXML software component corresponding to ArlangSwComponent
 * @param arxml used only to create software component, newly created software component is not added to arxml
 * @returns created arxml software component
 */
export function createArxmlSwComponent(arxml: Document, arlangSwComponent : ArlangSwComponent) : Element {
    const swComponent = arxml.createElement('APPLICATION-SW-COMPONENT-TYPE');
    swComponent.appendChild(createShortNameElement(arxml, arlangSwComponent.name));

    // create ports collection
    const arxmlPortsCollection = transformArlangPorts(arxml, arlangSwComponent.ports, undefined);
    if (arxmlPortsCollection !== null) {
        swComponent.appendChild(arxmlPortsCollection);
    }

    return swComponent;
}

/**
 * @returns Element (xml) if element is copied,
 * otherwise null (existing arxml element corresponding to arlangSwComponent is found at the exact location, therefore arxml swc is modified)
 */
export function copyOrModifyArxmlSwComponent(arxml : Document, arlangSwComponent : ArlangSwComponent, arlangModIdValue : string) : Element | null {
    const arxmlObject = getArxmlObject(arlangModIdValue);
    if (arxmlObject === undefined) {
        showNoArlangModIdFoundError(arlangModIdValue);
        return null;
    }

    const arxmlSwComponentPackage = getContainerFQNFromMetadata(arlangModIdValue);
    if (arxmlSwComponentPackage === undefined) {
        showNoArlangModIdFoundError(arlangModIdValue);
        return null;
    }

    const clonedChildsData : ClonedChildData[] = [];
    const clonedElement = cloneElement(arxml, arxmlObject, 'APPLICATION-SW-COMPONENT-TYPE', clonedChildsData);
    addClonedChildsDataToGlobalHolder(clonedChildsData);
    modifyArxmlSwComponent(arxml, clonedElement, arlangSwComponent, clonedChildsData);

    if (checkSameContainerFQNAndRelativeFilePath(arlangSwComponent.$container.name, currentRelativeFilePath,
                                arxmlSwComponentPackage, getRelativeFilePathWithoutExtension(arlangModIdValue)) === true) {

        // if arxmlObject is not added in arxmlObjectsToRemove list, element needs to be modified (it needs to be added before original arxml element, and original arxml element needs to be marked to be removed)
        if (arxmlObjectsToRemove.find(arxmlObjectToRemove => arxmlObjectToRemove === arxmlObject) === undefined) {

            // TODO - future optimization - if element is actually the same (same children attributes etc), do not insert and push to remove
            arxmlObject.parentNode!.insertBefore(clonedElement, arxmlObject);
            arxmlObjectsToRemove.push(arxmlObject);

            setOriginalArlangModIdAsTransformed(arlangModIdValue);

            return null;
        }

    }

    return clonedElement;
}

export function modifyArxmlSwComponent(arxml : Document, arxmlObject : Element, arlangSwComponent : ArlangSwComponent,
        arlangModIdToClonedArxmlObjects : {"arlangModId" : string, "clonedArxmlObject" : Element, "transformed" : boolean}[]) : void {

    const arxmlSwComponentChilds = arxmlObject.childNodes;

    let foundShortName = false;
    let foundPorts = false;

    for (let i = 0; i < arxmlSwComponentChilds.length; i++) {
        if (!isChildNodeElementNode(arxmlSwComponentChilds[i])) {
            continue;
        }

        const arxmlSwComponentChild = arxmlSwComponentChilds[i] as Element;

        if (arxmlSwComponentChild.tagName === 'SHORT-NAME') {
            foundShortName = true;

            // TODO HANDLE THIS CASE ? IS THIS VALID ARXML?
            if (arxmlSwComponentChild.childNodes.length > 0) {
                arxmlSwComponentChild.childNodes[0].textContent = arlangSwComponent.name;
            } else {
                arxmlSwComponentChild.appendChild(arxml.createTextNode(arlangSwComponent.name));
            }
        } else if (arxmlSwComponentChild.tagName === 'PORTS') {
            foundPorts = true;

            transformArlangPorts(arxml, arlangSwComponent.ports, arxmlSwComponentChild, arlangModIdToClonedArxmlObjects);
        }
    }

    if (!foundShortName) {
        const shortNameElement = createShortNameElement(arxml, arlangSwComponent.name);

        if (arxmlSwComponentChilds.length === 0) {
            arxmlObject.appendChild(shortNameElement);
        } else {
            arxmlObject.insertBefore(shortNameElement, arxmlSwComponentChilds[0]);
        }
    }

    if (!foundPorts) {
        const arxmlPortsCollection = transformArlangPorts(arxml, arlangSwComponent.ports, undefined, arlangModIdToClonedArxmlObjects);
        if (arxmlPortsCollection !== null) {
            arxmlObject.appendChild(arxmlPortsCollection);
        }
    }
}
