/*


*/

(function( $, undefined ) {


    $.kbWidget("kbaseIrisFileBrowser", 'kbaseDataBrowser', {
        version: "1.0.0",
        options: {
            title : 'File Browser',
            'root' : '/',
            types : {
                file : {
                    controls :
                    [
                        {
                            icon : 'icon-minus',
                            callback : function(e, $fb) {
                                $fb.deleteFile($(this).data('id'), 'file');
                            },
                            id : 'removeButton',
                            tooltip : 'delete this file',
                        },
                        {
                            icon : 'icon-eye-open',
                            callback : function(e, $fb) {
                                $fb.openFile($(this).data('id'));
                            },
                            id : 'viewButton',
                            'tooltip' : 'view this file',
                        },
                        {
                            icon : 'icon-pencil',
                            callback : function(e) {
                                console.log("clicked on edit");
                                console.log($(this).data('id'));
                            },
                            id : 'editButton',
                            tooltip : 'edit this file',
                        },
                        {
                            icon : 'icon-arrow-right',
                            callback : function(e, $fb) {
                                if ($fb.$terminal) {
                                    $fb.$terminal.kbaseIrisTerminal('appendInput', $(this).data('id') + ' ');
                                }
                            },
                            id : 'addButton',
                            'tooltip' : 'add this file to terminal input',
                        },
                    ],
                },
                folder : {
                    childrenCallback : function (path, callback) {

                        this.listDirectory(path, function (results) {
                            callback(results);
                        });
                    },
                    controls : [
                        {
                            icon : 'icon-minus',
                            'tooltip' : 'delete this folder',
                            callback : function(e, $fb) {
                                $fb.deleteFile($(this).data('id'), 'folder');
                            },
                            id : 'removeDirectoryButton'
                        },
                        {
                            icon : 'icon-plus',
                            'tooltip' : 'add a subdirectory',
                            callback : function(e, $fb) {
                                $fb.addDirectory($(this).data('id'));
                            },
                            id : 'addDirectoryButton'
                        },
                        {
                            icon : 'icon-arrow-up',
                            'tooltip' : 'upload a file',
                            callback : function(e, $fb) {
                                $fb.data('active_directory', $(this).data('id'));
                                $fb.data('fileInput').trigger('click');
                            },
                            id : 'uploadFileButton'
                        },

                    ],
                }
            },
        },

        init: function (options) {

            if (options.client) {
                this.client = options.client;
            }

            if (options.$terminal) {
                this.$terminal = options.$terminal;
            }

            if (options.$loginbox) {
                this.$loginbox = options.$loginbox;
            }

            this._super(options);

            this.listDirectory(this.options.root, $.proxy(function (results) {
                this.appendContent(results, this.data('ul-nav'))
            }, this));

            return this;

        },

        prepareRootContent : function() {

            var $ul = this._super();
            $ul.css('height', (parseInt(this.options.height) - 25) + 'px');

            var $pc = $('<div></div>').css('margin-top', '2px')
            $pc.kbaseButtonControls(
                {
                    onMouseover : false,
                    context : this,
                    controls : [
                        {
                            'icon' : 'icon-plus',
                            'tooltip' : 'add directory',
                            callback : function(e, $fb) {
                                $fb.addDirectory('/');
                            },

                        },
                        {
                            'icon' : 'icon-arrow-up',
                            'tooltip' : 'upload a file',
                            callback : function(e, $fb) {
                                $fb.data('active_directory', $(this).data('id'));
                                $fb.data('fileInput').trigger('click');
                            }
                        },
                    ]

                }
            );
            return $('<div></div>')
                .css('height', this.options.height)
                .append($ul)
                .append($pc)
                .append(
                    $('<input></input>')
                        .attr('type', 'file')
                        .attr('id', 'fileInput')
                        .css('display', 'none')
                        .bind( 'change', $.proxy(this.handleFileSelect, this) )
                )
        },

        sessionId : function() {
            if (this.$terminal != undefined) {
                return this.$terminal.sessionId;
            }
            else if (this.$loginbox != undefined) {
                return this.$loginbox.sessionId();
            }
            else {
                return undefined;
            }
        },

        refreshDirectory : function(path) {

            if (this.sessionId() == undefined) {
                this.data('ul-nav').empty();
                return;
            }

            var $target = path == '/'
                ? this.data('ul-nav')
                : this.targets[path].next();

            var pathRegex = new RegExp('^' + path);

            var openTargets = [];
            for (var subPath in this.targets) {
                if (
                       subPath.match(pathRegex)
                    && ! this.targets[subPath].next().is(':hidden')
                    && this.targets[subPath].next().is('ul')) {
                        openTargets.push(subPath);
                }
            }

            if (! $target.is(':hidden')) {
                this.listDirectory(path, $.proxy(function (results) {
                    $target.empty();
                    this.appendContent(results, $target)
                }, this), openTargets);
            }

            $.each(
                openTargets,
                $.proxy(function (idx, subPath) {
                    var $target = this.targets[subPath].next();

                    this.listDirectory(subPath, $.proxy(function (results) {
                        $target.empty();
                        this.appendContent(results, $target)
                        $target.show();
                    }, this));
                }, this)
            );

        },

        listDirectory : function (path, callback) {

            this.client.list_files(
                this.sessionId(),
                '/',
                path,
                jQuery.proxy( function (filelist) {
                    var dirs = filelist[0];
                    var files = filelist[1];

                    var results = [];

                    var $fb = this;

                    jQuery.each(
                        dirs.sort(this.sortByKey('name')),
                        $.proxy(function (idx, val) {
                            val['full_path'] = val['full_path'].replace(/\/+/g, '/');
                            results.push(
                                {
                                    'type' : 'folder',
                                    'id' : val['full_path'],
                                    'label' : val['name'],
                                    'open' : $fb.openTargets[ val['full_path'] ]
                                }
                            )
                        }, this)
                    );

                    jQuery.each(
                        files.sort(this.sortByKey('name')),
                        $.proxy(function (idx, val) {
                            val['full_path'] = val['full_path'].replace(/\/+/g, '/');

                            results.push(
                                {
                                    'type' : 'file',
                                    'id' : val['full_path'],
                                    'label' : val['name'],
                                }
                            )
                        }, this)
                    );

                    results = results.sort(this.sortByKey('label'));

                    callback(results);

                    }, this
                ),
                $.proxy(function (err) {this.dbg(err)},this)
            );

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

                        var upload_dir = '/';
                        if (this.data('active_directory')) {
                            upload_dir = this.data('active_directory');
                        }


                        var $processElem;

                        if (this.options.processList) {
                            $processElem = this.options.processList.addProcess('Uploading ' + file.name);
                            reader.onprogress = $.proxy(function (e) {
                                this.options.processList.removeProcess($processElem);
                                $processElem = this.options.processList.addProcess('Uploading ' + file.name + ' ' + (100 * e.loaded / e.total).toFixed(2) + '%')
                                this.dbg('progress ' + (e.loaded / e.total));
                                this.dbg(e);
                            }, this)
                        }

                        reader.onload = jQuery.proxy(
                            function(e) {

                                this.client.put_file(
                                    this.sessionId(),
                                    file.name,
                                    e.target.result,
                                    upload_dir,
                                    jQuery.proxy( function (res) {
                                        if (this.options.processList) {
                                            this.options.processList.removeProcess($processElem);
                                        }
                                        this.refreshDirectory(upload_dir)
                                    }, this),
                                    jQuery.proxy( function (res) {
                                        if (this.options.processList) {
                                            this.options.processList.removeProcess($processElem);
                                        }
                                        this.dbg(res);
                                    }, this)
                                );
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

        openFile : function(file) {

            // can't open the window in trhe callback!
            var win = window.open();
            win.document.open();

            this.client.get_file(
                this.sessionId(),
                file,
                '/',
                $.proxy(
                    function (res) {

                        try {
                            var obj = JSON.parse(res);
                            res = JSON.stringify(obj, undefined, 2);
                        }
                        catch(e) {
                            this.dbg("FAILURE");
                            this.dbg(e);
                        }

                        win.document.write(
                            $('<div></div>').append(
                                $('<div></div>')
                                    .css('white-space', 'pre')
                                    .append(res)
                            )
                            .html()
                        );
                        win.document.close();

                    },
                    this
                ),
                function (err) { this.dbg("FILE FAILURE"); this.dbg(err) }
            );
        },

        deleteFile : function(file, type) {

            var deleteMethod = type == 'file'
                ? 'remove_files'
                : 'remove_directory';

            file = file.replace(/\/+$/, '');

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
                        that.client[deleteMethod](
                            that.sessionId,
                            '/',
                            file,
                            function (res) { that.refreshDirectory(active_dir) },
                            function() {}
                            );
                    }
                }
            );

            $deleteModal.openPrompt();

        },

        addDirectory : function(parentDir) {
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
                                that.client.make_directory(
                                    that.sessionId,
                                    parentDir,
                                    $addDirectoryModal.dialogModal().find('input').val(),
                                    function (res) { that.refreshDirectory(parentDir) },
                                    function() {}
                                    );
                            }
                        }
                    ]
                }
            );

            $addDirectoryModal.openPrompt();


        },

    });

}( jQuery ) );
