import {
    CancellationToken,
    Location,
    DocumentLinkProvider,
    Range,
    SymbolInformation,
    TextDocument,
    Uri,
    WorkspaceSymbolProvider,
} from 'vscode';
import { Disposable } from './util/disposable';
import { Lazy, lazy } from './util/lazy';
import { LinkId } from './util/linkId';
import { MarkdownDocument } from './markdown';
import MarkdownDocumentProvider from './markdownDocumentProvider';
import { Re } from './util/re';
import { Link } from './link';

export function flatten<T>(arr: ReadonlyArray<T>[]): T[] {
    return ([] as T[]).concat.apply([], arr);
}

/** A class that delivers links upon request. */
export default class MarkdownLinkProvider extends Disposable
    implements WorkspaceSymbolProvider, DocumentLinkProvider
{
    private _cache = lazy(async () => {
        let cache = new Map<string, Lazy<Link[]>>();

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
    });

    /**
     * A map of markdown resource locations to lazily-evaluated lists of links.
     * Note: string is used instead of Uri for accurate comparisons.
     */
    private get cache(): Promise<Map<string, Lazy<Link[]>>> {
        return this._cache.value;
    }

    public constructor(
        private markdownProvider = new MarkdownDocumentProvider()
    ) {
        super();
    }

    /** WorkspaceSymbolProvider: Return an unused link ID appropriate for the current date. */
    public async newLinkId() {
        let ordinal = 0;
        while (true) {
            let linkId = LinkId.create(ordinal++);
            if ((await this.lookupLinks(linkId.text)).length === 0) {
                return linkId;
            }
        }
    }

    /** DocumentLinkProvider: quickly return all links in {@param document}. */
    public async provideDocumentLinks(document: TextDocument, _: CancellationToken) {
        return (await this.cache).get(document.uri.fsPath)?.value;
    }

    /** DocumentLinkProvider: resolve links found in a document. */
    public async resolveDocumentLink(link: Link, _: CancellationToken) {
        for (let links of (await this.cache).values()) {
            for (let found of links.value) {
                if (found.linkId.equals(link.linkId) && found.isHead()) {
                    const lineNumber = found.location.range.start.line + 1;
                    link.target = Uri.parse(found.location.uri.toString() + "#L" + lineNumber);
                    return link;
                }
            }
        }
        return link;
    }

    /** Given a query, return matching symbols. */
    public async provideWorkspaceSymbols(query: string): Promise<SymbolInformation[]> {
        return this.lookupLinks(query).then(links =>
            // Skip TOC lines because built-in "markdown-language-features" finds these
            links.filter(link => !link.name.startsWith("#")));
    }

    public async lookupLinks(query: string): Promise<Link[]> {
        return Promise.all(Array.from((await this.cache).values()).map(x => x.value))
            .then(sets => {
                let all = flatten(sets)
                    .filter(symbol => symbol.name.indexOf(query) !== -1);

                // Don't return multiple indexes for the same line??
                // TODO: Problem if there is a second index on a very long paragraph?
                return all.filter((item, index, array) =>
                    array.findIndex(item2 =>
                        item.location.range.start.line === item2.location.range.start.line &&
                        item.location.uri.fsPath === item2.location.uri.fsPath) === index);
            });
    }

    private scan(document: MarkdownDocument): Lazy<Link[]> {
        return lazy(() => {
            const links: Link[] = [];
            for (let index = 0; index < document.lineCount; index++) {
                let lineText = document.lineAt(index).text;
                let match;
                while ((match = Re.anyLink.exec(lineText)) !== null) {
                    console.log("In " + document.uri.fsPath + " matched " + match[0]);
                    const linkId = LinkId.decode(match[0].match(Re.linkId)![0].slice(1, -1));
                    const location = new Location(document.uri,
                        new Range(index, match.index, index, match.index + match[0].length));
                    links.push(new Link(
                        location,
                        lineText,
                        linkId));
                }
            }
            return links;
        });
    }
}