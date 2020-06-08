# Developer playbook

## Development Environment
* `sudo npm install fs-extra`
* VSCode itself, open this repo, push F5
* Read [VS Code API docs](https://code.visualstudio.com/api/references/vscode-api)
* [Document your APIs](https://typedoc.org/guides/doccomments/)
* Write [Unit Tests](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
* 4-spaces, no tabs, no trailing spaces: `find src -name "*.ts" -exec bash -c 'expand -it 4 {} | sed -E "s/[[:space:]]*$//" | sponge {}' \;`

## Package and release

* See [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).

```

# If needed
vsce login gladed         

# Validate
npm run vscode:prepublish  

# Update CHANGELOG.md with anticipated next version

# Commit all changes
git commit -m "Updated changelog"

# Publish!
vsce publish [patch | minor | major]

# Tag
git tag [v1.4.0]
git push --tags
```
