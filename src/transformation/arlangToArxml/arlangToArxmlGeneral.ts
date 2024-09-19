import { AstNode, LangiumDocument } from 'langium';
import { LangiumServices } from 'langium/lsp';
import { NodeFileSystem } from 'langium/node';
import { createArlangServices } from '../../language/arlang-module.js';
import { Model, Package as ArlangPackage, PortType as ArlangPortType, InterfaceType as ArlangInterfaceType } from '../../language/generated/ast.js';
import { URI } from 'vscode-uri';
import path from 'path';
import { isChildNodeElementNode } from '../transformationGeneral.js';
import { getArlangModIdFromArxmlObject } from '../metadataToArxml/metadataToArxmlTransformation.js';
import { ClonedChildData } from './arlangToArxmlTransformationFlowHelper.js';

export function getChildElementsByTagNameInsideArxmlObject(arxmlObject : Element, tagName : string) : Element[] {
    const retValChildNodes : Element[] = [];

    const childNodes = arxmlObject.childNodes;
    for (let i = 0; i < childNodes.length; i++) {
        const childNode = childNodes[i];

        if (!isChildNodeElementNode(childNode)) {
            continue;
        }

        const childNodeElement = childNodes[i] as Element;
        if (childNodeElement.tagName === tagName) {
            retValChildNodes.push(childNodeElement);
        }
    }

    return retValChildNodes;
}

export function getFirstChildElementByTagNameInsideArxmlObject(arxmlObject : Element, tagName : string) : Element | null {
    const childNodes = arxmlObject.childNodes;
    for (let i = 0; i < childNodes.length; i++) {
        const childNode =  childNodes[i];

        if (!isChildNodeElementNode(childNode)) {
            continue;
        }

        const childNodeElement = childNodes[i] as Element;
        if (childNodeElement.tagName === tagName) {
            return childNodeElement;
        }
    }

    return null;
}

/**
 * 
 * @param arxmlObject object in which SHORT-NAME node is searched for
 * @returns element after SHORT-NAME node if it exists, null otherwise
 */
export function getElementAfterShortName(arxmlObject : Element) : Element | null {
    let shortNameIndex = 0;

    const childNodes = arxmlObject.childNodes;
    for (let i = 0; i < childNodes.length; i++) {
        const childNode =  childNodes[i];

        if (!isChildNodeElementNode(childNode)) {
            continue;
        }

        const childNodeElement = childNodes[i] as Element;
        if (childNodeElement.tagName === 'SHORT-NAME') {
            shortNameIndex = i;
            break;
        }
    }

    for (let i = shortNameIndex + 1; i < childNodes.length; i++) {
        const childNode = childNodes[i];

        if (!isChildNodeElementNode(childNode)) {
            continue;
        } else {
            return childNode as Element;
        }
    }

    return null;
}

export function cloneElement(arxml : Document, originalElement : Element, newTagName: string, clonedChildDataHolder ?: ClonedChildData[]) : Element {
    const clone = arxml.createElement(newTagName);
    cloneChildNodes(arxml, clone, originalElement, clonedChildDataHolder);
    cloneAttributes(clone, originalElement);

    return clone;
}

function cloneChildNodes(arxml : Document, clone : Element, original : Element, clonedChildDataHolder ?: ClonedChildData[]) : void {
    const originalChildNodes = original.childNodes;
    for (let i = 0; i < originalChildNodes.length; i++) {
        const originalChildNode = originalChildNodes[i];

        if (isChildNodeElementNode(originalChildNode)) {
            const originalChildNodeElement = originalChildNode as Element;

            const clonedChildNode = originalChildNodeElement.cloneNode(false) as Element;
            cloneChildNodes(arxml, clonedChildNode, originalChildNodeElement, clonedChildDataHolder);

            clone.appendChild(clonedChildNode);
            if (clonedChildDataHolder !== undefined) {
                addClonedChildDataToHolder(clonedChildNode, originalChildNodeElement, clonedChildDataHolder);
            }
        } else {
            clone.appendChild(originalChildNode.cloneNode(true));
        }
    }
}

function cloneAttributes(clone : Element, originalElement : Element) : void {
    for (let i = 0; i < originalElement.attributes.length; i++) {
        clone.attributes.setNamedItem(originalElement.attributes[i].cloneNode(true) as Attr);
    }
}

function addClonedChildDataToHolder(clone : Element, originalElement : Element, clonedChildDataHolder : ClonedChildData[]) : void {
    const arlangModId = getArlangModIdFromArxmlObject(originalElement);
    if (arlangModId !== undefined) {
        clonedChildDataHolder.push({"arlangModId" : arlangModId, "clonedArxmlObject" : clone, "transformed" : false});
    }
    // else - error should not be reported because there may be elments like SHORT-NAME etc., that do not need associated arlangModId
}

// TODO mock this function call instead of checking shortName every time
export function createShortNameElement(arxml : Document, shortNameValue : string) : Element {
    const shortNameElement = arxml.createElement("SHORT-NAME");
    const shortNameElementValue = arxml.createTextNode(shortNameValue);
    shortNameElement.appendChild(shortNameElementValue);

    return shortNameElement;
}

export function getArxmlTagNameFromArlangPortType(arlangPortType : ArlangPortType) : string {
    if (arlangPortType == 'provided') {
        return 'P-PORT-PROTOTYPE';
    } else { // arlangPortType == 'required'
        return 'R-PORT-PROTOTYPE';
    }
}

export function getArxmlInterfaceTrefTagNameFromArlangPortType(arlangPortType : ArlangPortType) : string {
    if (arlangPortType == 'provided') {
        return 'PROVIDED-INTERFACE-TREF';
    } else { // arlangPortType == 'required'
        return 'REQUIRED-INTERFACE-TREF';
    }
}

export function getArxmlTagNameFromArlangInterfaceType(arlangInterfaceType : ArlangInterfaceType) : string {
    if (arlangInterfaceType === 'senderReceiver') {
        return 'SENDER-RECEIVER-INTERFACE';
    } else {
        return 'CLIENT-SERVER-INTERFACE';
    }
}

/**
 * @param arlangPackage package of arlang element
 * @param arlangRelativeFilePath relative path of arlang file (with file name) without extension
 * @param arxmlPackageFQN fully qualified name of ARPackage-s
 * @param arxmlRelativeFilePath relative path of arxml file (with file name) without extension
 * @returns true if packages are the same and relative file paths are the same, false otherwise
 */
export function checkSameContainerFQNAndRelativeFilePath(arlangContainerFQN: string, arlangRelativeFilePath: string,
                                                    arxmlContainerFQN : string, arxmlRelativeFilePath : string | undefined) : boolean {

    if (arlangContainerFQN === arxmlContainerFQN && arlangRelativeFilePath === arxmlRelativeFilePath) {
        return true;
    }

    return false;
}

export function getArxmlReferencePath(names: string[] | undefined, arlangPackage?: ArlangPackage | undefined) : string {
    let namesRef = '';
    if(names !== undefined) {
        namesRef = names.reduce( (name1, name2) => { return name1 + '/' + name2 } );
    }

    if (arlangPackage !== undefined) {
        const packageRef = '/' + arlangPackage.name.replaceAll('.', '/');
        if (names !== undefined) {
            return packageRef + '/' + namesRef;
        } else {
            return packageRef;
        }
    } else if (namesRef.length !== 0) {
        return '/' + namesRef;
    }

    return '';
}

export async function initializeModels(filePathsWithName: string[]): Promise<Model[]> {
    const services = createArlangServices(NodeFileSystem).Arlang;
    const models = await extractAstNode<Model>(filePathsWithName, services);

    return models;
}

async function extractAstNode<T extends AstNode>(filePathsWithName: string[], services: LangiumServices): Promise<T[]> {
    return (await extractDocuments(filePathsWithName, services)).map(document => document.parseResult?.value as T);
}

async function extractDocuments(filePathsWithName: string[], services: LangiumServices): Promise<LangiumDocument[]> {
    const documents = await Promise.all(filePathsWithName.map(
        async (filePathWithName) => await services.shared.workspace.LangiumDocuments.getOrCreateDocument(URI.file(path.resolve(filePathWithName)))
    ));

    await services.shared.workspace.DocumentBuilder.build(documents);

    return documents;
}
