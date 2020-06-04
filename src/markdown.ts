import {
    Uri,
    workspace,
} from 'vscode';

// An interface for a line in the document that matches the return from [TextDocument.lineAt]
interface MarkdownLine {
    text: string;
}

// A simple interface that could match a TextDocument, or a raw buffer
export interface MarkdownDocument {
    readonly uri: Uri;
    readonly lineCount: number;
    lineAt(line: number): MarkdownLine;
}

// Return resource as a markdown document from the current workspace if open, or from disk if not
export async function getMarkdownDocument(resource: Uri): Promise<MarkdownDocument | undefined> {
    // Return loaded document
    const openAlready = workspace.textDocuments.find(doc => doc.uri.toString() === resource.toString());
    if (openAlready !== undefined) {
        return openAlready;
    }

    // Or load fresh from disk
    return workspace.fs.readFile(resource).then(bytes => {
        const lines: string[] = Buffer.from(bytes).toString('utf-8').split(/(\r?\n)/);
        const rawLines: MarkdownLine[] = [];
        for (let index = 0; index < lines.length; index += 2) {
            rawLines.push({ text: lines[index] });
        }
        return {
            uri: resource,
            lineCount: rawLines.length,
            lineAt: (index: number) => { return rawLines[index]; },
        };
    });
}
