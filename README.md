[![VS Code Extension](https://img.shields.io/badge/VSCode-Extension-green)](https://marketplace.visualstudio.com/items?itemName=gladed.linkist) [![VS Code Extension](https://img.shields.io/badge/OpenVSX-Extension-green)](https://open-vsx.org/extension/gladed/linkist)


# ![Icon](img/icon_20_24.png) Linkist

A [Visual Studio Code extension](https://marketplace.visualstudio.com/items?itemName=gladed.linkist) to create persistent links between markdown documents in your workspace.

## Install

1. Open [VSCode](https://code.visualstudio.com/) or [VSCodium](https://github.com/VSCodium/vscodium).
2. Type `Ctrl+P` then paste: `ext install gladed.linkist`

## Use

1. Put your cursor on a markdown heading ...

    ```md
    # Horses
    ```

    ...and type `Ctrl+Alt+L`:

    ```md
    # [Horses](^2FnK^)
    ```

2. Copy that link anywhere else in your workspace, changing the text if you like:

    ```md
    ## Zebras

    Zebras are like [horses](^2FnK^), but with stripes.
    ```

3. Put your cursor on that link and type `Ctrl+Alt+L` again to go back to the heading.

4. Type `Ctrl+Alt+L` yet again to visit/list other places the link ID appears.

## Advanced Topics

* Select multiple lines (starting with a heading) and `Ctrl+Alt+L` will extract that section into a new file, replacing it with a link and backlink.
* Type `[` to auto-complete from existing links.
* Implement a "Zettelkasten" note taking system as described in [How to Take Smart Notes by Sönke Ahrens](https://amzn.to/2vi6Sm9).
* Read the [Change Log](CHANGELOG.md).
* Read [Frequently Asked Questions](https://github.com/gladed/linkist/wiki/FAQ).
