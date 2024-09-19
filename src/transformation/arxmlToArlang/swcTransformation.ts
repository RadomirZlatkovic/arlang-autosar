import { transformArxmlPortsFromSwc } from './portTransformation.js';
import { transformElementToArlangModId } from "./arlangModIdTransformation.js";

export function transformArxmlApplicationSwc(arxmlSwc : Element) : string  {
    const shortName = arxmlSwc.getElementsByTagName('SHORT-NAME')[0].childNodes[0].textContent;

    const transformedPorts = transformArxmlPortsFromSwc(arxmlSwc);

    let transformedSwc : string;
    if (transformedPorts.length > 0) {
        transformedSwc =
`	swComponent:application ${shortName} {

${transformedPorts.join('\n\n')}

		${transformElementToArlangModId(arxmlSwc)}
	}`;
    } else {
        transformedSwc =
`	swComponent:application ${shortName} {
		${transformElementToArlangModId(arxmlSwc)}
	}`;
    }

    return transformedSwc;
}
