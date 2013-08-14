Goko Dominion Salvager
======================

Discuss the extension at the [Dominion Strategy forum](http://goo.gl/4muRB).


Installation
------------
- Chrome - [get it from the Chrome web store](http://goo.gl/Y9AK5)
- Firefox - [Firefox Add-on Store](https://addons.mozilla.org/en-US/firefox/addon/goko-salvager/)
- Opera - the extension is not currently available in the Opera store, but it may be added by downloading and unzipping the [project ZIP](https://github.com/michaeljb/Goko-Live-Log-Viewer/archive/master.zip) and following [these instructions](http://dev.opera.com/extension-docs/tut_basics.html#step_4_testing_your_extension)
- Safari - [download the extension file](http://goo.gl/1SJmbB), and double-click on it to add it to Safari

Contributors
------------
- philosophyguy
- nutki
- 1wheel
- michaeljb
- ragingduckd
- yed (Zdenek Bouska)

Development-notes
-----------------
The current "safari:build" rake task doesn't quite work for me (aiannacc), though it does work for michaeljb. For aiannacc It generates the correct content but it doesn't sign it correctly. If you face the same problem, you can create a working Safari extension by opening Safari, enabling the Develop menu in Preferences, opening Menu/Develop/Extension Builder, adding the extension files using the bottom-left "+" sign, and then clicking "Build Package." You will need to have your Safari Developer certificate installed for this to work.
