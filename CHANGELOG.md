# Changelog

## TBD: 1.3.3
- Replacing use of "tag" in code and docs with "link ID" for clarity.
- Encode epoch day and ordinal into link ID for four-digit link IDs.
- Fixed adding a tag when in empty parens.
- Ctrl+Alt+I now acts more like Ctrl+Alt+L as it should.
- Support following but not insertion of [[012345ABC]] style links.
- Support faster link traversal and automatically going to header links first

## 1.3.2
- Selected text when linked takes on `[selected text](^tag^)` style
- Can traverse a link from anywhere in a markdown link or # heading
- Insert a space after word when adding a tag `like this ^tag^`

## 1.3.1
- Fixed insertion of tag at end of line

## 1.3.0
- Remove alternate style (links are lies since they don't really work anywhere).
- Attempts to insert tag inside a word will automatically move to the end of the word first.
- Insertion followed by immediate keystrokes result in tag landing in the right place.

## 1.2.0
- Limit tags to 3-5 chars only
- Always insert Markdown style with `[Text](^tag^)`
- Add support for Ctrl+Alt+I to insert last used tag

## 1.1.0
- When text is selected, create a Markdown link
- Link command follows Markdown-style links to tags
- Handle parenthesized `(ABC)` or bracketed `[ABC]` links

## 1.0.0
- Ctrl+Alt+L to insert or follow links
