import {
    Location,
    Range,
    SymbolInformation,
    SymbolKind,    
    WorkspaceSymbolProvider,
} from 'vscode';
import { Disposable } from './disposable';
import { Lazy, lazy } from './lazy';
import { Link } from './link';
import { MarkdownDocument } from './markdown';
import MarkdownDocumentProvider from './markdownDocumentProvider';

export function flatten<T>(arr: ReadonlyArray<T>[]): T[] {
	return ([] as T[]).concat.apply([], arr);
}

export default class MarkdownSymbolProvider extends Disposable implements WorkspaceSymbolProvider {
    private cache: Map<string, Lazy<Thenable<SymbolInformation[]>>> | undefined;
    private symbolRegex = /\^[A-Za-z0-9]{4,}\^/g;

    public constructor(
        private markdownProvider = new MarkdownDocumentProvider()
    ) {
        super();
    }

    public async newLink() {
        // Find an unused link ID
        let ordinal = 0;
        while (true) {
            let link = Link.create(ordinal++);
            if ((await this.lookupSymbols(link.id)).length === 0) {
                return link;
            }
        }
    }

	public async provideWorkspaceSymbols(query: string): Promise<SymbolInformation[]> {
        // Skip TOC lines because built-in "markdown-language-features" finds these
        return this.lookupSymbols(query).then(symbols =>
            symbols.filter(symbol => !symbol.name.startsWith("#")));
    }

    public async lookupSymbols(query: string): Promise<SymbolInformation[]> {
        if (this.cache === undefined) {
            this.cache = await this.initCache();
        }
        return Promise.all(Array.from(this.cache.values()).map(x => x.value))
            .then(sets => {
                let all = flatten(sets)
                    .filter(symbol => symbol.name.indexOf(query) !== -1);

                // Don't return multiple indexes for the same line
                // TODO: Problem if there is a second index on a very long paragraph?
                return all.filter((item, index, array) =>
                    array.findIndex(item2 =>
                        item.location.range.start.line === item2.location.range.start.line &&
                        item.location.uri === item2.location.uri) === index);
            });
    }

    private async initCache() {
        const cache = new Map<string, Lazy<Thenable<SymbolInformation[]>>>();

        // Initialize the cache and watch for document changes anywhere
        await this.markdownProvider.forEach(doc => {
            cache.set(doc.uri.fsPath, this.scan(doc));
        });
        this.register(this.markdownProvider.onDidDeleteDocument(deleted => {
            cache.delete(deleted.fsPath);
        }));
        this.register(this.markdownProvider.onDidUpdateDocument(updated => {
            cache.set(updated.uri.fsPath, this.scan(updated));
        }));
        return cache;
    }

    private scan(document: MarkdownDocument): Lazy<Thenable<SymbolInformation[]>> {
        return lazy(async () => {
            const symbols: SymbolInformation[] = [];
            for (let index = 0; index < document.lineCount; index++) {
                let line = document.lineAt(index).text;
                let match;
                while ((match = this.symbolRegex.exec(line)) !== null) {
                    const location = new Location(document.uri, 
                        new Range(index, match.index, index, match.index + match[0].length));
                    // If the matched item doesn't appear in about 80-100 characters it does NOT
                    // show up in symbol list, so truncate.
                    const start = Math.max(match.index - 70, 0);
                    symbols.push(new SymbolInformation(
                        line.slice(start, line.length),
                        SymbolKind.String,
                        '',
                        location));
                }
            }
            return symbols;
        });
    }
}