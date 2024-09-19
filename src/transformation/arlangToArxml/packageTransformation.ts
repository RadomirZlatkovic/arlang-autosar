import { createShortNameElement } from './arlangToArxmlGeneral.js';
import { getChildElementsByTagNameInsideArxmlObject } from './arlangToArxmlGeneral.js';

export function createARPackage(arxml: Document, shortName: string) : HTMLElement {
    const arPackageElement = arxml.createElement('AR-PACKAGE');
	arPackageElement.appendChild(createShortNameElement(arxml, shortName));

    return arPackageElement;
}

/**
 * Does not check nested AR-PACKAGES (e.g., AR-PACKAGES -> AR-PACKAGE -> AR-PACKAGES)
 */
export function getARPackageInsideSpecifiedARPackages(arPackages : Element, shortName: string) : Element | null {
    const packages = getChildElementsByTagNameInsideArxmlObject(arPackages, "AR-PACKAGE");

    for (let i = 0; i < packages.length; i++) {
        const shortNameNodes = packages[i].getElementsByTagName("SHORT-NAME");
        if (shortNameNodes.length === 0) {
            continue;
        }
        const shortNameNode = shortNameNodes[0];

        let shortNameValue : string | null = shortNameNode.childNodes[0].nodeValue;
        if(shortNameValue === shortName) {
            return packages[i];
        }
    }

    return null;
}
