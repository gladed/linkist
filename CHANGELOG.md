# Change Log

## 1.4.9

* Cleaner `[` auto-completion to avoid conflicts (#3).
* When linking selected text, a perfect match will reuse the existing link (#4).

## 1.4.8

* `[` now allows auto-completion to an existing link head
* Multiline link "from" line more forgiving about parent depth

## 1.4.6

* Multiline extraction includes "From" link if appropriate.
* Enabled definitions and references: Ctrl+Click and F12 open the "peek" view.
* Use "Peek References" (F12) instead of symbol search (Ctrl+T) to show link targets.

## 1.4.5

* Better headings and filenames in multiline extraction
* If a date like `2020-06-01` is present in link name encode into link id

## 1.4.4

* Ctrl+Click links in file to follow them to the link ID on a header line.
* Fixed cursor location prior to opening symbol searcher.
* If there are only two link ID instances, just bounce between them.

## 1.4.1

* Fixed some cases for finding link IDs and the right place to insert them
* Added multiline extract-to-file
* Visit external link if it's the only thing on the line

## 1.4.0

* Initial VS Code version
