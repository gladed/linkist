[![VS Code Extension](https://img.shields.io/badge/VSCode-Extension-green)](https://marketplace.visualstudio.com/items?itemName=gladed.linkist) [![VS Code Extension](https://img.shields.io/badge/OpenVSX-Extension-green)](https://open-vsx.org/extension/gladed/linkist)


# ![Icon](img/icon_20_24.png) Linkist

A [Visual Studio Code extension](https://marketplace.visualstudio.com/items?itemName=gladed.linkist) to create persistent links between markdown documents in your workspace.

It's a great way to implement a private "Zettelkasten" note taking system as described in [How to Take Smart Notes by Sönke Ahrens](https://amzn.to/2vi6Sm9).

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

4. Type `Ctrl+Alt+L` yet again to visit or list other places the link ID appears.

## Advanced Topics

* Understand why some links create [warnings](https://github.com/gladed/linkist/wiki/Warnings).
* Create new note files automatically:
  * Select multiple lines (starting with a heading) and `Ctrl+Alt+L` to extract that section into a new note
  * Use `Ctrl+Alt+L` on a link with no associated heading yet
* Type `[` to auto-complete from existing links.
* Read the [Change Log](CHANGELOG.md).

See [Frequently Asked Questions](https://github.com/gladed/linkist/wiki/FAQ) for more.
