{
    # Info for extension configuration files (package.json, manifest.json, etc)
    :name => 'gokosalvager',
    :version => '2.2.3',
    :title => 'Goko Dominion Salvager',
    :desc => 'Enhance your Online Dominion experience!',
    :author => 'The unofficial forum.dominionstrategy dev team',
    :contributors => [
        'philosophyguy',
        'Adam Pearce (1wheel)',
        'nutki',
        'Michael Brandt (michaeljb)',
        'Andrew Iannaccone (ragingduckd)',
        'Zdenek Bouska (yed)'
    ],
    :icon16 => 'salvager16.png',
    :icon48 => 'salvager48.png',
    :icon128 => 'salvager128.png',
    :homepage => 'http://forum.dominionstrategy.com/index.php?topic=9063.0',
    :license => 'MPL 2.0',
    :manifest_version => '2',
    :safarixtz_url => 'http://goo.gl/1SJmbB',

    # JS scripts for Goko to load, in order
    :js => [
        'jquery-ui.js',
        'angular.min.js',
        'utils.js',
        'settings.js',
        'kingdom_generator.js',
        'settingsDialog.js',
        'userSettings.js',
        'tableState.js',
        'autokick.js',
        'avatars.js',
        'blacklist.js',
        'sidebar.js',
        #'logviewer.js',
        #'decktracker.js',
        #'vpcounter.js',
        'lobby_ratings.js',
        'alwaysStack.js',
        'decktracker.js',
        'automatchGamePop.js',
        'automatchOfferPop.js',
        'automatchSeekPop.js',
        'automatch.js'
    ],

    # CSS to be injected
    :css => [
        'logviewer.css',
        'jquery-gokocolors.css'
    ]
}
