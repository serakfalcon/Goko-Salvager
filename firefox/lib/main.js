/*jslint browser:true */
/*globals require */

var pageMod = require("sdk/page-mod");
var self = require("sdk/self");

pageMod.PageMod({
    // Modify goko gameClient.html pages
    include: ["http://play.goko.com/Dominion/gameClient.html*",
              "https://play.goko.com/Dominion/gameClient.html*",
              "http://beta.goko.com/Dominion/gameClient.html*",
              "https://beta.goko.com/Dominion/gameClient.html*"],

    contentStyleFile: self.data.url('logviewer.css'),

    // - start (=when document element inserted)
    // - ready (=DOMContentLoaded)
    // - end (=onload event)
    contentScriptWhen: "ready",

    // Run the extension scripts in the Firefox JS context
    contentScriptFile: [
        self.data.url("backbone-min.js"),

        self.data.url("settings.js"),

        self.data.url("autokick.js"),
        self.data.url("avatars.js"),
        self.data.url("blacklist.js"),
        self.data.url("lobby_ratings.js"),
        self.data.url("kingdom_generator.js"),
        self.data.url("logviewer.js"),

        self.data.url("automatchSeekPop.js"),
        self.data.url("automatchOfferPop.js"),
        self.data.url("automatchGamePop.js"),
        self.data.url("automatch.js")
    ]
});
