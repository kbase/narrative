/**
 * This is a simple template for building KBase Narrative Widgets.
 * KBase Widgets are based around the jQuery widget extension architecture,
 * and are also instantiated as such.
 *
 * Your widget will need (at minimum) a unique name, a parent to inherit 
 * from, a semantic version, an 'options' structure, and an init() function
 * that returns itself.
 *
 * Details are described below.
 *
 * Instantiating a widget is done using a code form like this:
 * $("#myElement").MyWidget({ option1: value1, option2:value2 });
 *
 * Instantiating this widget within the narrative just requires the output
 * of a function that is run in the IPython Kernel to output the widget and
 * the set of options it requires. Examples to follow.
 *
 * This version of the widget template includes authentication options for
 * free - you shouldn't need to handle passing in user ids or auth tokens.
 * These are referenced by the functions:
 * this.user_id();
 * and
 * this.authToken();
 *
 * @see kbaseAuthenticatedWidget.js
 * @public
 */
define(['jquery', 'kbwidget'], function( $ ) {
    $.KBWidget({
        /* 
         * (required) Your widget should be named in CamelCase.
         */
        name: 'kbaseDefaultNarrativeOutput',

        /*
         * Extending kbaseAuthenticatedWidget lets you use auth tokens
         * semi-automatically, assuming the page this is used in fires
         * the loggedIn.kbase, loggedOut.kbase, and loggedInQuery events.
         * These are usually fired by the kbaseLogin widget.
         *
         * this.user_id() = the logged in user id
         * this.authToken() = the current authentication token
         */
        parent: 'kbaseWidget',

        /*
         * (optional) Widgets should be semantically versioned.
         * See http://semver.org
         */
        version: '1.0.0',

        /*
         * (optional) Widgets are implied to include an options structure.
         * It's useful to put default values here.
         */
        options: {
            data: null,
        },

        /**
         * (required) This is the only required function for a KBase Widget.
         * @param {object} options - a structure containing the set of 
         * options to be passed to this widget.
         * @private
         */
        init: function(options) {
            /*
             * This should be the first line of your init function.
             * It registers the new widget, overriding existing options.
             *
             * The members of the options structure will become members of 
             * this.options, overriding any existing members.
             */
            this._super(options);

            /*
             * It is required to return this.
             */
            return this.render();
        },

        /**
         * (not required)
         * I prefer to keep initialization and rendering code separate, but
         * that's just a style thing. You can do whatever the widget requires.
         */
        render: function() {
            var s = this.options.data;
            if (typeof s != 'string') {
                s = JSON.stringify(s, undefined, 2);
                s = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                s = s.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, 
                    function (match) {
                        var cls = 'number';
                        if (/^"/.test(match)) {
                            if (/:$/.test(match)) {
                                cls = 'key';
                            } else {
                                cls = 'string';
                            }
                        } else if (/true|false/.test(match)) {
                            cls = 'boolean';
                        } else if (/null/.test(match)) {
                            cls = 'null';
                        }
                        return '<span class="' + cls + '">' + match + '</span>';
                    }
                );
            }
            this.$elem.append($('<pre>').append(s));

            return this;
        },


    });
});