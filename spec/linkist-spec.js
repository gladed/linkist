'use babel';

import Linkist from '../lib/linkist';
const path = require("path")

// Use the command `window:run-package-specs` (ctrl+shift+Y) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
// or `fdescribe`). Remove the `f` to unfocus the block.

describe('Linkist', () => {
  let workspaceElement, editor, caratLinkRe;

  function tagRangeNearCursor() {
    return editor.getLastCursor().getCurrentWordBufferRange({ wordRegex: caratLinkRe })
  }

  function tagNearCursor() {
    return editor.getTextInBufferRange(tagRangeNearCursor())
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

  describe('link', () => {
    beforeEach(async () => {
    })

    it('adds tag', async () => {
      await link()
      expect(tagNearCursor()).toMatch(caratLinkRe)
    })

    it('adds tag at end of line', async () => {
      editor.insertText("# Some text\n")
      editor.getLastCursor().moveLeft()
      await link()
      expect(editor.getBuffer().getText()).toMatch(/\# Some text\^[A-Z0-9a-z]{3,5}\^/)
    })

    it('re-selects added tag', async() => {
      await link()
      let tag = tagNearCursor()

      await link()
      expect(editor.getLastSelection().getText()).toEqual(tag)
    })

    it('alternates between two links', async() => {
      await link()
      editor.moveRight(1)
      firstTagRange = tagRangeNearCursor()
      tag = tagNearCursor()
      editor.insertText(`\n\n${tag}`)
      secondTagRange = tagRangeNearCursor()

      // Boink back to the first tag
      await link()
      expect(editor.getLastSelection().getBufferRange()).toEqual(firstTagRange)

      // Boink to the next tag
      await link()
      expect(editor.getLastSelection().getBufferRange()).toEqual(secondTagRange)
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

    it('find tag in link', async() => {
        editor.insertText("[A link](^tag^)\n\n# A Target ^tag^")
        editor.moveToTop()
        await link()
        editor.moveToBeginningOfLine()
        expect(editor.getLastCursor().getBufferRow()).toEqual(2)
    })

    it('find tag anywhere in heading', async() => {
        editor.insertText("# Link Heading ^tag^\n\n# A Target ^tag^")
        editor.moveToTop()
        await link()
        editor.moveToBeginningOfLine()
        expect(editor.getLastCursor().getBufferRow()).toEqual(2)
    })

    it('insert link from selection', async() => {
        editor.insertText("Untagged text")
        editor.selectAll()
        await link()
        editor.selectAll()
        expect(editor.getLastSelection().getText()).toMatch(/\[Untagged text\]\(\^[A-Z0-9a-z]{3,5}\^\)/)
    })
  });

  describe('insert-last', () => {
    it('inserts previously used tag', async () => {
      await link()
      tag = tagNearCursor()
      editor.insertText(`\n`)
      await insertLast()
      expect(tagNearCursor()).toEqual(tag)
    })
  })
});
