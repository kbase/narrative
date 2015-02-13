//----------------------------------------------------------------------------
//  Copyright (C) 2008-2011  The IPython Development Team
//
//  Distributed under the terms of the BSD License.  The full license is in
//  the file COPYING, distributed as part of this software.
//----------------------------------------------------------------------------

//============================================================================
// SaveWidget
//============================================================================

var IPython = (function (IPython) {

    var utils = IPython.utils;

    var SaveWidget = function (selector) {
        this.selector = selector;
        if (this.selector !== undefined) {
            this.element = $(selector);
            this.style();
            this.bind_events();
        }
    };


    SaveWidget.prototype.style = function () {
    };


    SaveWidget.prototype.bind_events = function () {
        var that = this;
        this.element.find('span#notebook_name').click(function () {
            that.rename_notebook();
        });
        this.element.find('span#notebook_name').hover(function () {
            $(this).addClass("ui-state-hover");
        }, function () {
            $(this).removeClass("ui-state-hover");
        });
        $([IPython.events]).on('notebook_loaded.Notebook', function () {
            that.update_notebook_name();
            that.update_document_title();
        });
        $([IPython.events]).on('notebook_saved.Notebook', function () {
            that.update_notebook_name();
            that.update_document_title();
        });
        $([IPython.events]).on('notebook_save_failed.Notebook', function (event, data) {
            that.set_save_status('Narrative save failed!');
            console.log(event);
            console.log(data);

            var errorText;
            if (data.xhr.responseText) {
                var $error = $($.parseHTML(data.xhr.responseText));
                errorText = $error.find('#error-message > h3').text();

                /* gonna throw in a special case for workspace permissions issues for now.
                 * if it has this pattern:
                 * 
                 * User \w+ may not write to workspace \d+
                 * change the text to something more sensible.
                 */

                var res = /User\s+(\w+)\s+may\s+not\s+write\s+to\s+workspace\s+(\d+)/.exec(errorText);
                if (res) {
                    errorText = "User " + res[1] + " does not have permission to save to workspace " + res[2] + ".";
                }

            }
            else {
                errorText = 'An unknown error occurred!';
            }

            IPython.dialog.modal({
                title: "Narrative save failed!",
                body: $('<div>').append(errorText),
                buttons : {
                    "OK": {
                        class: "btn-primary",
                        click: function () {
                        }
                    }
                },
                open : function (event, ui) {


                    var that = $(this);
                    // Upon ENTER, click the OK button.
                    that.find('input[type="text"]').keydown(function (event, ui) {
                        if (event.which === utils.keycodes.ENTER) {
                            that.find('.btn-primary').first().click();
                        }
                    });
                    that.find('input[type="text"]').focus();
                }
            });



        });
        $([IPython.events]).on('checkpoints_listed.Notebook', function (event, data) {
            that.set_last_checkpoint(data[0]);
        });
        
        $([IPython.events]).on('checkpoint_created.Notebook', function (event, data) {
            that.set_last_checkpoint(data);
        });
        $([IPython.events]).on('set_dirty.Notebook', function (event, data) {
            that.set_autosaved(data.value);
        });
    };


    SaveWidget.prototype.rename_notebook = function (titleText, setDefault) {
        var that = this;
        var $input = $('<input/>').attr('type','text').addClass('form-control');
        if (setDefault) { $input.val(IPython.notebook.get_notebook_name()); }
        var dialog = $('<div/>').append(
            $("<p/>").addClass("rename-message")
                .html('Enter a new name:')
        ).append(
            $("<br/>")
        ).append(
            $input
        );
        IPython.dialog.modal({
            title: titleText,
            body: dialog,
            buttons : {
                "Cancel": {},
                "OK": {
                    class: "btn btn-primary",
                    click: function () {
                    var new_name = $(this).find('input').val();
                    if (!IPython.notebook.test_notebook_name(new_name)) {
                        $(this).find('.rename-message').html(
                            "Invalid name. Narrative names cannot be empty or be "+
                            "left 'Untitled'. Please try again:"
                        );
                        //if (setDefault) { $(this).find('input').val(IPython.notebook.get_notebook_name()); }
                        return false;
                    } else {
                        new_name = new_name.trim();
                        IPython.notebook.set_notebook_name(new_name);
                        $('#kb-narr-name #name').text(new_name); // Bad! but how else to set this?
                        that.update_notebook_name();
                        that.update_document_title();
                        IPython.notebook.save_notebook();
                    }
                    return true;
                }}
                },
            open : function () {
                var that = $(this);
                // Upon ENTER, click the OK button.
                that.find('input[type="text"]').keydown(function (event, ui) {
                    if (event.which === utils.keycodes.ENTER) {
                        that.find('.btn-primary').first().click();
                    }
                });
                that.find('input[type="text"]').focus();
            }
        });
    }


    SaveWidget.prototype.update_notebook_name = function () {
        var nbname = IPython.notebook.get_notebook_name();
        this.element.find('span#notebook_name').html(nbname);
    };


    SaveWidget.prototype.update_document_title = function () {
        var nbname = IPython.notebook.get_notebook_name();
        document.title = nbname;
    };


    SaveWidget.prototype.set_save_status = function (msg) {
        this.element.find('span#autosave_status').html(msg);
    }

    SaveWidget.prototype.set_checkpoint_status = function (msg) {
        this.element.find('span#checkpoint_status').html(msg);
    }

    SaveWidget.prototype.set_last_checkpoint = function (checkpoint) {
        if (!checkpoint) {
            this.set_checkpoint_status("");
            return;
        }
        var d = new Date(checkpoint.last_modified);
        this.set_checkpoint_status(
            "Last Checkpoint: " + d.format('mmm dd HH:MM')
        );
    }

    SaveWidget.prototype.set_autosaved = function (dirty) {
        if (dirty) {
            this.set_save_status("(unsaved changes)");
        } else {
//            this.set_save_status("(autosaved)");
            this.set_save_status("(saved)");
        }
    };


    IPython.SaveWidget = SaveWidget;

    return IPython;

}(IPython));

