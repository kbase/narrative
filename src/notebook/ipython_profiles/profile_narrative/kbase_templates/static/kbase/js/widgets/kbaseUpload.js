 /**
 * File upload widget.
 * Upload objects to the workspace service.
 *
 * Options:
 *   $anchor - HTML anchor: click on this element to create dialog
 *   ws_parent - parent object
 *
 * Author: Dan Gunter <dkgunter@lbl.gov>
 * Created: 27 Aug 2013
 */

// Jquery UI widget style
(function($, undefined) {

    var MissingOptionError = function(argname) {
        var e = new Error("missing option: '" + argname + "'");
        e.name = "MissingOptionError";
        return e;
    }

    var FileReaderError = function(filename) {
        var e = new Error("reading file: '" + filename + "'");
        e.name = "FileReaderError";
        return e;
    }

	$.KBWidget({
        name: "kbaseUploadWidget", 
        parent: 'kbaseWidget',
		version: "0.0.1",
        isLoggedIn: false,
		options: { },
        /**
         * Initialize the widget.
         *
         * @param options
         * @returns {*}
         */
		init: function(options) {
            this._super(options);
            // process options
            if (options.ws_parent === undefined)
                throw MissingOptionError('ws_parent');
            this.ws_p = options.ws_parent;            
            // defaults for instance vars
            this.desc_elem = this.type_elem = null;
            // create the dialog
            this.data_types = [];
            this.createDialog();
            var that = this;
            options.$anchor.on("click", function() {
                that.render();
            });
            return this;
		},

        /**
         * Create the dialog if data types are accessible.
         */
        createDialog: function() {
            var r  = this._getDataTypes(), self = this;
            console.debug("got from _getDataTypes: ", r);
            if (r !== undefined) {
                // jfc, there has to be an easier way to do this!
                r.done(function() { self._createDialog(self); });
            }
        },

        /**
         * Populate data types
         *
         * @return jQuery Promise object
         */
        _getDataTypes: function() {
            var _fn = "_getDataTypes.";
            if (this.data_types.length > 0) {
                return $.Deferred();
            }
            var _p = this.ws_p; // alias
            if (_p.ws_client == null) {
                console.error("Cannot get data types because no client");
                return undefined;
            }
            console.debug(_fn + "get_types.begin");
            var _this = this;
            var r = _p.ws_client.get_types(
                function(result) { 
                    $.each(result, function(key, value) { _this.data_types.push(value);});
                },
                function(result) { 
                    console.error(_fn + "get_types.failed msg=", result.error.message); 
                }                        
            );
            return r;
        },

        /**
         * Create the dialog widget
         *
         * @returns {*}
         */
        _createDialog: function(self) {
            self.cur_files = [];
            var _fn = "createDialog.";
            console.debug(_fn + "begin", "self=", self);
            var _p = self.ws_p; // alias
            var opts = {
                modal: true,
                closeOnEscape: true,
                title: 'Upload file',
                autoOpen: false,
                width: '50em'
            };
            self.dlg = self.$elem.dialog(opts);
            self.dlg.empty(); // make idempotent
            // Build form programmatically
            var $frm = $('<form>').addClass('form-horizontal');
            var fields = {
                'filename': {
                    type:'file',
                    id:'kb-up-filename',
                    label: 'Filename:',
                    desc_id: 'kb-up-desc'
                },
                'datatype': {
                    type:'select',
                    id:'dataset_type',
                    label:'Dataset Type:',
                    options: self.data_types
                },
                'dataset': {
                    type:'text',
                    id:'dataset_name',
                    label:'Dataset Name:',
                    placeholder: "Name or identifying phrase",
                    modified: false
                }
            };
            // Add each field
            var that = self;
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
                        // Input and buttons
                        $control = $('<div/>').addClass('form-group kb-upload')
                        $control.html('<div class="fileupload fileupload-new" data-provides="fileupload">' +
                            '<div class="input-group">' +
                                '<div class="form-control uneditable-input"><i class="icon-file fileupload-exists"></i> ' +
                                    '<span class="fileupload-preview"></span>' +
                                '</div>'+
                                '<div class="input-group-btn">'+
                                    '<a class="btn btn-default btn-file">'+
                                        '<span class="fileupload-new">Select file</span>'+
                                        '<span class="fileupload-exists">Change</span>'+
                                        '<input type="file" class="file-input"/></a>'+
                                    '<a href="#" class="btn btn-default fileupload-exists" data-dismiss="fileupload">Remove</a>'+
                                '</div> </div> </div>');
                        break;
                    case "text":
                        $control = $('<input>').attr({type:'text', name: value.id,
                            placeholder: value.placeholder}).addClass('form-control');
                        // remember whether this value was modified by the user
                        $control.change(function() {
                            // count as modified if non-empty
                            var modded = self.value === "" ? false : true;
                            fields.dataset.modified = modded;
                        });
                        that.desc_elem = $control;
                        break;
                    case "select":
                        $control = $('<select>').attr('name', value.id).addClass("form-control");
                        var keys = [];
                        $.each(value.options, function(k,v){keys.push(v);})
                        keys.sort();
                        that.file_type = keys[0];
                        $.each(keys, function(index, value) {
                           var $opt = $('<option>').text(value);
                           $control.append($opt);
                        });
                        that.type_elem = $control;
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
            self.dlg.append($frm);
            // Put filename in description, unless user entered something
            $frm.on('change.bs.fileinput', function(e) {
                console.debug("changed", e);
                // if the file-input was changed..
                if (e.target.className === "file-input") {
                    self.cur_files = e.target.files;
                    if (self.cur_files.length > 0 && !fields.dataset.modified) {
                        var $txt = $frm.find(':text');
                        $txt.val(self.cur_files[0].name);
                    }
                }
            });
            // Set up response
            $frm.on("submit", function(event) {
                event.preventDefault();
                for (var i=0; i < self.cur_files.length; i++) {
                    var f = self.cur_files[i];
                    $.extend(f, {
                        desc: that.desc_elem[0].value, // description
                        dtype: that.type_elem[0].value // data type name
                    });
                    var reader = new FileReader();
                    reader.onload = (function(file_info) {
                        return function(e) {
                            that.uploadFile(file_info, e.target.result); 
                        }
                    })(f);
                    reader.onerror = (function(file_info) {
                        return function(e) { 
                            throw FileReaderError(file_info); 
                        }
                    })(f);
                    reader.readAsBinaryString(f);
                }
                that.dlg.dialog('close');
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
        uploadFile: function(file, data) {
            console.debug("upload file '" + file.name + "' desc: " + file.desc);
            /*
            id has a value which is an object_id
            type has a value which is an object_type
            data has a value which is an ObjectData
            workspace has a value which is a workspace_id
            command has a value which is a string
            metadata has a value which is a reference to a hash where the key is a string and the value is a string
            auth has a value which is a string
            json has a value which is a bool
            compressed has a value which is a bool
            retrieveFromURL has a value which is a bool
            asHash has a value which is a bool                

            this.save_object = function (params, _callback, _errorCallback) {
                    return json_call_ajax("workspaceService.save_object",
                        [params], 1, _callback, _errorCallback);
                };

            */
            var meta = {
                'narrative': IPython.notebook.metadata,
                'description': file.desc,
            };
            var _p = this.ws_p; // parent obj
            var objid = this.sanitizeObjectId(file.desc);
            params = {
                id: objid,
                type: file.dtype, 
                workspace: _p.ws_id, // workspace_id
                command: 'upload', // string
                metadata: meta,
                auth: _p.ws_auth,
                json: false,
                compressed: false,
                retrieveFromURL: false,
                asHash: false
            };
            console.debug('upload file params', params)
            // put here, so not in logging
            params.data = {
                'version': 0.1,
                'bytes': data
            };
            _p.ws_client.save_object(params, this.handleUploadSuccess, 
                                     this.handleUploadFailure);
            //this.ws_client.save_object(params, 
            //    function())
            return this;
        },

        /**
         * Takes an arbitrary string and return a version of it that
         * can be used as a workspace object id.
         * Illegal chars are replaced by '_'.
         */
         sanitizeObjectId: function(oid) {
            return oid
                .replace(/[^\w\|.-]/g,"_") // illegal chars -> "_"
                .replace(/_+/g,"_");       // multiple "___" -> one "_"
         },

        /**
         * Called when an upload succeeds.
         */
        handleUploadSuccess: function(result) {
            console.debug("upload success", result);
        },

        /**
         * Called when an upload fails
         */
        handleUploadFailure: function(error) {
            console.debug("upload error", error);
        },

        /**
         * Respond to login.
         *
         * @param token
         * @returns {*}
         */
        loggedIn: function(token) {
            this.isLoggedIn = true;
            //this.wsClient = new workspaceService(this.options.workspaceURL);
            return this;
        },

        loggedOut: function(token) {
            this.isLoggedIn = false;
            return this;
        }
	});
})( jQuery );
