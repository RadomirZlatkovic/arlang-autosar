import * as vscode from 'vscode';
import { transform as doArxmlToArlangTransformation } from '../transformation/arxmlToArlang/arxmlToArlangTransformation.js';
import { ArlangProject } from './arlang-view.js';
import { messages, contextValueTypes, storageKeys } from './enums.js';
import { getArlangFolderPath, getTargetFolderPath } from './common.js';

class TargetProjectDataProvider implements vscode.TreeDataProvider<Node> {
    private _onDidChangeTreeData: vscode.EventEmitter<Node | undefined | void> = new vscode.EventEmitter<Node | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<Node | undefined | void> = this._onDidChangeTreeData.event;

    refresh() : void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: Node): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element.getTreeItem();
    }

    getChildren(element?: Node | undefined): vscode.ProviderResult<Node[]> {
        const targetFolder = TargetProject.INSTANCE().getProjectFolder();

        if (targetFolder !== undefined) {
            return [new Node(contextValueTypes.targetFolder, targetFolder.name, new vscode.ThemeIcon("folder-opened"))];
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
export class TargetProject {

    private static context : vscode.ExtensionContext;
    private static instance : TargetProject;

    private projectWorkspaceFolder : vscode.WorkspaceFolder | undefined;

    private targetProjectDataProvider : TargetProjectDataProvider;

    public static INSTANCE(context?: vscode.ExtensionContext) : TargetProject {
        if (context !== undefined) {
            TargetProject.context = context;
            TargetProject.instance = new TargetProject(context);
        }

        return TargetProject.instance;
    }

    private constructor(context: vscode.ExtensionContext) {
        // configure tree view
        this.targetProjectDataProvider = new TargetProjectDataProvider();
        vscode.window.registerTreeDataProvider('target_project-view', this.targetProjectDataProvider);

        // register commands
        vscode.commands.registerCommand('arlang.target.arxmlToArlangTransformation', () => {
            const targetFolderPath = getTargetFolderPath();
            const arlangFolderPath = getArlangFolderPath();

            if (targetFolderPath === undefined) {
                vscode.window.showErrorMessage(messages.noTargetFolderSelected);
            } else if (arlangFolderPath === undefined) {
                vscode.window.showErrorMessage(messages.noArlangFolderSelected);
            } else {
                doArxmlToArlangTransformation(targetFolderPath, arlangFolderPath);
            }
        });

        vscode.commands.registerCommand('arlang.target.refresh', () => this.targetProjectDataProvider.refresh());

        // listen to events
        context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(e => {
            this.refreshTargetView();
        }));
    }

    public getProjectFolder() : vscode.WorkspaceFolder | undefined {
        return this.projectWorkspaceFolder;
    }

    public async setProjectFolder(workspaceFolder : vscode.WorkspaceFolder) : Promise<void> {
        if (await ArlangProject.INSTANCE().isArlangFilePresent()) {
            const no = 'No';
            const yes = 'Yes';

            const selection = await vscode.window.showInformationMessage(
                `ARLANG folder '${ArlangProject.INSTANCE().getProjectFolder()!.name}' already contains ARLANG files. Continue?`,
                { modal: true, detail: 'ARXML files may not correspond to ARLANG files (or they may not be up to date) that exist in arlang folder.' },
                no, yes);
            if (selection === undefined || selection === no) {
                return;
            }
        }

        this.projectWorkspaceFolder = workspaceFolder;

        // update global storage to contain uri of target project folder
        TargetProject.context.globalState.update(storageKeys.targetProjectFolder, workspaceFolder.uri.fsPath.toString());

        this.refreshTargetView();
    }

    public undefineProjectFolder() : void {
        this.projectWorkspaceFolder = undefined;

        // update global storage to undefined
        TargetProject.context.globalState.update(storageKeys.targetProjectFolder, undefined);
    }

    public async restoreProjectFolder(workspaceFolder : vscode.WorkspaceFolder) {
        this.projectWorkspaceFolder = workspaceFolder;
        this.refreshTargetView();
    }

    public refreshTargetView() : void {
        this.targetProjectDataProvider.refresh();
    }

};
