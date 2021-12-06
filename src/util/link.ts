import {
    Location,
    Range,
    SymbolInformation,
    SymbolKind
} from 'vscode';
import { LinkId } from './linkId';

/** A standalone link ID like `^....^`. */
export const linkIdRe = /\^[A-Za-z0-9]{4,7}\^/g;

/** The prefix part of a markdown line including headings and bullets. */
export const markdownPrefixRe = new RegExp(/^ *(#+ +|[0-9]+\. |[*-] (\[.?\])?) */);

/** The [label] part of a markdown link */
export const markdownLinkLabelRe = /\[[^\\[]+\]/;

/**
 * A markdown-delimited link containing a link ID like `[label](^....^)` with label as the first matched group.
 */
export const markdownLinkRe = new RegExp(/\[([^\]]+)\]\(/.source + linkIdRe.source + '\\)');

/** Optionally prefixed form of any link (global). */
export const prefixedAnyLinkRe = new RegExp('(' + markdownPrefixRe.source + ')?((' +
    markdownLinkRe.source + ')|(' + linkIdRe.source + '))', 'g');


/** A specific instance where a link ID was found. */
export class Link extends SymbolInformation {
    /**
     * The range where this link (either markdown or standalone) is found
     */
    public get range(): Range {
        return this.location.range;
    }

    /**
     * The label (e.g. `[label](^...^)`) associated with this link, if any
     */
    public label?: string;

    constructor(
        /** Location of the complete `[markdown](^...^)` link or just `^...^` if standalone */
        location: Location,

        /** The entire line of text on which this link was found */
        public line: string,

        /** The linkId found at {@param location}. */
        public linkId: LinkId,

        /** The markdown prefix characters associated with this link, if any. */
        public prefix?: string,

        /** This link's "parent", e.g. the higher-level `# heading` under which it appears, if any. */
        public parent?: Link
    ) {
        /** Set an abbreviated form of the name. */
        super(Link.abbreviate(location, line), SymbolKind.String, '', location);

        const markdownMatch = line.substring(location.range.start.character, location.range.end.character).match(markdownLinkRe);
        if (markdownMatch) {
            this.label = markdownMatch[1];
        }
    }

    public toMarkdown() {
        return '['  + (this.label ? this.label : "???") + '](^' + this.linkId.text + '^)';
    }

    /** Return true if this link is a "head" (occurs on a markdown heading line). */
    public get isHead() {
        return this.line.startsWith('#');
    }

    /** Return an abbreviated form of the link, suitable for display in symbol lists. */
    private static abbreviate(location: Location, line: string) {
        if (location.range.start.character < 20) {
            return line.substring(0, location.range.end.character);
        }
        else {
            return line.substring(location.range.start.character - 10, location.range.end.character);
        }
    }

    public toString() {
        return "Link(uri=" + this.location.uri.fsPath + ":" + this.location.range.start.line +
            "#" + this.location.range.start.character + "-" + this.location.range.end.character + " " + this.linkId.toString() +
            " line=" + this.line + " prefix=" + this.prefix + " parent=" + this.parent?.linkId.text + ")";
    }
}
