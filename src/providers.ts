import {
    CancellationToken,
    DefinitionProvider,
    Position,
    ReferenceContext,
    TextDocument,
    ReferenceProvider,
} from 'vscode';
import Linker from './linker';

export class MarkdownDefinitionProvider implements DefinitionProvider {
    constructor(public linkProvider: Linker) { }
    async provideDefinition(document: TextDocument, position: Position, _: CancellationToken) {
        const sourceLink = await this.linkProvider.linkAt(document.uri, position);
        if (sourceLink) {
            const references = await this.linkProvider.linksFor(sourceLink.linkId.text);
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

export class MarkdownReferenceProvider implements ReferenceProvider {
    constructor(public linkProvider: Linker) { }
    async provideReferences(document: TextDocument, position: Position, context: ReferenceContext, _: CancellationToken) {
        const link = await this.linkProvider.linkAt(document.uri, position);
        if (!link) {
            return [];
        }
        return this.linkProvider.linksFor(link.linkId.text)
            ?.filter(_ => _ !== link || context.includeDeclaration)
            .map(_ => _.location);
    }
}
