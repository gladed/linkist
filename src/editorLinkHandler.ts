import {
    TextDocument,
    Position,
    Range,
    TextEditor,
    Uri,
    workspace,
    commands,
    window
} from 'vscode';
import { camelize, titleCase } from './util/text';
import { TextEncoder } from 'util';
import Linker from './linker';
import { linkIdRe, markdownLinkRe, markdownPrefixRe, markdownLinkLabelRe } from './util/link';

export class EditorLinkHandler {

    /** An optionally prefixed link with no target attached. */
    noTargetRe = new RegExp('(' + markdownPrefixRe.source + ')?\\[[^\\]]{2,}\\]');
    /** An optionally prefixed link with an empty target. */
    emptyTargetRe = new RegExp(this.noTargetRe.source + '\\(\\)');
    /** An optionally prefixed link containing ANY target. */
    anyTargetRe = new RegExp(this.noTargetRe.source + '\\([^\\)]+\\)');
    /** A line with prefix parts also containing a link. */
    prefixLinkRe = new RegExp('(' + markdownPrefixRe.source + ')?' + markdownLinkRe.source);
    prefixedUnlinkedLineRe = new RegExp(markdownPrefixRe.source + '[^\\[]+');

    constructor(private linker: Linker) { }

    public linkIdAt(document: TextDocument, position: Position): string | undefined {
        // Find fully-qualified link
        let range = document.getWordRangeAtPosition(position, this.prefixLinkRe);
        if (range) {
            return document.getText(range).match(linkIdRe)![0].slice(1, -1);
        }

        // Allow for standalone link IDs ^...^
        range = document.getWordRangeAtPosition(position, linkIdRe);
        if (range) {
            range = new Range(range.start.translate(0, 1), range.end.translate(0, -1));
            return document.getText(range);
        }
        return undefined;
    }

    /** Return the range around JUST the markdown link, without any prefix. */
    private findMarkdownLink(editor: TextEditor, position: Position): Range | undefined {
        const matchRange = editor.document.getWordRangeAtPosition(position, this.prefixLinkRe);
        if (!matchRange) { return undefined; }

        const prefixMatch = editor.document.getText(matchRange).match(markdownPrefixRe);
        if (prefixMatch) {
            return new Range(matchRange.start.translate(0, prefixMatch[0].length),
                matchRange.end);
        } else {
            return matchRange;
        }
    }

    /**
     * Find or create a good insertion point for a new link, add appropriate content,
     * and return a position where the new text may be inserted
     */
    public async insertLink(editor: TextEditor) {
        const multiline = editor.selection.active.line !== editor.selection.anchor.line;
        if (multiline) {
            return await this.handleMultiLine(editor);
        } else {
            return await this.handleSingleLine(editor, editor.selection);
        }
    }

    private async handleSingleLine(
        editor: TextEditor,
        range: Range,
        linkText: string | undefined = undefined
    ): Promise<Range | undefined> {
        // If there's a link present already, return it
        const linkedRange = this.findMarkdownLink(editor, range.start);
        if (linkedRange) {
            return linkedRange;
        }
        return await this.handleEmptyTarget(editor, range.start) ||
            this.handleHasTarget(editor, range) ||
            await this.handleNoTarget(editor, range.start, linkText) ||
            await this.handleUnlinked(editor, range);
    }

    private async handleEmptyTarget(editor: TextEditor, at: Position): Promise<Range | undefined> {
        // `[empty target]()`
        const emptyLink = editor.document.getWordRangeAtPosition(at, this.emptyTargetRe);
        if (!emptyLink) { return; }

        const spot = emptyLink.end.translate(0, -1);
        const linkText = (await this.linker.newLinkId(editor.document.getText(emptyLink))).text;
        await editor.edit(builder => {
            builder.insert(spot, "^" + linkText + "^");
        });
        return this.findMarkdownLink(editor, spot);
    }

    private async handleNoTarget(editor: TextEditor, at: Position, linkText: string | undefined): Promise<Range | undefined> {
        // `[no target yet]`
        const unlinked = editor.document.getWordRangeAtPosition(at, this.noTargetRe);
        if (!unlinked) { return; }

        const spot = unlinked.end;
        const linkTextToInsert = linkText ? linkText : (await this.linker.newLinkId(editor.document.getText(unlinked))).text;
        await editor.edit(editBuilder => {
            editBuilder.insert(spot, "(^" + linkTextToInsert + "^)");
        });
        return this.findMarkdownLink(editor, spot);
    }

    public handleHasTarget(editor: TextEditor, at: Range): Range | undefined {
        const alreadyLinked = editor.document.getWordRangeAtPosition(at.start, this.anyTargetRe);
        if (alreadyLinked) {
            return at;
        }
        return undefined;
    }

    /** If there is a link of any kind anywhere around {@param at} then open its target. */
    public visitUri(editor: TextEditor, at: Range): boolean {
        const alreadyLinked = editor.document.getWordRangeAtPosition(at.start, this.anyTargetRe);
        if (!alreadyLinked) { return false; }

        try {
            const alreadyLinkedText = editor.document.getText(alreadyLinked);
            const dest = Uri.parse(alreadyLinkedText.match(/\[[^\]]*\]\(([^)]+)\)/)![1], true);
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
        const linkText = (await this.linker.newLinkId(editor.document.getText(at))).text;
        const linkLabel = editor.document.getText(linkRange).toLowerCase();
        const match = (await this.linker.allLinks()).find((link) => link.label?.toLowerCase() === linkLabel);
        if (match) {
            await editor.edit(builder => {
                builder.insert(linkRange.start, "[");
                builder.insert(linkRange.end, "](^" + match.linkId.text + "^)");
            });
        } else {
            await editor.edit(builder => {
                builder.insert(linkRange.start, "[");
                builder.insert(linkRange.end, "](^" + linkText + "^)");
            });
        }
        return this.findMarkdownLink(editor, linkRange.start);
    }

    private findLinkableRange(editor: TextEditor, near: Range): Range {
        // If nothing selected, pick a likely candidate for selection
        let result: Range | undefined;
        if (editor.document.getText(near).length === 0) {
            // `# A bunch of text in a heading`
            const prefixRange = editor.document.getWordRangeAtPosition(near.start, this.prefixedUnlinkedLineRe);
            if (prefixRange) {
                const lineRange = editor.document.lineAt(prefixRange.start.line).range;
                const start = lineRange.start.translate(0,
                    editor.document.getText(prefixRange).match(markdownPrefixRe)![0].length);
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

        const titleLinkText = editor.document.getText(titleRange);
        const title = editor.document.getText(titleRange).match(markdownLinkLabelRe)![0];
        const fileName = camelize(title);
        let text = editor.document.getText(editor.selection).replace(/^#+/,'#');

        const titleLink = await this.linker.linkAt(editor.document.uri, titleRange.start);
        if (titleLink?.parent) {
            text = text.replace(/.*\n/, '$&\nFrom: ' + titleLink.parent.toMarkdown() + '\n\n');
        }

        const destUri = await this.createTargetFile(editor.document.uri, fileName, text);
        if (!destUri) {
            // Could not create destination file
            return;
        }
        await editor.edit(builder => {
            builder.delete(editor.selection);
            builder.insert(origin, "* " + titleLinkText);
        });
        return titleRange;
    }

    public async createNote(editor: TextEditor): Promise<boolean> {
        const link = await this.linker.linkAt(editor.document.uri, editor.selection.start);
        if (!link || !link.label || link.isHead) {
            return false;
        }
        const title = titleCase(link.label);
        const fileName = camelize(title);
        let text = '# [' + title + '](^' + link.linkId.text + '^)\n';
        if (link?.parent) {
            text = text + '\nFrom: ' + link.parent.toMarkdown() + '\n';
        }
        const destUri = await this.createTargetFile(editor.document.uri, fileName, text);
        if (!destUri) {
            window.showWarningMessage("Could not create " + fileName);
            return false;
        }
        await window.showTextDocument(destUri);
        return true;
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
