# Changelog

See [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.1]
### Changed
- Fixed insertion of tag at end of line

## [1.3.0]
### Removed
- Remove alternate style (links are lies since they don't really work anywhere).

### Changed
- Attempts to insert tag inside a word will automatically move to the end of the word first.
- Insertion followed by immediate keystrokes result in tag landing in the right place.

## [1.2.0]
### Added
- Limit tags to 3-5 chars only
- Always insert Markdown style with `[Text](^tag^)`
- Add support for Ctrl+Alt+I to insert last used tag

## [1.1.0]
### Added
- When text is selected, create a Markdown link
- Link command follows Markdown-style links to tags
- Handle parenthesized `(ABC)` or bracketed `[ABC]` links

## [1.0.0]
### Added
- Ctrl+Alt+L to insert or follow links
