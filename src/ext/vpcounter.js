
    var vpoint = {
        'Estate': function () {return 1; },
        'Colony': function () {return 10; },
        'Duchy': function () {return 3; },
        'Duke': function (d) {return d.Duchy || 0; },
        'Fairgrounds': function (d) {
            var c, s = 0;
            for (c in d) {
                s += 1;
            }
            return 2 * Math.floor(s / 5);
        },
        'Farmland': function () {return 2; },
        'Feodum': function (d) {return Math.floor((d.Silver || 0) / 3); },
        'Gardens': function (d) {
            var c, s = 0;
            for (c in d) {
                s += d[c];
            }
            return Math.floor(s / 10);
        },
        'Province': function () {return 6; },
        'Silk Road': function (d) {
            var c, s = 0;
            for (c in d) {
                if (types[c].match(/victory/)) {
                    s += d[c];
                }
            }
            return Math.floor(s / 4);
        },
        'Vineyard': function (d) {
            var c, s = 0;
            for (c in d) {
                if (types[c].match(/\baction/)) {
                    s += d[c];
                }
            }
            return Math.floor(s / 3);
        },
        //'Overgrown Estate': function () {return 0},
        'Dame Josephine': function () {return 2; },
        'Great Hall': function () {return 1; },
        'Nobles': function () {return 2; },
        'Island': function () {return 2; },
        'Harem': function () {return 2; },
        'Tunnel': function () {return 2; },
        'Curse': function () {return -1; },
    };

    function vp_in_deck(deck) {
        var card, points = 0;
        for (card in deck) {
            if (vpoint[card]) {
                points += deck[card] * vpoint[card](deck);
            }
        }
        return points;
    }






    vpOn = false;
    vpLocked = false;
    vp_div = function () {
        if (!vpOn) {
            return '';
        }
        var ret = '<div style="position:absolute;padding:2px;background-color:gray"><table>';
        var p = Object.keys(newLogNames);
        p.sort(function (a, b) {
            var pa = newLogNames[a];
            var pb = newLogNames[b];
            if (playervp[pa] !== playervp[pb]) {
                return playervp[pb] - playervp[pa];
            }
            return pb - pa;
        });
        var i;
        for (i = 0; i < p.length; i += 1) {
            var pn = newLogNames[p[i]];
            ret += '<tr class="p' + pn + '"><td>' + p[i] + '</td><td>' + playervp[pn] + '</td></tr>';
        }
        ret += '</table></div>';
        return ret;
    };

    dw.prototype._old_moveCards = dw.prototype._moveCards;
    dw.prototype._moveCards = function (options, callback) {
        var m = options.moves;
        try {
            for (i = 0; i < m.length; i += 1) {
                if (m[i].source.area.name === 'reveal'
                        && m[i].destination.area.name === 'hand'
                        && m[i].source.area.playerIndex !== m[i].destination.area.playerIndex) {
                    updateDeckMasq(m[i].source.area.playerIndex + 1, m[i].destination.area.playerIndex + 1,
                                    decodeCard(m[i].sourceCard));
                }
            }
        } catch (e) { console.log('exception: ' + e); }
        this._old_moveCards(options, callback);
    };

    function vp_txt() {
        var i, ret = [];
        var p = Object.keys(newLogNames);
        for (i = 0; i < p.length; i += 1) {
            ret.push(p[i] + ': ' + playervp[newLogNames[p[i]]]);
        }
        return ret.sort().join(', ');
    }


    var updateDeckMasq = function (src_player, dst_player, card) {
        if (!card || !src_player || !dst_player) {
            return;
        }
        console.log('passed: ' + card + ' from ' + src_player + ' to ' + dst_player);
        updateCards(src_player, [card], -1);
        updateCards(dst_player, [card], 1);
    };

    var vpoint = {
        'Estate': function () {return 1; },
        'Colony': function () {return 10; },
        'Duchy': function () {return 3; },
        'Duke': function (d) {return d.Duchy || 0; },
        'Fairgrounds': function (d) {
            var c, s = 0;
            for (c in d) {
                s += 1;
            }
            return 2 * Math.floor(s / 5);
        },
        'Farmland': function () {return 2; },
        'Feodum': function (d) {return Math.floor((d.Silver || 0) / 3); },
        'Gardens': function (d) {
            var c, s = 0;
            for (c in d) {
                s += d[c];
            }
            return Math.floor(s / 10);
        },
        'Province': function () {return 6; },
        'Silk Road': function (d) {
            var c, s = 0;
            for (c in d) {
                if (types[c].match(/victory/)) {
                    s += d[c];
                }
            }
            return Math.floor(s / 4);
        },
        'Vineyard': function (d) {
            var c, s = 0;
            for (c in d) {
                if (types[c].match(/\baction/)) {
                    s += d[c];
                }
            }
            return Math.floor(s / 3);
        },
        //'Overgrown Estate': function () {return 0},
        'Dame Josephine': function () {return 2; },
        'Great Hall': function () {return 1; },
        'Nobles': function () {return 2; },
        'Island': function () {return 2; },
        'Harem': function () {return 2; },
        'Tunnel': function () {return 2; },
        'Curse': function () {return -1; },
    };

    function vp_in_deck(deck) {
        var card, points = 0;
        for (card in deck) {
            if (vpoint[card]) {
                points += deck[card] * vpoint[card](deck);
            }
        }
        return points;
    }

    function updateCards(player, cards, v) {
        var i;
        for (i = 0; i < cards.length; i += 1) {
            playerDecks[player][cards[i]] = playerDecks[player][cards[i]] ?
                    playerDecks[player][cards[i]] + v : v;
            if (playerDecks[player][cards[i]] <= 0) {
                delete playerDecks[player][cards[i]];
            }
        }
        playervp[player] = vpchips[player] + vp_in_deck(playerDecks[player]);
    }

    updateDeck = function (player, action) {
        var h;
        if ((h = action.match(/^returns (.*) to the Supply$/)) !== null) {
            updateCards(player, [h[1]], -1);
        } else if ((h = action.match(/^gains (.*)/)) !== null) {
            updateCards(player, [h[1]], 1);
        } else if ((h = action.match(/^trashes (.*)/)) !== null) {
            if (possessed && player === newLogMode) {
                return;
            }
            updateCards(player, h[1].split(', ').filter(function (c) {
                return c !== "Fortress";
            }), -1);
        } else if ((h = action.match(/^starting cards: (.*)/)) !== null) {
            updateCards(player, h[1].split(', '), 1);
            /* live log does not have passed card names
               } else if (h = action.match(/^passes (.*)/)) {
               updateCards(player, [h[1]], -1);
               updateCards(player === newLogPlayers ? 1 : player + 1, [h[1]], 1);
               */
        } else if ((h = action.match(/^receives ([0-9]*) victory point chips$/)) !== null) {
            vpchips[player] += parseInt(h[1], 10);
            updateCards(player, []);
        } else if ((h = action.match(/^plays Bishop$/)) !== null) {
            vpchips[player] += 1;
            updateCards(player, []);
        } else if ((h = action.match(/^plays (Spoils|Madman)$/)) !== null) {
            updateCards(player, [h[1]], -1);
        }
    };


