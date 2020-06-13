import {
    Position,
    Range,
    Selection,
    TextEditor,
    Uri,
    workspace,
    commands,
} from 'vscode';
import { camelize } from './util/text';
import { TextEncoder } from 'util';
import { Re } from './util/re';
import MarkdownLinkProvider from './markdownLinkProvider';

export class EditorLinkHandler {

    /** The [title] part of a markdown link */
    linkTitleRe = /\[[^\\[]+\]/;
    /** The [whole](link) */
    linkRe = new RegExp(this.linkTitleRe.source + '\\(' + Re.linkId.source + '\\)');
    /** The prefix part of a markdown line including headings and bullets. */
    prefixRe = new RegExp(/^ *(\#+|[0-9]+\.|[\*-]( ?\[.?\])?) */);
    /** An optionally prefixed link with no target attached. */
    noTargetRe = new RegExp('(' + this.prefixRe.source + ')?\\[[^\\]]{2,}\\]');
    /** An optionally prefixed link with an empty target. */
    emptyTargetRe = new RegExp(this.noTargetRe.source + '\\(\\)');
    /** An optionally prefixed link containing ANY target. */
    anyTargetRe = new RegExp(this.noTargetRe.source + '\\([^\\)]+\\)');

    prefixedUnlinkedLineRe = new RegExp(this.prefixRe.source + '[^\\[]+');
    prefixLinkRe = new RegExp('(' + this.prefixRe.source + ')?' + this.linkRe.source);

    constructor(private linkProvider: MarkdownLinkProvider) { }

    // Given the current selection, find and extract the nearest link ID inside it
    public linkIdNearCursor(editor: TextEditor): string | undefined {
        // Ignore multi-line selection
        if (editor.selection.start.line !== editor.selection.end.line) { return undefined; }

        // Cursor plain link ID
        let match = editor.document.getWordRangeAtPosition(editor.selection.active, Re.linkId);
        if (match) {
            editor.selection = new Selection(
                match.start.translate(0, 1), match.end.translate(0, -1));
            return editor.document.getText(editor.selection);
        }

        // Cursor on `* [markdown](^....^)` link ID
        match = editor.document.getWordRangeAtPosition(editor.selection.active, this.prefixLinkRe);
        if (match) {
            editor.selection = new Selection(match.end.translate(0, -6), match.end.translate(0, -2));
            return editor.document.getText(editor.selection);
        }
        return undefined;
    }

    /** Return the range around JUST the markdown link, without any prefix. */
    private findLink(editor: TextEditor, position: Position): Range | undefined {
        const matchRange = editor.document.getWordRangeAtPosition(position, this.prefixLinkRe);
        if (!matchRange) { return undefined; }

        const prefixMatch = editor.document.getText(matchRange).match(this.prefixRe);
        if (prefixMatch) {
            return new Range(matchRange.start.translate(0, prefixMatch[0].length),
                matchRange.end);
        } else {
            return matchRange;
        }
    }

    /**
     * Find or create a good insertion point for a new tag, add appropriate content,
     * and return a position where the new text may be inserted
     */
    public async insertLink(editor: TextEditor) {
        const at = editor.selection.active;
        const multiline = editor.selection.active.line !== editor.selection.anchor.line;
        if (multiline) {
            return await this.handleMultiLine(editor);
        } else {
            return await this.handleSingleLine(editor, editor.selection);
        }
    }

    private async handleSingleLine(editor: TextEditor, range: Range): Promise<Range | undefined> {
        // If there's a link present already, return it
        let linkedRange = this.findLink(editor, range.start);
        if (linkedRange) {
            return linkedRange;
        }
        return await this.handleEmptyTarget(editor, range.start) ||
            this.handleHasTarget(editor, range) ||
            await this.handleNoTarget(editor, range.start) ||
            await this.handleUnlinked(editor, range);
    }

    private async handleEmptyTarget(editor: TextEditor, at: Position): Promise<Range | undefined> {
        // `[empty target]()`
        const emptyLink = editor.document.getWordRangeAtPosition(at, this.emptyTargetRe);
        if (!emptyLink) { return; }

        const spot = emptyLink.end.translate(0, -1);
        const linkText = (await this.linkProvider.newLinkId(editor.document.getText(emptyLink))).text;
        await editor.edit(builder => {
            builder.insert(spot, "^" + linkText + "^");
        });
        return this.findLink(editor, spot);
    }

    private async handleNoTarget(editor: TextEditor, at: Position): Promise<Range | undefined> {
        // `[no target yet]`
        const unlinked = editor.document.getWordRangeAtPosition(at, this.noTargetRe);
        if (!unlinked) { return; }

        const spot = unlinked.end;
        const linkText = (await this.linkProvider.newLinkId(editor.document.getText(unlinked))).text;
        await editor.edit(editBuilder => {
            editBuilder.insert(spot, "(^" + linkText + "^)");
        });
        return this.findLink(editor, spot);
    }

    public handleHasTarget(editor: TextEditor, at: Range): Range | undefined {
        const alreadyLinked = editor.document.getWordRangeAtPosition(at.start, this.anyTargetRe);
        if (alreadyLinked) {
            return at;
        }
        return undefined;
    }

    public visitUri(editor: TextEditor, at: Range): boolean {
        const alreadyLinked = editor.document.getWordRangeAtPosition(at.start, this.anyTargetRe);
        if (!alreadyLinked) { return false; }

        try {
            const alreadyLinkedText = editor.document.getText(alreadyLinked);
            const dest = Uri.parse(alreadyLinkedText.match(/\[[^\]]*\]\(([^\)]+)\)/)![1], true);
            commands.executeCommand('vscode.open', dest);
            return true;
        } catch (e) {
            return false;
        }
    }

    /** Given a selection containing no link, identify a good range to link and insert one. */
    private async handleUnlinked(editor: TextEditor, at: Range): Promise<Range | undefined> {
        // Find a range and promote it to a link
        const linkRange: Range = this.findLinkableRange(editor, at);
        const linkText = (await this.linkProvider.newLinkId(editor.document.getText(at))).text;
        await editor.edit(builder => {
            builder.insert(linkRange.start, "[");
            builder.insert(linkRange.end, "](^" + linkText + "^)");
        });
        return this.findLink(editor, linkRange.start);
    }

    private findLinkableRange(editor: TextEditor, near: Range): Range {
        // If nothing selected, pick a likely candidate for selection
        let result: Range | undefined;
        if (editor.document.getText(near).length === 0) {
            // `# A bunch of text in a heading`
            let prefixRange = editor.document.getWordRangeAtPosition(near.start, this.prefixedUnlinkedLineRe);
            if (prefixRange) {
                const lineRange = editor.document.lineAt(prefixRange.start.line).range;
                const start = lineRange.start.translate(0,
                    editor.document.getText(prefixRange).match(this.prefixRe)![0].length);
                result = new Range(start, lineRange.end);
            } else {
                result = editor.document.getWordRangeAtPosition(near.start);
            }
        }
        if (!result) {
            result = new Range(near.start, near.end);
        }
        return result;
    }

    private async handleMultiLine(editor: TextEditor): Promise<Range | undefined> {
        // Make sure there's a link on the first line
        const origin = editor.selection.start;
        const titleRange = await this.handleSingleLine(editor, new Range(origin, origin));
        if (!titleRange) { return; }

        const titleLink = editor.document.getText(titleRange);
        const title = editor.document.getText(titleRange).match(this.linkTitleRe)![0];
        const fileName = camelize(title);
        const text = editor.document.getText(editor.selection).replace(/^\#+/,'#');
        const destUri = await this.createTargetFile(editor.document.uri, fileName, text);
        if (!destUri) {
            // Could not create destination file
            return;
        }
        await editor.edit(builder => {
            builder.delete(editor.selection);
            builder.insert(origin, "* " + titleLink);
        });
        return titleRange;
    }

    private async createTargetFile(near: Uri, name: string, text: string): Promise<Uri | undefined> {
        let start = 0;
        while (start < 10) {
            const destUri = Uri.joinPath(near, "..", name + (start === 0 ? "" : start) + ".md");
            try {
                await workspace.fs.stat(destUri);
            } catch (e) {
                await workspace.fs.writeFile(destUri, new TextEncoder().encode(text));
                return destUri;
            }
            start++;
        }
        return;
    }
}
