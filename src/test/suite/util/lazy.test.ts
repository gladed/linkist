import * as assert from 'assert';
import { lazy, Lazy } from '../../../util/lazy';

suite('lazy', () => {
    test('should evaluate later', () => {
        let source = 5;
        let l = lazy(() => source);
        source = 6;
        assert.deepStrictEqual(l.value, 6);
    });

    test('should not have value before its time', () => {
        let l = lazy(() => 5);
        assert.deepStrictEqual(l.hasValue, false);
        l.value;
        assert.deepStrictEqual(l.hasValue, true);
    });

    test('should map lazy value on demand', () => {
        let source = 5;
        let l = lazy(() => source);
        let m = l.map((x) => x.toString());
        source = 6;
        assert.deepStrictEqual(m.value, "6");
    });
});
