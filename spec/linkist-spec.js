'use babel';

import Linkist from '../lib/linkist';

// Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
// or `fdescribe`). Remove the `f` to unfocus the block.

describe('Linkist', () => {
  let workspaceElement, activationPromise;

  beforeEach(() => {
    workspaceElement = atom.views.getView(atom.workspace);
    activationPromise = atom.packages.activatePackage('linkist');
  });

  describe('when a link value is generated', () => {
      it('never repeats', () => {
        var digits = 'j6EpuN2TkFbJBVSCfhnarZ95W8KARmwUytiqQgcYxsX3D7dM4ePGzHv'
        function ordinalToLink(v) {
          result = "";
          lastDigit = 7;
          while (v > 0 || result == "") {
            digit = v % digits.length;
            v = Math.floor(v / digits.length);
            result = digits[(digit + lastDigit) % digits.length] + result;
            lastDigit = (lastDigit + digit + 7) % digits.length;
          }
          return result;
        }

        String.prototype.shuffle = function () {
          var a = this.split(""),
              n = a.length;

          for(var i = n - 1; i > 0; i--) {
              var j = Math.floor(Math.random() * (i + 1));
              var tmp = a[i];
              a[i] = a[j];
              a[j] = tmp;
          }
          return a.join("");
        }
        console.log(digits.shuffle())
        console.log(ordinalToLink(166375))
        var linkValues = []
        for (var i = 0; i < digits.length * digits.length; i++) {
          linkValues.push(ordinalToLink(i))
        }
        expect(linkValues.size).not.toEqual(0)
        expect(new Set(linkValues).size).toEqual(linkValues.length);
      });
  });

  // describe('when the linkist:toggle event is triggered', () => {
  //   it('hides and shows the modal panel', () => {
  //     // Before the activation event the view is not on the DOM, and no panel
  //     // has been created
  //     expect(workspaceElement.querySelector('.linkist')).not.toExist();
  //
  //     // This is an activation event, triggering it will cause the package to be
  //     // activated.
  //     atom.commands.dispatch(workspaceElement, 'linkist:link');
  //
  //     waitsForPromise(() => {
  //       return activationPromise;
  //     });
  //
  //     runs(() => {
  //       expect(workspaceElement.querySelector('.linkist')).toExist();
  //
  //       let linkistElement = workspaceElement.querySelector('.linkist');
  //       expect(linkistElement).toExist();
  //
  //       let linkistPanel = atom.workspace.panelForItem(linkistElement);
  //       expect(linkistPanel.isVisible()).toBe(true);
  //       atom.commands.dispatch(workspaceElement, 'linkist:link');
  //       expect(linkistPanel.isVisible()).toBe(false);
  //     });
  //   });
  //
  //   it('hides and shows the view', () => {
  //     // This test shows you an integration test testing at the view level.
  //
  //     // Attaching the workspaceElement to the DOM is required to allow the
  //     // `toBeVisible()` matchers to work. Anything testing visibility or focus
  //     // requires that the workspaceElement is on the DOM. Tests that attach the
  //     // workspaceElement to the DOM are generally slower than those off DOM.
  //     jasmine.attachToDOM(workspaceElement);
  //
  //     expect(workspaceElement.querySelector('.linkist')).not.toExist();
  //
  //     // This is an activation event, triggering it causes the package to be
  //     // activated.
  //     atom.commands.dispatch(workspaceElement, 'linkist:link');
  //
  //     waitsForPromise(() => {
  //       return activationPromise;
  //     });
  //
  //     runs(() => {
  //       // Now we can test for view visibility
  //       let linkistElement = workspaceElement.querySelector('.linkist');
  //       expect(linkistElement).toBeVisible();
  //       atom.commands.dispatch(workspaceElement, 'linkist:link');
  //       expect(linkistElement).not.toBeVisible();
  //     });
  //   });
  // });
});
