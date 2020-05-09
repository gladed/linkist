'use babel';

import { CompositeDisposable, Range } from 'atom';
const LinkIdModel = require('./linkid-model');

export default {
  subscriptions: null,
  linkDigits: 'j6EpuN2TkFbJBVSCfhnarZ95W8KARmwUytiqQgcYxsX3D7dM4ePGzHv',

  activate(state) {
    return this.activateAsync(state)
  },

  async activateAsync(state) {
    this.linkIdFormat = `[${this.linkDigits}]{3,5}`
    this.linkIdModel = new LinkIdModel(state)
    this.subs = new CompositeDisposable()
    this.subs.add(atom.commands.add('atom-workspace', {
      'linkist:link': () => this.link()
    }))
    this.subs.add(atom.commands.add('atom-workspace', {
      'linkist:insert-last': () => this.insertLast()
    }))
    await this.linkIdModel.setup()
  },

  // Called on unload to clean up UIs and subscriptions
  deactivate() {
    this.subs.dispose()
    this.linkIdModel.dispose()
  },

  // Called to return package-specific state between use
  serialize() {
    state = { }
    this.linkIdModel.serialize(state)
    return state
  },

  async link() {
    let editor = atom.workspace.getActiveTextEditor()
    if (!editor) return;

    let cursor = editor.getLastCursor()
    let linkFormat = `(\\^${this.linkIdFormat}\\^)|(^#.*\\^${this.linkIdFormat}\\^)|(\\[[^\\]]+\\]\\(\\^${this.linkIdFormat}\\^\\))|(\\[[^\\]]*\\^${this.linkIdFormat}\\^[^\\]]*\\]\\([^\\)]+\\))`
    let linkRe = new RegExp(linkFormat)
    let currentRange = cursor.getCurrentWordBufferRange({ wordRegex: linkFormat })

    let linkIdRe = new RegExp(`\\^(${this.linkIdFormat})\\^`, 'g')
    let matches = linkIdRe.exec(editor.getTextInBufferRange(currentRange))
    if (matches) {
      // A link ID is under or near the cursor, go on to the next one
      await this.linkIdModel.selectNext(matches[1], editor, currentRange)
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
        this.insertLinkId(await this.linkIdModel.createUnique(), targetLocation)
    }
  },

  // Insert a link ID at the cursor
  async insertLinkId(linkId, at) {
    let editor = atom.workspace.getActiveTextEditor()
    if (!editor) return;
    editor.setSelectedBufferRange(editor.setTextInBufferRange(new Range(at, at), `^${linkId}^`))
  },

  async insertLast() {
    let editor = atom.workspace.getActiveTextEditor()
    if (!editor) return;

    let lastLinkId = this.linkIdModel.getLastLinkId()
    if (!lastLinkId) return;
    this.insertLinkId(lastLinkId, editor.getLastSelection().getBufferRange().end)
  }
};
