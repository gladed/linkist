import {
    Location,
    Position,
    Range,
    Uri,
} from 'vscode';
import { Disposable } from './util/disposable';
import { Lazy, lazy } from './util/lazy';
import { MarkdownDocument } from './markdown';
import MarkdownDocumentProvider from './markdownDocumentProvider';
import { Link, LinkId, linkIdRe, prefixedAnyLinkRe, markdownPrefixRe } from './util/link';
import { textToDate } from './util/date';

/** A class that delivers links upon request. */
export default class Linker extends Disposable {

    private _cache = lazy(async () => {
        let cache = new Map<string, Lazy<Link[]>>();

        // Initialize the cache and watch for document changes anywhere
        await this.markdownProvider.forEach(doc => {
            cache.set(doc.uri.fsPath, this.scan(doc));
            this.refreshLinks();
        });
        this.register(this.markdownProvider.onDidDeleteDocument(deleted => {
            this.invalidateLinks(cache.get(deleted.fsPath)?.value);
            cache.delete(deleted.fsPath);
            this.refreshLinks();
        }));
        this.register(this.markdownProvider.onDidUpdateDocument(updated => {
            this.invalidateLinks(cache.get(updated.uri.fsPath)?.value);
            cache.set(updated.uri.fsPath, this.scan(updated));
            this.refreshLinks();
        }));
        return cache;
    });

    /** A map of all link IDs to known links objects. */
    private linkMap = new Map<string, Link[]>();

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

    private invalidateLinks(links: Link[] | undefined) {
        for (let link of links ?? []) {
            this.linkMap.delete(link.linkId.text);
        }
    }

    private async refreshLinks() {
        // Compile a list of link IDs whose lists changed
        const toAdd = new Map<string, Link[]>();
        for (let links of (await this.cache).values()) {
            for (let link of links.value) {
                let linkIdText = link.linkId.text;
                if (!this.linkMap.get(linkIdText)) {
                    const addLinks = toAdd.get(linkIdText);
                    if (addLinks) {
                        addLinks.push(link);
                    } else {
                        toAdd.set(linkIdText, [link]);
                    }
                }
            }
        }
        for (let links of toAdd.values()) {
            // May have to clear parent links on these
            this.linkMap.set(links[0].linkId.text, links);
        }
    }

    /** Return an unused link ID appropriate for the current date. */
    public async newLinkId(name: string = '') {
        let ordinal = 0;
        const date = textToDate(name);
        while (true) {
            let linkId = LinkId.create(ordinal++, date);
            if ((await this.lookupLinks(linkId.text)).length === 0) {
                return linkId;
            }
        }
    }

    /** Return all links matching linkText. */
    public linksFor(linkText: string) {
        return this.linkMap.get(linkText);
    }

    /** Return links found in the current resource if any. */
    public async linksIn(resource: Uri) {
        return (await this.cache).get(resource.fsPath)?.value;
    }

    /** Return the link at the specified location if any. */
    public async linkAt(resource: Uri, at: Position) {
        const links: Link[] | undefined = (await this.cache).get(resource.fsPath)?.value;
        if (links) {
            for (let link of links) {
                if (link.location.range.contains(at)) {
                    return link;
                }
            }
        }
        return undefined;
    }

    /** Given a query string, return any links that appear to match, even partially. */
    public async lookupLinks(query: string): Promise<Link[]> {
        return Promise.all(Array.from((await this.cache).values()).map(x => x.value))
            .then(sets => {
                let all = flatten(sets)
                    .filter(symbol => symbol.name.indexOf(query) !== -1);

                // Don't return multiple matches for the same line?
                return all.filter((item, index, array) =>
                    array.findIndex(item2 =>
                        item.location.range.start.line === item2.location.range.start.line &&
                        item.location.uri.fsPath === item2.location.uri.fsPath) === index);
            });
    }

    /** Return all of the links found in the supplied document. */
    private scan(document: MarkdownDocument): Lazy<Link[]> {
        return lazy(() => {
            const links: Link[] = [];
            for (let index = 0; index < document.lineCount; index++) {
                let lineText = document.lineAt(index).text;
                let match;
                while ((match = prefixedAnyLinkRe.exec(lineText)) !== null) {
                    const linkId = LinkId.decode(match[0].match(linkIdRe)![0].slice(1, -1));
                    let location, prefix, prefixMatch;
                    if (prefixMatch = match[0].match(markdownPrefixRe)) {
                        // There's a prefix involved in this link:
                        location = new Location(document.uri,
                            new Range(index, match.index + prefixMatch[0].length, index, match.index + match[0].length));
                        prefix = prefixMatch[0].trim();
                    } else {
                        location = new Location(document.uri,
                            new Range(index, match.index, index, match.index + match[0].length));
                    }
                    // const noPrefixMatch = anyLinkRe.exec(match[0])!;
                    links.push(new Link(location, lineText, linkId, prefix));
                }
            }
            return links;
        });
    }
}

/** For an array of arrays return a single-depth array. */
function flatten<T>(arr: ReadonlyArray<T>[]): T[] {
    return ([] as T[]).concat.apply([], arr);
}
