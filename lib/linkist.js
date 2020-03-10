'use babel';

import LinkistView from './linkist-view';
import { CompositeDisposable } from 'atom';

export default {

  linkistView: null,
  modalPanel: null,
  subscriptions: null,

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
      'linkist:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.linkistView.destroy();
  },

  serialize() {
    return {
      linkistViewState: this.linkistView.serialize()
    };
  },

  toggle() {
    let editor
    if (editor = atom.workspace.getActiveTextEditor()) {
      let selection = editor.getSelectedText()
      let reversed = selection.split('').reverse().join('')
      editor.insertText(reversed)
    }  
  }

};
