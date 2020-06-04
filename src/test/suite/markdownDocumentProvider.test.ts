import * as assert from 'assert';
import * as fs from 'fs';
import { Event, Disposable, window, Uri, workspace } from 'vscode';
import MarkdownDocumentProvider from '../../markdownDocumentProvider';

export async function waitForEvent<T>(
	event: Event<T>
): Promise<Disposable> {
	console.log("Creating promise");
	return new Promise((resolve) => {
		console.log("Promise started...");
		const disposable = event((e) => {
			console.log("Yes, we saw the event", e);
			resolve(disposable);
		});
	});
}
  
export async function executeAndWaitForEvent<T, ET>(
	func: () => Thenable<T>,
	event: Event<ET>
): Promise<T> {
	console.log("Launching function and event");
	const [disposable, result] = await Promise.all([waitForEvent(event), func()]);
	console.log("Done waiting for both function and event", result, disposable);
	disposable.dispose();
	return result;
}

suite('MarkdownDocumentProvider', () => {
	test('should have some tests', async () => {
		assert.deepEqual([], []);
	});
});
