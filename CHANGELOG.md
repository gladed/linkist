# Change Log

## 1.4.12

* Fix auto-completion when creating a link on a bullet line (#18).
* Smarter handling of `* Item [Link](^...^)` (#17).
* Pick better title names when creating topics (#16).

## 1.4.11

* Update package versions, add internal test cases.

## 1.4.10

* Ctrl+Space replacement of links improved.
* Show link warnings (#6)
* Link command automatically creates new note if no heading yet (#7).

## 1.4.9

* Cleaner `[` auto-completion to avoid conflicts (#3).
* When linking selected text, a perfect match will reuse the existing link (#4).

## 1.4.8

* `[` now allows auto-completion to an existing link head
* Multi-line link "from" line more forgiving about parent depth

## 1.4.6

* Multi-line extraction includes "From" link if appropriate.
* Enabled definitions and references: Ctrl+Click and F12 open the "peek" view.
* Use "Peek References" (F12) instead of symbol search (Ctrl+T) to show link targets.

## 1.4.5

* Better headings and filenames in multi-line extraction
* If a date like `2020-06-01` is present in link name encode into link id

## 1.4.4

* Ctrl+Click links in file to follow them to the link ID on a header line.
* Fixed cursor location prior to opening symbol searcher.
* If there are only two link ID instances, just bounce between them.

## 1.4.1

* Fixed some cases for finding link IDs and the right place to insert them
* Added multi-line extract-to-file
* Visit external link if it's the only thing on the line

## 1.4.0

* Initial VS Code version
