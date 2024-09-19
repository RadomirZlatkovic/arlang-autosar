import { getArlangModId } from "../arxmlToMetadata/arxmlToMetadaTransformation.js";

export function transformElementToArlangModId(element : Element) : string {
    return `arlangModId : "${getArlangModId(element)}"`;
}
