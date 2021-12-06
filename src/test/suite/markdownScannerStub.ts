import { MarkdownDocument } from '../../markdown';
import { EventEmitter, Uri } from 'vscode';
import { Disposer } from '../../util/disposer';

/** Pretend to manage a bunch of markdown documents. */
export class FakeMarkdownScanner extends Disposer {
    private readonly onDidUpdateDocumentEmitter = this.register(new EventEmitter<MarkdownDocument>());
    private readonly onDidDeleteDocumentEmitter = this.register(new EventEmitter<Uri>());

    public cache = new Map<Uri, MarkdownDocument>();

    /** Invoke {@param callback} for every markdown document in the workspace. */

    async forEach(callback: (document: MarkdownDocument) => void) {
        for (const document of this.cache.values()) {
            callback(document);
        }
    }

    public update(document: MarkdownDocument) {
        this.cache.set(document.uri, document);
        this.onDidUpdateDocumentEmitter.fire(document);
    }


    public delete(uri: Uri) {
        this.cache.delete(uri);
        this.onDidDeleteDocumentEmitter.fire(uri);
    }

    /** Return an event that fires whenever a markdown document is created or altered. */

    public get onDidUpdateDocument() {
        // this.watchFiles();
        return this.onDidUpdateDocumentEmitter.event;
    }

    /** Return an event that fires whenever a markdown document is deleted. */

    public get onDidDeleteDocument() {
        // this.watchFiles();
        return this.onDidDeleteDocumentEmitter.event;
    }
}
