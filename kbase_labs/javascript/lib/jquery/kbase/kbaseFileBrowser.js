/*


*/

(function( $, undefined ) {


    $.kbWidget("kbaseFileBrowser", 'kbaseWidget', {
        version: "1.0.0",
        options: {
            'root' : '/',
            'controls' : true,
            'externalControls' : true,
            'height' : '110px',
            'tallHeight' : '450px',
            'shouldToggleNavHeight' : true,
            'controlButtons' : ['deleteButton', 'viewButton', 'addDirectoryButton', 'uploadButton', 'addButton'],
            'name' : 'File Browser',
            'openFolderIcon' : 'icon-folder-open-alt',
            'closedFolderIcon' : 'icon-folder-close-alt',
            'fileIcon' : 'icon-file',
        },

        init: function (options) {

            this._super(options);

            if (options.client) {
                this.client = options.client;
            }

            if (options.$loginbox) {
                this.$loginbox = options.$loginbox;
            }

            this.appendUI(this.$elem);

            return this;

        },

        refreshDirectory : function(path) {

            if (this.sessionId() == undefined) {
                this.$elem.find('ul').first().empty();
            }

            if (this.data(path)) {
                this.listDirectory(path, this.data(path));
            }

        },

        sortByName : function (a,b) {
                 if (a['name'].toLowerCase() < b['name'].toLowerCase()) { return -1 }
            else if (a['name'].toLowerCase() > b['name'].toLowerCase()) { return 1  }
            else                            { return 0  }
        },

        sessionId : function() {
            return this.$loginbox.sessionId();
        },

        selected : function( path ) {

        },

        displayPath : function(path, $ul, filelist) {

            var $fb = this;

            $ul.empty();

            $.each(
                filelist,
                $.proxy(function (idx, val) {

                    var icon = this.options.fileIcon;
                    var callback = function(e) {
                        e.preventDefault();
                        $fb.data('activeDirectory', undefined);
                        $fb.data('activeFile', undefined);
                        $fb.disableButtons();
                        var $opened = $fb.$elem.find('.active');
                        $opened.removeClass('active');
                        if ($(this).parent().get(0) != $opened.get(0)) {
                            $(this).parent().addClass('active');
                            $fb.data('activeFile', val.path);
                            $fb.enableButtons('f');
                            $fb.selected(val.path);
                        }
                    };

                    if (val.type == 'directory') {
                        icon = this.data(val.path) ? $fb.options.openFolderIcon : $fb.options.closedFolderIcon
                        callback = function(e) {
                            e.preventDefault();
                            $fb.data('activeDirectory', undefined);
                            $fb.data('activeFile', undefined);
                            $fb.disableButtons();

                            var $opened = $fb.$elem.find('.active');
                            $opened.removeClass('active');

                            //has children? It's opened. Close it.
                            if ($(this).next().children().length) {
                                //shut it if it's active. Otherwise, make it active
                                if ($(this).parent().get(0) == $opened.get(0)) {
                                    $(this).children().first().removeClass($fb.options.openFolderIcon);
                                    $(this).children().first().addClass($fb.options.closedFolderIcon);
                                    $(this).next().empty();
                                    $fb.data(val.path, undefined);
                                }
                                else {
                                    $fb.data('activeDirectory', val.path);
                                    $(this).parent().addClass('active');
                                    $fb.enableButtons('d');
                                    $fb.selected(val.path);
                                }

                            }
                            //no children? it's closed. open it.
                            else {
                                $(this).children().first().removeClass($fb.options.closedFolderIcon);
                                $(this).children().first().addClass($fb.options.openFolderIcon);
                                $fb.listDirectory(val.path, $(this).next());
                                $(this).parent().addClass('active');
                                $fb.data('activeDirectory', val.path);
                                $fb.data(val.path, $(this).next());
                                $fb.enableButtons('d');
                                $fb.selected(val.path);
                            }
                        }

                    }

                    $ul.append(
                        $('<li></li>')
                            .append(
                                $('<a></a>')
                                    .append(
                                        $('<i></i>')
                                            .addClass(icon)
                                            .css('color', 'gray')
                                    )
                                    .append(' ')
                                    .append(val.name)
                                    .attr('href', '#')
                                    .bind('click',
                                        callback
                                    )
                            )
                            .data('meta', val.meta)
                            .data('able', 'baker')
                            .append($('<ul></ul>').addClass('nav nav-list'))
                    );

                    if (val.type == 'directory' && this.data(val.path)) {
                        this.listDirectory(val.path, $ul.children().last().children().last());
                    }
                }, this)
            );

        },

        fileBrowserContainer : function() {
            var navHeight = this.options.height;

            var $ul = $('<ul></ul>')
                .addClass('nav nav-list')
                .css('height', navHeight)
                .css('overflow', 'auto')
                .attr('id', 'ul-nav')
            ;

            var $container =
                $('<div></div>')
                    .append($ul);

            this.data('file-ul', $ul);

            return $container;
        },

        fileBrowserControls : function() {
            var $div =
                $('<div></div>')
                    .addClass('btn-toolbar')
                    .addClass('text-right')
                    .append(
                        $('<div></div>')
                            .addClass('btn-group')
                            .attr('id', 'control-buttons')
                            .append(
                                $('<input></input>')
                                    .attr('type', 'file')
                                    .attr('id', 'fileInput')
                                    .css('display', 'none')
                                    .bind( 'change', jQuery.proxy(this.handleFileSelect, this) )
                            )
                    )
            ;
            return $div;
        },

        appendUI : function($elem) {

            var $container = this.fileBrowserContainer();

            var $box = $('<div></div>').kbaseBox(
                {
                    title : this.options.name,
                    canCollapse: true,  //boolean. Whether or not clicking the title bar collapses the box
                    content: $container,//'Moo. We are a box. Take us to China.',  //The content within the box. Any HTML string or jquery element
                    //optional list of controls to populate buttons on the right end of the title bar. Give it an icon
                    //and a callback function.
                }
            );

            $elem.append($box.$elem);

            if (this.options.controls) {
                if (this.options.externalControls) {
                    $container.parent().parent().append(this.fileBrowserControls());
                }
                else {
                    $container.append(this.fileBrowserControls());
                }
            }

            this._rewireIds($box.$elem, this);

            $.each(
                this.options.controlButtons,
                $.proxy( function (idx, val) {
                    this.data('control-buttons').append(
                        this[val]()
                    );
                }, this)
            );

            this._rewireIds($box.$elem, this);

            this.listDirectory(this.options.root, this.data('file-ul'));
            this.disableButtons();

            return this;

        },

        disableButtons : function() {
            this.toggleButtons('N');
        },

        enableButtons : function(flag) {
            this.toggleButtons(flag);
        },

        toggleButtons : function(flag) {

            $.each(
                this.options.controlButtons,
                $.proxy(function (idx, val) {
                    var $button = this[val]();
                    if ($button == undefined) {
                        return;
                    }
                    var require = $button.data('require');
                    if (require != undefined) {
                        if ((require == 'a' && flag != 'N') || require == flag) {
                            $button.removeClass('disabled');
                        }
                        else {
                            $button.addClass('disabled');
                        }
                    }
                }, this)
            );
        },

        addDirectoryButton : function() {
            return this.data('addDirectoryButton') != undefined
                ? this.data('addDirectoryButton')
                : $('<a></a>')
                    .attr('id', 'addDirectoryButton')
                    .addClass('btn btn-mini')
                    .append($('<i></i>').addClass('icon-plus'))
                    .attr('title', 'Add new directory')
                    .tooltip()
                    .bind('click',
                        $.proxy( function(e) {
                            e.preventDefault();
                            if (! this.addDirectoryButton().hasClass('disabled')) {
                                this.addDirectory();
                            }
                        }, this)
                    )
        },

        viewButton : function() {
            return this.data('viewButton') != undefined
                ? this.data('viewButton')
                : $('<a></a>')
                    .attr('id', 'viewButton')
                    .addClass('btn btn-mini')
                    .append($('<i></i>').addClass('icon-search'))
                    .attr('title', 'View selected file')
                    .tooltip()
                    .bind('click',
                        $.proxy( function(e) {
                            e.preventDefault();
                            if (! this.viewButton().hasClass('disabled')) {
                                this.openFile(this.data('activeFile'));
                            }
                        }, this)
                    )
                    .data('require', 'f')
        },

        deleteButton : function() {
            return this.data('deleteButton') != undefined
                ? this.data('deleteButton')
                : $('<a></a>')
                    .attr('id', 'deleteButton')
                    .addClass('btn btn-mini')
                    .append($('<i></i>').addClass('icon-minus'))
                    .attr('title', 'Delete selected item')
                    .tooltip()
                    .bind('click',
                        $.proxy( function(e) {
                            e.preventDefault();
                            if (! this.deleteButton().hasClass('disabled')) {
                                this.deleteFile();
                            }
                        }, this)
                    )
                    .data('require', 'a')
        },

        uploadButton : function() {
            return this.data('uploadButton') != undefined
                ? this.data('uploadButton')
                : $('<a></a>')
                    .attr('id', 'uploadButton')
                    .addClass('btn btn-mini')
                    .append($('<i></i>').addClass('icon-arrow-up'))
                    .attr('title', 'Upload file')
                    .tooltip()
                    .bind('click',
                        $.proxy( function (e) {
                            this.data('fileInput').trigger('click');
                        }, this)
                    )
        },
        addButton : function() {
            if (this.options.addFileCallback == undefined) {
                return;
            }

            return this.data('addButton') != undefined
                ? this.data('addButton')
                : $('<a></a>')
                    .attr('id', 'addButton')
                    .addClass('btn btn-mini')
                    .append($('<i></i>').addClass('icon-arrow-right'))
                    .attr('title', 'Add file')
                    .tooltip()
                    .bind('click',
                        $.proxy( function (e) {
                            e.preventDefault();
                            e.stopPropagation();
                            if (! this.addButton().hasClass('disabled')) {
                                this.options.addFileCallback(this.data('activeFile'));
                            }
                        }, this)
                    )
                    .data('require', 'f')
        },

        addDirectory : function() {
            var parentDir = this.data('activeDirectory') || this.options.root;
            var that = this;

            var displayDir = parentDir.replace(this.options.root, '/');

            var $addDirectoryModal = $('<div></div>').kbasePrompt(
                {
                    title : 'Create directory',
                    body : $('<p></p>')
                            .append('Create directory ')
                            .append(
                                $('<span></span>')
                                    .css('font-weight', 'bold')
                                    .text(displayDir)
                            )
                            .append(' ')
                            .append(
                                $('<input></input>')
                                    .attr('type', 'text')
                                    .attr('name', 'dir_name')
                                    .attr('size', '20')
                            )
                    ,
                    controls : [
                        'cancelButton',
                        {
                            name : 'Create directory',
                            type : 'primary',
                            callback : function(e, $prompt) {
                                $prompt.closePrompt();
                                that.makeDirectoryCallback($addDirectoryModal.dialogModal().find('input').val(), parentDir);
                            }
                        }
                    ]
                }
            );

            $addDirectoryModal.openPrompt();


        },

        openFile : function(file, content, win) {

            if (win == undefined) {
                win = window.open();
                win.document.open();
            }

            if (content == undefined) {
                this.fetchContent(file, win);
                return;
            }

            content = content.replace(/>/g, '&gt;');
            content = content.replace(/</g, '&lt;');

            win.document.write(
                $('<div></div>').append(
                    $('<div></div>')
                        .css('white-space', 'pre')
                        .append(content)
                )
                .html()
            );
            win.document.close();

        },

        deleteFile : function() {

            var file = this.data('activeFile');
            var deleteMethod = 'deleteFileCallback';

            if (file == undefined) {
                file = this.data('activeDirectory');

                if (file == undefined) {
                    return;
                }

                file = file.replace(/\/+$/, '');
                deleteMethod = 'deleteDirectoryCallback';

            }
            var matches = file.match(/(.+)\/[^/]+$/);

            var active_dir = '/';
            if (matches != undefined && matches.length > 1) {
                active_dir = matches[1];
            }

            var that = this; //sigh. The confirm button needs it for now.

            var promptFile = file.replace(this.options.root, '');

            var $deleteModal = $('<div></div>').kbaseDeletePrompt(
                {
                    name : promptFile,
                    callback : function(e, $prompt) {
                        $prompt.closePrompt();
                        that[deleteMethod](file, active_dir);
                    }
                }
            );

            $deleteModal.openPrompt();

        },

        handleFileSelect : function(evt) {

            evt.stopPropagation();
            evt.preventDefault();

            var files = evt.target.files
                || evt.originalEvent.dataTransfer.files
                || evt.dataTransfer.files;

            $.each(
                files,
                jQuery.proxy(
                    function (idx, file) {

                        var reader = new FileReader();

                        var upload_dir = this.options.root;
                        if (this.data('activeDirectory')) {
                            upload_dir = this.data('activeDirectory');
                        }


                        var $processElem;

                        if (this.options.processList) {
                            $processElem = this.options.processList.addProcess('Uploading ' + file.name);
                        }

                        reader.onload = jQuery.proxy(
                            function(e) {
                                this.uploadFile(file.name, e.target.result, upload_dir, $processElem);
                            },
                            this
                        );

                        reader.readAsText(file);

                    },
                    this
                )
            );

            this.data('fileInput').val('');

        },

        listDirectory : function (path, $ul) {
             throw "Cannot call listDirectory directly - please subclass";
        },

        makeDirectoryCallback : function (dir, parentDir) {
             throw "Cannot call makeDirectoryCallback directly - please subclass";
        },

        fetchContent : function(file, win) {
             throw "Cannot call fetchContent directly - please subclass";
        },

        deleteFileCallback : function(file, active_dir) {
             throw "Cannot call deleteFileCallback directly - please subclass";
        },

        deleteDirectoryCallback : function(file, active_dir) {
             throw "Cannot call deleteDirectoryCallback directly - please subclass";
        },

        uploadFile : function(name, content, upload_dir, $processElem) {
             throw "Cannot call uploadFile directly - please subclass";
        },

    });

}( jQuery ) );
