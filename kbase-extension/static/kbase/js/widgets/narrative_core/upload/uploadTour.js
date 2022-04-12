/**
 * Based on code developed by the Jupyter development team.
 */
define([
    'jquery',
    'base/js/namespace',
    'bootstraptour',
    'handlebars',
    'text!kbase/templates/tour/tour_panel.html',
], ($, Jupyter, Tour, Handlebars, TourTmpl) => {
    'use strict';

    const UploadTour = function ($elem, useGlobus) {
        const that = this;
        this.$elem = $elem;
        this.step_duration = 0;
        this.template = Handlebars.compile(TourTmpl);
        this.tour_steps = [
            {
                title: 'Data Upload and Import Tour',
                placement: 'bottom',
                orphan: true,
                content:
                    'This tour shows how to use the Import panel to upload data files and import them into your Narrative as KBase data objects.',
                backdrop: true,
            },
            {
                title: 'Upload Area',
                placement: 'bottom',
                element: that.$elem.find('.kb-dropzone'),
                content:
                    'Drag and drop files here, or click within the boundary to select multiple files to upload. Uploads start immediately, and once finished, will be reflected in the file list below.',
            },
            {
                title: 'Globus Upload',
                placement: 'bottom',
                element: that.$elem.find('.globus_acl_link'),
                content:
                    'Click here to use Globus Online to upload your files. Clicking this link will open the Globus Online file transfer page, pointing to your directory in KBase.',
            },
            {
                title: 'Web Upload',
                placement: 'bottom',
                element: that.$elem.find('.web_upload_div'),
                content:
                    'Click here to add an import app to your Narrative that will walk you through uploading files from a publicly accessible website, FTP, Dropbox, or Google Drive.',
            },
            {
                title: 'Staging Path',
                placement: 'left',
                element: that.$elem.find('.kb-data-staging__breadcrumbs'),
                content:
                    'If you are viewing the contents of a subfolder, you can click links a different folder name to navigate and show other files. Click the Refresh button to manually refresh the list of files in the current folder.',
            },
            {
                title: 'Uploaded Files',
                placement: 'top',
                element: that.$elem.find('table.kb-staging-table > .kb-staging-table-header'),
                content:
                    'This table lists your uploaded files, their filenames, their size, and when they were last modified. You can sort by any of the fields.',
            },
            {
                title: 'Selected Files',
                placement: 'top',
                element: that.$elem.find('table.kb-staging-table > thead > tr > th:nth-child(1)'),
                content:
                    'This column shows whether the file is selected. If a file has an assigned type, then it can be selected. If one or more files are selected, the Import Selected button will become available',
            },
            {
                title: 'File or Folder',
                placement: 'top',
                element: that.$elem.find('.kb-staging-table-header__file'),
                content:
                    'This column shows whether the row is a file <i class="fa fa-file-o"></i> or a folder <i class="fa fa-folder"></i>. Click the folder show the files inside.',
            },
            {
                title: 'Import As...',
                placement: 'top',
                element: that.$elem.find('table.kb-staging-table > thead > tr > th:last-child'),
                content:
                    'Select an object type for your file, make sure it is selected, then click the Import Selected button to create one or more Import cells. Check the app parameters and click the Run button to transform your data file(s) into an object available for analysis in your Narrative.',
            },
            {
                title: 'End of Tour',
                orphan: true,
                backdrop: true,
                content:
                    'This concludes the tour of the data staging tools. If you have any questions, please follow the "Contact Us" link in the Help menu near the top right of the Narrative.',
            },
        ];

        // remove the globus step if we're not using it.
        if (!useGlobus) {
            this.tour_steps.splice(2, 1);
        }

        this.tour = new Tour({
            storage: false, // start tour from beginning every time
            debug: true,
            reflex: true, // click on element to continue tour
            animation: false,
            duration: this.step_duration,
            onPause: this.toggle_pause_play,
            onResume: this.toggle_pause_play,
            steps: this.tour_steps,
            template: function (i) {
                return that.template({
                    step: i + 1,
                    totalSteps: that.tour_steps.length,
                });
            },
            orphan: true,
        });
    };

    /**
     * Opens the data slideout if it's not open already.
     */
    UploadTour.prototype.openDataSlideout = function (setOpen) {
        if (setOpen) {
            Jupyter.narrative.showDataOverlay();
        } else {
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

    UploadTour.prototype.stop = function () {
        if (this.tour && !this.tour.ended()) {
            this.tour.end();
        }
    };

    UploadTour.prototype.command_icon_hack = function () {
        $('#modal_indicator').css('min-height', '18px');
    };

    UploadTour.prototype.toggle_pause_play = function () {
        $('#tour-pause').toggleClass('fa-pause fa-play');
    };

    UploadTour.prototype.edit_mode = function () {
        this.notebook.focus_cell();
        this.notebook.edit_mode();
    };

    return { Tour: UploadTour };
});
