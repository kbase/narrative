// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

define([
    'jquery',
    'bootstraptour',
    'text!kbase/templates/tour/tour_panel.html',
    'css!kbase/css/kbaseTour.css'
], function($, Tour, TourStyle) {
    "use strict";

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
                content: "Start by naming your Narrative. By default, each new Narrative is named “Untitled.” Click on this name and enter a new title. "
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
                content: 'Click the “share” button to open a dialog box allowing you to search for and select KBase users you want to share with. You can give them view-only access, editing privileges, or the ability to edit and share the Narrative with other users.'
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
                content: 'You should periodically save your Narrative by clicking the save icon. KBase does autosave your Narrative when an App is launched and finished, but other changes should be saved manually.'
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
                content: 'A key feature of KBase is the ability to run complex analyses on your data within your Narrative.',
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
            template: TourStyle,
            orphan: true
        });

    };

    NarrativeTour.prototype.start = function () {
        console.log("let's start the tour");
        this.tour.init();
        this.tour.start();
        if (this.tour.ended()) {
            this.tour.restart();
        }
    };

    NarrativeTour.prototype.command_icon_hack = function() {
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

