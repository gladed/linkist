import * as vscode from 'vscode';
import MarkdownSymbolProvider from './markdownSymbolProvider';
import { Link } from './link';

export async function activate(context: vscode.ExtensionContext) {

	const symbolProvider = new MarkdownSymbolProvider();
	context.subscriptions.push(symbolProvider);

	// Given the current selection, find a tag and put the cursor on it, returning success.
	function moveToTag(editor: vscode.TextEditor) {
		const tag = editor.document.getWordRangeAtPosition(editor.selection.active,
			/\^[A-Za-z0-9]{3,7}\^/
		);
		if (tag) {
			editor.selection = new vscode.Selection(tag.start, tag.end);
			return true;
		} 
		const link = editor.document.getWordRangeAtPosition(editor.selection.active,
			/\[[^\]]*\]\(\^[A-Za-z0-9]{3,7}\^\)/
		);
		if (link) {
			editor.selection = new vscode.Selection(link.end.translate(0, -2), link.end.translate(0, -2));
			return true;
		}
		return false;
	}

	// Find or create a good insertion point for a new tag, embedding in a markdown link
	async function findGoodInsertionPoint(editor: vscode.TextEditor): Promise<vscode.Position> {
		const emptyLink = editor.document.getWordRangeAtPosition(editor.selection.active,
			/\[[^\]]*\]\(\)/
		);
		if (emptyLink) {
			editor.selection = new vscode.Selection(emptyLink.end.translate(0, -1), emptyLink.end.translate(0, -1));
			return editor.selection.end;
		}

		const unlinked = editor.document.getWordRangeAtPosition(editor.selection.active,
			/\[[^\]]*\][^\(]/
		);
		if (unlinked) {
			editor.selection = new vscode.Selection(unlinked.end.translate(0, -1), unlinked.end.translate(0, -1));
			const position = editor.selection.active;
			await editor.edit(editBuilder => {
				editBuilder.insert(position, "()");
			}, { undoStopBefore: true, undoStopAfter: false });
			return editor.selection.end.translate(0, -1);
		}

		if (editor.selection.active.line === editor.selection.anchor.line) {
			// If nothing selected, select the nearest word
			if (editor.document.getText(editor.selection).length === 0) {
				const wordRange = editor.document.getWordRangeAtPosition(editor.selection.start);
				if (wordRange) {
					editor.selection = new vscode.Selection(wordRange?.start, wordRange.end);
				}
			}
			if (editor.document.getText(editor.selection).length > 0) {
				await editor.edit(editBuilder => {					
					editBuilder.insert(editor.selection.start, "[");
					editBuilder.insert(editor.selection.end, "]()");
				}, { undoStopBefore: true, undoStopAfter: false });
				return editor.selection.end.translate(0, -1);
			}
		}

		await editor.edit(editBuilder => {					
			editBuilder.insert(editor.selection.start, "[]()");
		}, { undoStopBefore: true, undoStopAfter: false });
		return editor.selection.end.translate(0, -1);
	}

	context.subscriptions.push(vscode.commands.registerCommand('linkist.link', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}
		if (moveToTag(editor)) {
			let symbols = await symbolProvider.lookupSymbols(editor.document.getText(editor.selection));
			if (symbols.length > 1) {
				let jumpTo: vscode.SymbolInformation | undefined;

				if (!editor.document.lineAt(editor.selection.start.line).text.startsWith("#")) {
					jumpTo = symbols.find(symbol => symbol.name.startsWith("#"));
				}
				if (jumpTo) {
					let viewColumn = vscode.window.visibleTextEditors.find(_ => _.document.uri === jumpTo!.location.uri)?.viewColumn;
					await vscode.window.showTextDocument(jumpTo.location.uri, {selection: jumpTo.location.range, viewColumn: viewColumn});
				} else {
					vscode.commands.executeCommand("workbench.action.showAllSymbols");
				}
			} else {

				// TODO: This is a cool thing we can do with links but we will need to update diagnostics whenever
				// the file changes so we really need something like a MarkdownDiagnosticsProvider.

				// const noLink = new vscode.Diagnostic(
				// 	new vscode.Range(editor.selection.start, editor.selection.end),
				// 	"This link ID appears nowhere else in the project.");
				// // TODO: Should be a warning token or something
				// const collection = vscode.languages.createDiagnosticCollection();
				// const diagnostics: vscode.Diagnostic[] = [noLink];
				// collection.set(editor.document.uri, diagnostics);
			}
		} else {		
			const position = await findGoodInsertionPoint(editor);
			console.log("Looking for a new link");
			const link = await symbolProvider.newLink();	
			editor.edit(editBuilder => {
				editBuilder.insert(position, "^" + link.id + "^");
			}, { undoStopBefore: false, undoStopAfter: true });
		}
	}));

	context.subscriptions.push(vscode.languages.registerWorkspaceSymbolProvider(symbolProvider));
}

export function deactivate() { }
