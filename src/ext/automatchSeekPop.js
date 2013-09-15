/*jslint browser: true, devel: true, indent: 4, maxlen: 100, es5: true */
/*global jQuery, $, angular */

(function () {
    "use strict"; // JSList mode

    var gs = window.GokoSalvager;
    gs.AM = gs.AM || {};

    gs.AM.appendSeekPopup = function (viewport) {
        $('<div>').attr('id', 'seekAAPop')
                  .attr('title', 'Looking for Match')
            .append($('<p>').text('Automatch is looking for players whose '
                                + 'search criteria match your table.</p>'))
            .append($('<button>').attr('id', 'seekAAStop')
                                 .text('Stop Looking'))
            .append($('<button>').attr('id', 'seekAAOkay')
                                 .text('Keep Looking'))
            .appendTo('#viewport')
            .dialog({
                modal: false,
                width: 500,
                draggable: true,
                resizeable: false,
                autoOpen: false
            });

        $('#seekAAStop').click(function () {
            gs.AM.showSeekPop(false);
            gs.AM.cancelSeek();
        });

        $('#seekAAOkay').click(function () {
            gs.AM.showSeekPop(false);
        });

        $('<div>').attr('id', 'seekPop')
                  .attr('title', 'Seek Automatch')
                  .attr('ng:app', 'amSettingsApp')
                  .attr('ng:controller', 'settingsController')
            .append($('<table>')
                .append($('<tr>')
                    .append($('<td>').attr('colspan', 2)
                        .append('Min Players:')
                        .append($('<select>').attr('id', 'minPlayers')
                                             .attr('ng:model', 'so.automatch_min_players')
                                             .attr('ng:options', 'i for i in [2,3,4,5,6]')))
                    .append($('<td>').attr('colspan', 2)
                        .append('Min Sets:')
                        .append($('<select>').attr('id', 'minSets')
                                             .attr('ng:model', 'so.automatch_min_sets')
                                             .attr('ng:options',
                                                   'setCountsString(i) for i in setCounts'))))
                .append($('<tr>')
                    .append($('<td>').attr('colspan', 2)
                        .append('Max Players:')
                        .append($('<select>').attr('id', 'maxPlayers')
                                             .attr('ng:model', 'so.automatch_max_players')
                                             .attr('ng:options',
                                                   'i for i in [2,3,4,5,6]')))
                    .append($('<td>').attr('colspan', 2)
                        .append('Max Sets:')
                        .append($('<select>').attr('id', 'maxSets')
                                             .attr('ng:model', 'so.automatch_max_sets')
                                             .attr('ng:options',
                                                   'setCountsString(i) for i in setCounts')))))
            .append($('<table>')
                .append($('<tr>')
                    .append($('<td>')
                        .append('Rating +/-'))
                    .append($('<td>')
                        .append($('<input>').attr('type', 'number')
                                            .attr('id', 'rdiff')
                                            .attr('value', '2000')
                                            .attr('size', '4')
                                            .attr('ng:model', 'so.automatch_rdiff'))))
                .append($('<tr>')
                    .append($('<td>').text('System: '))
                    .append($('<td>')
                        .append($('<select>').attr('id', 'ratingSystem')
                                             .attr('ng:model', 'so.automatch_rSystem')
                            .append($('<option>').attr('value', 'pro').text('Pro'))
                            .append($('<option>').attr('value', 'casual').text('Casual'))
                            .append($('<option>').attr('value', 'unrated').text('Unrated')))))
                .append($('<tr>')
                    .append($('<td>')
                        .append($('<input>').attr('type', 'submit')
                                            .attr('id', 'seekreq')
                                            .attr('value', 'Submit')
                                            .attr('ng:click', 'save(us)'))
                        .append($('<input>').attr('type', 'submit')
                                            .attr('id', 'seekcan')
                                            .attr('value', 'Cancel'))
                        .append($('<input>').attr('type', 'submit')
                                            .attr('id', 'seekhide')
                                            .attr('value', 'Hide')))
                    .append($('<td>').attr('colspan', 4)
                        .append($('<div>').attr('id', 'seekstatus')))))
            .appendTo($('#viewport'));

        // Override Goko's "hide select elements by default" css
        $('#seekPop select').css('visibility', 'inherit');
        $('#seekPop select').css('top', 'auto');

        $('#seekPop').dialog({
            modal: false,
            width: 550,
            draggable: true,
            resizeable: false,
            autoOpen: false
        });

        // Submit request
        $('#seekreq').click(function () {
            var np, ns, rr, rs;
            gs.debug('requested seek');

            np = {rclass: 'NumPlayers', props: {}};
            np.props.min_players = gs.get_option('automatch_min_players');
            np.props.max_players = gs.get_option('automatch_max_players');

            ns = {rclass: 'NumSets', props: {}};
            ns.props.min_sets = gs.get_option('automatch_min_sets');
            ns.props.max_sets = gs.get_option('automatch_max_sets');

            rr = {rclass: 'RelativeRating', props: {}};
            rr.props.pts_lower = gs.get_option('automatch_rdiff');
            rr.props.pts_higher = gs.get_option('automatch_rdiff');
            rr.props.rating_system = gs.get_option('automatch_rSystem');

            rs = {rclass: 'RatingSystem', props: {}};
            rs.props.rating_system = gs.get_option('automatch_rSystem');

            // Clear any cached table information from an automatch request
            // that was generated through a table create.
            gs.AM.tableSettings = null;

            // Send seek request
            gs.AM.submitSeek({
                player: gs.AM.player,
                requirements: [np, ns, rr, rs]
            });

            // Hide the dialog
            gs.AM.showSeekPop(false);
        });

        // Cancel outstanding request, if any, and close dialog
        $('#seekcan').click(function () {
            gs.AM.cancelSeek();
            gs.AM.showSeekPop(false);
        });

        $('#seekhide').click(function () {
            gs.AM.showSeekPop(false);
        });


        /*
         * Input validation
         */

        $('#minPlayers').change(function () {
            if (parseInt($('#minPlayers').val(), 10)
                    > parseInt($('#maxPlayers').val(), 10)) {
                $('#maxPlayers').val($('#minPlayers').val());
            }
        });

        $('#maxPlayers').change(function () {
            if (parseInt($('#maxPlayers').val(), 10)
                    < parseInt($('#minPlayers').val(), 10)) {
                $('#minPlayers').val($('#maxPlayers').val());
            }
        });

        $('#minSets').change(function () {
            if (parseInt($('#minSets').val(), 10)
                    > parseInt($('#maxSets').val(), 10)) {
                $('#maxSets').val($('#minSets').val());
            }
        });

        $('#maxSets').change(function () {
            if (parseInt($('#maxSets').val(), 10)
                    < parseInt($('#minSets').val(), 10)) {
                $('#minSets').val($('#maxSets').val());
            }
        });

        angular.bootstrap(window.document.getElementById('seekPop'));
    };

    // Update and show/hide the dialog
    gs.AM.showSeekPop = function (visible) {
        var seeking, canceling;

        seeking = (gs.AM.state.seek !== null);
        canceling = seeking && gs.AM.state.seek.hasOwnProperty('canceling');

        $('#seekPop select').prop('disabled', seeking || canceling);
        $('#seekPop input').prop('disabled', seeking || canceling);
        $('#seekreq').prop('disabled', seeking || canceling);
        $('#seekcan').prop('disabled', canceling);
        $('#seekhide').prop('disabled', false);
        $('#seekstatus').text(seeking ? 'Looking for a match...' : '');

        if (typeof visible === "undefined") {
            visible = true;
        }

        if (gs.AM.state.seek !== null && gs.AM.tableSettings !== null) {
            $('#seekAAPop').dialog(visible ? 'open' : 'close');
            $('#seekAAOkay').focus();
        } else {
            $('#seekPop').dialog(visible ? 'open' : 'close');
            $('#seekhide').focus();
        }
    };
}());
