/**
 * Based on code developed by the Jupyter development team.
 */
define([
    'jquery',
    'base/js/namespace',
    'bootstraptour',
    'handlebars',
    'text!kbase/templates/tour/tour_panel.html',
    'css!kbase/css/kbaseTour.css'
], function($, Jupyter, Tour, Handlebars, TourTmpl) {
    "use strict";

    var UploadTour = function ($elem, notebook, events) {
        var that = this;
        this.$elem = $elem;
        this.notebook = notebook;
        this.step_duration = 0;
        this.events = events;
        this.template = Handlebars.compile(TourTmpl);
        this.tour_steps = [
            {
                title: "Data Staging Tour",
                placement: 'bottom',
                orphan: true,
                content: 'This tour will show how to use the Staging panel to upload and manage data files, as well as how to import those into your Narrative as KBase data objects.',
                backdrop: true
            },
            {
                title: "Upload Area",
                placement: "bottom",
                element: that.$elem.find('.kb-dropzone'),
                content: 'Drag and drop files to upload here, or click within the boundary to select multiple files to upload. Uploads start immediately, and once finished, will be reflected in the file list below.'
            },
            {
                title: "Staging Path",
                placement: "right",
                element: that.$elem.find('div.file-path'),
                content: 'If you are viewing the contents of a folder, you can click on links prior to that folder to navigate and show other files. Click the button on the left to manually refresh'
            },
            {
                title: "Uploaded Files",
                placement: "top",
                element: that.$elem.find('#kb-data-staging-table'),
                content: 'This table lists your uploaded files, their names when uploaded, their size, and when they were last modified. You can sort by any of the available fields.'
            },
            {
                title: "File or Folder",
                placement: "top",
                element: that.$elem.find('#kb-data-staging-table > thead > tr > th:nth-child(1)'),
                content: 'This column shows whether the row is a file <i class="fa fa-file-o"></i> or a folder <i class="fa fa-folder"></i>. Clicking the folder icon will show the files inside.'
            },
            {
                title: "Import to this Narrative",
                placement: "top",
                element: that.$elem.find('#kb-data-staging-table > thead > tr > th:last-child'),
                content: 'Select an object type to import your file, then click the <i class="fa fa-upload"></i> button to create an Import App. This will transform your data file(s) into an object available for analysis in your Narrative.'
            },
            {
                title: "End of Tour",
                orphan: true,
                backdrop: true,
                content: 'This concludes the tour of the data staging tools. If you have any questions, please follow the "Contact Us" link in the menu at the top left of the Narrative.'
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
                return that.template({step: (i+1), totalSteps: that.tour_steps.length});
            },
            orphan: true
        });

    };

    /**
     * Opens the data slideout if it's not open already.
     */
    UploadTour.prototype.openDataSlideout = function(setOpen) {
        if (setOpen) {
            Jupyter.narrative.showDataOverlay();
        }
        else {
            Jupyter.narrative.hideOverlay();
        }
    };

    UploadTour.prototype.start = function () {
        this.openDataSlideout(true);
        this.tour.init();
        this.tour.start();
        if (this.tour.ended()) {
            this.tour.restart();
        }
    };

    UploadTour.prototype.command_icon_hack = function() {
        $('#modal_indicator').css('min-height', '18px');
    };

    UploadTour.prototype.toggle_pause_play = function () {
        $('#tour-pause').toggleClass('fa-pause fa-play');
    };

    UploadTour.prototype.edit_mode = function() {
        this.notebook.focus_cell();
        this.notebook.edit_mode();
    };

    return {'Tour': UploadTour};

});
