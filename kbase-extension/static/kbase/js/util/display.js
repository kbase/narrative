/*global define*/
/*jslint white: true*/
/**
 * A few string utility functions. These are kinda unrelated, but used in several places.
 *
 * @author Bill Riehl wjriehl@lbl.gov
 */
define(['jquery',
        'bluebird',
        'narrativeConfig',
        'util/timeFormat',
        'kbase-client-api'],
function($,
         Promise,
         Config,
         TimeFormat) {
    'use strict';

    var profileClient = new UserProfile(Config.url('user_profile'));
    var profilePageUrl = Config.url('profile_page');
    var cachedUserIds = {};

    function lookupUserProfile (username) {
        if (!cachedUserIds[username]) {
            cachedUserIds[username] = Promise.resolve(profileClient.get_user_profile([username]));
        }
        return cachedUserIds[username];
    }

    /**
     * @method
     * displayRealName
     */
    function displayRealName (username, $target) {
        lookupUserProfile(username).then(function(profile) {
            var usernameLink = '<a href="' + profilePageUrl + username + '" target="_blank">' + username + '</a>';

            if (profile && profile[0] && profile[0].user) {
                var name = profile[0].user.realname;
                if (name !== undefined)
                    usernameLink = name + ' (' + usernameLink + ')';
            }
            $target.html(usernameLink);
        })
        .catch(function(err) { console.log(err); });
    }

    /**
     * @method
     * loadingSpinner
     * creates and returns a loading spinner DOM element with optional caption.
     * This node is a div with the usual loading gif centered, with the (optional)
     * caption centered below.
     */
    function loadingSpinner (caption) {
        var spinner = '<span class="fa fa-spinner fa-pulse fa-2x fa-fw">';
        if (caption) {
            spinner += caption + '... &nbsp; &nbsp;'
        }
        spinner += '</span>';
        return spinner;
    }

    return {
        lookupUserProfile: lookupUserProfile,
        displayRealName: displayRealName
    };
});