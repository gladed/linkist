import {
    ExtensionContext,
    Selection,
    SymbolInformation,
    commands,
    languages,
    window,
} from 'vscode';
import MarkdownSymbolProvider from './markdownSymbolProvider';
import { EditorLinkHandler } from './editorLinkHandler';

export async function activate(context: ExtensionContext) {

    const symbolProvider = new MarkdownSymbolProvider();
    const editorHandler = new EditorLinkHandler();

    context.subscriptions.push(symbolProvider);

    context.subscriptions.push(commands.registerCommand('linkist.link', async () => {
        const editor = window.activeTextEditor;
        if (!editor) {
            return;
        }
        const linkId = editorHandler.linkIdNearCursor(editor);
        if (linkId) {
            let symbols = await symbolProvider.lookupSymbols(linkId);
            if (symbols.length > 1) {
                let jumpTo: SymbolInformation | undefined;

                if (!editor.document.lineAt(editor.selection.start.line).text.startsWith("#")) {
                    jumpTo = symbols.find(symbol => symbol.name.startsWith("#"));
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
            const range = await editorHandler.insertLink(editor, (await symbolProvider.newLink()).text);
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

    context.subscriptions.push(languages.registerWorkspaceSymbolProvider(symbolProvider));
}

export function deactivate() { }
