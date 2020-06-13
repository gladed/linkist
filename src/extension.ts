import {
    ExtensionContext,
    Selection,
    SymbolInformation,
    commands,
    languages,
    window,
} from 'vscode';
import MarkdownLinkProvider from './markdownLinkProvider';
import { EditorLinkHandler } from './editorLinkHandler';
import { LinkExplorer } from './linkExplorer';

export async function activate(context: ExtensionContext) {

    const linkProvider = new MarkdownLinkProvider();
    const editorHandler = new EditorLinkHandler(linkProvider);
    const linkExplorer = new LinkExplorer();

    window.registerTreeDataProvider('links', linkExplorer);
    context.subscriptions.push(linkProvider);

    // Enable the link command
    context.subscriptions.push(commands.registerCommand('linkist.link', async () => {
        const editor = window.activeTextEditor;
        if (!editor) {
            return;
        }
        const linkId = editorHandler.linkIdNearCursor(editor);
        if (linkId) {
            let links = await linkProvider.lookupLinks(linkId);
            if (links.length === 2) {
                let jumpTo = links[0];
                if (jumpTo.location.range.start.line === editor.selection.start.line) {
                    jumpTo = links[1];
                }
                let viewColumn = window.visibleTextEditors.find(_ => _.document.uri === jumpTo!.location.uri)?.viewColumn;
                await window.showTextDocument(jumpTo.location.uri, {selection: jumpTo.location.range, viewColumn: viewColumn});
            } else if (links.length > 2) {
                let jumpTo: SymbolInformation | undefined;
                if (!editor.document.lineAt(editor.selection.start.line).text.startsWith("#")) {
                    jumpTo = links.find(symbol => symbol.name.startsWith("#"));
                }
                if (jumpTo) {
                    let viewColumn = window.visibleTextEditors.find(_ => _.document.uri === jumpTo!.location.uri)?.viewColumn;
                    await window.showTextDocument(jumpTo.location.uri, {selection: jumpTo.location.range, viewColumn: viewColumn});
                } else {
                    commands.executeCommand("workbench.action.showAllSymbols");
                }
            } else {
                window.showWarningMessage("'" + linkId + "' does not link to anything");
            }
        } else if (editorHandler.visitUri(editor, editor.selection)) {
            // If true, request was launched so do nothing
        } else {
            const range = await editorHandler.insertLink(editor);
            if (range) {
                editor.selection = new Selection(range.start, range.end);
            }
        }
        // TODO: This is a cool thing we can do with links but we will need to update diagnostics whenever
        // the file changes so we really need something like a MarkdownDiagnosticsProvider.

        // const noLink = new vscode.Diagnostic(
        // 	new vscode.Range(editor.selection.start, editor.selection.end),
        // 	"This link ID appears nowhere else in the project.");
        // // TODO: Should be a warning token or something
        // const collection = vscode.languages.createDiagnosticCollection();
        // const diagnostics: vscode.Diagnostic[] = [noLink];
        // collection.set(editor.document.uri, diagnostics);
    }));

    // Allow symbol linking
    context.subscriptions.push(languages.registerWorkspaceSymbolProvider(linkProvider));

    // Allow link clicking
    const markdownSelector = { scheme: 'file', language: 'markdown' };
    context.subscriptions.push(
        languages.registerDocumentLinkProvider(markdownSelector, linkProvider));
}

export function deactivate() { }
