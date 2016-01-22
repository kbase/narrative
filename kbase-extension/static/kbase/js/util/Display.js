/*global define*/
/*jslint white: true*/
/**
 * A few string utility functions. These are kinda unrelated, but used in several places.
 *
 * @author Bill Riehl wjriehl@lbl.gov
 */
define(['jquery',
        'narrativeConfig',
        'util/timeFormat',
        'kbase-client-api'],
function($,
         Config,
         TimeFormat) {
    'use strict';

    var profileClient = new UserProfile(Config.url('user_profile'));
    var profilePageUrl = Config.url('profile_page');
    var cachedUserIds = {};

    function lookupUserProfile (username) {
        if (!cachedUserIds[username]) {
            cachedUserIds[username] = profileClient.get_user_profile([username]);
        }
        return cachedUserIds[username];
    }

    /**
     * @method
     * insertRealName
     */
    function displayRealName (username, $target) {
        lookupUserProfile(username).always(function(profile) {
            var usernameLink = '<a href="' + profilePageUrl + username + '" target="_blank">' + username + '</a>';

            if (profile && profile[0]) {
                var name = profile[0].user.realname;
                usernameLink = name + ' (' + usernameLink + ')';
            }
            $target.html(usernameLink);
        })
    }

    return {
        lookupUserProfile: lookupUserProfile,
        displayRealName: displayRealName
    };
});