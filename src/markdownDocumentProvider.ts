import {
    EventEmitter,
    Uri,
    workspace,
} from 'vscode';
import { getMarkdownDocument, MarkdownDocument } from './markdown';
import { Disposable } from './util/disposable';

export default class MarkdownDocumentProvider extends Disposable {
    private readonly onDidUpdateDocumentEmitter = this.register(new EventEmitter<MarkdownDocument>());
    private readonly onDidDeleteDocumentEmitter = this.register(new EventEmitter<Uri>());
    private watching = false;
    
    async forEach(callback: (doc: MarkdownDocument) => void) {
        const resources = await workspace.findFiles('**/*.md', ' **/node_modules/**');
        for (const resource of resources) {
            const document = await getMarkdownDocument(resource);
            if (document) {
                callback(document);
            }
        }
    }

    public get onDidUpdateDocument() {
        this.watchFiles();
		return this.onDidUpdateDocumentEmitter.event;
    }
    
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