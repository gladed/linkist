import * as assert from 'assert';
import { LinkId } from '../../../util/link';

suite('LinkId', () => {
    test('should create links', () => {
        assert.deepEqual(LinkId.create(5, new Date("2020-06-04")).text, "gAws");
    });

    test('should decode links', () => {
        const link = LinkId.decode('GwtD');
        assert.deepEqual(link.date, new Date("2020-05-29"));
        assert.deepEqual(link.ordinal, 14);
        assert.deepEqual(link.text, 'GwtD');
    });
});
