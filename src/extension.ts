import { 
	ExtensionContext,
	Position,
	Range,
	Selection,
	SymbolInformation,
	TextEditor,
	commands,
	languages,
	window,
} from 'vscode';
import MarkdownSymbolProvider from './markdownSymbolProvider';

export async function activate(context: ExtensionContext) {

	const symbolProvider = new MarkdownSymbolProvider();
	context.subscriptions.push(symbolProvider);

	// Given the current selection, find a tag and put the cursor on it, returning success.
	function moveToTag(editor: TextEditor) {
		const tag = editor.document.getWordRangeAtPosition(editor.selection.active,
			/\^[A-Za-z0-9]{3,7}\^/
		);
		if (tag) {
			editor.selection = new Selection(tag.start, tag.end);
			return true;
		} 
		const link = editor.document.getWordRangeAtPosition(editor.selection.active,
			/\[[^\]]*\]\(\^[A-Za-z0-9]{3,7}\^\)/
		);
		if (link) {
			editor.selection = new Selection(link.end.translate(0, -2), link.end.translate(0, -2));
			return true;
		}
		return false;
	}

	// Find or create a good insertion point for a new tag, embedding in a markdown link
	async function prepareForInsertion(editor: TextEditor): Promise<Position | undefined> {
		// A link that's present but not completed [like this one]()
		const emptyLink = editor.document.getWordRangeAtPosition(editor.selection.active,
			/\[[^\]]*\]\(\)/
		);
		if (emptyLink) {
			editor.selection = new Selection(emptyLink.end.translate(0, -1), emptyLink.end.translate(0, -1));
			return editor.selection.end;
		}

		// A link that's has no target yet [like this]
		const unlinked = editor.document.getWordRangeAtPosition(editor.selection.active,
			/\[[^\]]*\][^\(]/
		);
		if (unlinked) {
			editor.selection = new Selection(unlinked.end.translate(0, -1), unlinked.end.translate(0, -1));
			const position = editor.selection.active;
			await editor.edit(editBuilder => {
				editBuilder.insert(position, "()");
			}, { undoStopBefore: true, undoStopAfter: false });
			return editor.selection.end.translate(0, -1);
		}

		// Single-line selection?
		if (editor.selection.active.line === editor.selection.anchor.line) {
			// If nothing selected, pick a likely candidate for selection
			if (editor.document.getText(editor.selection).length === 0) {
				const lineText = editor.document.lineAt(editor.selection.start.line).text;
				let wordRange: Range | undefined;
				if (wordRange = editor.document.getWordRangeAtPosition(editor.selection.start,
					/^\#+ +[^\[]+/)) {
					// Select everything after the first # and space
					wordRange = new Range(
						wordRange.start.translate(0, lineText.match(/^\#+ +/)![0].length),
						wordRange.end);
				} else {	
					wordRange = editor.document.getWordRangeAtPosition(editor.selection.start);
				}
				if (wordRange) {
					editor.selection = new Selection(wordRange.start, wordRange.end);
				}
			}
			// Surround the current selection with a link
			if (editor.document.getText(editor.selection).length > 0) {
				await editor.edit(editBuilder => {					
					editBuilder.insert(editor.selection.start, "[");
					editBuilder.insert(editor.selection.end, "]()");
				}, { undoStopBefore: true, undoStopAfter: false });
				editor.selection = new Selection(editor.selection.end, editor.selection.end);
				return editor.selection.end.translate(0, -1);
			}
		}

		return undefined;
	}

	context.subscriptions.push(commands.registerCommand('linkist.link', async () => {
		const editor = window.activeTextEditor;
		if (!editor) {
			return;
		}
		if (moveToTag(editor)) {
			let symbols = await symbolProvider.lookupSymbols(editor.document.getText(editor.selection));
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
			const position = await prepareForInsertion(editor);
			if (position) {
				const link = await symbolProvider.newLink();	
				await editor.edit(editBuilder => {
					editBuilder.insert(position, "^" + link.text + "^");
				}, { undoStopBefore: false, undoStopAfter: true });
				const linkRange = editor.document.getWordRangeAtPosition(editor.selection.start,
					/\[[^\[]+\]\([A-Za-z0-9\^]+\)/);
				console.log("New selection range is", linkRange);
				if (linkRange) {
					editor.selection = new Selection(linkRange.start, linkRange.end);
				}
			}
		}
	}));

	context.subscriptions.push(languages.registerWorkspaceSymbolProvider(symbolProvider));
}

export function deactivate() { }
