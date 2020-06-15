import * as vscode from 'vscode';

export abstract class Disposable {
    private isDisposed = false;
    protected disposables: vscode.Disposable[] = [];

    public dispose(): any {
        if (this.isDisposed) {
            return;
        }
        this.isDisposed = true;
        Disposable.disposeAll(this.disposables);
    }

    // Registers a disposable for later disposing
    protected register<T extends vscode.Disposable>(value: T): T {
        if (this.isDisposed) {
            value.dispose();
        } else {
            this.disposables.push(value);
        }
        return value;
    }

    static disposeAll(disposables: vscode.Disposable[]) {
        while (disposables.length) {
            const item = disposables.pop();
            if (item) {
                item.dispose();
            }
        }
    }
}

/** A standalone object that can manage disposable objects, which is also itself disposable. */
export class Disposer extends Disposable {
    /** Add and return a {@param value} to be disposed when this object is disposed. */
    public register<T extends vscode.Disposable>(value: T): T {
        return super.register(value);
    }
}
