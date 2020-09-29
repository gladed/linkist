import {
    CancellationToken,
    EventEmitter,
    Location,
    Position,
    Range,
    Uri,
} from 'vscode';
import { Disposable } from './util/disposable';
import { Lazy, lazy } from './util/lazy';
import { MarkdownDocument } from './markdown';
import MarkdownScanner from './markdown';
import { Link, LinkId, linkIdRe, prefixedAnyLinkRe, markdownPrefixRe } from './util/link';
import { textToDate } from './util/date';

/** Scans for {@link Link}s in markdown documents. */
export default class Linker extends Disposable {

    private readonly onUpdatedLinksEmitter = this.register(new EventEmitter<Uri>());

    /** Return an event that fires whenever a resource has new links. */
    public get onUpdatedLinks() {
        return this.onUpdatedLinksEmitter.event;
    }

    /** A map of all link IDs to known Link objects. */
    private linkMap = new Map<string, Link[]>();

    /** A lazily-evaluated map of file paths to arrays of links within. */
    private lazyFileMap = lazy(async () => {
        // Note: Strings are used because Uri's are not stable map keys
        let cache = new Map<string, Lazy<Link[]>>();

        // Initialize the cache
        await this.scanner.forEach(doc => {
            cache.set(doc.uri.fsPath, this.scan(doc));
        });
        this.refreshLinks();

        // Watch everywhere for changes
        this.register(this.scanner.onDidDeleteDocument(deleted => {
            const lostLinks = cache.get(deleted.fsPath)?.value;
            this.invalidateLinks(lostLinks);
            cache.delete(deleted.fsPath);
            this.refreshLinks();
        }));
        this.register(this.scanner.onDidUpdateDocument(updated => {
            const lostLinks = cache.get(updated.uri.fsPath)?.value;
            this.invalidateLinks(lostLinks);
            cache.set(updated.uri.fsPath, this.scan(updated));
            this.refreshLinks();
        }));
        return cache;
    });

    /** Shortcut to get the fileMap when it's ready. */
    private get fileMap(): Promise<Map<string, Lazy<Link[]>>> {
        return this.lazyFileMap.value;
    }

    public constructor(private scanner: PublicInterfaceOf<MarkdownScanner> = new MarkdownScanner()) {
        super();
    }

    /** Wipe out all knowledge of {@param links} so they can be repopulated. */
    private invalidateLinks(links: Link[] | undefined) {
        for (let link of links ?? []) {
            this.linkMap.delete(link.linkId.text);
        }
    }

    private async refreshLinks() {
        const urisUpdated: Uri[] = [];
        // Review all links in all files
        const toAdd = new Map<string, Link[]>();
        for (let links of (await this.fileMap).values()) {
            for (let link of links.value) {
                let linkIdText = link.linkId.text;
                if (!this.linkMap.get(linkIdText)) {
                    // This link isn't in the map yet so build it up
                    const addLinks = toAdd.get(linkIdText);
                    if (addLinks) {
                        addLinks.push(link);
                    } else {
                        toAdd.set(linkIdText, [link]);
                    }
                    if (!urisUpdated.find(uri => link.location.uri.fsPath === uri.fsPath)) {
                        urisUpdated.push(link.location.uri);
                    }
                }
            }
        }

        for (let links of toAdd.values()) {
            this.linkMap.set(links[0].linkId.text, links);
        }

        for (let uri of urisUpdated) {
            this.onUpdatedLinksEmitter.fire(uri);
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

    /** Return all currently-known links matching link ID text. */
    public linksFor(linkText: string): (Link[] | undefined) {
        return this.linkMap.get(linkText);
    }

    /** Return links found in the current resource if any. */
    public async linksIn(resource: Uri) {
        return (await this.fileMap).get(resource.fsPath)?.value;
    }

    /** Return the link at the specified location if any. */
    public async linkAt(resource: Uri, at: Position) {
        const links: Link[] | undefined = (await this.fileMap).get(resource.fsPath)?.value;
        if (links) {
            for (let link of links) {
                if (link.location.range.contains(at)) {
                    return link;
                }
            }
        }
        return undefined;
    }

    public async allLinks(token: CancellationToken | undefined = undefined): Promise<Link[]> {
        return Array.from((await this.fileMap).values()).reduce<Link[]>((previousValue: Link[], currentValue: Lazy<Link[]>) => {
            if (token?.isCancellationRequested) {
                return [];
            } else {
                return previousValue.concat(currentValue.value);
            }
        }, []);
    }

    /** Given a query string, return any links that appear to match, even partially. */
    public async lookupLinks(query: string, token: CancellationToken | undefined = undefined): Promise<Link[]> {
        return Promise.all(Array.from((await this.fileMap).values())
            .map(x => x.value))
            .then(sets => {
                if (token?.isCancellationRequested) {
                    return [];
                }
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
            let parent: Link | undefined;

            for (let index = 0; index < document.lineCount; index++) {
                let lineText = document.lineAt(index).text;
                let match;

                // For any heading line, roll parent back to a link above it if possible
                const depth = headDepth(lineText);
                while (parent?.prefix && depth && depth <= parent.prefix.length && parent.parent) {
                    parent = parent.parent;
                }

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
                    const newLink = new Link(location, lineText, linkId, prefix, parent);
                    links.push(newLink);
                    if (newLink.prefix && headDepth(newLink.prefix)) {
                        parent = newLink;
                    }
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

function headDepth(text: string): number | undefined {
    let match = text.match(/^\#+/);
    return match ? match[0].trim().length : undefined;
}
