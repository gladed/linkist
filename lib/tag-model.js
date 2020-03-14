'use babel';

import { CompositeDisposable, Range } from 'atom';

// Manage link tags across files in project
module.exports = class TagModel {
  constructor(state) {
    this.linkDigits = 'j6EpuN2TkFbJBVSCfhnarZ95W8KARmwUytiqQgcYxsX3D7dM4ePGzHv'
    this.lastTag = null;
    this.ordinal = state.ordinal ? state.ordinal : 4001;
  }

  async setup() {
    this.subs = new CompositeDisposable()
    this.subs.add(atom.config.observe('linkist.filesToSearch', globs => {
      this.globs = globs.split(/[ ,;]+/)
    }))
  }

  dispose() {
    this.subs.dispose()
  }

  serialize(state) {
    state.ordinal = this.ordinal
  }

  // Return a new, random-looking link. Might not be unique.
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
  }

  // Scan for results and select the next item that isn't under the cursor
  async findNext(tag, editor, currentRange) {
    let tagRe = new RegExp(`\\(${tag}\\)|\\[${tag}\\]|\\^${tag}\\^`, 'g')
    let matches = []
    await atom.workspace.scan(tagRe, { 'paths': this.globs }, found => {
      matches.push(found)
    })

    // Find the first match and the next match
    let found = false, first = false, next = false
    matches.forEach(fileMatch => {
      fileMatch.matches.forEach(itemMatch => {
        let matchRange = Range.fromObject(itemMatch.range)
        if (editor && editor.getPath() == fileMatch.filePath && matchRange && matchRange.intersectsWith(currentRange)) {
          found = true
        } else {
          if (!first) first = { 'file': fileMatch, 'item': itemMatch }
          if (found && !next) next = { 'file': fileMatch, 'item': itemMatch }
        }
      })
    })
    return next ? next : first
  }

  // Find the next tag and select it
  async selectNext(tag, editor, currentRange) {
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
      // On a collision, randomly bump the ordinal and try again.
      this.ordinal += 100 + Math.floor(Math.random() * 200);
      tag = this.createTag()
      tagAt = await this.findNext(tag)
    }
    return tag
  }
}

// If we were indexing...
// monitorFiles() {
//   // Subscribe to ALL directories so we know if files changed
//   this.subs.add(atom.project.onDidChangeFiles(events => {
//     for (const event of events) {
//       console.log(`Event ${event.action} for ${event.path}`, event)
//     }
//   }))
//   this.subs.add(atom.workspace.observeTextEditors(editor => {
//       console.log(`Subscribing to editor for ${editor.buffer.file.path}`)
//       this.subs.add(editor.onDidDestroy(() => {
//         console.log(`Closing editor for ${editor.buffer.file.path}`)
//       }))
//       this.subs.add(editor.onDidChangePath(() => {
//         console.log(`Editor path changed in ${editor.buffer.file.path}`)
//       }))
//       this.subs.add(editor.onDidStopChanging(() => {
//         console.log(`Editor contents changed in ${editor.buffer.file.path}`)
//       }))
//   }))
// }
