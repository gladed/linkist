# Developer playbook

## Development Environment
* `sudo npm install fs-extra`
* VSCode itself, open this repo, push F5
* Update packages with `npm update --save`
* Read [VS Code API docs](https://code.visualstudio.com/api/references/vscode-api)
* [Document your APIs](https://typedoc.org/guides/doccomments/)
* Write [Unit Tests](https://code.visualstudio.com/api/working-with-extensions/testing-extension)

## Package and release

* See [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).

```

# Clean up spaces
find src -name "*.ts" -exec bash -c 'expand -it 4 {} | sed -E "s/[[:space:]]*$//" | sponge {}' \;

# If needed (https://dev.azure.com/gladed/, https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
vsce login gladed         

# Validate
npm run vscode:prepublish  

# Update CHANGELOG.md with anticipated next version

# Commit all changes
git commit -m "Updated changelog"

# Publish to MS and open-vsx
vsce publish [patch | minor | major]
npx ovsx publish -p $(cat .open-vsx-token)

# Tag
git push --tags
```
