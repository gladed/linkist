import {
    Position,
    Range,
    Selection,
    TextEditor,
} from 'vscode';


export class EditorLinkHandler {
    // Given the current selection, find and extract the nearest link ID inside it
    public linkIdNearCursor(editor: TextEditor): string | undefined {
        // Cursor on naked link ID
        let match = editor.document.getWordRangeAtPosition(editor.selection.active,
            /\^[A-Za-z0-9]{4,7}\^/
        );
        if (match) {
            return editor.document.getText(new Selection(
                match.start.translate(0, 1), match.end.translate(0, -1)));
        }

        // Cursor on [markdown](^....^) link ID
        match = editor.document.getWordRangeAtPosition(editor.selection.active,
            /(^[\#0-9\-\*\. ]+)?\[[^\]]*\]\(\^[A-Za-z0-9]{4,7}\^\)/
        );
        if (match) {
            return editor.document.getText(new Selection(
                match.end.translate(0, -6), match.end.translate(0, -2)));
        }

        return undefined;
    }
    
    private selectLink(editor: TextEditor, position: Position) {
        const linkRange = editor.document.getWordRangeAtPosition(position,
            /\[[^\[]+\]\([A-Za-z0-9\^]+\)/);
        if (linkRange) {
            editor.selection = new Selection(linkRange.start, linkRange.end);
        }
    }

    /**
     * Find or create a good insertion point for a new tag, add appropriate content,
     * and return a position where the new text may be inserted
     */
    public async insertLink(editor: TextEditor, link: string) {
        return await this.handleEmptyTarget(editor, link) || 
            await this.handleNoTarget(editor, link) ||
            await this.handleSingleLine(editor, link) ||
            await this.handleMultiLine(editor, link);
    }

    private async handleEmptyTarget(editor: TextEditor, link: string): Promise<boolean> {
        // `[empty target]()`
        const emptyLink = editor.document.getWordRangeAtPosition(editor.selection.active,
            /(^[\#\*0-9\-\. ]+)?\[[^\]]*\]\(\)/
        );
        if (!emptyLink) { return false; }
        const spot = emptyLink.end.translate(0, -1);
        await editor.edit(builder => {
            builder.insert(spot, "^" + link + "^");
        });
        this.selectLink(editor, spot);
        return true;
    }

    private async handleNoTarget(editor: TextEditor, link: string): Promise<boolean> {
        // `[no target yet]`
        const unlinked = editor.document.getWordRangeAtPosition(editor.selection.active,
            /(^[\#\*0-9\-\. ]+)?\[[^\]]*\]/
        );
        if (!unlinked) { return false; }

        const spot = unlinked.end;
        await editor.edit(editBuilder => {
            editBuilder.insert(spot, "(^" + link + "^)");
        });
        this.selectLink(editor, spot);
        return true;
    }

    private async handleSingleLine(editor: TextEditor, link: string): Promise<boolean> {
        if (editor.selection.active.line !== editor.selection.anchor.line) { return false; }
        
        // Find a range and promote it to a link
        const linkRange: Range = this.findLinkableRange(editor);
        await editor.edit(builder => {
            builder.insert(linkRange.start, "[");
            builder.insert(linkRange.end, "](^" + link + "^)");
        });
        this.selectLink(editor, linkRange.start);
        return true;
    }

    private findLinkableRange(editor: TextEditor): Range {
        // If nothing selected, pick a likely candidate for selection
        if (editor.document.getText(editor.selection).length === 0) {
            // `# A bunch of text in a heading`
            let linkRange: Range | undefined;
            if (linkRange = editor.document.getWordRangeAtPosition(editor.selection.start,
                /^\#+ +[^\[]+/)) {
                const lineText = editor.document.lineAt(editor.selection.start.line).text;
                // Select everything after the first #, if any, and space
                return new Range(
                    linkRange.start.translate(0, lineText.match(/^\#+ +/)![0].length),
                    linkRange.end);
            } else {
                // Just select the word nearest the cursor if any
                linkRange = editor.document.getWordRangeAtPosition(editor.selection.start);
                if (linkRange) {
                    return linkRange;
                }
            }
        }
        return new Range(editor.selection.start, editor.selection.end);
    }

    private async handleMultiLine(editor: TextEditor, link: string): Promise<boolean> {
        return false;
    }
}