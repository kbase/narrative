// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

define([
    'jquery',
    'bootstraptour',
    'handlebars',
    'text!kbase/templates/tour/tour_panel.html',
    'css!kbase/css/kbaseTour.css'
], function($, Tour, Handlebars, TourTmpl) {
    "use strict";

    var NarrativeTour = function (narrative, notebook, events) {
        var that = this;
        this.notebook = notebook;
        this.narrative = narrative;
        this.step_duration = 0;
        this.events = events;
        this.template = Handlebars.compile(TourTmpl);
        this.tour_steps = [
            {
                title: "Welcome to the Narrative Tour", // add a grayed out background.
                placement: 'bottom',
                orphan: true,
                content: "Welcome to KBase—the Department of Energy Systems Biology Knowledgebase! This tour will demonstrate how to find and use KBase’s Narrative User Interface to begin creating Narratives for data analysis. Narratives contain all the data, analysis steps, results, and discussions for a research project. Think of a Narrative as an advanced lab notebook that contains all of your data, analyses, thought processes, procedural notes, visualizations, custom scripts, and results. Use the left and right arrow button to go backwards and forwards through this tour. Press the right arrow to continue.",
                backdrop: true
            },
            {
                element: "#notebook_name",
                title: "Narrative Name",
                placement: 'bottom',
                content: "Start by naming your Narrative. By default, each new Narrative is named “Untitled.” Click on this name and enter a new title."
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
            // {
            //     element: '#kb-ipy-menu',
            //     title: 'Kernel Controls',
            //     placement: 'bottom',
            //     content: 'Control the Jupyter kernel'
            // },
            {
                element: $('#kb-share-btn .kb-nav-btn-txt'),
                title: 'Share with others',
                placement: 'bottom',
                content: 'Click the “share” button to open a dialog box allowing you to search for and select KBase users you want to share with. You can give them view-only access, editing privileges, or the ability to edit and share the Narrative with other users. By default, each Narrative you create is private. You can choose to make your Narrative public or share it with certain collaborators.'
            },
            // {
            //     element: '#kb-settings-btn',
            //     title: 'Adjust global settings',
            //     placement: 'bottom',
            //     content: 'Change some global options'
            // },
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
                element: '.kb-side-header[kb-data-id="0"]',
                title: 'Analyze Tab',
                placement: 'bottom',
                content: 'A key feature of KBase is the ability to run complex analyses on your data within your Narrative. The Analyze tab contains both your data and the analysis tools in KBase - called Apps.',
                onShow: function(tour) {
                    $('.kb-side-header[kb-data-id="0"]').click();
                }
            },
            {
                element: $('.kb-side-tab[kb-data-id="0"]').find('button > .fa-arrow-right').first(), //$('.kb-side-tab[kb-data-id="0"] > button > .fa-arrow-right'),
                title: 'Data Slideout',
                placement: 'left',
                content: 'Clicking the “Add Data” button opens the data slideout, which allow you to add Data into your Narrative from a variety of sources.',
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
                content: 'The <i>Shared With Me</i> tab contains data from Narratives that have been shared with you by collaborators. It also will be empty if no Narratives have been shared with you.',
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
                content: 'The <i>Example</i> tab contains sample data that can be used to demonstrate KBase analysis tools.',
                onShow: function(tour) {
                    that.openDataSlideout(true);
                    $('.kb-side-overlay-container .kb-side-header:nth-child(4)').click();
                }
            },
            {
                element: '.kb-side-overlay-container .kb-side-header:nth-child(5)', // import tab
                title: 'Import Data',
                placement: 'bottom',
                content: 'Finally, the <i>Import</i> tab allows you to upload your own data for analysis. This and other data you add are private unless you choose to share your Narrative. Click the drop-down menu to see a list of currently uploadable data types.',
                onShow: function(tour) {
                    that.openDataSlideout(true);
                    $('.kb-side-overlay-container .kb-side-header:nth-child(5)').click();
                }
            },
            {
                element: '.kb-narr-side-panel-set > .kb-side-separator:nth-child(2)', // The 'Apps' area
                title: 'Apps in KBase',
                placement: 'right',
                content: 'All of the Apps available in KBase are listed just below the Data Panel. Each App performs a specific analysis function on a particular type of data input, generating an output data object or a visualization. The output of each App can be used in downstream analysis with other Apps, meaning that you can chain together several Apps to perform a sophisticated analysis workflow on your initial data.',
                onShow: function(tour) {
                    $('.kb-side-header[kb-data-id="0"]').click();
                    that.openDataSlideout(false);
                }
            },
            {
                element: '.kb-side-separator:nth-child(2) .kb-function-body .kb-data-list-obj-row:first', //'.kb-narr-side-panel-set > .kb-side-separator:nth-child(2)', // [...] or more... btn on first app
                title: 'App Information',
                placement: 'right',
                content: 'To see a brief description of an app or method, click under its name. The “more” link at the end of this description will open in another tab a page with detailed information about the app or method.',
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
                content: '<p>To manage your Narratives within the Narrative Interface, click the Narratives tab above your Data Panel. This reveals options for both creating a new, empty Narrative and copying the current Narrative, complete with all its data and contents. You also can copy public Narratives or others that have been shared with you. Copying a Narrative allows you to run your own analyses using the data within that Narrative without changing the original version.<p>The Narratives tab also lists all your Narratives and those that have been shared with you. Click the name of any of these Narratives to open them in a new window. Hovering over a Narrative will reveal options for viewing its history, reverting to an earlier version, and copying or deleting it. Be aware that once you delete a Narrative, its data and contents cannot be recovered.',
                onShow: function(tour) {
                    $('.kb-side-header[kb-data-id="1"]').click();
                }
            },
            {
                element: '#kb-add-md-cell',
                title: 'Markdown Cells',
                placement: 'left',
                content: 'You also can include formatted text in your Narratives to capture notes, hypotheses, conclusions, and explanations of analysis steps. This text is added using markdown cells, which can be inserted by clicking the paragraph icon at the bottom of the Narrative. These cells can contain raw text, HTML, or LaTeX to communicate the content of your Narrative.'
            },
            {
                title: "End of Basic Features Tour",
                placement: 'bottom',
                orphan: true,
                content: "<p>You now have been introduced to the basic features of the Narrative Interface. We hope you conduct interesting and creative research using these tools and are able to expand your collaborator network with other KBase users. If you have any questions or feature requests, please follow the Contact Us link in the hamburger menu.<p>To learn about advanced features of the Narrative Interface, click the right arrow button to proceed. Click the exit button to return to your Narrative.",
                backdrop: true
            },
            {
                title: 'Advanced Features of the Narrative Interface',
                placement: 'bottom',
                orphan: true,
                content: 'This section of the Narrative Tour will introduce you to some features of the Narrative Interface that are useful to advanced users and developers.'
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
            template: function(i, step) {
                return that.template({step: (i+1), totalSteps: that.tour_steps.length});
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
        }
        else {
            this.narrative.hideOverlay();
            // $(document).trigger('hideSidePanelOverlay.Narrative');
        }
    }

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

