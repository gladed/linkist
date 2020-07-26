import * as assert from 'assert';
import { textToDate } from '../../../util/date';

suite('textToDate()', () => {
    test('should parse date in past', () => {
        assert.deepEqual(textToDate("Here is a date 1972-06-25"), new Date("1972-06-25"));
    });

    test('should grab first date', () => {
        assert.deepEqual(textToDate("Here is a date 2030-05-012022-02-22"), new Date("2030-05-01"));
    });

    test('should return undefined if no date present', () => {
        assert.deepEqual(textToDate("Here is no date"), undefined);
    });
});
