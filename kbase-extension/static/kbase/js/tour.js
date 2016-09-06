// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

define([
    'jquery',
    'bootstraptour',
], function($, Tour) {
    "use strict";

    var tour_style = "<div class='popover tour'>\n" +
        "<div class='arrow'></div>\n" +
        "<div style='position:absolute; top:7px; right:7px'>\n" +
            "<button class='btn btn-default btn-sm fa fa-times' data-role='end'></button>\n" +
        "</div><h3 class='popover-title'></h3>\n" +
        "<div class='popover-content'></div>\n" +
        "<div class='popover-navigation'>\n" +
            "<button class='btn btn-primary fa fa-step-backward' data-role='prev'></button>\n" +
            "<button class='btn btn-primary fa fa-step-forward pull-right' data-role='next'></button>\n" +
            "<button id='tour-pause' class='btn btn-sm btn-default fa fa-pause' data-resume-text='' data-pause-text='' data-role='pause-resume'></button>\n" +
        "</div>\n" +
    "</div>";

    var NarrativeTour = function (notebook, events) {
        var that = this;
        this.notebook = notebook;
        this.step_duration = 0;
        this.events = events;
        this.tour_steps = [
            {
                title: "Welcome to the Narrative Tour",
                placement: 'bottom',
                orphan: true,
                content: "You can use the left and right arrow keys to go backwards and forwards."
            },
            {
                element: "#notebook_name",
                title: "Narrative Name",
                placement: 'bottom',
                content: "Click here to change the name for this Narrative."
            },
            {
                element: '#kb-view-mode',
                title: 'Toggle View Only',
                placement: 'bottom',
                content: 'Click here to change view mode.'
            },
            {
                element: '#kb-update-btn',
                title: 'Narrative Update',
                placement: 'bottom',
                content: 'If there\'s an update to the Narrative, this button will appear. Click on it, and it will guide you through refreshing your Narrative environment.',
                onShow: function(tour) {
                    $('#kb-update-btn').show();
                },
                onHide: function(tour) {
                    $('#kb-update-btn').hide();
                }
            },
            {
                element: '#kb-ipy-menu',
                title: 'Kernel Controls',
                placement: 'bottom',
                content: 'Control the Jupyter kernel'
            },
            {
                element: $('#kb-share-btn .kb-nav-btn-txt'),
                title: 'Share with others',
                placement: 'bottom',
                content: 'Clicking here will let you edit sharing privileges on this Narrative'
            },
            {
                element: '#kb-settings-btn',
                title: 'Adjust global settings',
                placement: 'bottom',
                content: 'Change some global options'
            },
            {
                element: '#kb-save-btn',
                title: 'Save the Narrative',
                placement: 'bottom',
                content: 'Save any changes to the Narrative. Autosaves occur when an App is launched and finished, but other changes should be saved periodically.'
            },
            {
                element: '#signin-button',
                title: 'Profile and Logout',
                placement: 'left',
                content: 'Click here to produce a menu that will let you view your user profile or logout.'
            },
            {
                element: $('.kb-side-header[kb-data-id="0"]'),
                title: 'Analyze Tab',
                placement: 'bottom',
                content: 'Get your analyze on!',
                onShow: function(tour) {
                    $('.kb-side-header[kb-data-id="0"]').click();
                }
            },
            {
                element: $('.kb-side-tab[kb-data-id="0"]').find('button > .fa-arrow-right').first(), //$('.kb-side-tab[kb-data-id="0"] > button > .fa-arrow-right'),
                title: 'Data Slideout',
                placement: 'left',
                content: 'Slideout data browser - click to show and dismiss.',
                onShow: function(tour) {
                    $('.kb-side-header[kb-data-id="0"]').click();
                    $('.kb-side-tab[kb-data-id="0"]').find('button > .fa-arrow-right')
                                                     .first()
                                                     .click();
                }
            },







            // {
            //     element: $("#menus").parent(),
            //     placement: 'bottom',
            //     title: "Notebook Menubar",
            //     content: "The menubar has menus for actions on the notebook, its cells, and the kernel it communicates with."
            // },
            // {
            //     element: "#maintoolbar",
            //     placement: 'bottom',
            //     title: "Notebook Toolbar",
            //     content: "The toolbar has buttons for the most common actions. Hover your mouse over each button for more information."
            // // },
            // {
            //     element: "#modal_indicator",
            //     title: "Mode Indicator",
            //     placement: 'bottom',
            //     content: "The Notebook has two modes: Edit Mode and Command Mode. In this area, an indicator can appear to tell you which mode you are in.",
            //     onShow: function(tour) { that.command_icon_hack(); }
            // },
            // {
            //     element: "#modal_indicator",
            //     title: "Command Mode",
            //     placement: 'bottom',
            //     onShow: function(tour) { notebook.command_mode(); that.command_icon_hack(); },
            //     onNext: function(tour) { that.edit_mode(); },
            //     content: "Right now you are in Command Mode, and many keyboard shortcuts are available. In this mode, no icon is displayed in the indicator area."
            // },
            // {
            //     element: "#modal_indicator",
            //     title: "Edit Mode",
            //     placement: 'bottom',
            //     onShow: function(tour) { that.edit_mode(); },
            //     content: "Pressing <code>Enter</code> or clicking in the input text area of the cell switches to Edit Mode."
            // },
            // {
            //     element: '.selected',
            //     title: "Edit Mode",
            //     placement: 'bottom',
            //     onShow: function(tour) { that.edit_mode(); },
            //     content: "Notice that the border around the currently active cell changed color. Typing will insert text into the currently active cell."
            // },
            // {
            //     element: '.selected',
            //     title: "Back to Command Mode",
            //     placement: 'bottom',
            //     onShow: function(tour) { notebook.command_mode(); },
            //     content: "Pressing <code>Esc</code> or clicking outside of the input text area takes you back to Command Mode."
            // },
            // {
            //     element: '#keyboard_shortcuts',
            //     title: "Keyboard Shortcuts",
            //     placement: 'bottom',
            //     onShow: function(tour) {
            //         /** need to add `open` and `pulse` classes in 2 calls */
            //         $('#help_menu').parent().addClass('open');
            //         $('#help_menu').parent().addClass('pulse');
            //         $('#keyboard_shortcuts').addClass('pulse');
            //       },
            //     onHide: function(tour) {
            //         $('#help_menu').parent().removeClass('open pulse');
            //         $('#keyboard_shortcuts').removeClass('pulse');
            //       },
            //     content: "You can click here to get a list of all of the keyboard shortcuts."
            // },
            // {
            //     element: "#kernel_indicator_icon",
            //     title: "Kernel Indicator",
            //     placement: 'bottom',
            //     onShow: function(tour) { events.trigger('kernel_idle.Kernel');},
            //     content: "This is the Kernel indicator. It looks like this when the Kernel is idle."
            // },
            // {
            //     element: "#kernel_indicator_icon",
            //     title: "Kernel Indicator",
            //     placement: 'bottom',
            //     onShow: function(tour) { events.trigger('kernel_busy.Kernel'); },
            //     content: "The Kernel indicator looks like this when the Kernel is busy."
            // },
            // {
            //     element: ".fa-stop",
            //     placement: 'bottom',
            //     title: "Interrupting the Kernel",
            //     onHide: function(tour) { events.trigger('kernel_idle.Kernel'); },
            //     content: "To cancel a computation in progress, you can click here."
            // },
            // {
            //     element: "#notification_kernel",
            //     placement: 'bottom',
            //     onShow: function(tour) { $('.fa-stop').click(); },
            //     title: "Notification Area",
            //     content: "Messages in response to user actions (Save, Interrupt, etc) appear here."
            // },
            {
                title: "Fin.",
                placement: 'bottom',
                orphan: true,
                content: "This concludes the KBase Narrative User Interface Tour. Happy bioinformaticising!"
            }
        ];

        this.tour = new Tour({
            storage: false, // start tour from beginning every time
            debug: true,
            reflex: true, // click on element to continue tour
            animation: false,
            duration: this.step_duration,
            onStart: function() { console.log('tour started'); },
            // TODO: remove the onPause/onResume logic once pi's patch has been
            // merged upstream to make this work via data-resume-class and
            // data-resume-text attributes.
            onPause: this.toggle_pause_play,
            onResume: this.toggle_pause_play,
            steps: this.tour_steps,
            template: tour_style,
            orphan: true
        });

    };

    NarrativeTour.prototype.start = function () {
        console.log("let's start the tour");
        this.tour.init();
        this.tour.start();
        if (this.tour.ended())
        {
            this.tour.restart();
        }
    };

    NarrativeTour.prototype.command_icon_hack =  function() {
        $('#modal_indicator').css('min-height', '18px');
    };

    NarrativeTour.prototype.toggle_pause_play = function () {
        $('#tour-pause').toggleClass('fa-pause fa-play');
    };

    NarrativeTour.prototype.edit_mode = function() {
        this.notebook.focus_cell();
        this.notebook.edit_mode();
    };

    return {'Tour': NarrativeTour};

});

