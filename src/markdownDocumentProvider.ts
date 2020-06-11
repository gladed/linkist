import {
    EventEmitter,
    Uri,
    workspace,
} from 'vscode';
import { getMarkdownDocument, MarkdownDocument } from './markdown';
import { Disposable } from './util/disposable';

/** Watch for changes to all markdown files in the workspace. */
export default class MarkdownDocumentProvider extends Disposable {
    private readonly onDidUpdateDocumentEmitter = this.register(new EventEmitter<MarkdownDocument>());
    private readonly onDidDeleteDocumentEmitter = this.register(new EventEmitter<Uri>());
    private watching = false;

    /** Invoke {@param callback} for every markdown document in the workspace. */
    async forEach(callback: (doc: MarkdownDocument) => void) {
        const resources = await workspace.findFiles('**/*.md', ' **/node_modules/**');
        for (const resource of resources) {
            const document = await getMarkdownDocument(resource);
            if (document) {
                callback(document);
            }
        }
    }

    /** Return an event that fires whenever a markdown document is created or altered. */
    public get onDidUpdateDocument() {
        this.watchFiles();
        return this.onDidUpdateDocumentEmitter.event;
    }

    /** Return an event that fires whenever a markdown document is deleted. */
    public get onDidDeleteDocument() {
        this.watchFiles();
        return this.onDidDeleteDocumentEmitter.event;
    }

    private watchFiles() {
        if (this.watching) {
            return;
        }

        let fileWatcher = this.register(workspace.createFileSystemWatcher('**/*.md'));
        this.watching = true;

        fileWatcher.onDidChange(async changed => {
            let document = await getMarkdownDocument(changed);
            if (document) {
                this.onDidUpdateDocumentEmitter.fire(document);
            }
        });
        fileWatcher.onDidCreate(async created => {
            let document = await getMarkdownDocument(created);
            if (document) {
                this.onDidUpdateDocumentEmitter.fire(document);
            }
        });

        fileWatcher.onDidDelete(async deleted => {
            this.onDidDeleteDocumentEmitter.fire(deleted);
        });

        workspace.onDidChangeTextDocument(event => {
            if (event.document.languageId === 'markdown') {
                this.onDidUpdateDocumentEmitter.fire(event.document);
            }
        }, null, this.disposables);
    }
}