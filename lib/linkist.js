'use babel';

import LinkistView from './linkist-view';
import { CompositeDisposable } from 'atom';

export default {
  linkistView: null,
  modalPanel: null,
  subscriptions: null,
  linkAlphabet: '23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ',
  linkChars: 6,

  // Called on load to initialize UI and subscribe to handlers
  activate(state) {
    this.linkistView = new LinkistView(state.linkistViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.linkistView.getElement(),
      visible: false
    });

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
      linkistViewState: this.linkistView.serialize()
    };
  },

  // Insert a new link? Or something?
  link() {
    let editor = atom.workspace.getActiveTextEditor()
    if (editor) {
      var cursor = editor.getCursors()[0]
      var linkRe = new RegExp('\\^[' + this.linkAlphabet + ']{5,}', 'g')
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
        var link = "^"
        for (var i = 0; i < this.linkChars; i++) {
          var pos = Math.floor(Math.random() * this.linkAlphabet.length)
          link += this.linkAlphabet.substring(pos, pos + 1)
        }
        editor.insertText(link)
      }
    }
  }
};
