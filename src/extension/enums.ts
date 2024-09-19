export enum messages {
    noTargetFolderSelected = "Target folder is not chosen (target folder is a directory that stores ARXML files).",
    noArlangFolderSelected = "ARLANG folder is not chosen (ARLANG folder is a directory that stores ARLANG files).",
    folderAlreadyUsedAsTarget = "Folder is already used as Target project folder",
    folderAlreadyUsedAsArlang = "Folder is already used as Arlang project folder"
}

export enum contextValueTypes {
    workspaceFolder = "workspaceFolder",
    targetFolder = "targetFolder",
    arlangFolder = "arlangFolder"
}

export enum storageKeys {
    targetProjectFolder = "targetProjectFolder",
    arlangProjectFolder = "arlangProjectFolder"
}
