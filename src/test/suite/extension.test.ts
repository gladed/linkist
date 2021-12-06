import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import {
    TextEditor,
    Position,
    Range,
    Selection
} from 'vscode';

suite('link command', async () => {
    const testDirectory = '../../../../src/test/res/';
    const uri = vscode.Uri.file(path.join(__dirname + testDirectory + 'test.md'));

    // Need a throwaway workspace
    async function setText(editor: TextEditor, text: string) {
        await editor.edit(builder => {
            builder.delete(new Range(new Position(0, 0),
                editor.document.lineAt(editor.document.lineCount - 1).range.end));
            builder.insert(new Position(0, 0), text);
        });
    }
    test('link a heading', async () => {
        // Open the document
        const document = await vscode.workspace.openTextDocument(uri);
        const editor = await vscode.window.showTextDocument(document);
        await setText(editor, '# Hello\n\nSome text');
        editor.selection = new Selection(new Position(0, 0), new Position(0, 0));

        // Insert a link on the top line
        await vscode.commands.executeCommand('linkist.link');

        // Validate there's a link there
        assert.ok(editor.document.lineAt(0).text.match(/\# \[Hello\]\(\^[A-Za-z0-9]{4,7}\^\)/));
    });
    test('link a bullet', async () => {
        // Open the document
        const document = await vscode.workspace.openTextDocument(uri);
        const editor = await vscode.window.showTextDocument(document);
        await setText(editor, '* Hello\n\nSome text');
        editor.selection = new Selection(new Position(0, 0), new Position(0, 0));

        // Link the line
        await vscode.commands.executeCommand('linkist.link');

        // Validate there's a link there
        assert.ok(editor.document.lineAt(0).text.match(/\* \[Hello\]\(\^[A-Za-z0-9]{4,7}\^\)/));
    });
});
