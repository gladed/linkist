import {
    CancellationToken,
    CompletionItemProvider,
    CompletionContext,
    CompletionList,
    DefinitionProvider,
    Position,
    Range,
    ReferenceContext,
    ReferenceProvider,
    TextDocument,
    CompletionItemKind,
} from 'vscode';
import Linker from './linker';
import { linkIdRe } from './util/link';

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
    async provideReferences(
        document: TextDocument,
        position: Position,
        context: ReferenceContext,
        _: CancellationToken
    ) {
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

    // A candidate link that does NOT match on `[[`
    candidateLinkStartRe = /(^|[^\[])(\[[^\\[]*\])/;

    // Accept an empty or populated markdownLink
    candidateRe = new RegExp(this.candidateLinkStartRe.source + '(\\(' + linkIdRe.source + '\\))?([^\\(]|$)');

    async provideCompletionItems(
        document: TextDocument,
        position: Position,
        token: CancellationToken,
        ___: CompletionContext
    ) {
        // Return no matches unless we're on a real candidate
        let candidate = document.getWordRangeAtPosition(position, this.candidateRe);
        if (!candidate) {
            return [];
        }

        // Review the match again and select the correct replacement range
        const matches = document.getText(candidate).match(this.candidateRe)!!;
        candidate = new Range(candidate.start.translate(0, matches[1].length),
            candidate.end.translate(0, -matches[4].length));

        // Convert all head links into [CompletionItem] objects for insertion
        let links = (await this.linker.allLinks(token))
            .filter((link) => link.isHead())
            .map((link) => {
                const markdownLink = "[" + link.label + "](^" + link.linkId.text + "^)";
                return {
                    label: markdownLink,
                    detail: relativePath(link.location.uri.fsPath, document.uri.toString().slice(7)),
                    documentation: "Created " + link.linkId.date.toISOString().slice(0, 10),
                    range: candidate,
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
