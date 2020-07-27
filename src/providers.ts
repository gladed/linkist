import {
    CancellationToken,
    CompletionItemProvider,
    CompletionContext,
    CompletionItem,
    CompletionList,
    DefinitionProvider,
    Position,
    ReferenceContext,
    ReferenceProvider,
    TextDocument,
    CompletionItemKind,
} from 'vscode';
import Linker from './linker';

/** Tell VSCode how to find the "definition" for a link id. */
export class MarkdownDefinitionProvider implements DefinitionProvider {
    constructor(public linker: Linker) { }
    async provideDefinition(document: TextDocument, position: Position, _: CancellationToken) {
        const sourceLink = await this.linker.linkAt(document.uri, position);
        if (sourceLink) {
            const references = this.linker.linksFor(sourceLink.linkId.text);
            if (references) {
                for (let target of references) {
                    if (target.isHead()) {
                        return target.location;
                    }
                }
                // No actual head so just return the first one (so clicking works)
                return references[0].location;
            }
        }
        return;
    }
}

/** Tell VSCode how to find references to the current link id. */
export class MarkdownReferenceProvider implements ReferenceProvider {
    constructor(public linker: Linker) { }
    async provideReferences(document: TextDocument, position: Position, context: ReferenceContext, _: CancellationToken) {
        const link = await this.linker.linkAt(document.uri, position);
        if (!link) {
            return [];
        }
        return this.linker.linksFor(link.linkId.text)
            ?.filter(_ => _ !== link || context.includeDeclaration)
            .map(_ => _.location);
    }
}

/** When the user hits '[' then give some options based on text. */
export class MarkdownCompletionItemProvider implements CompletionItemProvider {
    constructor(public linker: Linker) { }

    async provideCompletionItems(
        document: TextDocument,
        __: Position,
        token: CancellationToken,
        ___: CompletionContext
    ): Promise<CompletionList<CompletionItem>> {
        // Convert head links to [CompletionItem] objects
        let links = (await this.linker.allLinks(token))
            .filter((link) => link.isHead())
            .map((link) => {
                return {
                    label: "[" + link.label + "](^" + link.linkId.text + "^)",
                    documentation: relativePath(link.location.uri.fsPath, document.uri.toString().slice(7)),
                    insertText: link.label,
                    command: {
                        arguments: [link.linkId.text],
                        command: "linkist.link",
                        title: ""
                    },
                    kind: CompletionItemKind.Reference
                };
            });
        return new CompletionList(links, true);
    }
}

/** Snip out the unique part of one (the part not duplicated in two). */
function relativePath(one: string, two: string) {
    let index = 0;
    while (index < one.length && index < two.length && one[index] === two[index]) {
        index++;
    }
    return one.slice(index);
}
