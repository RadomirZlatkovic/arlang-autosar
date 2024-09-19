import { transformArxmlSenderReceiverInterface, transformArxmlClientServerInterface } from "./interfaceTransformation.js";
import { transformArxmlApplicationSwc } from "./swcTransformation.js";
import { isChildNodeElementNode } from "../transformationGeneral.js";

export function transformArxmlElementsFromARPackage(arPackage : Element) : string[] {
    let elementsCollection = getElementsCollectionFromARPackage(arPackage);

    if (elementsCollection === null) { // 0 or 1 <ELEMENTS> can exist in one ARPackage
        return [];
    }

    return transformArxmlElements(elementsCollection);
}

export function transformArxmlElements(arxmlElements : Element) : string[] {
    const transformedElements : string[] = [];

    const childNodes = arxmlElements.childNodes;
    for (let i = 0; i < childNodes.length; i++) {
        const childNode = childNodes[i]
        if (!isChildNodeElementNode(childNode)) {
            continue;
        }

        const transformedElement = transformArxmlElement(childNode as Element);
        if (transformedElement !== null) {
            transformedElements.push(transformedElement);
        }
    }

    return transformedElements;
}

export function transformArxmlElement(arxmlElement : Element) : string | null {
    switch(arxmlElement.tagName) {
        case 'SENDER-RECEIVER-INTERFACE':
            return transformArxmlSenderReceiverInterface(arxmlElement);
        case 'CLIENT-SERVER-INTERFACE':
            return transformArxmlClientServerInterface(arxmlElement);
        case 'APPLICATION-SW-COMPONENT-TYPE':
            return transformArxmlApplicationSwc(arxmlElement);
        default:
            return null;
    }
}

function getElementsCollectionFromARPackage(arPackage : Element) : Element | null {
    const arPackageChilds = arPackage.childNodes;
    for (let i = 0; i < arPackageChilds.length; i++) {
        if ((arPackageChilds[i] as Element).tagName === 'ELEMENTS') {
            return arPackageChilds[i] as Element; // 0 or 1 <ELEMENTS> can exist in one ARPackage
        }
    }

    return null;
}
