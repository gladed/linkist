import * as assert from 'assert';
import { FakeMarkdownScanner as MarkdownScannerStub } from './markdownScannerStub';
import Linker from '../../linker';
import MarkdownDocument, { MarkdownLine }  from '../../markdown';
import { Uri } from 'vscode';

var markdownUriCount: number = 0;

class MarkdownDocumentStub extends MarkdownDocument {
    readonly uri: Uri = Uri.parse("file" + (markdownUriCount++) + ".md");
    lineCount: number = 0;
    private lines: MarkdownLine[] = [];
    constructor(content: string) {
        super();
        this.update(content);
    }
    public lineAt(index: number) {
        return this.lines[index];
    }

    public update(text: string) {
        this.lines = text.split("\n").map((line) => {
            return {
                text: line
            };
        });
        this.lineCount = this.lines.length;
    }
}

suite('Linker', () => {
    const fms = new MarkdownScannerStub();
    const linker = new Linker(fms);

    test("no links", async () => {
        assert.deepEqual(await linker.lookupLinks(""), []);
    });

    test("one link", async () => {
        fms.update(new MarkdownDocumentStub("^abcd^"));
        assert.deepEqual((await linker.lookupLinks("abcd")).length, 1);
    });

    test("no link on mismatch", async () => {
        fms.update(new MarkdownDocumentStub("^abcd^"));
        assert.deepEqual((await linker.lookupLinks("efgh")).length, 0);
    });

    test("update with second link", async () => {
        let document = new MarkdownDocumentStub("^abcd^");
        fms.update(document);
        await linker.lookupLinks("abcd");
        fms.update(new MarkdownDocumentStub("^abcd^\n^efgh^"));
        assert.deepEqual((await linker.lookupLinks("efgh")).length, 1);
    });
});
