'use babel';

import Linkist from '../lib/linkist';
const path = require("path")

// Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
// or `fdescribe`). Remove the `f` to unfocus the block.

describe('Linkist', () => {
  let workspaceElement, editor, caratLinkRe;

  function tagRangeNearCursor() {
    return editor.getCursors()[0].getCurrentWordBufferRange({ wordRegex: caratLinkRe })
  }

  function tagNearCursor() {
    return editor.getTextInBufferRange(tagRangeNearCursor())
  }

  async function link() {
    await atom.commands.dispatch(editor.element, "linkist:link")
  }

  beforeEach(async () => {
    caratLinkRe = /\^[A-Za-z0-9]{3,5}\^/
    workspaceElement = atom.views.getView(atom.workspace);
    workspaceElement.style.height = '800px'
    atom.project.setPaths([path.join(__dirname, "fixtures")]);
  });

  describe('on empty file', () => {
    beforeEach(async () => {
      await atom.workspace.open("test.md")
      editor = atom.workspace.getCenter().getActiveTextEditor()
      atom.packages.activatePackage('linkist')
    })

    it('link adds tag', async () => {
      await link()
      expect(tagNearCursor()).toMatch(caratLinkRe)
    })

    it('link re-selects added tag', async() => {
      await link()
      let tag = tagNearCursor()

      await link()
      expect(editor.getLastSelection().getText()).toEqual(tag)
    })

    it('link creates a markdown link around selected text', async() => {
      editor.insertText("hello")
      editor.selectAll()
      await link()
      editor.selectAll()
      expect(editor.getLastSelection().getText()).toMatch(/\[hello\]\([A-Z0-9a-z]{3,5}\)/)
    })

    it('link alternates between two links', async() => {
      await link()
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
  });
});
