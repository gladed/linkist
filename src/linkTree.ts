import {
    EventEmitter,
    TreeDataProvider,
    TreeItem
} from 'vscode';

import { Link } from './util/link';

/** Allows interactive exploration of links. */
export class LinkTree implements TreeDataProvider<LinkItem> {
    private _onDidChangeTreeData = new EventEmitter<any>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private _links?: Link[];
    get links(): Link[] | undefined {
        return this._links;
    }

    set links(links: Link[] | undefined) {
        // The root changed so update the tree
        this._links = links;
        this._onDidChangeTreeData.fire(undefined);
    }

    async getChildren(element?: LinkItem | undefined) {
        if (element) {
            // Date item
            // Incoming links
            return [];
        } else {
            const children: LinkItem[] = [];
            if (this.links) {
                for (let link of this.links) {
                    children.push(new LinkItem(link));
                }
            }
            // Append recently visited items below this
            return children;
        }
    }

    getTreeItem(element: LinkItem): import("vscode").TreeItem | Thenable<TreeItem> {
        return element;
    }

    getParent(_: LinkItem): LinkItem | undefined {
        return undefined;
    }
}

class LinkItem extends TreeItem {

    constructor(public link: Link) {
        super(LinkItem.calculateName(link));
        this.command = {
            command: 'extension.openLinkSelection',
            title: '',
            arguments: [ link.location ]
        };
        // TODO: Add icon as in https://github.com/microsoft/vscode-extension-samples/blob/master/tree-view-sample/src/jsonOutline.ts#L136
    }

    static calculateName(link: Link) {
        let name = "^" + link.linkId.text + "^";;
        if (link.label) {
            if (link.prefix) {
                name = link.prefix + " " + link.label + " (" + name + ")";
            } else {
                name = link.label + " (" + name + ")";
            }
        }
        return name;
    }
}