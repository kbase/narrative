/*global define*/
/*jslint white: true*/
/**
 * A few string utility functions. These are kinda unrelated, but used in several places.
 *
 * @author Bill Riehl wjriehl@lbl.gov
 */
define([
    'kbwidget',
    'bootstrap',
    'jquery',
    'underscore',
    'bluebird',
    'narrativeConfig',
    'util/timeFormat',
    'util/string',
    'kbase-client-api',
    'kbaseAccordion',
    'api/auth'
], function (
    KBWidget,
    bootstrap,
    $,
    _,
    Promise,
    Config,
    TimeFormat,
    StringUtil,
    kbase_client_api,
    KBaseAccordion,
    Auth
) {
    'use strict';

    var profileClient = new UserProfile(Config.url('user_profile'));
    var authClient = Auth.make({url: Config.url('auth')});
    var profilePageUrl = Config.url('profile_page');
    var cachedUserIds = {};

    function lookupUserProfile(username) {
        if (!cachedUserIds[username]) {
            cachedUserIds[username] = Promise.resolve(profileClient.get_user_profile([username]));
        }
        return cachedUserIds[username];
    }

    /**
     * @method
     * displayRealName
     *
     */
    /**
     * Builds a displayable element from a user name. This includes a link to a user's profile page.
     * For example, a user named "kbaseuser" would get a display like:
     * KBase User (kbaseuser)
     * where the part inside the parentheses links to the profile page.
     * @param {string} username - the user id to put on display
     * @param {object} $target - the target JQuery node to modify (maybe should just return the element as part of a promise?)
     * @param {string} displayName - optional, the display name to use. If given, then an auth call isn't made.
     */
    function displayRealName(username, $target, displayName) {
        let safeUser = StringUtil.escape(username),
            usernameLink = '<a href="' + profilePageUrl + safeUser + '" target="_blank">' + safeUser + '</a>';
        if (displayName) {
            return new Promise((resolve) => {
                $target.text(displayName);
                $target.append(' (' + usernameLink + ')');
                resolve();
            });
        }
        return authClient.getUserNames(null, [username])
            .then((user) => {
                if (user[safeUser]) {
                    $target.text(user[safeUser]);
                    usernameLink = ' (' + usernameLink + ')';
                }
            })
            .catch((err) => {
                console.error(err);
            })
            .finally(() => {
                $target.append(usernameLink);
            });
    }

    /**
     * @method
     * loadingSpinner
     * creates and returns a loading spinner DOM element with optional caption.
     * This node is a div with the usual loading gif centered, with the (optional)
     * caption centered below.
     */
    function loadingSpinner(caption) {
        var spinner = '<span class="fa fa-spinner fa-pulse fa-2x fa-fw">';
        if (caption) {
            spinner += caption + '... &nbsp; &nbsp;'
        }
        spinner += '</span>';
        return spinner;
    }

    function loadingDiv(caption) {
        var $caption = $('<span>');
        var $loader = $('<div>').addClass('kb-data-loading')
            .append('<img src="' + Config.get('loading_gif') + '" style="margin:auto">')
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
        if (params.cursor) {
            cursor = params.cursor;
        }

        if (params.url) {
            var size = '50px';
            if (params.size) {
                size = params.size;
            }
            return $('<img src="' + params.url + '">').css({'max-width': size, 'max-height': size, 'cursor': cursor});
        }

        // no url, so show default
        var icons = Config.get('icons'); // icon default parameters are set in a config

        var isApp = false;
        if (params['isApp']) {
            isApp = params['isApp'];
        }

        var name = isApp ? "app" : "method";
        var icon_color = isApp ? icons.colors[9] : icons.colors[5];
        var icon_class = isApp ? 'app-icon' : 'method-icon';

        var icon = icons.methods[name];
        var $icon = $('<i>');
        // background
        $icon.addClass("fa-stack fa-2x").css({'cursor': cursor});
        var $i = $('<i>').addClass('fa fa-square fa-stack-2x ' + icon_class);
        if (params.setColor) {
            $i.css({color: icon_color});
        }
        $icon.append($i);
        // add stack of font-awesome icons
        _.each(icon, function (cls) {
            $icon.append($('<i>')
                .addClass("fa fa-inverse fa-stack-1x " + cls));
        });
        return $icon;
    }

    /**
     * title - a string for the title of the error panel
     * error - either a string or a simple object (key-value pairs) representing the error
     *         if it has the following structure, then it's treated as a KBase JSON-RPC error:
     * {
     *     status: (number),
     *     error: {
     *         code: (number),
     *         message: (string),
     *         name: (string),
     *         error: (long traceback string)
     *     }
     * }
     * stackTrace (optional) - a (usually large) string with a stacktrace error. This gets
     *                         hidden behind an accordion.
     */
    function createError(title, error, stackTrace) {
        var $errorPanel = $('<div>')
                          .addClass('alert alert-danger')
                          .append('<b>' + title + '</b><br>Please contact the KBase team at <a href="http://kbase.us/contact-us/">http://kbase.us/contact-us/</a> with the information below.');

        $errorPanel.append('<br><br>');

        // If it's a string, just dump the string.
        if (typeof error === 'string') {
            $errorPanel.append(error);
        }

        // If it's an object, expect an error object
        else if (typeof error === 'object') {
            var errObj = error;
            if (error.status && error.error && error.error.error) {
                errObj = {
                    status: error.status,
                    code: error.error.code,
                    message: error.error.message,
                    name: error.error.name
                };
                if (!stackTrace) {
                    stackTrace = error.error.error;
                }
            }
            Object.keys(errObj).forEach(function(key) {
                $errorPanel.append($('<div>').append('<b>' + key + ':</b> ' + errObj[key]));
            });
        }
        else if (error) {
            $errorPanel.append('No other information available. Sorry!');
        }
        if (stackTrace) {
            var $traceAccordion = $('<div>');
            $errorPanel.append($traceAccordion);
            new KBaseAccordion($traceAccordion, {
                elements: [
                    {
                        title: 'Error Details',
                        body: $('<pre>').addClass('kb-function-error-traceback').append(stackTrace)
                    }
                ]}
            );
        }
        return $errorPanel;
    }

    /**
     * A helper function that makes a simple button with an icon in it.
     * sizeClass is expected to be a bootstrap btn size (btn-xs, btn-md, etc)
     * iconClass is expected to be a space-delimited string ('fa fa-spinner fa-spin fa-2x', etc.)
     */
    function simpleButton(sizeClass, iconClass) {
        return $('<button>')
               .addClass('btn btn-default ' + sizeClass)
               .append($('<span>').addClass(iconClass));
    }

    /**
     *
     * @param {DOMElement} element
     */
    function verticalInViewport(element) {
        if (!element) {
            return true;
        }
        let rect = element.getBoundingClientRect();
        if (rect.top === 0 && rect.bottom === 0) {
            return false;
        }
        return (
            (rect.top >= 0 && rect.top <= (window.innerHeight || document.documentElement.clientHeight)) ||
            (rect.bottom >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight))
        );
    }

    return {
        lookupUserProfile: lookupUserProfile,
        displayRealName: displayRealName,
        loadingDiv: loadingDiv,
        getAppIcon: getAppIcon,
        createError: createError,
        simpleButton: simpleButton,
        verticalInViewport: verticalInViewport
    };
});
