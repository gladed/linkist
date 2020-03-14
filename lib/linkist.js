'use babel';

import { CompositeDisposable, Range } from 'atom';
const TagModel = require('./tag-model');

export default {
  subscriptions: null,
  linkDigits: 'j6EpuN2TkFbJBVSCfhnarZ95W8KARmwUytiqQgcYxsX3D7dM4ePGzHv',

  activate(state) {
    return this.activateAsync(state)
  },

  async activateAsync(state) {
    this.tagModel = new TagModel(state)
    this.subs = new CompositeDisposable();
    this.subs.add(atom.commands.add('atom-workspace', {
      'linkist:link': () => this.link()
    }))
    await this.tagModel.setup()
  },

  // Called on unload to clean up UIs and subscriptions
  deactivate() {
    this.subs.dispose()
    this.tagModel.dispose()
  },

  // Called to return package-specific state between use
  serialize() {
    state = { }
    this.tagModel.serialize(state)
    return state
  },

  async link() {
    let editor = atom.workspace.getActiveTextEditor()
    if (!editor) return;

    let cursor = editor.getCursors()[0]
    let tagFormat = `[${this.linkDigits}]{3,5}`
    let tagRe = new RegExp(tagFormat, 'g')
    let linkFormat = `(\\[[^\\]]+\\])?\\(${tagFormat}\\)|\\[${tagFormat}\\]|\\^${tagFormat}\\^`
    let linkRe = new RegExp(linkFormat)
    let currentRange = cursor.getCurrentWordBufferRange({ wordRegex: linkFormat })
    let matches = editor.getTextInBufferRange(currentRange).match(tagRe)
    if (!matches) {
      // There is no tag under cursor, create and insert a tag
      if (!editor.getLastSelection().getBufferRange().isSingleLine()) {
        // Collapse to cursor if needed
        cursor.setBufferPosition(cursor.getBufferPosition())
      }
      let linkText = editor.getLastSelection().getText()
      await this.tagModel.createUnique().then(tag => {
        if (linkText) {
          // Convert selected text to a markdown link
          editor.insertText(`[${linkText}](${tag})`)
        } else {
          // Nah, just insert the tag
          editor.insertText(`^${tag}^`)
        }
      })
    } else {
      // A tag is under the cursor, go on to the next one
      await this.tagModel.selectNext(matches[matches.length - 1], editor, currentRange)
    }
  }
};
