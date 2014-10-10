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
 (function($, undefined){
    $.KBWidget({
        name: 'kbaseNarrativeControlPanel', 
        parent: 'kbaseAuthenticatedWidget',
        version: '0.0.1',
        options: {
            title: 'Control',
            collapsible: true,

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

            this.$elem.append($('<div>')
                              .addClass('panel panel-primary')
                              .append($('<div>')
                                      .addClass('panel-heading')
                                      .append($('<div>')
                                              .addClass('panel-title')
                                              .css({'text-align': 'center'})
                                              .append(this.options.title)                              
                                              .append($('<button>')
                                                  .addClass('btn btn-xs btn-default kb-ws-refresh-btn')
                                                  .css({'margin-top': '-4px',
                                                        'left': '9px'})
                                                  .click($.proxy(function(event) {
                                                      if ($(event.currentTarget.firstChild).hasClass('glyphicon-chevron-down')) {
                                                          $(event.currentTarget.firstChild).removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-right');
                                                          this.$elem.find('.kb-narr-panel-body').hide();
                                                      }
                                                      else {
                                                          $(event.currentTarget.firstChild).removeClass('glyphicon-chevron-right').addClass('glyphicon-chevron-down');
                                                          this.$elem.find('.kb-narr-panel-body').show();
                                                      }
                                                  }, this))
                                                  .append($('<span>')
                                                          .addClass('glyphicon glyphicon-chevron-down')))))
                              .append($('<div>')
                                      .addClass('panel-body kb-narr-panel-body')
                                      .append(this.$bodyDiv)));
        },

        /**
         * Adds a button to the button panel that sits on the right side of the header.
         * @param {object} btn - the button element to add. Expected to be a jquery node.
         * @public
         */
        addButton: function(btn) {

        },

        /**
         * Sets the button panel to have the given list of buttons. This replaces any
         * existing buttons that might be there.
         * @param {Array} btnList - the list of button elements. Each one is expected to
         * be a jquery node representing a button
         * @public
         */
        addButtonList: function(btnList) {

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
})(jQuery);