import {
    Location,
    Range,
    SymbolInformation,
    SymbolKind,
    Uri,
    WorkspaceSymbolProvider,
} from 'vscode';
import { Disposable } from './util/disposable';
import { Lazy, lazy } from './util/lazy';
import { LinkId } from './util/linkId';
import { MarkdownDocument } from './markdown';
import MarkdownDocumentProvider from './markdownDocumentProvider';

export function flatten<T>(arr: ReadonlyArray<T>[]): T[] {
    return ([] as T[]).concat.apply([], arr);
}

export class Link extends SymbolInformation {
    constructor(
        /**
         * A descriptive string for the link. May include some context around the link to allow
         * for better pattern matching. (TODO: Sloppy but required for good symbol searches.)
         */
        name: string,

        /**
         * Location of the complete `[markdown](^...^)` link or just `^...^` if standalone
         */
        location: Location,

        /** The referenced linkId found in {@param location}. */
        public linkId: LinkId
    ) {
        super(name, SymbolKind.String, '', location);
    }
}

/** A class that delivers links upon request. */
export default class MarkdownLinkProvider extends Disposable implements WorkspaceSymbolProvider {
    /** A map of markdown resource locations to lazily-evaluated lists of links. */
    private cache: Map<Uri, Lazy<Link[]>> | undefined;

    private linkIdRe = /\^[A-Za-z0-9]{4,7}\^/g;
    private markdownLinkRe = new RegExp(/\[[^\]]\]\(/.source + this.linkIdRe.source + '\\)');
    private anyLinkRe = new RegExp(
        '(' + this.markdownLinkRe.source + ')|(' + this.linkIdRe.source + ')', 'g');

    public constructor(
        private markdownProvider = new MarkdownDocumentProvider()
    ) {
        super();
    }

    /** Return an unused link ID appropriate for the current date. */
    public async newLinkId() {
        let ordinal = 0;
        while (true) {
            let linkId = LinkId.create(ordinal++);
            if ((await this.lookupLinks(linkId.text)).length === 0) {
                return linkId;
            }
        }
    }

    /** Given a query, return matching symbols. */
    public async provideWorkspaceSymbols(query: string): Promise<SymbolInformation[]> {
        return this.lookupLinks(query).then(symbols =>
            // Skip TOC lines because built-in "markdown-language-features" finds these
            symbols.filter(symbol => !symbol.name.startsWith("#")));
    }

    public async lookupLinks(query: string): Promise<Link[]> {
        if (this.cache === undefined) {
            this.cache = await this.initCache();
        }
        return Promise.all(Array.from(this.cache.values()).map(x => x.value))
            .then(sets => {
                let all = flatten(sets)
                    .filter(symbol => symbol.name.indexOf(query) !== -1);

                // Don't return multiple indexes for the same line??
                // TODO: Problem if there is a second index on a very long paragraph?
                return all.filter((item, index, array) =>
                    array.findIndex(item2 =>
                        item.location.range.start.line === item2.location.range.start.line &&
                        item.location.uri === item2.location.uri) === index);
            });
    }

    /** Return an initially populated cache of links */
    private async initCache() {
        const cache = new Map<Uri, Lazy<Link[]>>();

        // Initialize the cache and watch for document changes anywhere
        await this.markdownProvider.forEach(doc => {
            cache.set(doc.uri, this.scan(doc));
        });
        this.register(this.markdownProvider.onDidDeleteDocument(deleted => {
            cache.delete(deleted);
        }));
        this.register(this.markdownProvider.onDidUpdateDocument(updated => {
            cache.set(updated.uri, this.scan(updated));
        }));
        return cache;
    }

    private scan(document: MarkdownDocument): Lazy<Link[]> {
        return lazy(() => {
            const links: Link[] = [];
            for (let index = 0; index < document.lineCount; index++) {
                let line = document.lineAt(index).text;
                let match;
                while ((match = this.anyLinkRe.exec(line)) !== null) {
                    const linkId = LinkId.decode(match[0].match(this.linkIdRe)![0]);
                    const location = new Location(document.uri,
                        new Range(index, match.index, index, match.index + match[0].length));
                    // If the matched item doesn't appear in about 80-100 characters it does NOT
                    // show up in symbol list, so truncate.
                    const start = Math.max(match.index - 70, 0);
                    links.push(new Link(
                        line.slice(start, line.length),
                        location,
                        linkId));
                }
            }
            return links;
        });
    }
}