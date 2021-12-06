import * as assert from 'assert';
import { Disposable } from 'vscode';
import { Disposer } from '../../../util/disposer';

suite('disposer', () => {
    test('dispose 1', () => {
        let count = 0;
        const d = new Disposer(() => { count++; });
        d.dispose();
        assert.strictEqual(count, 1);
    });

    test('dispose many', () => {
        let count = 0;
        const d = new Disposer();
        d.register(new Disposable(() => { count++; }));
        d.register(new Disposable(() => { count++; }));
        d.dispose();
        d.dispose(); // does nothing
        assert.strictEqual(count, 2);
    });

    test('pre-disposed disposes instantly', () => {
        let count = 0;
        const d = new Disposer();
        d.dispose();
        d.register(new Disposable(() => { count++; }));
        assert.strictEqual(count, 1);
    });
});
