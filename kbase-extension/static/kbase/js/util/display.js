/*global define*/
/*jslint white: true*/
/**
 * A few string utility functions. These are kinda unrelated, but used in several places.
 *
 * @author Bill Riehl wjriehl@lbl.gov
 */
define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'bluebird',
		'narrativeConfig',
		'util/timeFormat',
		'kbase-client-api'
	], function(
		KBWidget,
		bootstrap,
		$,
		Promise,
		Config,
		TimeFormat,
		kbase_client_api
	) {
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

    function loadingDiv (caption) {
        var $caption = $('<span>');
        var $loader = $('<div>').addClass('kb-data-loading')
                                .append('<img src="' + Config.get('loading_gif') + '">')
                                .append('<br>')
                                .append($caption);
        if (caption)
            setText(caption);

        function setText(caption) {
            $caption.text(caption);
        }

        return {
            div: $loader,
            setText: setText
        };
    }


    /**
     * @method
     * getMethodIcon
     * 
     * Provides a JQuery object containing an Icon for narrative apps (in the 
     * legacy style) or methods (soon to be called apps).
     *
     * params = {
     *    isApp: true | false  // set to true to use the default app icon
     *    url:  string         // url to the icon image, if missing this will provide a default
     *    size: string         // set the max-width and max-height property for url icons 
     *                         // (icons are square), default is 50px
     *    cursor: string       // if set, set the cursor css of the icon, default is 'default'
     *    setColor: true | false  // this param should probably go away, but if true will set the color of the default icon
     * }
     */
    function getAppIcon(params) {

        var cursor = 'default';
        if(params.cursor) { cursor = params.cursor; }

        if(params.url) {
            var size = '50px';
            if(params.size) { size = params.size; }
            return $('<img src="'+params.url+'">').css({'max-width':size,'max-height':size, 'cursor':cursor});
        }

        // no url, so show default
        var icons = Config.get('icons'); // icon default parameters are set in a config

        var isApp = false;
        if(params['isApp']) { isApp = params['isApp']; }

        var name = isApp ? "app" : "method";
        var icon_color = isApp ? icons.colors[9] : icons.colors[5];
        var icon_class = isApp ? 'app-icon' : 'method-icon';

        var icon = icons.methods[name];
        var $icon = $('<i>');
        // background
        $icon.addClass("fa-stack fa-2x").css({'cursor': cursor});
        var $i = $('<i>').addClass('fa fa-square fa-stack-2x ' + icon_class);
        if(params.setColor) { $i.css({color: icon_color}); }
        $icon.append($i);
        // add stack of font-awesome icons
        _.each(icon, function (cls) {
            $icon.append($('<i>')
                .addClass("fa fa-inverse fa-stack-1x " + cls));
        });
        return $icon;
    }


    return {
        lookupUserProfile: lookupUserProfile,
        displayRealName: displayRealName,
        loadingDiv: loadingDiv,
        getAppIcon: getAppIcon
    };
});