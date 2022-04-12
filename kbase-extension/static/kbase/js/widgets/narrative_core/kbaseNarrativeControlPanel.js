/**
 * This widget is an outer DOM container for a KBase Narrative control element.
 * It instantiates a panel that the widget lives in, with some flexibility for
 * the title of the panel, adds a list of buttons on the panel, and gives the
 * option to minimize or restore the panel.
 *
 * This is a base class widget for any sidebar widgets that want its behavior.
 * Those sidebars should just include a title option.
 * Usage:
  new kbaseNarrativeControlPanel(* $('#my-element'), {
 *     title : 'My Controls',
 *     collapsible : true,
 *     buttons: [],
 * });
 *
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @public
 */
define(['kbwidget', 'bootstrap', 'jquery', 'kbaseAuthenticatedWidget'], (
    KBWidget,
    bootstrap,
    $,
    kbaseAuthenticatedWidget
) => {
    'use strict';
    return KBWidget({
        name: 'kbaseNarrativeControlPanel',
        parent: kbaseAuthenticatedWidget,
        version: '0.0.1',
        options: {
            title: 'Control',
            showTitle: true,
            collapsible: true,
            maxHeight: '400px',
            collapseCallback: null, // called when this panel is minimized/maximized
            slideTime: 400, // set minimize/maximize animation time
        },

        /**
         * @method
         * Initializes the widget. This sets up internal variables, renders
         * the DOM structure, and creates an internal spot for the widget it
         * should hold.
         * Runs automatically on instantiation.
         * @param {object} options - set of inserted options from the instantiation
         * statement.
         * @returns {object} the initialized widget
         * @private
         */
        init: function (options) {
            this._super(options);
            this.slideTime = this.options.slideTime;
            this.render();
            return this;
        },

        userCollapse: false,
        toggleCollapse: function (override) {
            const $toggleIcon = this.$elem.find('.kb-narr-panel-toggle');

            let collapse;
            if (override) {
                switch (override) {
                    case 'collapse':
                        collapse = true;
                        break;
                    case 'expand':
                        collapse = false;
                        break;
                    case 'restore':
                        collapse = this.userCollapse;
                        break;
                    case 'user':
                        collapse = !this.isMinimized();
                        this.userCollapse = collapse;
                }
            } else {
                collapse = this.Min ? false : true;
            }

            // nothing to do if the new collapse state is the same as the old.
            if ((collapse && this.isMinimized()) || (!collapse && !this.isMinimized())) {
                return;
            }

            if (collapse) {
                $toggleIcon.removeClass('fa-chevron-down').addClass('fa-chevron-right');
                this.$bodyDiv.parent().slideUp(this.slideTime);
                this.isMin = true;
            } else {
                $toggleIcon.removeClass('fa-chevron-right').addClass('fa-chevron-down');
                this.$bodyDiv.parent().slideDown(this.slideTime);
                this.isMin = false;
            }
            if (this.options.collapseCallback) {
                this.options.collapseCallback(this.isMin);
            }
        },

        /**
         * @method
         * Renders the new containing panel widget
         * @private
         */
        render: function () {
            // DOM structure setup here.
            // After this, just need to update the function list

            /* There's a few bits here.
             * 1. It's all in a Bootstrap Panel scaffold.
             * 2. The panel-body section contains the core of the widget:
             *    a. loading panel (just a blank thing with a spinning gif)
             *    b. error panel
             *    c. actual function widget setup.
             *
             * So, initialize the scaffold, bind the three core pieces in the
             * panel-body, make sure the right one is being shown at the start,
             * and off we go.
             */
            // Make a main body panel for everything to sit inside.
            this.$bodyDiv = $('<div>');

            this.$headerDiv = $('<div>');

            this.$buttonPanel = $('<span>')
                .addClass('btn-toolbar pull-right')
                .attr('role', 'toolbar')
                .css({ 'margin-top': '-2px' });

            const $titleSpan = $('<span>');
            if (this.options.showTitle) {
                $titleSpan.append(
                    $('<span>')
                        .css({ cursor: 'pointer' })
                        .click(
                            $.proxy(function (event) {
                                event.preventDefault();
                                this.toggleCollapse('user');
                            }, this)
                        )
                        .append($('<span>').addClass('fa fa-chevron-down kb-narr-panel-toggle'))
                        .append(this.options.title)
                );
            }
            $titleSpan.append(this.$buttonPanel);

            this.isMin = false;
            this.$elem.append(
                $('<div>')
                    .css({ height: '100%' })
                    .addClass('kb-narr-side-panel')
                    .append($('<div>').addClass('kb-title').append($titleSpan))
                    .append($('<div>').addClass('kb-narr-panel-body-wrapper').append(this.$bodyDiv))
            );
        },

        // remember the minimization state
        isMin: null,

        /**
         * Returns minimization state of the Panel, true if minimized, false otherwise
         * @public
         */
        isMinimized: function () {
            return this.isMin;
        },

        // allows the height of the entire panel to be dynamically set
        setHeight: function (height) {
            this.$elem.css({ height: height });
        },

        /**
         * Adds a button to the button panel that sits on the right side of the header.
         * @param {object} btn - the button element to add. Expected to be a jquery node.
         * @public
         */
        addButton: function (btn) {
            this.$buttonPanel.append(btn);
        },

        /**
         * Sets the button panel to have the given list of buttons. This replaces any
         * existing buttons that might be there.
         * @param {Array} btnList - the list of button elements. Each one is expected to
         * be a jquery node representing a button
         * @public
         */
        addButtonList: function (btnList) {
            this.$buttonPanel.empty();
            for (let i = 0; i < btnList.length; i++) {
                this.addButton(btnList[i]);
            }
        },

        /**
         * Returns the main body element of the widget as a jquery node. This is effective
         * for binding a functional widget into it.
         * @returns {object} a jquery node for the main widget panel
         * @public
         */
        body: function () {
            return this.$bodyDiv;
        },

        /**
         * Gets invoked whenever the user clicks over to the side panel tab where this control
         * panel lives. For example, the current (5/29/2019) narrative starts on the Analyze tab.
         * When a user clicks on the Narratives tab, each widget there (just the one, really) has
         * this function called.
         */
        activate: function () {
            // no op - meant to be extended by some functional widget.
        },
    });
});
