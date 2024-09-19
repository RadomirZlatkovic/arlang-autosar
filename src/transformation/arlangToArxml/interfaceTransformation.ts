import { Interface as ArlangInterface, ArlangModificationId } from '../../language/generated/ast.js';
import { getArxmlObject, getContainerFQNFromMetadata, getRelativeFilePathWithoutExtension } from '../metadataToArxml/metadataToArxmlTransformation.js';
import { currentRelativeFilePath, arxmlObjectsToRemove, setOriginalArlangModIdAsTransformed } from './arlangToArxmlTransformationFlowHelper.js';
import { showNoArlangModIdFoundError } from '../vscodeHelperFunctions.js';
import { checkSameContainerFQNAndRelativeFilePath, cloneElement, createShortNameElement, getArxmlTagNameFromArlangInterfaceType } from './arlangToArxmlGeneral.js';

/**
 * @returns Element (xml) if new xml element is created or copied,
 * otherwise null (existing arxml element corresponding to arlangInterface is found at the exact location, therefore arxml interface is modified)
 */
export function transformArlangInterface(arxml : Document, arlangInterface : ArlangInterface) : Element | null {
    const arlangModId = arlangInterface.arlangModId;
    if (arlangModId === undefined) {
        return createArxmlInterface(arxml, arlangInterface);
    } else {
        return copyOrModifyArxmlInterface(arxml, arlangInterface, arlangModId)
    }
}

/**
 * Creates ARXML interface corresponding to ArlangInterface
 * @param arxml used only to create interface, newly created interface is not added to arxml
 * @returns created arxml interface
 */
export function createArxmlInterface(arxml : Document, arlangInterface : ArlangInterface) : Element {
    const xmlTagName = getArxmlTagNameFromArlangInterfaceType(arlangInterface.type);
    const arxmlInterface = arxml.createElement(xmlTagName);
    arxmlInterface.appendChild(createShortNameElement(arxml, arlangInterface.name));

    return arxmlInterface;
}

/**
 * @returns Element (xml) if element is copied,
 * otherwise null (existing arxml element corresponding to arlangInterface is found at the exact location, therefore arxml interface is modified)
 */
export function copyOrModifyArxmlInterface(arxml : Document, arlangInterface : ArlangInterface, arlangModId : ArlangModificationId) : Element | null {
    const arlangModIdValue = arlangModId.id;

    const arxmlObject = getArxmlObject(arlangModIdValue);
    if (arxmlObject === undefined) {
        showNoArlangModIdFoundError(arlangModIdValue);
        return null;
    }

    const arxmlInterfacePackage = getContainerFQNFromMetadata(arlangModIdValue);
    if (arxmlInterfacePackage === undefined) {
        showNoArlangModIdFoundError(arlangModIdValue);
        return null;
    }

    const clonedElement = cloneElement(arxml, arxmlObject, getArxmlTagNameFromArlangInterfaceType(arlangInterface.type));
    modifyArxmlInterface(arxml, clonedElement, arlangInterface);

    if (checkSameContainerFQNAndRelativeFilePath(arlangInterface.$container.name, currentRelativeFilePath,
                                        arxmlInterfacePackage, getRelativeFilePathWithoutExtension(arlangModIdValue)) === true) {

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

export function modifyArxmlInterface(arxml : Document, arxmlObject : Element, arlangInterface : ArlangInterface) : void {
    const arxmlInterfaceChilds = arxmlObject.childNodes;

    let foundShortName = false;

    for (let i = 0; i < arxmlInterfaceChilds.length; i++) {
        const arxmlInterfaceChild = arxmlInterfaceChilds[i] as Element;

        if (arxmlInterfaceChild.tagName === 'SHORT-NAME') {

            // TODO HANDLE THIS CASE ? IS THIS VALID ARXML?
            if (arxmlInterfaceChild.childNodes.length > 0) {
                arxmlInterfaceChild.childNodes[0].textContent = arlangInterface.name;
            } else {
                arxmlInterfaceChild.appendChild(arxml.createTextNode(arlangInterface.name));
            }

            foundShortName = true;
        }
    }

    if (!foundShortName) {
        const shortNameElement = createShortNameElement(arxml, arlangInterface.name);

        if (arxmlInterfaceChilds.length === 0) {
            arxmlObject.appendChild(shortNameElement);
        } else {
            arxmlObject.insertBefore(shortNameElement, arxmlInterfaceChilds[0]);
        }
    }
}
