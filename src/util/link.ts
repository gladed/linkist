import {
    Location,
    Range,
    SymbolInformation,
    SymbolKind
} from 'vscode';

/** Encoding alphabet for link IDs. */
const alphabet = 'j6EpuN2TkFbJBVSCfhnarZ95W8KARmwUytiqQgcYxsX3D7dM4ePGzHv';

/** A standalone link ID like `^....^`. */
export const linkIdRe = /\^[A-Za-z0-9]{4,7}\^/g;

/** The prefix part of a markdown line including headings and bullets. */
export const markdownPrefixRe = new RegExp(/^ *(\#+ +|[0-9]+\. |[\*-] (\[.?\])?) */);

/** The [title] part of a markdown link */
export const markdownLinkTitleRe = /\[[^\\[]+\]/;

/**
 * A markdown-delimited link containing a link ID like `[text](^....^)` with text as the first group.
 */
export const markdownLinkRe = new RegExp(/\[([^\]]+)\]\(/.source + linkIdRe.source + '\\)');

/** Either a markdown-delimited link or a standalone link ID, globally matched. */
export const anyLinkRe = new RegExp('(' + markdownLinkRe.source + ')|(' + linkIdRe.source + ')', 'g');

/** Optionally prefixed form of any link (global). */
export const prefixedAnyLinkRe = new RegExp('(' + markdownPrefixRe.source + ')?((' +
    markdownLinkRe.source + ')|(' + linkIdRe.source + '))', 'g');

/**
 * A link identifier encoding a date and an ordinal into a short, random-looking string.
 */
export class LinkId {
    private constructor(
        /** Text representing the link, e.g. "iwy3" */
        public readonly text: string,
        /** Date of originally creation. */
        public readonly date: Date,
        /** Numeric offset within date. */
        public readonly ordinal: number
    ) { }

    /**
     * Given a text like "iwy3", return the corresponding {@link LinkId}.
     *
     * @param ordinal Numeric offset within the date (0-99).
     * @param date Date to encode in the link (default: today).
     */
    static decode(text: string): LinkId {
        const decoded = LinkId.decodeToInt(text);
        const ordinal = decoded % 100;
        const date = new Date((Math.floor(decoded / 100)) * 24 * 60 * 60 * 1000);
        return new LinkId(text, date, ordinal);
    }

    private static decodeToInt(text: string) {
        let digits: number[] = [];
        let lastDigit = 7;
        for (var i = 0; i < text.length; i++) {
            digits.unshift((alphabet.indexOf(text.charAt(i)) - lastDigit +
                alphabet.length) % alphabet.length);
            lastDigit = (lastDigit + digits[0]) % alphabet.length;
        }
        for (var value = 0; digits.length !== 0; value = value * alphabet.length + digits.shift()!) { }
        return value;
    }

    /**
     * Return a generated {@link LinkId}.
     *
     * @param ordinal Numeric offset within the date (0-99).
     * @param date Date to encode in the link (default: today).
     */
    static create(ordinal: number, date: Date = new Date()) {
        const days = Math.floor(date.getTime() / 8.64e7);
        return new LinkId(LinkId.endcodeToString(days * 100 + ordinal), date, ordinal);
    }

    private static endcodeToString(value: number) {
        let lastDigit = 7;
        let linkId = "";
        while (value !== 0) {
            let digit = value % alphabet.length;
            linkId = linkId + alphabet[(digit + lastDigit) % alphabet.length];
            lastDigit += digit;
            value = Math.floor(value / alphabet.length);
        }
        return linkId;
    }

    public equals(other: LinkId): boolean {
        return this.text === other.text;
    }
    public toString(): string {
        return this.text + "/" + this.date.toISOString().slice(0, 10) + "#" + this.ordinal;
    }
}

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

        /** The linkId found in {@param location}. */
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
    public isHead() {
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
            " prefix=" + this.prefix + " parent=" + this.parent?.linkId.text + ")";
    }
}
