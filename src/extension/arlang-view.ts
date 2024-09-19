import * as vscode from 'vscode';
import { transform as doArlangToArxmlTransformation } from '../transformation/arlangToArxml/arlangToArxmlTransformation.js';
import { messages, contextValueTypes, storageKeys } from './enums.js';
import { getArlangFolderPath, getTargetFolderPath, isFileWithExtensionPresent } from './common.js';

class ArlangProjectDataProvider implements vscode.TreeDataProvider<Node> {
    private _onDidChangeTreeData: vscode.EventEmitter<Node | undefined | void> = new vscode.EventEmitter<Node | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<Node | undefined | void> = this._onDidChangeTreeData.event;

    refresh() : void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: Node): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element.getTreeItem();
    }

    getChildren(element?: Node | undefined): vscode.ProviderResult<Node[]> {
        const arlangFolder = ArlangProject.INSTANCE().getProjectFolder();

        if (arlangFolder !== undefined) {
            return [new Node(contextValueTypes.arlangFolder, arlangFolder.name, new vscode.ThemeIcon("folder-opened"))];
        }

        return [];
    }

};

class Node {

    private treeItem : vscode.TreeItem;

    constructor(
        contextValueType: contextValueTypes,
		label: string,
        iconPath: string | vscode.Uri | {
            light: string | vscode.Uri;
            dark: string | vscode.Uri;
        } | vscode.ThemeIcon | undefined
	) {
        this.treeItem = new vscode.TreeItem(label);

        this.treeItem.tooltip = `${label}`;

        this.treeItem.iconPath = iconPath;

        this.treeItem.contextValue = contextValueType.valueOf();
    }

    public getTreeItem() : vscode.TreeItem {
        return this.treeItem;
    }

};

/**
 * singleton
 */
export class ArlangProject {

    private static context : vscode.ExtensionContext;
    private static instance : ArlangProject;

    private projectWorkspaceFolder : vscode.WorkspaceFolder | undefined;

    private arlangProjectDataProvider : ArlangProjectDataProvider;

    public static INSTANCE(context?: vscode.ExtensionContext) : ArlangProject {
        if (context !== undefined) {
            ArlangProject.context = context;
            ArlangProject.instance = new ArlangProject(context);
        }

        return ArlangProject.instance;
    }

    private constructor(context: vscode.ExtensionContext) {
        // configure tree view
        this.arlangProjectDataProvider = new ArlangProjectDataProvider();
        vscode.window.registerTreeDataProvider('arlang_project-view', this.arlangProjectDataProvider);

        // register commands
        vscode.commands.registerCommand('arlang.arlang.arlangToArxmlTransformation', () => {
            const targetFolderPath = getTargetFolderPath();
            const arlangFolderPath = getArlangFolderPath();

            if (targetFolderPath === undefined) {
                vscode.window.showErrorMessage(messages.noTargetFolderSelected);
            } else if (arlangFolderPath === undefined) {
                vscode.window.showErrorMessage(messages.noArlangFolderSelected);
            } else {
                doArlangToArxmlTransformation(arlangFolderPath, targetFolderPath);
            }
        });

        vscode.commands.registerCommand('arlang.arlang.refresh', () => this.arlangProjectDataProvider.refresh());

        // listen to events
        context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(e => {
            this.refreshArlangView();
        }));
    }

    public getProjectFolder() : vscode.WorkspaceFolder | undefined {
        return this.projectWorkspaceFolder;
    }

    public async setProjectFolder(workspaceFolder : vscode.WorkspaceFolder) : Promise<void> {
        if (await isFileWithExtensionPresent(workspaceFolder.uri.fsPath, '.arlang')) {
            const no = 'No';
            const yes = 'Yes';

            const selection = await vscode.window.showInformationMessage(
                `Folder '${workspaceFolder.name}' already contains ARLANG files. Continue?`,
                { modal: true , detail : 'If target project folder is selected, ARLANG files may not be related to ARXML files (or they may not be up to date) inside target folder.' },
                no, yes);
            if (selection === undefined || selection === no) {
                return;
            }
        }

        this.projectWorkspaceFolder = workspaceFolder;

        // update global storage to contain uri of arlang project folder
        ArlangProject.context.globalState.update(storageKeys.arlangProjectFolder, workspaceFolder.uri.fsPath.toString());

        this.refreshArlangView();
    }

    public undefineProjectFolder() : void {
        this.projectWorkspaceFolder = undefined;

        // update global storage to undefined
        ArlangProject.context.globalState.update(storageKeys.arlangProjectFolder, undefined);
    }

    public async restoreProjectFolder(workspaceFolder : vscode.WorkspaceFolder) {
        this.projectWorkspaceFolder = workspaceFolder;
        this.refreshArlangView();
    }

    public refreshArlangView() : void {
        this.arlangProjectDataProvider.refresh();
    }

    public async isArlangFilePresent() : Promise<boolean> {
        const arlangFolder = this.getProjectFolder();
        if (arlangFolder === undefined) {
            return false;
        }

        return await isFileWithExtensionPresent(arlangFolder.uri.fsPath, '.arlang');
    }

};
