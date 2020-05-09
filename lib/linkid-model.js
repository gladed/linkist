'use babel';

import { CompositeDisposable, Range } from 'atom';

// Manage link link IDs across files in project
module.exports = class LinkIdModel {
  constructor(state) {
    this.linkDigits = 'j6EpuN2TkFbJBVSCfhnarZ95W8KARmwUytiqQgcYxsX3D7dM4ePGzHv'
    this.lastLinkId = null;
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

  getLastLinkId() {
    return this.lastLinkId
  }

  // Return a new, random-looking link. Might not be unique.
  createLinkId() {
    let today = Math.floor(new Date()/8.64e7)
    if (this.day != today || this.ordinal == undefined) {
      this.day = today
      this.ordinal = 0
    }

    // Note: we can extract date with:
    // let resultValue = this.decode(linkId)
    // let resultOrdinal = resultValue % 100;
    // let resultDays = Math.floor(resultValue / 100);
    // let resultDate = new Date((resultDays + 1) * 24 * 60 * 60 * 1000)
    return this.encode(this.day * 100 + this.ordinal++, this.linkDigits)
  }

  // LinkID encoder (int -> string)
  encode(value, alphabet) {
      let lastDigit = 7
      let linkId = ""
      while (value != 0) {
          let digit = value % alphabet.length
          linkId = linkId + alphabet[(digit + lastDigit) % alphabet.length]
          lastDigit += digit
          value = Math.floor(value / alphabet.length)
      }
      return linkId
  }

  // Link ID decoder (string -> int)
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
  async findNext(linkId, editor, currentRange) {
    let linkIdRe = new RegExp(`\\^${linkId}\\^`, 'g')
    let matches = []
    await atom.workspace.scan(linkIdRe, { 'paths': this.globs }, found => {
      matches.push(found)
    })

    let current = false // A Link ID at or near the current range.
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

  // Find the next link ID and select it
  async selectNext(linkId, editor, currentRange) {
    this.lastLinkId = linkId
    let linkIdAt = await this.findNext(linkId, editor, currentRange)
    if (linkIdAt) {
      let range = Range.fromObject(linkIdAt.item.range)
      await atom.workspace.open(linkIdAt.file.filePath,
        { pending: false, initialLine: range.start.row, initialColumn: range.start.column })
      atom.workspace.getActiveTextEditor().setSelectedBufferRange(range)
    } else {
      // Flash in place to indicate uniqueness: ^VNt^
      // (because beep doesn't work, resetting range doesn't work)
      editor.setSelectedBufferRange(currentRange, {flash: true})
    }
  }

  // Create and return a unique link ID
  async createUnique() {
    let linkId = this.createLinkId()
    let linkIdAt = await this.findNext(linkId)
    while (linkIdAt) {
      linkId = this.createLinkId()
      linkIdAt = await this.findNext(linkId)
    }
    this.lastLinkId = linkId
    return linkId
  }
}
