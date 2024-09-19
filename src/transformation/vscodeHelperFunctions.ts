import * as vscode from 'vscode';
import { ARLANG_METADATA_FOLDER_NAME } from './typesAndConstants.js';
import { setErrorOccurredIndication } from './arlangToArxml/arlangToArxmlTransformationFlowHelper.js';

export function getWorkspaceFiles(fileExtension: string) : Thenable<vscode.Uri[]> {
    return vscode.workspace.findFiles(`**/*.${fileExtension}`);
}

export function showTransformationDone() : void {
    vscode.window.showInformationMessage('Transformation done');
}

export function showTransformationSuccess() : void {
    vscode.window.showInformationMessage('SUCCESS: Transformation done');
}

export function showTransformationError(errorMessage : string) : void {
    setErrorOccurredIndication();

    vscode.window.showErrorMessage(`${errorMessage}`);
}

export function showFolderCreationError(errorMessage : string) : void {
    setErrorOccurredIndication();

    vscode.window.showErrorMessage(`Error cannot create directory: ${errorMessage}`);
}

export function showNoARPackageFound(fileName : string, filePath : string) : void {
    vscode.window.showWarningMessage(`No ARPackage found in file '${fileName}' on path '${filePath}'. Empty file will be generated.`);
}

export function showMetadataFolderAccessWarning(metadataFolderPath : string) : void {
    // TODO - USER SHOULD BE ASKED IF HE WANTS TO CONTINUE!
    vscode.window.showWarningMessage(`Cannot find or access metadata folder (${ARLANG_METADATA_FOLDER_NAME} folder) at path '${metadataFolderPath}'. Metadata is used when modifying existing arxml file/s.`);
}

export function showNoArlangModIdFoundError(arlangModId : string) : void {
    setErrorOccurredIndication();

    showTransformationError(`arlangModId ${arlangModId} is not found in any metadata files (json files inside ${ARLANG_METADATA_FOLDER_NAME} folder). arlangModId should not be edited by the user.`);
}
