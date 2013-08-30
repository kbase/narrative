/**
 *  File upload widget.
 *
 * Author: Dan Gunter <dkgunter@lbl.gov>
 * Created: 27 Aug 2013
 */

// Jquery UI widget style
(function($, undefined) {

	$.KBWidget("kbaseUploadWidget", 'kbaseWidget', {
		version: "0.0.1",
		$buttonList: null,
		$viewPort: null,
		viewPortTabs: {},
		currentTab: null,
		workspaceWidgets: [],

		options: {},

        /**
         * Initialize the widget.
         *
         * @param options
         * @returns {*}
         */
		init: function(options) {
            this._super(options);
            this.createDialog();
            var that = this;
            this.$elem.on("click", function(event) {
                that.render();
            });
            return this;
		},

        /**
         * Create the dialog widget
         *
         * @returns {*}
         */
        createDialog: function() {
            var opts = {
                modal: true,
                closeOnEscape: true,
                title: 'Upload file',
                autoOpen: false,
                width: '50em',
            };
            this.dlg = $('#narrative-upload-dialog').dialog(opts);
            // Build form programmatically
            var $frm = $('<form>').addClass('form-horizontal');
            var fields = {
                'filename': {
                    type:'file',
                    id:'filename',
                    label: 'Filename:'
                },
                'datatype': {
                    type:'select',
                    id:'dataset_type',
                    label:'Dataset Type:',
                    options: []
                },
                'dataset': {
                    type:'text',
                    id:'dataset_name',
                    label:'Dataset Name:',
                    placeholder: "Name or identifying phrase",
                    modified: false
                }
            };
            // Populate data types
            // XXX: fetch these from somewhere!
            fields.datatype.options = {
                FastaFile: "FASTA",
                FastqFile: "FASTQ",
                BedFile: "BED",
                Gff3File: "GFF3",
                SamFile: "SAM",
                BamFile: "BAM",
                SbmlFile: "SBML",
                BiomFile: "BIOM",
                PdbFile: "PDB" };
            // Add each field
            $.each(fields, function(key, value) {
                var $frm_grp = $('<div>').addClass('control-group');
                var $frm_controls = $('<div>').addClass('controls');
                // Build and add the label
                var $label = $('<label class="control-label" for="' + value.id + '">' + value.label + '</label>');
                $frm_grp.append($label);
                // Build and add the control
                var $control = null;
                switch (value.type) {
                    case "file":
                        // This uses Bootstrap file-upload, see: http://jasny.github.io/bootstrap/javascript.html#fileupload
                        var $buttons = $('<span>').addClass('btn btn-file')
                        $.each({'Select file': 'fileupload-new',
                                'Change': 'fileupload-exists'}, function(bname, bclass) {
                            var $btn = $('<span>').addClass(bclass).text(bname);
                            $buttons.append($btn);
                        });
                        var $input = $('<input>').attr({type: value.type, name: value.id, id: value.id});
                        $buttons.append($input);
                        $control = $('<div>')
                            .addClass('fileupload fileupload-new').attr('data-provides','fileupload');
                        var $preview = $('<div>').addClass('uneditable-input span3">');
                        $preview.append($('<i>').addClass('icon-file fileupload-exists'));
                        $preview.append($('<span>').addClass('fileupload-preview'));
                        var $ia = $('<div>').addClass('input-append')
                        $ia.append($preview);
                        $ia.append($buttons);
                        $control.append($ia);
                        // register file upload widget
                        $('.fileupload').fileupload({'name': value.id});
                        break;
                    case "text":
                        $control = $('<input>').attr({type:'text', name: value.id,
                            placeholder: value.placeholder}).addClass('input-xxlarge');
                        // remember whether this value was modified by the user
                        $control.change(function() {
                            // count as modified if non-empty
                            var modded = this.value === "" ? false : true;
                            fields.dataset.modified = modded;
                        });
                        break;
                    case "select":
                        $control = $('<select>').attr('name', value.id);
                        var keys = [];
                        $.each(value.options, function(k,v){keys.push(v);})
                        keys.sort();
                        $.each(keys, function(index, value) {
                           var $opt = $('<option>').text(value);
                           $control.append($opt);
                        });
                        break;
                    default:
                        break; // XXX: raise an exception
                }
                $frm_controls.append($control);
                $frm_grp.append($frm_controls);
                // Add the label+controls to the form
                $frm.append($frm_grp);
            });
            // Add actions
            var $up_btn = $('<button>').addClass('btn btn-primary').text('Upload');
            var $cancel_btn = $('<button>').addClass('btn btn-link').text('Cancel');
            var $actions = $('<div>').addClass('form-actions');
            $actions.append($up_btn);
            $actions.append($cancel_btn);
            $frm.append($actions);
            // Populate dialog with form
            this.dlg.append($frm);
            var that = this;   // stash one-up this
            // Put filename in description, unless user entered something
            $frm.find(':file').change(function(e) {
                if (fields.dataset.modified) {
                    return; // don't mess if user typed something
                }
                var s = that._getFileName(this.value);
                var $txt = $frm.find(':text');
                //alert("val to '" + s + "'");
                $txt.val(s);
            });
            // Set up response
            $frm.on( "submit", function(event) {
                event.preventDefault();
                var frm_arr = $(this).serializeArray();
                var $file_input = $('#' + fields.filename.id);
                var formData = new FormData($file_input[0]);
                frm_arr.push({name: that._getFileName($file_input.val()), data: formData});
                that.uploadFile(frm_arr);
            });
            // Cancel
            $cancel_btn.click(function() {
                that.dlg.dialog('close');
            });
            return this;
        },

        /**
         * Render the dialog.
         * @returns {*}
         */
        render: function() {
            this.dlg.find(':text').val('');
            this.dlg.dialog('open');
            return this;
        },

        /**
         * Get file name from input.
         * Has a workaround for chrome
         */
        _getFileName: function(path) {
            return (navigator.userAgent.indexOf('Chrome')) ?
                path.replace(/C:\\fakepath\\/i, '') : path;
        },

        /**
         * Upload the file into the workspace.
         *
         * @param values File path and metadata
         * @returns {*}
         */
        uploadFile: function(values) {
            console.log("upload called with:");
            $.each(values, function(index, value) {
                console.log("(" + index + ")");
                $.each(value, function(key, val) {
                    console.log("   - " + key + '=' + val);
                });
            });
            return this;
        }
	});
})( jQuery );
