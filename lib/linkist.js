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

    let cursor = editor.getLastCursor()
    let linkFormat = `(\\^${this.tagFormat}\\^)|(^#.*\\^${this.tagFormat}\\^)|(\\[[^\\]]+\\]\\(\\^${this.tagFormat}\\^\\))|(\\[[^\\]]*\\^${this.tagFormat}\\^[^\\]]*\\]\\([^\\)]+\\))`
    let linkRe = new RegExp(linkFormat)
    let currentRange = cursor.getCurrentWordBufferRange({ wordRegex: linkFormat })

    let tagRe = new RegExp(`\\^(${this.tagFormat})\\^`, 'g')
    let matches = tagRe.exec(editor.getTextInBufferRange(currentRange))
    if (matches) {
      // A tag is under or near the cursor, go on to the next one
      await this.tagModel.selectNext(matches[1], editor, currentRange)
    } else {
        if (linkText = editor.getLastSelection().getText()) {
            // Convert selected text to a markdown link
            editor.insertText(`[${linkText}]()`)
            editor.moveLeft(1)
        } else {
            if (cursor.isInsideWord() && !cursor.isAtEndOfLine()) {
                cursor.moveToEndOfWord()
                editor.insertText(' ')
            }
        }
        let targetLocation = editor.getLastSelection().getBufferRange().end
        this.insertTag(await this.tagModel.createUnique(), targetLocation)
    }
  },

  // Insert a tag at the cursor
  async insertTag(tag, at) {
    let editor = atom.workspace.getActiveTextEditor()
    if (!editor) return;
    editor.setSelectedBufferRange(editor.setTextInBufferRange(new Range(at, at), `^${tag}^`))
  },

  async insertLast() {
    let editor = atom.workspace.getActiveTextEditor()
    if (!editor) return;

    let lastTag = this.tagModel.getLastTag()
    if (!lastTag) return;
    this.insertTag(lastTag, editor.getLastSelection().getBufferRange().end)
  }
};
