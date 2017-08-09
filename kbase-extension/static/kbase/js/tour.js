/**
 * Based on code developed by the Jupyter development team.
 */
define([
    'jquery',
    'bootstraptour',
    'handlebars',
    'text!kbase/templates/tour/tour_panel.html',
    'css!kbase/css/kbaseTour.css'
], function($, Tour, Handlebars, TourTmpl) {
    "use strict";

    var NarrativeTour = function(narrative, notebook, events) {
        var that = this;
        this.notebook = notebook;
        this.narrative = narrative;
        this.step_duration = 0;
        this.events = events;
        this.template = Handlebars.compile(TourTmpl);
        this.tour_steps = [{
                title: "Welcome to the Narrative Tour", // add a grayed out background.
                placement: 'bottom',
                orphan: true,
                content: '<p>This tour will demonstrate how to use KBase’s Narrative User Interface to begin creating Narratives for data analysis. Think of a Narrative as an advanced lab notebook that contains all of your data, analyses, notes, visualizations, custom scripts, and results.<p>Use the left and right arrow buttons to go backwards and forwards through this tour.',
                backdrop: true
            },
            {
                element: "#notebook_name",
                title: "Narrative Name",
                placement: 'bottom',
                content: 'By default, each new Narrative is named “Untitled.” Click on this name and enter a new title.'
            },
            {
                element: '#kb-view-mode',
                title: 'Toggle View Only',
                placement: 'bottom',
                content: 'If you have edit permission for this Narrative, you can choose View Only (uneditable) or Edit mode'
            },
            {
                element: '#kb-update-btn',
                title: 'Narrative Update',
                placement: 'bottom',
                content: 'If there\'s an update to the Narrative Interface, this button will appear. Click it before you start working on your Narrative.',
                onShow: function(tour) {
                    $('#kb-update-btn').show();
                },
                onHide: function(tour) {
                    $('#kb-update-btn').hide();
                }
            },
            {
                element: $('#kb-share-btn .kb-nav-btn-txt'),
                title: 'Share with others',
                placement: 'bottom',
                content: 'Click the Share button to open a dialog box allowing you to search for and select KBase users you want to share with. You can give them view-only access, editing privileges, or the ability to edit and share the Narrative with other users. By default, each Narrative you create is private. You can choose to make your Narrative public or share it with certain collaborators.'
            },
            {
                element: '#kb-save-btn',
                title: 'Save the Narrative',
                placement: 'bottom',
                content: 'You should periodically save your Narrative by clicking the save button. KBase does autosave your Narrative whenever an App is run, but other changes should be saved manually.'
            },
            {
                element: '#signin-button',
                title: 'Profile and Logout',
                placement: 'left',
                content: 'Click here for a menu that will let you view and edit your user profile or log out.'
            },
            {
                element: '.kb-side-header[kb-data-id="0"]',
                title: 'Analyze Tab',
                placement: 'bottom',
                content: 'The Analyze tab contains both the data you have added to this Narrative and the analysis tools in KBase--called Apps.',
                onShow: function(tour) {
                    $('.kb-side-header[kb-data-id="0"]').click();
                }
            },
            {
                element: $('.kb-side-tab[kb-data-id="0"]').find('button > .fa-arrow-right').first(), //$('.kb-side-tab[kb-data-id="0"] > button > .fa-arrow-right'),
                title: 'Data Slideout',
                placement: 'left',
                content: 'This arrow opens the data slideout, which allows you to add data to your Narrative from a variety of sources.',
                onShow: function(tour) {
                    that.openDataSlideout(true);
                }
            },
            {
                element: '.kb-side-overlay-container .kb-side-header:nth-child(1)', // my data tab
                title: 'My Data',
                placement: 'bottom',
                content: 'The <i>My Data</i> tab shows data from your other Narratives. If this is your first Narrative, it will be empty.',
                onShow: function(tour) {
                    that.openDataSlideout(true);
                    $('.kb-side-overlay-container .kb-side-header:nth-child(1)').click();
                }
            },
            {
                element: '.kb-side-overlay-container .kb-side-header:nth-child(2)', // shared with me tab
                title: 'Shared With Me',
                placement: 'bottom',
                content: 'The <i>Shared With Me</i> tab contains data from any Narratives that have been shared with you by collaborators.',
                onShow: function(tour) {
                    that.openDataSlideout(true);
                    $('.kb-side-overlay-container .kb-side-header:nth-child(2)').click();
                }
            },
            {
                element: '.kb-side-overlay-container .kb-side-header:nth-child(3)', // public tab
                title: 'Public Data',
                placement: 'bottom',
                content: 'The <i>Public</i> tab provides direct access to public data that KBase periodically imports from several sources. These sources are listed on the KBase website <a href="//kbase.us/data-policy-and-sources" target="_blank">kbase.us/data-policy-and-sources</a>',
                onShow: function(tour) {
                    that.openDataSlideout(true);
                    $('.kb-side-overlay-container .kb-side-header:nth-child(3)').click();
                }
            },
            {
                element: '.kb-side-overlay-container .kb-side-header:nth-child(4)', // example tab
                title: 'Example Data',
                placement: 'bottom',
                content: 'The <i>Example</i> tab contains sample data that can be used to try out KBase analysis tools.',
                onShow: function(tour) {
                    that.openDataSlideout(true);
                    $('.kb-side-overlay-container .kb-side-header:nth-child(4)').click();
                }
            },
            {
                element: '.kb-side-overlay-container .kb-side-header:nth-child(5)', // import tab
                title: 'Import Data',
                placement: 'bottom',
                content: 'Finally, the <i>Import</i> tab allows you to upload your own data for analysis. Any data you add are kept private unless you choose to share your Narrative. This and other data you add are private unless you choose to share your Narrative. Click the drop-down menu to see a list of currently uploadable data types.',
                onShow: function(tour) {
                    that.openDataSlideout(true);
                    $('.kb-side-overlay-container .kb-side-header:nth-child(5)').click();
                }
            },
            {
                element: '.kb-narr-side-panel-set > .kb-side-separator:nth-child(2)', // The 'Apps' area
                title: 'Apps in KBase',
                placement: 'right',
                content: 'In KBase, you can run complex analyses on the data in your Narrative by using Apps. All of the Apps available in KBase are listed just below the Data Panel. Click an App name to add it to your Narrative, or click the “...” that appears to the right of the name when hovering your mouse to see more information about the App.',
                onShow: function(tour) {
                    $('.kb-side-header[kb-data-id="0"]').click();
                    that.openDataSlideout(false);
                }
            },
            {
                element: '.kb-side-separator:nth-child(2) .kb-function-body .kb-data-list-obj-row:first', //'.kb-narr-side-panel-set > .kb-side-separator:nth-child(2)', // [...] or more... btn on first app
                title: 'App Information',
                placement: 'right',
                content: 'After clicking the "..." to see a short description of an App, click the "more..." link at the end of the description to open another tab with detailed information about the App.',
                onShow: function(tour) {
                    $('.kb-side-header[kb-data-id="0"]').click();
                    $('.kb-side-separator:nth-child(2) .kb-function-body .kb-data-list-obj-row:first').click();
                    // get first ellipsis and click on it.
                }
            },
            {
                element: '.kb-side-header[kb-data-id="1"]',
                title: 'Narratives Tab',
                placement: 'bottom',
                content: '<p>This tab lists all your Narratives and those that have been shared with you. Click the name of any Narrative to open it in a new window. Hovering over a Narrative name will reveal options for viewing its history, reverting to an earlier version, and copying or deleting it. This tab also lets you create a new, empty Narrative or copy a Narrative, complete with all its data and contents.',
                onShow: function(tour) {
                    $('.kb-side-header[kb-data-id="1"]').click();
                }
            },
            {
                element: '#kb-add-md-cell',
                title: 'Markdown Cells',
                placement: 'left',
                content: 'You can include formatted text in your Narratives in markdown cells, which can be inserted by clicking the paragraph icon at the bottom of the Narrative. Markdown cells can also contain raw text, HTML, or LaTeX.'
            },
            {
                title: "End of Basic Features Tour",
                orphan: true,
                content: "<p>You have now been introduced to the basic features of the Narrative Interface. We hope you conduct interesting and creative research using these tools and are able to expand your collaborator network with other KBase users. If you have any questions or feature requests, please follow the Contact Us link in the hamburger menu at the top left. <p>To learn about advanced features of the Narrative Interface, click the right arrow button to proceed. To exit the tour, click the X at the top right of this box.",
                backdrop: true
            },
            {
                element: '#kb-ipy-menu',
                title: 'Kernel Controls',
                placement: 'bottom',
                content: 'Access control options for the Jupyter kernel that powers the Narrative Interface. This is useful for restarting or reconnecting to KBase after your network connection has been disrupted.',
            },
            // {
            //     element: '#kb-settings-btn',
            //     title: 'Adjust Global Settings',
            //     placement: 'bottom',
            //     content: 'Enable advanced or developer features for your Narrative in the Settings Menu. These option are enabled for individual Narratives. Refresh your browser to enable these settings for your Narrative.'
            // },
            {
                element: '#kb-add-code-cell',
                title: 'Code Cells',
                placement: 'left',
                content: 'Code Cells allow you to use Python and other coding languages to create custom scripts in your Narrative.'
            },
            {
                title: 'End of Advanced Features Tour',
                orphan: true,
                content: 'You have now been introduced to the advanced features of the Narrative Interface. The <a href="http://kbase.us/narrative-guide/">Narrative User Guide</a> has more information. If you have any questions or feature requests, please follow the Contact Us link in the hamburger menu.',
                backdrop: true
            }

        ];

        this.tour = new Tour({
            storage: false, // start tour from beginning every time
            debug: true,
            reflex: true, // click on element to continue tour
            animation: false,
            duration: this.step_duration,
            onPause: this.toggle_pause_play,
            onResume: this.toggle_pause_play,
            steps: this.tour_steps,
            template: function(i, step) {
                return that.template({ step: (i + 1), totalSteps: that.tour_steps.length });
            },
            orphan: true
        });

    };

    /**
     * Opens the data slideout if it's not open already.
     */
    NarrativeTour.prototype.openDataSlideout = function(setOpen) {
        if (setOpen) {
            this.narrative.showDataOverlay();
            // $(document).trigger('showSidePanelOverlay.Narrative');
            // $('.kb-side-tab[kb-data-id="0"]').find('button > .fa-arrow-right')
            //                                  .first()
            //                                  .click();
        } else {
            this.narrative.hideOverlay();
            // $(document).trigger('hideSidePanelOverlay.Narrative');
        }
    };

    NarrativeTour.prototype.start = function() {
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

    NarrativeTour.prototype.toggle_pause_play = function() {
        $('#tour-pause').toggleClass('fa-pause fa-play');
    };

    NarrativeTour.prototype.edit_mode = function() {
        this.notebook.focus_cell();
        this.notebook.edit_mode();
    };

    return { 'Tour': NarrativeTour };

});