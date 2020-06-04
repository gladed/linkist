# Developer playbook

## Development Environment
* VSCode itself, open this repo, push F5
* API docs at https://code.visualstudio.com/api/references/vscode-api
* [Document your APIs](https://typedoc.org/guides/doccomments/)
* Write [Unit Tests](https://code.visualstudio.com/api/working-with-extensions/testing-extension)

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
```
