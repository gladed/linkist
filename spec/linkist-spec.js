'use babel';

import Linkist from '../lib/linkist';
const path = require("path")

// Use the command `window:run-package-specs` (ctrl+shift+Y) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
// or `fdescribe`). Remove the `f` to unfocus the block.

describe('Linkist', () => {
  let workspaceElement, editor, caratLinkRe;

  function linkIdRangeNearCursor() {
    return editor.getLastCursor().getCurrentWordBufferRange({ wordRegex: caratLinkRe })
  }

  function linkIdNearCursor() {
    return editor.getTextInBufferRange(linkIdRangeNearCursor())
  }

  function link() {
    return atom.commands.dispatch(editor.element, "linkist:link")
  }

  function insertLast() {
    return atom.commands.dispatch(editor.element, "linkist:insert-last")
  }

  function report() {
    return atom.commands.dispatch(editor.element, "linkist:report")
  }

  beforeEach(async () => {
    let caratLinkReText = `\\^[A-Za-z0-9]{3,5}\\^`
    caratLinkRe = new RegExp(caratLinkReText)
    workspaceElement = atom.views.getView(atom.workspace);
    workspaceElement.style.height = '800px'
    atom.project.setPaths([path.join(__dirname, "fixtures")]);
    await atom.workspace.open("test.md")
    editor = atom.workspace.getCenter().getActiveTextEditor()
    atom.packages.activatePackage('linkist')
  });

  describe('alt link', () => {
      it('works', async() => {
          editor.insertText("[[012345]]\n\n[[012345]]")
          await link()
          expect(editor.getLastSelection().getBufferRange().start.row).toMatch(0) // Should go back to top
      })
  })

  describe('link', () => {
    it('traverses nicely', async() => {
      editor.insertText("\n* [Minor 1](^abcd^)\n# [Major](^abcd^)\n* [Minor 2](^abcd^)")
      editor.moveUp(1)
      await link()
      expect(editor.getLastSelection().getBufferRange().start.row).toMatch(2) // Should go back to major entry
      await link()
      expect(editor.getLastSelection().getBufferRange().start.row).toMatch(1) // Should to top entry because we came from Minor 2
      await link()
      expect(editor.getLastSelection().getBufferRange().start.row).toMatch(3) // Go back to where we started finally
    })

    it('adds link ID', async () => {
      await link()
      expect(linkIdNearCursor()).toMatch(caratLinkRe)
    })

    it('adds link ID at end of line', async () => {
      editor.insertText("# Some text\n")
      editor.getLastCursor().moveLeft()
      await link()
      expect(editor.getBuffer().getText()).toMatch(/\# Some text\^[A-Z0-9a-z]{3,5}\^/)
    })

    it('re-selects added link ID', async() => {
      await link()
      let linkId = linkIdNearCursor()

      await link()
      expect(editor.getLastSelection().getText()).toEqual(linkId)
    })

    it('alternates between two links', async() => {
      editor.insertText("\n")
      await link()
      editor.moveRight(1)
      firstLinkIdRange = linkIdRangeNearCursor()
      linkId = linkIdNearCursor()
      editor.insertText(`\n\n${linkId}`)
      secondLinkIdRange = linkIdRangeNearCursor()

      // Boink back to the first link ID
      await link()
      expect(editor.getLastSelection().getBufferRange()).toEqual(firstLinkIdRange)

      // Boink to the next link ID
      await link()
      expect(editor.getLastSelection().getBufferRange()).toEqual(secondLinkIdRange)
    })

    it('goes to end of word before insertion', async() => {
      editor.insertText("happy")
      editor.moveLeft(1)
      await link()
      editor.moveRight(1)
      editor.insertText("boy")
      editor.selectAll()
      expect(editor.getLastSelection().getText()).toMatch(/happy \^[A-Z0-9a-z]{3,5}\^boy/)
    })

    it('find link ID in link', async() => {
        editor.insertText("[A link](^abcd^)\n\n# A Target ^abcd^")
        editor.moveToTop()
        await link()
        editor.moveToBeginningOfLine()
        expect(editor.getLastCursor().getBufferRow()).toEqual(2)
    })

    it('find link ID anywhere in heading', async() => {
        editor.insertText("# Link Heading ^abcd^\n\n# A Target ^abcd^")
        editor.moveToTop()
        await link()
        editor.moveToBeginningOfLine()
        expect(editor.getLastCursor().getBufferRow()).toEqual(2)
    })

    it('insert link into ()', async() => {
        editor.insertText("# [Link Heading]()")
        editor.moveLeft(1)
        await link()
        expect(editor.getText()).toMatch(/# \[Link Heading\]\(\^[a-zA-Z2-9]{3,5}\^\)/)
    })

    it('insert last link as markdown from selection', async() => {
        editor.insertText("Link Heading")
        editor.selectAll()
        await link()
        editor.moveRight(1)
        editor.insertText("\nAnd more")
        editor.selectToBeginningOfWord()
        await insertLast()
        expect(editor.getText()).toMatch(/\[more\]\(\^[a-zA-Z2-9]{3,5}\^\)/)
    })

    it('insert link from selection', async() => {
        editor.insertText("Unlinked text")
        editor.selectAll()
        await link()
        editor.selectAll()
        expect(editor.getLastSelection().getText()).toMatch(/\[Unlinked text\]\(\^[A-Z0-9a-z]{3,5}\^\)/)
    })
  });

  describe('insert-last', () => {
    it('inserts previously used link ID', async () => {
      await link()
      linkId = linkIdNearCursor()
      editor.insertText(`\n`)
      await insertLast()
      expect(linkIdNearCursor()).toEqual(linkId)
    })
  })
});
