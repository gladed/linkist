'use babel';

import LinkistView from './linkist-view';
import { CompositeDisposable } from 'atom';

export default {
  linkistView: null,
  modalPanel: null,
  subscriptions: null,
  linkDigits: 'j6EpuN2TkFbJBVSCfhnarZ95W8KARmwUytiqQgcYxsX3D7dM4ePGzHv',
  linkChars: 6,

  // Called on load to initialize UI and subscribe to handlers
  activate(state) {
    this.linkistView = new LinkistView(state.linkistViewState);
    // this.modalPanel = atom.workspace.addModalPanel({
    //   item: this.linkistView.getElement(),
    //   visible: false
    // });
    if (state.ordinal) {
      this.ordinal = state.ordinal;
    } else {
      this.ordinal = 3027;
    }

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'linkist:link': () => this.link()
    }));
  },

  // Called on unload to clean up UIs and subscriptions
  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.linkistView.destroy();
  },

  // Called to return package-specific state between use
  serialize() {
    return {
      linkistViewState: this.linkistView.serialize(),
      ordinal: this.ordinal
    };
  },

  ordinalToLink(ordinal) {
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

  // Insert a new link? Or something?
  link() {
    let editor = atom.workspace.getActiveTextEditor()
    if (editor) {
      var cursor = editor.getCursors()[0]
      var linkRe = new RegExp('\\^[' + this.linkDigits + ']{3,}\\^', 'g')
      options = {}
      options.wordRegex = linkRe
      var bufferRange = cursor.getCurrentWordBufferRange(options)
      var cursorText = editor.getTextInBufferRange(bufferRange)


      var match = cursorText.match(linkRe)
      if (match) {
        // Search for a link (e.g. ^5uMhtD) in the current project.
        editor.setSelectedBufferRange(bufferRange)
        atom.commands.dispatch(document.querySelector('atom-text-editor'), 'project-find:show')
      } else {
        // Insert a new link (e.g. ^XzX3fi) in the current project.
        // TODO: Move to end of word, or insert within {}[](), or
        // after ",", make sure it's not clobbered up at end, etc.
        // if (cursor.isInsideWord()) {
        //   console.log("Inside word at so moving to end")
        //   cursor.moveToEndOfWord()
        // }
        this.ordinal += 1
        var link = "^" + this.ordinalToLink(this.ordinal) + "^"
        editor.insertText(link)
      }
    }
  }
};
