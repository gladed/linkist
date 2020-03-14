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
    this.tagFormat = `[${this.linkDigits}]{3,5}`
    this.tagModel = new TagModel(state)
    this.subs = new CompositeDisposable()
    this.subs.add(atom.commands.add('atom-workspace', {
      'linkist:link': () => this.link()
    }))
    this.subs.add(atom.commands.add('atom-workspace', {
      'linkist:insert-last': () => this.insertLast()
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
    let tagRe = new RegExp(this.tagFormat, 'g')
    let linkFormat = `(\\[[^\\]]+\\])?\\(\\^?${this.tagFormat}\\^?\\)|\\[${this.tagFormat}\\]|\\^${this.tagFormat}\\^`
    let linkRe = new RegExp(linkFormat)
    let currentRange = cursor.getCurrentWordBufferRange({ wordRegex: linkFormat })
    let matches = editor.getTextInBufferRange(currentRange).match(tagRe)
    if (!matches) {
      this.insertTag(await this.tagModel.createUnique())
    } else {
      // A tag is under the cursor, go on to the next one
      await this.tagModel.selectNext(matches[matches.length - 1], editor, currentRange)
    }
  },

  // Insert a tag at the cursor
  async insertTag(tag) {
    let editor = atom.workspace.getActiveTextEditor()
    if (!editor) return;

    // Collapse to cursor if needed
    if (!editor.getLastSelection().getBufferRange().isSingleLine()) {
      let cursor = editor.getCursors()[0]
      cursor.setBufferPosition(cursor.getBufferPosition())
    }
    if (linkText = editor.getLastSelection().getText()) {
      // Convert selected text to a markdown link
      editor.insertText(`[${linkText}](^${tag}^)`)
    } else {
      // Just insert the tag
      editor.insertText(`^${tag}^`)
    }
  },

  async insertLast() {
    let lastTag = this.tagModel.getLastTag()
    if (lastTag) {
      this.insertTag(lastTag)
    }
  }
};
