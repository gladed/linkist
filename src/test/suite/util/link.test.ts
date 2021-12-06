import * as assert from 'assert';
import { LinkId } from '../../../util/link';

suite('LinkId', () => {
    test('should create links', () => {
        assert.strictEqual(LinkId.create(5, new Date("2020-06-04")).text, "gAws");
    });

    test('should decode links', () => {
        const link = LinkId.decode('GwtD');
        assert.deepStrictEqual(link.date, new Date("2020-05-29"));
        assert.strictEqual(link.ordinal, 14);
        assert.strictEqual(link.text, 'GwtD');
    });
});
