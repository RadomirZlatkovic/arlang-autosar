import { transformArxmlElementsFromARPackage } from "./elementsTransformation.js";

export function transformArxmlARPackage(arPackage : Element) : string {
    let fqn = getFQNFromARPackage(arPackage);

    let transformedElements = transformArxmlElementsFromARPackage(arPackage);

    let arlangContent : string;
    if (transformedElements.length > 0) {
        arlangContent =
`#package ${fqn}

${transformedElements.join('\n\n')}

#end`
    } else {
        arlangContent =
`#package ${fqn}
#end`
    }

    return arlangContent;
}

export function getFQNFromARPackage(arPackage : Element) : string  {
    // fully qualified name
    let fqn = arPackage.getElementsByTagName('SHORT-NAME')[0].childNodes[0].textContent!;

    // parent node of ARPackage is ARPackages, parent node of ARPackages is AUTOSAR
    let parentNode = arPackage.parentNode!.parentNode!;
    while(parentNode.nodeName !== 'AUTOSAR') {
        const shortName = (parentNode as Element).getElementsByTagName('SHORT-NAME')[0].childNodes[0].textContent;
        fqn = `${shortName}.${fqn}`;

        parentNode = parentNode.parentNode!.parentNode!;
    }

    return fqn;
}
