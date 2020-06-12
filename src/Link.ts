import { 
    Location,
    DocumentLink,
    Range,
    SymbolInformation,
    SymbolKind,
    Uri
} from 'vscode';

import { LinkId } from './util/linkId';

/** A specific instance where a link ID was found. */
export class Link extends SymbolInformation implements DocumentLink {
    /**
     * The range where this link is found
     */
    public get range(): Range {
        return this.location.range;
    }
    
    /**
     * The uri this link points to, may not yet be known.
     */
    public target?: Uri;
    
    /**
     * The tooltip text when you hover over this link.
     */
    public tooltip?: string;

    constructor(
        /**
         * Location of the complete `[markdown](^...^)` link or just `^...^` if standalone
         */
        location: Location,
        /**
         * The entire line of text on which this link was found
         */
        public line: string,
        /** The linkId found in {@param location}. */
        public linkId: LinkId) {
        super(Link.abbreviate(location, line), SymbolKind.String, '', location);
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
}
