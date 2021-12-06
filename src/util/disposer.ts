import { Disposable } from "vscode";

/** A Disposable object which also disposes registered objects. */
export class Disposer extends Disposable {
    private isDisposed = false;
    protected disposables: Disposable[] = [];

    public dispose(): any {
        if (this.isDisposed) return;
        this.isDisposed = true;
        Disposer.disposeAll(this.disposables);
    }

    public constructor(toDispose = ()=>{}) {
        super(toDispose)
    }

    // Registers a disposable for later disposing
    public register<T extends Disposable>(value: T): T {
        if (this.isDisposed) {
            value.dispose();
        } else {
            this.disposables.push(value);
        }
        return value;
    }

    static disposeAll(disposables: Disposable[]) {
        while (disposables.length) {
            const item = disposables.pop();
            if (item) {
                item.dispose();
            }
        }
    }
}
