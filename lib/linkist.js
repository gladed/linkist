'use babel';

import { CompositeDisposable, Range } from 'atom';

export default {
  subscriptions: null,
  linkDigits: 'j6EpuN2TkFbJBVSCfhnarZ95W8KARmwUytiqQgcYxsX3D7dM4ePGzHv',

  activate(state) {
    this.ordinal = state.ordinal ? state.ordinal : 4000;
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'linkist:link': () => this.link()
    }));
  },

  // Called on unload to clean up UIs and subscriptions
  deactivate() {
    this.subscriptions.dispose()
  },

  // Called to return package-specific state between use
  serialize() {
    return {
      ordinal: this.ordinal
    };
  },

  // Return a new, random-looking link
  createTag() {
    let ordinal = this.ordinal++
    var result = "";
    var lastDigit = 7;
    var len = this.linkDigits.length
    while (ordinal > 0 || result == "") {
      var digit = ordinal % len;
      ordinal = Math.floor(ordinal / len);
      result = this.linkDigits[(digit + lastDigit) % len] + result;
      lastDigit = (lastDigit + digit + 7) % len;
    }
    return result;
  },

  link() {
    let editor = atom.workspace.getActiveTextEditor()
    if (!editor) return;

    let self = this

    // Scan for results and select the next one
    async function findNext(tag) {
      let tagRe = new RegExp(`\\(${tag}\\)|\\[${tag}\\]|\\^${tag}\\^`, 'g')
      let matches = []
      let globs = atom.config.get('linkist.filesToSearch').split(/[ ,;]+/)
      console.log("Globs:", globs)
      await atom.workspace.scan(tagRe, { 'paths': globs }, found => { matches.push(found) })

      // Find the first match and the next match
      let found = false, first = false, next = false
      matches.forEach(fileMatch => {
        fileMatch.matches.forEach(itemMatch => {
          console.log("Matched item", itemMatch)
          let matchRange = Range.fromObject(itemMatch.range)
          if (fileMatch.filePath == editor.getPath() && matchRange.isEqual(tagRange)) {
            found = true
          } else {
            if (!first) first = { 'file': fileMatch, 'item': itemMatch }
            if (found && !next) next = { 'file': fileMatch, 'item': itemMatch }
          }
        })
      })
      return next ? next : first
    }

    async function selectNext(tag) {
      let tagAt = await findNext(tag)
      if (tagAt) {
        let range = Range.fromObject(tagAt.item.range)
        await atom.workspace.open(tagAt.file.filePath,
          { pending: false, initialLine: range.start.row, initialColumn: range.start.column })
        atom.workspace.getActiveTextEditor().setSelectedBufferRange(range)
      } else {
        // Flash in place to indicate uniqueness
        editor.setSelectedBufferRange(tagRange, {flash: true})
      }
    }

    async function findUnique() {
      let tag = self.createTag()
      let tagAt = await findNext(tag)
      while (tagAt) {
        // On a collision, randomly bump the ordinal and try again.
        self.ordinal += 500 + Math.floor(Math.random() * 1000);
        tag = self.createTag()
        tagAt = await findNext(tag)
      }
      return tag
    }

    let cursor = editor.getCursors()[0]
    let linkRe = new RegExp(`\\([${this.linkDigits}]{3,}\\)|\\[[${this.linkDigits}]{3,}\\]|\\^[${this.linkDigits}]{3,}\\^`)
    options = { wordRegex: linkRe }
    let tagRange = cursor.getCurrentWordBufferRange(options)
    let cursorText = editor.getTextInBufferRange(tagRange)
    if (!cursorText.match(linkRe)) {
      // Nothing under cursor, create and insert a tag
      findUnique().then(tag => editor.insertText(`^${tag}^`))
    } else {
      // We have a tag, follow to the next one
      selectNext(cursorText.slice(1, cursorText.length - 1))
    }
  }
};
