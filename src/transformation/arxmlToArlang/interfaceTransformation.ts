import { InterfaceType } from "../../language/generated/ast.js";
import { transformElementToArlangModId } from "./arlangModIdTransformation.js";

export function transformArxmlSenderReceiverInterface(arxmlInterface : Element) : string {
    const shortName = arxmlInterface.getElementsByTagName('SHORT-NAME')[0].childNodes[0].textContent;

    const interfaceType : InterfaceType = 'senderReceiver';
    const transformedInterface =
`	interface:${interfaceType} ${shortName} {
		${transformElementToArlangModId(arxmlInterface)}
	}`;

    return transformedInterface;
}

export function transformArxmlClientServerInterface(arxmlInterface : Element) : string {
    const shortName = arxmlInterface.getElementsByTagName('SHORT-NAME')[0].childNodes[0].textContent;

    const interfaceType : InterfaceType = 'clientServer';
    const transformedInterface =
`	interface:${interfaceType} ${shortName} {
		${transformElementToArlangModId(arxmlInterface)}
	}`;

    return transformedInterface;
}
