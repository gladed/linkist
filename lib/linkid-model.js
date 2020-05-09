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
    this.disposeTraversal()
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
    if (this.lastLinkId != linkId) {
        this.disposeTraversal()
        this.lastLinkId = linkId
    }
    let matches
    if (this.traversal) {
        matches = this.traversal.matches
    } else {
        // Build a traversal object that will track which item is next in line
        this.traversal = { matches: [], disposer: new CompositeDisposable() }
        matches = this.traversal.matches
        let linkIdRe = new RegExp(`\\^${linkId}\\^|\\[\\[${linkId}\\]\\]`, 'g')
        await atom.workspace.scan(linkIdRe, { 'paths': this.globs }, found => {
          found.matches.forEach(item => {
            matches.push({'filePath': found.filePath, 'item': item})
          })
        })

        // Prefer match lines that with # or are at the top of a file
        matches.sort((a, b) => {
            if (a.item.lineText.startsWith("#") || new Range(a.item.range).start.row == 0) return -1
            if (b.item.lineText.startsWith("#") || new Range(b.item.range).start.row == 0) return 1
            else return 0
        })
    }

    // Locate the matched item under the cursor and push it to the bottom of the stack
    let current = matches.find(match => {
        let matchRange = Range.fromObject(match.item.range)
        return editor && editor.getPath() == match.filePath && matchRange && matchRange.intersectsWith(currentRange)
    })
    if (current) {
        matches.splice(matches.indexOf(current), 1)
        matches.push(current)
    }
    return matches[0]
  }

  disposeTraversal() {
      if (this.traversal) {
          this.traversal.disposer.dispose()
          this.traversal = false
      }
  }

  // Find the next link ID and select it
  async selectNext(linkId, editor, currentRange) {
    if (this.traversal) {
        this.traversal.disposer.dispose()
        this.traversal.disposer = new CompositeDisposable()
    }
    let linkIdAt = await this.findNext(linkId, editor, currentRange)
    if (!linkIdAt) return

    let range = Range.fromObject(linkIdAt.item.range)
    await atom.workspace.open(linkIdAt.filePath,
      { pending: false, initialLine: range.start.row, initialColumn: range.start.column })
    atom.workspace.getActiveTextEditor().setSelectedBufferRange(range)

    if (this.traversal.matches.length == 1) {
      // Flash in place to indicate uniqueness: ^VNt^
      // (because beep doesn't work and resetting range doesn't work)
      editor.setSelectedBufferRange(currentRange, {flash: true})
    }

    // Listen for change and if we hear of any cursor change, trash the traversal
    this.traversal.disposer.add(editor.onDidChangeSelectionRange(editor => {
        this.disposeTraversal()
    }))
    this.traversal.disposer.add(atom.workspace.onDidChangeActivePaneItem(workspace => {
        this.disposeTraversal()
    }))
  }

  // Create and return a unique link ID
  async createUnique() {
    let linkIdAt = true
    while (linkIdAt) {
      linkId = this.createLinkId()
      linkIdAt = await this.findNext(linkId)
      this.disposeTraversal()
    }
    return linkId
  }
}
