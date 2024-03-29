import * as assert from 'assert';
import { LinkId } from '../../../util/linkId';

suite('LinkId', () => {
    test('should create links', () => {
        assert.strictEqual(LinkId.encode(5, new Date("2020-06-04")).text, "gAws");
    });

    test('should create links from today', () => {
        assert.notStrictEqual("gAws", LinkId.encode(5, undefined));
    });

    test('should decode links', () => {
        const link = LinkId.decode('GwtD');
        assert.deepStrictEqual(link.date, new Date("2020-05-29"));
        assert.strictEqual(link.ordinal, 14);
        assert.strictEqual(link.text, 'GwtD');
    });
});
