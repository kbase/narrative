/**
 * This widget is an outer DOM container for a KBase Narrative control element.
 * It instantiates a panel that the widget lives in, with some flexibility for
 * the title of the panel, adds a list of buttons on the panel, and gives the
 * option to minimize or restore the panel.
 *
 * This is a base class widget for any sidebar widgets that want its behavior.
 * Those sidebars should just include a title option. 
 * Usage: 
 * $('#my-element').kbaseNarrativeControlPanel({ 
 *     title : 'My Controls', 
 *     collapsible : true,
 *     buttons: [],
 * });
 *
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @public
 */
define(['jquery', 'kbwidget', 'kbaseAuthenticatedWidget'], function($) {
    $.KBWidget({
        name: 'kbaseNarrativeControlPanel', 
        parent: 'kbaseAuthenticatedWidget',
        version: '0.0.1',
        options: {
            title: 'Control',
            showTitle: true,
            collapsible: true,
            maxHeight: '400px',
            collapseCallback: null,  // called when this panel is minimized/maximized
            slideTime: 400           // set minimize/maximize animation time
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
        init: function(options) {
            this._super(options);
            this.slideTime = this.options.slideTime;
            this.render();
            return this;
        },

        /**
         * @method
         * Renders the new containing panel widget
         * @private
         */
        render: function() {
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
                                .css({'margin-top' : '-2px'});

            var $titleSpan = $('<span>');
            if(this.options.showTitle) {
              $titleSpan
                .append($('<span>')
                  .css({'cursor' : 'pointer'})
                  .click(
                      $.proxy(function(event) {
                          event.preventDefault();
                          if ($(event.currentTarget.firstChild).hasClass('glyphicon-chevron-down')) {
                              $(event.currentTarget.firstChild).removeClass('glyphicon-chevron-down')
                                                               .addClass('glyphicon-chevron-right');
                              this.$bodyDiv.parent().slideUp(this.slideTime);
                              this.isMin = true;
                          }
                          else {
                              $(event.currentTarget.firstChild).removeClass('glyphicon-chevron-right')
                                                               .addClass('glyphicon-chevron-down');
                              this.$bodyDiv.parent().slideDown(this.slideTime);
                              this.isMin = false;
                          }
                          if(this.options.collapseCallback) {
                              this.options.collapseCallback(this.isMin);
                          }
                      }, this)
                  )
                  .append($('<span>')
                          .addClass('glyphicon glyphicon-chevron-down kb-narr-panel-toggle'))
                  .append(this.options.title))
            }
            $titleSpan.append(this.$buttonPanel);

            this.isMin = false;
            this.$elem.append($('<div>')
                              .css({'height':'100%', 'overflow-y':'auto'})
                              .addClass('kb-narr-side-panel')
                              .append($('<div>')
                                      .addClass('kb-title')
                                      .append($titleSpan))
                              .append($('<div>')
                                      .addClass('kb-narr-panel-body')
                                      .append(this.$bodyDiv)));
        },

        // remember the minimization state
        isMin: null,

        /**
         * Returns minimization state of the Panel, true if minimized, false otherwise
         * @public
         */
        isMinimized: function() {
          return this.isMin;
        },

        // allows the height of the entire panel to be dynamically set
        setHeight: function(height) {
          this.$elem.css({height:height});
        },

        /**
         * Adds a button to the button panel that sits on the right side of the header.
         * @param {object} btn - the button element to add. Expected to be a jquery node.
         * @public
         */
        addButton: function(btn) {
            this.$buttonPanel.append(btn);
        },

        /**
         * Sets the button panel to have the given list of buttons. This replaces any
         * existing buttons that might be there.
         * @param {Array} btnList - the list of button elements. Each one is expected to
         * be a jquery node representing a button
         * @public
         */
        addButtonList: function(btnList) {
            this.$buttonPanel.empty();
            for (var i=0; i<btnList.length; i++) {
                this.addButton(btnList[i]);
            }
        },

        /**
         * Returns the main body element of the widget as a jquery node. This is effective
         * for binding a functional widget into it.
         * @returns {object} a jquery node for the main widget panel
         * @public
         */
        body: function() {
            return this.$bodyDiv;
        },
    });
});