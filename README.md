# Linkist

Creates tags that connect documents, even if you move them around.

## Get it

1. Open [Atom](https://atom.io/).
2. Type `Ctrl+,` and click `Install`.
4. Type `linkist` and install.

## Use it

1. Just type `Ctrl+Alt+L` to create a unique "link tag", like `^4xy^`.
2. Copy that tag anywhere else in the project.
3. Put your cursor on a tag and type `Ctrl+Alt+L` to jump to the next place where that tag is found.

## And more...

* You can use this to implement a "Slip-box" note taking system. See [How to Take Smart Notes by Sönke Ahrens](https://amzn.to/2vi6Sm9) and https://zettelkasten.de for more resources and discussion.
* The `^tag^` format is rendered in markdown as a ^superscript^, which looks like a footnote. Or you can use `[tag]` or `[Readable Text](tag)` formats instead. They all work the same.
* If you have text selected when you create a new link it will make a nice-looking markdown link for you: `[Selected Text](tag)`.
* Link tags keep working even when you rearrange content between files, or move the files around your project.
* By default `*.md` and `*.txt` files are searched. You can change this in Settings.
* If a tag isn't linked anywhere else, it will flash when you activate it with `Ctrl+Alt+L`.
