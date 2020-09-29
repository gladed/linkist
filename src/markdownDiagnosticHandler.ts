import {
    Diagnostic,
    DiagnosticCollection,
    DiagnosticSeverity,
} from 'vscode';
import Linker from "./linker";
import { Disposable } from "./util/disposable";
import { Link } from './util/link';

class Issue extends Diagnostic {
    constructor(public link: Link, message: string, severity: DiagnosticSeverity) {
        super(link.range, message, severity);
    }
}

export class MarkdownDiagnosticHandler extends Disposable {

    constructor(diagnostics: DiagnosticCollection, linker: Linker) {
        super();
        this.register(linker.onUpdatedLinks(async uri => {
            // First: trash ALL diagnostics for this link text.
            const issues: Issue[] = [];
            for (let link of (await linker.linksIn(uri)) ?? []) {
                const links = linker.linksFor(link.linkId.text) ?? [];
                this.checkMultihead(issues, links, link) &&
                    this.checkHeadless(issues, links, link) &&
                    this.checkWeak(issues, links, link);
            }
            diagnostics.set(uri, issues);
        }));
    }

    private checkMultihead(issues: Issue[], links: Link[], link: Link): Boolean {
        if (links?.filter(l => l.isHead).length > 1) {
            issues.push(new Issue(link, "Multiple # heads for this link", DiagnosticSeverity.Error));
            return false;
        }
        return true;
    }

    private checkHeadless(issues: Issue[], links: Link[], link: Link): Boolean {
        if (!link.isHead && !links?.find(l => l.isHead)) {
            issues.push(new Issue(link, "No # head for this link", DiagnosticSeverity.Warning));
            return false;
        }
        return true;
    }

    private checkWeak(issues: Issue[], links: Link[], link: Link): Boolean {
        if (links.length < 2) {
            issues.push(new Issue(link, "No links to this; make more connections", DiagnosticSeverity.Hint));
            return false;
        }
        if (links.length < 3) {
            issues.push(new Issue(link, "Only one other link to this; make more connections", DiagnosticSeverity.Hint));
            return false;
        }
        return true;
    }
}
