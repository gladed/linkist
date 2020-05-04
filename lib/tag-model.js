'use babel';

import { CompositeDisposable, Range } from 'atom';

// Manage link tags across files in project
module.exports = class TagModel {
  constructor(state) {
    this.linkDigits = 'j6EpuN2TkFbJBVSCfhnarZ95W8KARmwUytiqQgcYxsX3D7dM4ePGzHv'
    this.lastTag = null;
    this.ordinal = state.ordinal
    this.day = state.day
  }

  async setup() {
    this.subs = new CompositeDisposable()
    // Subscribe to settings changes
    this.subs.add(atom.config.observe('linkist.filesToSearch', globs => {
      this.globs = globs.split(/[ ,;]+/)
    }))
  }

  dispose() {
    this.subs.dispose()
  }

  serialize(state) {
    state.ordinal = this.ordinal
    state.day = this.day
  }

  getLastTag() {
    return this.lastTag
  }

  // Return a new, random-looking link. Might not be unique.
  createTag() {
    let today = Math.floor(new Date()/8.64e7)
    if (this.day != today || this.ordinal == undefined) {
      this.day = today
      this.ordinal = 0
    }

    // Note: we can extract date with:
    // let resultValue = this.decode(tag)
    // let resultOrdinal = resultValue % 100;
    // let resultDays = Math.floor(resultValue / 100);
    // let resultDate = new Date((resultDays + 1) * 24 * 60 * 60 * 1000)
    return this.encode(this.day * 100 + this.ordinal++, this.linkDigits)
  }

  // Tag encoder (int -> string)
  encode(value, alphabet) {
      let lastDigit = 7
      let tag = ""
      while (value != 0) {
          let digit = value % alphabet.length
          tag = tag + alphabet[(digit + lastDigit) % alphabet.length]
          lastDigit += digit
          value = Math.floor(value / alphabet.length)
      }
      return tag
  }

  // Tag decoder (string -> int)
  decode(encoded, alphabet) {
      let digits = []
      let lastDigit = 7
      for (var i = 0; i < encoded.length; i++) {
          digits.unshift((alphabet.indexOf(encoded.charAt(i)) - lastDigit +
              alphabet.length) % alphabet.length)
          lastDigit = (lastDigit + digits[0]) % alphabet.length
      }
      for (var value = 0; digits.length != 0;
          value = value * alphabet.length + digits.shift());
      return value
  }

  // Scan for results and select the next item that *isn't under the cursor*
  async findNext(tag, editor, currentRange) {
    let tagRe = new RegExp(`\\^${tag}\\^`, 'g')
    let matches = []
    await atom.workspace.scan(tagRe, { 'paths': this.globs }, found => {
      matches.push(found)
    })

    let current = false // A tag at or near the current range.
    let first = false // "First" item in rotation in case we must wrap around
    let next = false // Next item to visit after we find the one we're at
    matches.forEach(fileMatch => {
      fileMatch.matches.forEach(itemMatch => {
        let matchRange = Range.fromObject(itemMatch.range)
        if (editor && editor.getPath() == fileMatch.filePath && matchRange && matchRange.intersectsWith(currentRange)) {
          current = true
        } else {
          if (!first) {
            first = { 'file': fileMatch, 'item': itemMatch }
          }
          if (current && !next) {
            next = { 'file': fileMatch, 'item': itemMatch }
          }
        }
      })
    })
    return next ? next : first
  }

  // Find the next tag and select it
  async selectNext(tag, editor, currentRange) {
    this.lastTag = tag
    let tagAt = await this.findNext(tag, editor, currentRange)
    if (tagAt) {
      let range = Range.fromObject(tagAt.item.range)
      await atom.workspace.open(tagAt.file.filePath,
        { pending: false, initialLine: range.start.row, initialColumn: range.start.column })
      atom.workspace.getActiveTextEditor().setSelectedBufferRange(range)
    } else {
      // Flash in place to indicate uniqueness: ^VNt^
      // (because beep doesn't work, resetting range doesn't work)
      editor.setSelectedBufferRange(currentRange, {flash: true})
    }
  }

  // Create and return a unique tag
  async createUnique() {
    let tag = this.createTag()
    let tagAt = await this.findNext(tag)
    while (tagAt) {
      tag = this.createTag()
      tagAt = await this.findNext(tag)
    }
    this.lastTag = tag
    return tag
  }
}
