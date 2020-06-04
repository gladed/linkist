# Linkist

A [VS Code extension](https://marketplace.visualstudio.com/items?itemName=gladed.linkist) that creates persistent links between markdown documents in your workspace.

## Install

1. Open [VSCode](https://code.visualstudio.com/) or [VSCodium](https://github.com/VSCodium/vscodium).
2. [Ctrl+P] then paste `ext install gladed.linkist`

## Usage

1. Put your cursor on a markdown heading

    ```md
    # Horses
    ```
    and type `Ctrl+Alt+L`:

    ```md
    # [Horses](^2FnK^)
    ```
2. Copy that link anywhere else in your workspace, changing the text if you like:

    ```md
    ## Zebras

    Zebras are similar to [horses](^2FnK^).
    ```

3. Put your cursor on that link and type `Ctrl+Alt+L` again to go back to the heading.

## Advanced Topics

* Read the [Change Log](CHANGELOG.md).
* Use links to implement a "Zettelkasten" note taking system as described in [How to Take Smart Notes by Sönke Ahrens](https://amzn.to/2vi6Sm9).
