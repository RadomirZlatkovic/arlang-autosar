import { PortType } from "../../language/generated/ast.js";
import { transformElementToArlangModId } from "./arlangModIdTransformation.js";
import { isChildNodeElementNode } from "../transformationGeneral.js";
import { getFirstChildElementByTagNameInsideArxmlObject } from "../arlangToArxml/arlangToArxmlGeneral.js";
import { showTransformationError } from "../vscodeHelperFunctions.js";

export function transformArxmlPortsFromSwc(arxmlSwc : Element) : string[] {
    let portsCollection = getPortsCollectionFromSwc(arxmlSwc);

    if (portsCollection === null) { // 0 or 1 <PORTS> can exist in one Swc
        return [];
    }

    return transformArxmlPorts(portsCollection);
}

export function transformArxmlPorts(arxmlPorts : Element) : string[] {
    const transformedPorts : string[] = [];

    const childNodes = arxmlPorts.childNodes;
    for (let i = 0; i < childNodes.length; i++) {
        const childNode = childNodes[i];
        if (!isChildNodeElementNode(childNode)) {
            continue;
        }

        const transformedPort = transformArxmlPort(childNode as Element);
        if (transformedPort !== null) {
            transformedPorts.push(transformedPort);
        }
    }

    return transformedPorts;
}

export function transformArxmlPort(arxmlPort : Element) : string | null {
    switch(arxmlPort.tagName) {
        case 'P-PORT-PROTOTYPE':
            return transformArxmlProvidePort(arxmlPort);
        case 'R-PORT-PROTOTYPE':
            return transformArxmlRequirePort(arxmlPort);
        default:
            return null;
    }
}

export function transformArxmlProvidePort(arxmlPort : Element) : string | null {
    const shortName = arxmlPort.getElementsByTagName('SHORT-NAME')[0].childNodes[0].textContent;

    const interfaceTrefTagName = 'PROVIDED-INTERFACE-TREF';
    const interfaceTref = getFirstChildElementByTagNameInsideArxmlObject(arxmlPort, interfaceTrefTagName);
    if (interfaceTref === null) {
        showTransformationError(`Cannot find ${interfaceTrefTagName} inside ${shortName}.`);
        return null;
    }

    const dest = interfaceTref.attributes.getNamedItem('DEST')?.value;
    if (!isInterfaceDestSupported(dest))  {
        return null;
    }

    const interfaceTrefValue = interfaceTref.childNodes[0].textContent?.substring(1).replaceAll('/', '.');

    const portType : PortType = 'provided';
    const transformedPort =
`		port:${portType} ${shortName} implements ${interfaceTrefValue} {
			${transformElementToArlangModId(arxmlPort)}
		}`;

    return transformedPort;
}

export function transformArxmlRequirePort(arxmlPort : Element) : string | null {
    const shortName = arxmlPort.getElementsByTagName('SHORT-NAME')[0].childNodes[0].textContent;

    const interfaceTrefTagName = 'REQUIRED-INTERFACE-TREF';
    const interfaceTref = getFirstChildElementByTagNameInsideArxmlObject(arxmlPort, interfaceTrefTagName);
    if (interfaceTref === null) {
        showTransformationError(`Cannot find ${interfaceTrefTagName} inside ${shortName}.`);
        return null;
    }

    const dest = interfaceTref.attributes.getNamedItem('DEST')?.value;
    if (!isInterfaceDestSupported(dest))  {
        return null;
    }

    const interfaceTrefValue = interfaceTref.childNodes[0].textContent?.substring(1).replaceAll('/', '.');

    const portType : PortType = 'required';
    const transformedPort =
`		port:${portType} ${shortName} implements ${interfaceTrefValue} {
			${transformElementToArlangModId(arxmlPort)}
		}`;

    return transformedPort;
}

function getPortsCollectionFromSwc(arxmlSwc : Element) : Element | null {
    const childNodes = arxmlSwc.childNodes;
    for (let i = 0; i < childNodes.length; i++) {
        const childNode = childNodes[i];
        if (!isChildNodeElementNode(childNode)) {
            continue;
        }

        if ((childNode as Element).tagName === 'PORTS') {
            return childNode as Element; // 0 or 1 <PORTS> can exist in one Swc
        }
    }

    return null;
}

function isInterfaceDestSupported(dest : string | undefined) : boolean {
    if ( dest === undefined || (dest !== 'SENDER-RECEIVER-INTERFACE' && dest !== 'CLIENT-SERVER-INTERFACE') )  {
        return false;
    }

    return true;
}
