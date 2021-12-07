import * as assert from 'assert';
import { camelize, titleCase } from '../../../util/text';

suite('camelize', () => {
    test('should create a legit filename', () => {
        assert.strictEqual(camelize("Isn't this gránd"), "isntThisGránd");
    });
});

suite('titleCase', () => {
    test('should ignore special characters', () => {
        assert.strictEqual(titleCase("Isn't this gránd"), "Isn't This Gránd");
    });
});
