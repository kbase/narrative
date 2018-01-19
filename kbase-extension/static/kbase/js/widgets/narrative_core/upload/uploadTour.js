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
    'use strict';

    var UploadTour = function ($elem, useGlobus, tourStartFn, tourEndFn) {
        var that = this;
        this.$elem = $elem;
        this.step_duration = 0;
        this.template = Handlebars.compile(TourTmpl);
        this.tour_steps = [
            {
                title: 'Data Upload and Import Tour',
                placement: 'bottom',
                orphan: true,
                content: 'This tour shows how to use the Import panel to upload data files and import them into your Narrative as KBase data objects.',
                backdrop: true
            },
            {
                title: 'Upload Area',
                placement: 'bottom',
                element: that.$elem.find('.kb-dropzone'),
                content: 'Drag and drop files here, or click within the boundary to select multiple files to upload. Uploads start immediately, and once finished, will be reflected in the file list below.'
            },
            {
                title: 'Globus Upload',
                placement: 'bottom',
                element: that.$elem.find('.globus_div > a'),
                content: 'Click here to use Globus Online to upload your files. Clicking this link will open the Globus Online file transfer page, already linked your directory in KBase.'
            },
            {
                title: 'Web Upload',
                placement: 'bottom',
                element: that.$elem.find('.web_upload_div > a'),
                content: 'Click here to add an App to your Narrative that will walk you through uploading files from a publically accessible website, FTP, Dropbox, or Google Drive.'
            },
            {
                title: 'Staging Path',
                placement: 'right',
                element: that.$elem.find('div.file-path'),
                content: 'If you are viewing the contents of a folder, you can click links next to that folder name to navigate and show other files. Click the button on the left to manually refresh the list.'
            },
            {
                title: 'Uploaded Files',
                placement: 'top',
                element: that.$elem.find('#kb-data-staging-table'),
                content: 'This table lists your uploaded files, their filenames, their size, and when they were last modified. You can sort by any of the fields.'
            },
            {
                title: 'File or Folder',
                placement: 'top',
                element: that.$elem.find('#kb-data-staging-table > thead > tr > th:nth-child(1)'),
                content: 'This column shows whether the row is a file <i class="fa fa-file-o"></i> or a folder <i class="fa fa-folder"></i>. Click a folder icon to show the files inside.'
            },
            {
                title: 'Import to this Narrative',
                placement: 'top',
                element: that.$elem.find('#kb-data-staging-table > thead > tr > th:last-child'),
                content: 'Select an object type for your file, then click the <i class="fa fa-upload"></i> button to create an Import App cell. Check the parameters and click the Play button (green arrow) to transform your data file(s) into an object available for analysis in your Narrative.'
            },
            {
                title: 'End of Tour',
                orphan: true,
                backdrop: true,
                content: 'This concludes the tour of the data staging tools. If you have any questions, please follow the "Contact Us" link in the menu at the top left of the Narrative.'
            }
        ];

        // remove the globus step if we're not using it.
        if (!useGlobus) {
            this.tour_steps.splice(2, 1);
        }
        console.log("BUILDING NEW TOUR");

        this.tour = new Tour({
            storage: false, // start tour from beginning every time
            debug: true,
            reflex: true, // click on element to continue tour
            animation: false,
            duration: this.step_duration,
            onPause: this.toggle_pause_play,
            onResume: this.toggle_pause_play,
            // onStart: tourStartFn,
            // onEnd: tourEndFn,
            steps: this.tour_steps,
            template: function(i, step) {
                return that.template({
                    step: (i+1),
                    totalSteps: that.tour_steps.length
                });
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
