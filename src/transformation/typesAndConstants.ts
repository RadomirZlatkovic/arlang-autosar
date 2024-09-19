export const ARLANG_METADATA_FOLDER_NAME = '.arlang';

export type ArlangMetadata = ArlangMetadataObject[];

export type ArlangMetadataObject = {
    "arlangModId" : string, // identify arxml element from arlang element
    "containerFQN" : string, // container fully qualified name (e.g., p1.p2.p3 , or p1.p2.p3.MySwc)
    "tagName": string,
    "index": number
};
