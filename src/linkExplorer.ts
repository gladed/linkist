import { 
    EventEmitter,
    TreeDataProvider,
    TreeItem
} from 'vscode';

import { Link } from './util/link';

export class LinkExplorer implements TreeDataProvider<Link> {
    private _onDidChangeTreeData = new EventEmitter<any>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    getChildren(element?: Link | undefined): import("vscode").ProviderResult<Link[]> {
        return [];
    }

    getTreeItem(element: Link): import("vscode").TreeItem | Thenable<TreeItem> {
        throw new Error("not implemented");
    }

    getParent(element: Link): Link | undefined {
        return undefined;
    }
}
