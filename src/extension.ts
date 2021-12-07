import {
    ExtensionContext,
    Selection,
    SymbolInformation,
    commands,
    languages,
    window,
} from 'vscode';
import Linker from './linker';
import { EditorLinkHandler } from './editorLinkHandler';
import { Disposer } from './util/disposer';
import {
    MarkdownDefinitionProvider,
    MarkdownReferenceProvider,
    MarkdownCompletionItemProvider,
} from './providers';
import { MarkdownDiagnosticHandler } from './markdownDiagnosticHandler';

const markdownSelector = { scheme: 'file', language: 'markdown' };

export async function activate(context: ExtensionContext) {

    const disposer = new Disposer();
    context.subscriptions.push(disposer);

    const linker = disposer.register(new Linker());
    const editorHandler = new EditorLinkHandler(linker);

    // Enable commands
    disposer.register(commands.registerCommand('linkist.link', handleLinkCommand));

    // CTRL+Click to bounce between definitions. If there are 3+ it opens up a reference peek view
    disposer.register(languages.registerDefinitionProvider(markdownSelector, new MarkdownDefinitionProvider(linker)));

    // This works but you have to type F12 or shift+F12 or CTRL+Click to get there
    disposer.register(languages.registerReferenceProvider(markdownSelector, new MarkdownReferenceProvider(linker)));

    // Allow the user to auto-complete a link when `[` is typed
    disposer.register(languages.registerCompletionItemProvider(markdownSelector, new MarkdownCompletionItemProvider(linker), '['));

    disposer.register(new MarkdownDiagnosticHandler(languages.createDiagnosticCollection("Link diagnostics"), linker));

    // Auto startup
    if (window.activeTextEditor) {
        linker.linksIn(window.activeTextEditor.document.uri);
    } else {
        disposer.register(window.onDidChangeActiveTextEditor(() => {
            if (window.activeTextEditor) {
                linker.linksIn(window.activeTextEditor.document.uri);
            }}));
    }

    // Things we don't do:

    // Don't do symbol searches, markdown plugin already handles these for # lines
    // disposer.register(languages.registerWorkspaceSymbolProvider(new LinkSymbolProvider(linker)));

    // Provide symbols on a per-document basis. Not needed because we might also have a workspace symbol provider
    // disposer.register(languages.registerDocumentSymbolProvider(markdownSelector, ...));

    // This underlines the whole link but breaks CTRL+CLICK on # head because it links to itself.
    // disposer.register(languages.registerDocumentLinkProvider(markdown, ...));

    // Nice if you want to show metadata about a link, but also distracting and
    // the link tree will do a better job contextualizing the current link.
    // disposer.register(languages.registerHoverProvider(markdownSelector, new MarkdownHoverProvider(linker)));

    async function handleLinkCommand() {
        const editor = window.activeTextEditor;
        if (!editor) {
            return;
        }

        const linkId = editorHandler.linkIdAt(editor.document, editor.selection);
        if (linkId) {
            const links = await linker.lookupLinks(linkId);
            if (!links.find(l => l.isHead) && await editorHandler.createNote(editor)) {
                // Done already
            } else if (links.length === 2) {
                let jumpTo = links[0];
                if (jumpTo.location.range.start.line === editor.selection.start.line) {
                    jumpTo = links[1];
                }
                const viewColumn = window.visibleTextEditors.find(_ => _.document.uri === jumpTo!.location.uri)?.viewColumn;
                await window.showTextDocument(jumpTo.location.uri, { selection: jumpTo.location.range, viewColumn: viewColumn });
            } else if (links.length > 2) {
                let jumpTo: SymbolInformation | undefined;
                if (!editor.document.lineAt(editor.selection.start.line).text.startsWith("#")) {
                    jumpTo = links.find(symbol => symbol.name.startsWith("#"));
                }
                if (jumpTo) {
                    const viewColumn = window.visibleTextEditors.find(_ => _.document.uri === jumpTo!.location.uri)?.viewColumn;
                    await window.showTextDocument(jumpTo.location.uri, { selection: jumpTo.location.range, viewColumn: viewColumn });
                } else {
                    commands.executeCommand("editor.action.referenceSearch.trigger");
                }
            }
        } else if (editorHandler.visitUri(editor, editor.selection)) {
            // If true, request was launched so do nothing
        } else {
            const range = await editorHandler.insertLink(editor);
            if (range) {
                editor.selection = new Selection(range.start, range.end);
            }
        }
    }
}

export function deactivate() { true; }
