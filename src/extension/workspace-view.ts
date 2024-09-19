import * as vscode from 'vscode';
import { ArlangProject } from './arlang-view.js';
import { TargetProject } from './target-view.js';
import { messages, contextValueTypes } from './enums.js';

export class WorkspaceFoldersDataProvider implements vscode.TreeDataProvider<Node> {
    private _onDidChangeTreeData: vscode.EventEmitter<Node | undefined | void> = new vscode.EventEmitter<Node | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<Node | undefined | void> = this._onDidChangeTreeData.event;

    refresh() : void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: Node): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: Node | undefined): vscode.ProviderResult<Node[]> {
        const workspaceFolders = vscode.workspace.workspaceFolders;

        if (workspaceFolders === undefined) {
            return [];
        } else if (workspaceFolders.length >= 1) {

            return workspaceFolders.map(workspaceFolder => {
                if (workspaceFolder === TargetProject.INSTANCE().getProjectFolder()) {
                    return new Node(contextValueTypes.targetFolder,
                        workspaceFolder, workspaceFolder.name, new vscode.ThemeIcon("folder-opened"), "Target project folder");
                } else if (workspaceFolder === ArlangProject.INSTANCE().getProjectFolder()) {
                    return new Node(contextValueTypes.arlangFolder,
                        workspaceFolder, workspaceFolder.name, new vscode.ThemeIcon("folder-opened"), "Arlang project folder");
                }

                return new Node(contextValueTypes.workspaceFolder,
                    workspaceFolder, workspaceFolder.name, new vscode.ThemeIcon("folder"));
            });

        }

        return [];
    }

};

export class Node extends vscode.TreeItem {

    private workspaceFolder : vscode.WorkspaceFolder;

    constructor(
        contextValueType: contextValueTypes,
        workspaceFolder: vscode.WorkspaceFolder,
		public override readonly label: string,
        iconPath: string | vscode.Uri | {
            light: string | vscode.Uri;
            dark: string | vscode.Uri;
        } | vscode.ThemeIcon | undefined,
        description? : string
	) {
        super(label);

        this.workspaceFolder = workspaceFolder;

        if (description !== undefined) {
            this.description = description;
            this.tooltip = `${label} - ${description}`;
        } else {
            this.tooltip = label;
        }

        this.iconPath = iconPath;

        this.contextValue = contextValueType.valueOf();
    }

    public getWorkspaceFolder() : vscode.WorkspaceFolder {
        return this.workspaceFolder;
    }

};

// singleton
export class WorkspaceFolders {

    private static instance : WorkspaceFolders;

    private workspaceFoldersDataProvider : WorkspaceFoldersDataProvider;

    public static INSTANCE(context?: vscode.ExtensionContext) : WorkspaceFolders {
        if (context !== undefined) {
            WorkspaceFolders.instance = new WorkspaceFolders(context);
        }

        return WorkspaceFolders.instance;
    }

    private constructor(context: vscode.ExtensionContext) {
        // configure tree view
        this.workspaceFoldersDataProvider = new WorkspaceFoldersDataProvider();
        vscode.window.registerTreeDataProvider('workspace_folders-view', this.workspaceFoldersDataProvider);

        // register commands
        vscode.commands.registerCommand('arlang.workspace.addRootFolder', () => {
            vscode.commands.executeCommand('workbench.action.addRootFolder');
        });

        vscode.commands.registerCommand('arlang.workspace.refresh', () => {
            this.refreshWorkspaceView();
        });

        vscode.commands.registerCommand('arlang.workspace.removeEntry', (node: Node) => {
            const selectedWorkspaceFolder = node.getWorkspaceFolder();

            if (TargetProject.INSTANCE().getProjectFolder() === selectedWorkspaceFolder) {
                TargetProject.INSTANCE().undefineProjectFolder();
            } else if (ArlangProject.INSTANCE().getProjectFolder() === selectedWorkspaceFolder) {
                ArlangProject.INSTANCE().undefineProjectFolder();
            }

            vscode.workspace.updateWorkspaceFolders(selectedWorkspaceFolder.index, 1);
        });

        vscode.commands.registerCommand('arlang.unselectTargetFolder', () => {
            const targetProjectInstance = TargetProject.INSTANCE();

            targetProjectInstance.undefineProjectFolder();
            targetProjectInstance.refreshTargetView();

            this.refreshWorkspaceView();
        });

        vscode.commands.registerCommand('arlang.unselectArlangFolder', () => {
            const arlangProjectInstance = ArlangProject.INSTANCE();

            arlangProjectInstance.undefineProjectFolder();
            arlangProjectInstance.refreshArlangView();

            this.refreshWorkspaceView();
        });

        vscode.commands.registerCommand('arlang.workspace.selectTargetFolder', async (node: Node) => {
            const selectedWorkspaceFolder = node.getWorkspaceFolder();

            if (TargetProject.INSTANCE().getProjectFolder() === selectedWorkspaceFolder) {
                vscode.window.showErrorMessage(messages.folderAlreadyUsedAsTarget);
                return;
            } else if (ArlangProject.INSTANCE().getProjectFolder() === selectedWorkspaceFolder) {
                vscode.window.showErrorMessage(messages.folderAlreadyUsedAsArlang);
                return;
            }

            await TargetProject.INSTANCE().setProjectFolder(selectedWorkspaceFolder);

            this.workspaceFoldersDataProvider.refresh();
        });

        vscode.commands.registerCommand('arlang.workspace.selectArlangFolder', async (node: Node) => {
            const selectedWorkspaceFolder = node.getWorkspaceFolder();

            if (TargetProject.INSTANCE().getProjectFolder() === selectedWorkspaceFolder) {
                vscode.window.showErrorMessage(messages.folderAlreadyUsedAsTarget);
                return;
            } else if (ArlangProject.INSTANCE().getProjectFolder() === selectedWorkspaceFolder) {
                vscode.window.showErrorMessage(messages.folderAlreadyUsedAsArlang);
                return;
            }

            await ArlangProject.INSTANCE().setProjectFolder(selectedWorkspaceFolder);

            this.workspaceFoldersDataProvider.refresh();
        });

        // listen to events
        context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(e => {
            this.refreshWorkspaceView();
        }));
    }

    public refreshWorkspaceView() : void {
        this.workspaceFoldersDataProvider.refresh();
    }

};
