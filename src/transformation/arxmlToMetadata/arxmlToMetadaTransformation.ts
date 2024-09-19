import { getFQNFromARPackage } from "../arxmlToArlang/arPackageTransformation.js";
import { ArlangMetadataObject, ArlangMetadata} from "../typesAndConstants.js";

var arlangModIdCounter = 0;

var elementToArlangModId = new Map<Element, string>;

export function initArxmlToMetadataTransformation() : void {
    arlangModIdCounter = 0;
    elementToArlangModId.clear();
}

export function getArlangModId(element : Element) : string {
    const arlangModId = elementToArlangModId.get(element);
    return arlangModId !== undefined ? arlangModId : "undefined";
}

export function transformArxmlToMetadata(arxml : Document) : ArlangMetadata {
    let metadata : ArlangMetadata = [];

    transformArxmlElementsToMetadata(arxml, 'SENDER-RECEIVER-INTERFACE', metadata);
    transformArxmlElementsToMetadata(arxml, 'CLIENT-SERVER-INTERFACE', metadata);
    transformArxmlElementsToMetadata(arxml, 'APPLICATION-SW-COMPONENT-TYPE', metadata);
    transformArxmlElementsToMetadata(arxml, 'P-PORT-PROTOTYPE', metadata);
    transformArxmlElementsToMetadata(arxml, 'R-PORT-PROTOTYPE', metadata);

    return metadata;
}

export function transformArxmlElementsToMetadata(arxml : Document, tagName : string, metadataHolder : ArlangMetadata) : void {
    let arElements = arxml.getElementsByTagName(tagName);
    for (let i = 0; i < arElements.length; i++) {
        const arElement = arElements[i];
        const arlangModId = createNewArlangModId();

        metadataHolder.push(transformArxmlElementToMetadata(arElement, i, arlangModId));
        elementToArlangModId.set(arElement, arlangModId);
    }
}

export function transformArxmlElementToMetadata(arxmlElement : Element, xmlElementIndex : number, arlangModId? : string) : ArlangMetadataObject {
    const tagName = arxmlElement.tagName;

    let containerFQN : string;

    if (tagName === 'P-PORT-PROTOTYPE' || tagName === 'R-PORT-PROTOTYPE') {
        const swc = arxmlElement.parentNode!.parentNode! as Element;
        const arPackage = swc.parentNode!.parentNode! as Element;

        const swcShortName = swc.getElementsByTagName('SHORT-NAME')[0].childNodes[0].textContent;

        containerFQN = getFQNFromARPackage(arPackage) + '.' + swcShortName;
    } else { // arxml object is conained under <ELEMENT>
        const arPackage = arxmlElement.parentNode!.parentNode! as Element;

        containerFQN = getFQNFromARPackage(arPackage);
    }

    return {
        "arlangModId" : arlangModId !== undefined ? arlangModId : createNewArlangModId(),
        "containerFQN" : containerFQN,
        "tagName": arxmlElement.nodeName,
        "index": xmlElementIndex
    };
}

function createNewArlangModId() : string {
    return 'arlangModId@' + arlangModIdCounter++;
}
