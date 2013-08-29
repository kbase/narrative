/*


*/

(function( $, undefined ) {


    $.KBWidget({

		  name: "kbaseWorkspaceBrowser",
		parent: 'kbaseFileBrowser',

        version: "1.0.0",
        options: {
            name : 'Workspace Browser',
            workspace : 'chenrydemo',
            selectWorkspace : true,
        },

        init : function(options) {

            options.controlButtons = ['deleteButton', 'viewButton', 'uploadButton', 'addButton'];

            this._super(options);

            if (this.options.wsClient != undefined) {
                this.wsClient = this.options.wsClient;
            }

            if (this.options.workspace != undefined) {
                this.workspace = this.options.workspace;
            }

            this.listWorkspaces();

            return this;

        },

        token : function() {
            var token = this.$loginbox.get_kbase_cookie('token');
            return token;
        },

        selected : function( path ) {
            var workspace = this.data('workspace-select').val();
            var $option = this.data('workspace-select').find(':selected');

            if ($option.data('perm') != 'a') {
                this.deleteButton().addClass('disabled');
            }
        },

        refreshDirectory : function(path) {
            this.listWorkspaces();
        },

        listDirectory : function (path, $ul) {

            if (path == this.workspace) {
                this.wsClient.list_workspace_objects_async(
                    {
                        workspace           : path,
                        auth       : this.token(),
                        showDeletedObject   : false,
                    },
                    $.proxy ( function(res) {
                        var files = [];
                        this.meta = {};
                        $.each(
                            res,
                            $.proxy( function (idx, val) {
                                files.push({
                                    name : val[0],
                                    path : val[0],
                                    type : val[3] == 0 ? 'file' : 'directory'
                                });

                                this.meta[val[0]] = {
                                    name    : val[0],
                                    version : val[3],
                                    type    : val[1],
                                };

                            }, this)
                        );

                        this.displayPath('/', $ul, files.sort(this.sortByName));
                    }, this)
                )
            }
            else if (this.workspace) {

                var files = [];
                var version = this.meta[path].version;
                for (var i = version; i >= 0; i--) {
                    files.push({
                        name : 'Revision ' + i,
                        path : path,
                        type : 'file',
                        meta : {
                            version : i
                        }
                    });
                }

                this.displayPath('path', $ul, files);

            }
        },

        /*makeDirectoryCallback : function (dir, parentDir) {

        },*/

        viewButton : function() {
            var $viewButton = this._super();
            $viewButton.data('require', 'a');
            $viewButton.unbind('click');
            $viewButton.bind('click',
                $.proxy( function(e) {
                    e.preventDefault();
                    if (! this.viewButton().hasClass('disabled')) {
                        var file = this.data('activeFile');
                        if (file == undefined) {
                            file = this.data('activeDirectory');
                        }

                        this.openFile( file );
                    }
                }, this)
            );
            return $viewButton;
        },

        addButton : function() {
            var $addButton = this._super();
            $addButton.data('require', 'a');
            $addButton.unbind('click');
            $addButton.bind('click',
                $.proxy( function(e) {
                    e.preventDefault();
                    if (! this.addButton().hasClass('disabled')) {
                        var file = this.data('activeFile');
                        if (file == undefined) {
                            file = this.data('activeDirectory');
                        }

                        this.options.addFileCallback( file );
                    }
                }, this)
            );
            return $addButton;
        },

        stringify : function(key, val) {
            if (typeof val == 'array') {
                val = val.join(", ");
            }
            else if (typeof val != 'string') {
                val = this.stringify(val);
            }

            return key + ' : ' + val;
        },

        fetchContent : function(file, win) {

            var $opened = this.$elem.find('.active');

            var params = {
                type : this.meta[file].type,
                workspace : this.workspace,
                id : file,
            };

            if (meta = $opened.data('meta')) {
                params.instance = meta.version;
            }

            this.wsClient.get_object_async(
                params,
                $.proxy(
                    function(res) {
                        try {
                            if (typeof res.data == 'string') {
                                res = res.data;
                            }
                            else {
                                var jsonStr = JSON.stringify(res.data, undefined, 2);
                                res = jsonStr;
                            }
                        }
                        catch(e) {
                            this.dbg("FAILURE");
                            this.dbg(e);
                            res = res.data;
                        }

                        /*if (typeof res != 'string') {
                            var output = '';
                            for (prop in res) {
                                output += this.stringify(prop, res[prop]);
                            }
                            res = output;
                        }*/

                        this.openFile(file, res, win);
                    }, this),
                $.proxy (function(res) {
                    win.close();
                    var $errorModal = $('<div></div>').kbaseErrorPrompt(
                        {
                            title : 'Fetch failed',
                            message : res.message
                        }
                    );
                    $errorModal.openPrompt();
                }, this)

            );
        },

        deleteFileCallback : function(file, active_dir) {
            if (this.workspace == undefined) {

            }
            else {
                this.wsClient.delete_object_async(
                    {
                        type : 'Unspecified',
                        workspace : this.workspace,
                        id : file,
                        auth       : this.token(),
                    },
                    $.proxy (function(res) {
                        this.listDirectory(this.workspace, this.data('ul-nav'));
                    }, this),
                    $.proxy (function(res) {
                        var $errorModal = $('<div></div>').kbaseErrorPrompt(
                            {
                                title : 'Deletion failed',
                                message : res.message
                            }
                        );
                        $errorModal.openPrompt();
                    }, this)

                );
            }
        },

        /*deleteDirectoryCallback : function(file, active_dir) {

        },*/

        uploadFile : function(name, content, upload_dir, $processElem) {
            if (this.workspace == undefined) {

            }
            else {
                this.wsClient.save_object_async(
                    {
                        type : 'Unspecified',
                        workspace : this.workspace,
                        id : name,
                        data : content,
                        auth       : this.token(),
                    },
                    $.proxy (function(res) {
                        if (this.options.processList) {
                            this.options.processList.removeProcess($processElem);
                        }
                        this.listDirectory(this.workspace, this.data('ul-nav'));
                    }, this),
                    $.proxy (function(res) {
                        if (this.options.processList) {
                            this.options.processList.removeProcess($processElem);
                        }
                        var $errorModal = $('<div></div>').kbaseErrorPrompt(
                            {
                                title : 'Creation failed',
                                message : res.message
                            }
                        );
                        $errorModal.openPrompt();
                    }, this)

                );
            }
        },

        createWorkspace : function() {
            var $addWorkspaceModal = $('<div></div>').kbasePrompt(
                {
                    title : 'Create workspace',
                    body : $('<p></p>')
                            .append('Create workspace ')
                            .append(' ')
                            .append(
                                $('<input></input>')
                                    .attr('type', 'text')
                                    .attr('name', 'ws_name')
                                    .attr('size', '20')
                            )
                    ,
                    controls : [
                        'cancelButton',
                        {
                            name : 'Create workspace',
                            type : 'primary',
                            callback : $.proxy(function(e, $prompt) {
                                $prompt.closePrompt();
                                //that.makeDirectoryCallback($addDirectoryModal.dialogModal().find('input').val(), parentDir);
                                this.wsClient.create_workspace_async(
                                    {
                                        workspace           : $addWorkspaceModal.dialogModal().find('input').val(),
                                        permission          : 'a',
                                        auth       : this.token(),
                                    },
                                    $.proxy( function(res) {
                                        this.workspace =   $addWorkspaceModal.dialogModal().find('input').val();
                                        this.listWorkspaces();
                                    }, this),
                                    $.proxy(function(res) {
                                        var $errorModal = $('<div></div>').kbaseErrorPrompt(
                                            {
                                                title : 'Creation failed',
                                                message : res.message
                                            }
                                        );
                                        $errorModal.openPrompt();
                                    }, this)
                                );
                            }, this)
                        }
                    ]
                }
            );

            $addWorkspaceModal.openPrompt();
        },

        deleteWorkspace : function() {
            var $deleteModal = $('<div></div>').kbaseDeletePrompt(
                {
                    name : this.data('workspace-select').val(),
                    callback : $.proxy(function(e, $prompt) {
                        $prompt.closePrompt();
                        this.deleteWorkspaceCallback(this.data('workspace-select').val());
                    }, this)
                }
            );
            $deleteModal.openPrompt();
        },

        deleteWorkspaceCallback : function (ws) {

            this.wsClient.delete_workspace_async(
                {
                    workspace  : ws,
                    auth       : this.token(),
                },
                $.proxy( function(res) {
                    this.listWorkspaces();
                }, this),
                $.proxy(function(res) {

                    var $errorModal = $('<div></div>').kbaseErrorPrompt(
                        {
                            title : 'deletion failed',
                            message : res.message
                        }
                    );
                    $errorModal.openPrompt();
                }, this)
            );

        },

        fileBrowserContainer : function() {

            var superContainer = this._super('fileBrowserContainer');

            if (this.options.selectWorkspace) {
                superContainer.prepend(
                    $('<div></div>')
                        .addClass('btn-toolbar')
                        .addClass('text-left')
                        .css('width', '100%')
                        .append(
                            $('<div></div>')
                                .addClass('input-append')
                                .attr('id', 'workspace-controls')
                                .append(
                                    $('<select></select>')
                                        .css('height', '22px')
                                        .css('width', '254px')
                                        .attr('id', 'workspace-select')
                                        .bind('change', $.proxy ( function(e) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            this.workspace = undefined;
                                            var workspace = this.data('workspace-select').val();
                                            var $option = this.data('workspace-select').find(':selected');

                                            if ($option.data('perm') != 'a') {
                                                this.data('deleteWorkspace-button').addClass('disabled');
                                            }
                                            else {
                                                this.data('deleteWorkspace-button').removeClass('disabled');
                                            }

                                            if (workspace != '--- choose workspace ---') {
                                                this.workspace = workspace;
                                                this.listDirectory(workspace, this.data('ul-nav'));
                                            }
                                        }, this))
                                )
                                .append(
                                    $('<button></button>')
                                        .addClass('btn btn-mini')
                                        .attr('id', 'deleteWorkspace-button')
                                        .append( $('<i></i>').addClass('icon-minus') )
                                        .bind('click', $.proxy( function(e) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (! this.data('deleteWorkspace-button').hasClass('disabled')) {
                                                this.deleteWorkspace();
                                            }
                                        }, this))
                                )
                                .append(
                                    $('<button></button>')
                                        .addClass('btn btn-mini')
                                        .attr('id', 'createWorkspace-button')
                                        .append( $('<i></i>').addClass('icon-plus') )
                                        .bind('click', $.proxy( function(e) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            this.createWorkspace();
                                        }, this))
                                )
                        )
                );
            }

            this._rewireIds(superContainer, this);

            return superContainer;
        },

        listWorkspaces : function() {

            this.wsClient.list_workspaces_async(
                {'auth' : this.token()},
                $.proxy( function (res) {
                    var workspaces = [];
                    $.each(
                        res,
                        $.proxy(function (idx, val) {
                            workspaces.push(
                                {
                                    name : val[0],
                                    perm : val[4]
                                }
                            );
                        }, this)
                    );

                    var perm;

                    workspaces = workspaces.sort(this.sortByName);
                    if (this.data('workspace-select') != undefined) {
                        this.data('workspace-select').empty();
                        this.data('workspace-select').append(
                            $('<option></option>')
                                .append(' --- choose workspace --- ')
                                .attr('val', '')
                        );
                        $.each(
                            workspaces,
                            $.proxy (function (idx, val) {

                                var $option = $('<option></option>')
                                    .append(val.name)
                                    .attr('value', val.name)
                                    .data('perm', val.perm);
                                if (val.name == this.workspace) {
                                   perm = val.perm;
                                }

                                this.data('workspace-select').append($option);

                            }, this)
                        );
                    }

                    if (this.workspace) {
                        this.data('workspace-select').val(this.workspace);
                        this.listDirectory(this.workspace, this.data('ul-nav'));
                    }
                    if (perm != 'a') {
                        this.data('deleteWorkspace-button').addClass('disabled');
                    }


                }, this)
            );
        },

    });

}( jQuery ) );
