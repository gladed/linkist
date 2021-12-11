# Developer playbook

## Development Environment

* First time:
  * `sudo apt install npm moreutils`
  * `sudo npm install -g fs-extra vsce`
* In VSCode, open this repo, push F5 to run unit tests or "extension development host"
  * Open View->Run to change between running tests and the development host.
  * Open the debug console here to see `console.log()` output.
* Update to latest dependencies: `npm update --save`
* Read [VS Code API docs](https://code.visualstudio.com/api/references/vscode-api)
* [Document your APIs](https://typedoc.org/guides/doccomments/)
* Write [Unit Tests](https://code.visualstudio.com/api/working-with-extensions/testing-extension)

## Package and release

* See [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).

1. Clean up spaces
  * In Bash: `find src -name "*.ts" -exec bash -c 'expand -it 4 {} | sed -E "s/[[:space:]]*$//" | sponge {}' \;`
  * In VSCode: add `"files.trimTrailingWhitespace": true` to settings.
2. Clean up warnings, `npm run lint`
3. Run tests (see above)
4. Validate, `npm run vscode:prepublish`
5. Login (if needed), `vsce login gladed`
6. Update, `CHANGELOG.md`
7. Publish (select type of version bump), `vsce publish [patch | minor | major]`
  * Maybe also `npx ovsx publish -p $(cat .open-vsx-token)`
8. Tag `git push && git push --tags`

# Promote tag to release at https://github.com/gladed/linkist/tags
```


## Original instructions

## Setup

- install the recommended extensions (amodio.tsl-problem-matcher and dbaeumer.vscode-eslint)


## Get up and running straight away

* Press `F5` to open a new window with your extension loaded.
* Run your command from the command palette by pressing (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac) and typing `Hello World`.
* Set breakpoints in your code inside `src/extension.ts` to debug your extension.
* Find output from your extension in the debug console.

## Make changes

* You can relaunch the extension from the debug toolbar after changing code in `src/extension.ts`.
* You can also reload (`Ctrl+R` or `Cmd+R` on Mac) the VS Code window with your extension to load your changes.


## Explore the API

* You can open the full set of our API when you open the file `node_modules/@types/vscode/index.d.ts`.

## Run tests

* Open the debug viewlet (`Ctrl+Shift+D` or `Cmd+Shift+D` on Mac) and from the launch configuration dropdown pick `Extension Tests`.
* Press `F5` to run the tests in a new window with your extension loaded.
* See the output of the test result in the debug console.
* Make changes to `src/test/suite/extension.test.ts` or create new test files inside the `test/suite` folder.
  * The provided test runner will only consider files matching the name pattern `**.test.ts`.
  * You can create folders inside the `test` folder to structure your tests any way you want.

## Go further

 * Reduce the extension size and improve the startup time by [bundling your extension](https://code.visualstudio.com/api/working-with-extensions/bundling-extension).
 * [Publish your extension](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) on the VSCode extension marketplace.
 * Automate builds by setting up [Continuous Integration](https://code.visualstudio.com/api/working-with-extensions/continuous-integration).
