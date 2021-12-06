import * as assert from 'assert';
import { lazy } from '../../../util/lazy';

suite('lazy', () => {
    test('should evaluate later', () => {
        let source = 5;
        const l = lazy(() => source);
        source = 6;
        assert.strictEqual(l.value, 6);
    });

    test('should not have value before its time', () => {
        const l = lazy(() => 5);
        assert.strictEqual(l.hasValue, false);
        l.value;
        assert.strictEqual(l.hasValue, true);
    });

    test('should map lazy value on demand', () => {
        let source = 5;
        const l = lazy(() => source);
        const m = l.map((x) => x.toString());
        source = 6;
        assert.strictEqual(l.hasValue, false);
        assert.strictEqual(m.hasValue, false);
        assert.strictEqual(m.value, "6");
        assert.strictEqual(l.hasValue, true);
        assert.strictEqual(m.hasValue, true);
    });
});
