/*
 *  This module provides helper functions for the Workspace API
 */

    function WSHandler(params) {
        console.log('here')
        var parent = this;

        var user = params && params.user
            ? params.user
            : null;

        var url = params && params.url
            ? params.url
//            : "http://bio-data-1.mcs.anl.gov/services/fba_gapfill";
            :"http://kbase.us/services/workspace";

        var service = new workspaceService(url);

        this.getWorkspace = function(workspaceId) {
            var def = $.Deferred();

            var params = {
                workspace: workspaceId
            };

            if (user) {
                params.auth = user.token;
            }

            service.get_workspacemeta(params).done(function(rawWorkspace) {
                var workspace = new Workspace(rawWorkspace);
                def.resolve(workspace);
            }).fail(function() {
                def.reject(); // TODO: error message
            });

            return def.promise();
        };

        this.getWorkspaces = function() {
            def = $.Deferred();

            var params = {};

            if (user) {
                params.auth = user.token;
            }

            service.list_workspaces(params).done(function(rawWorkspaces) {
                var workspaces = [];
                for (var i=0; i<rawWorkspaces.length; i++) {
                    var workspace = new Workspace(rawWorkspaces[i]);
                    workspaces.push(workspace);
                }

                def.resolve(workspaces);
            }).fail(function() {
                def.reject(); // TODO: error message
            });

            return def.promise();
        };

        this.createWorkspace = function(workspaceId, permission) {
            var def = $.Deferred();

            // permission must be: 'n', 'r', 'w', or 'a'
            if (! validatePermission(permission)) {
                permission = 'n';
            }
                
            var params = {
                workspace: workspaceId,
                default_permission: permission
            };

            if (user) {
                params.auth = user.token;
            }

            service.create_workspace(params).done(function(rawWorkspace) {
                var workspace = new Workspace(rawWorkspace);
                workspace.permissions = {};
                def.resolve(workspace);
            }).fail(function(error) {
                def.reject(error);
            });

            return def.promise();
        };

        function validatePermission(perm) {
            return /^[nrwa]$/.test(perm);
        }

        /*
         * Objects
         * 
         */
        function Workspace(data) {
            var self = this;
            var dataFields = ['id', 'owner', 'moddate', 'objects', 'user_permission', 'global_permission'];

            for (var i=0; i<dataFields.length; i++) {
                this[dataFields[i]] = data[i];
            }

            if (user) {
                this.isOwned = (user.user_id === this.owner ? true : false);
            } else {
                // check if public
                this.isOwned = ('public' === this.owner ? true : false);
            }


            this.clone = function(newWorkspaceId, permission) {
                var def = $.Deferred();

                // permission must be: 'n', 'r', 'w', or 'a'
                if (! validatePermission(permission)) {
                    permission = null;
                }

                var params = {
                    current_workspace: self.id,
                    new_workspace: newWorkspaceId
                };

                if (permission) {
                    params.default_permission = permission;
                }

                if (user) {
                    params.auth = user.token;
                }

                service.clone_workspace(params).done(function() {
                    // can clone into new or existing workspace
                    // get workspace to ensure permissions are correct
                    parent.getWorkspace(newWorkspaceId).done(function(newWorkspace) {
                        def.resolve(newWorkspace);
                    }).fail(function(error) {
                        def.reject(error);
                    });
                }).fail(function(error) {
                    def.reject(error);
                });

                return def.promise();
            };

            this.getAllObjectsMeta = function() {
                var def = $.Deferred();

                var params = {
                    workspace: self.id
                };

                if (user) {
                    params.auth = user.token;
                }
                    
                service.list_workspace_objects(params).done(function(data) {
                    for (var i=0; i<data.length; i++) {
                        data[i] = new WorkspaceObject(data[i]);
                    }

                    def.resolve(data);
                }).fail(function() {
                    def.reject(); // TODO: error message
                });

                return def.promise();
            };

            this.hasObject = function() {};  // TODO: implement

            this.getObject = function(type, id) {
                var def = $.Deferred();

                var params = {
                    workspace: this.id,
                    type: type,
                    id: id
                };

                if (user) {
                    params.auth = user.token;
                }

                service.get_object(params).done(function(data) {
                    def.resolve(data.data);
                }).fail(function() {
                    def.reject(); // TODO: error message
                });

                return def.promise();

            };

            this.getObjectHistory = function(type, id) {
                var def = $.Deferred();

                var params = {
                    workspace: this.id,
                    type: type,
                    id: id
                };

                if (user) {
                    params.auth = user.token;
                }

                var prom = service.object_history(params)
                    .fail(function() {
                        def.reject(); // TODO: error message
                    });

                return prom;
            }


            this.deleteObj = function(type, id) {
                var def = $.Deferred();

                var params = {
                    workspace: this.id,
                    type: type,
                    id: id
                };
                console.log(params)

                if (user) {
                    params.auth = user.token;
                }

                service.delete_object(params).done(function() {
                    def.resolve(self);
                }).fail(function() {
                    def.reject(); // TODO: error message
                });

                return def.promise();
            }

            this.copyObject = function(type, id, new_ws, new_id) {
                var def = $.Deferred();

                var params = {
                    source_workspace: this.id,
                    type: type,
                    source_id: id,
                    new_workspace: new_ws,
                    new_id: new_id
                };
                console.log(params)

                if (user) {
                    params.auth = user.token;
                }

                service.copy_object(params).done(function() {
                    def.resolve(self);
                }).fail(function() {
                    def.reject(); // TODO: error message
                });

                return def.promise();
            };


            this.moveObject = function(type, id, new_ws, new_id) {
                var def = $.Deferred();

                var params = {
                    source_workspace: this.id,
                    type: type,
                    source_id: id,
                    new_workspace: new_ws,
                    new_id: new_id
                };
                console.log(params)

                if (user) {
                    params.auth = user.token;
                }

                service.move_object(params).done(function() {
                    def.resolve(self);
                }).fail(function() {
                    def.reject(); // TODO: error message
                });

                return def.promise();
            };

            this.saveObject = function() {}; // TODO: implement
            this.revertObject = function() {};  // TODO: implement

            if (! (this.isOwned || this.user_permission === 'a')) {
                return;
            }

            this.getPermissions = function() {
                var def = $.Deferred();

                var params = {
                    workspace: self.id
                };

                if (user) {
                    params.auth = user.token;
                }
            
                service.get_workspacepermissions(params).done(function(perms) {
                    // remove 'default', and self from perms
                    delete perms['default'];
                    if (user) {
                        delete perms[user.user_id];
                    } else {
                        delete perms['public'];
                    }

                    self.permissions = perms;
                    def.resolve(self);
                }).fail(function() {
                    def.reject(); // TODO: better error
                });

                return def.promise();
            };

            this.setGlobalPermission = function(permission) {
                var def = $.Deferred();

                if (! validatePermission(permission)) {
                    def.reject(); // TODO: error message
                    return def.promise();
                }

                var params = {
                    workspace: self.id,
                    new_permission: permission
                };

                if (user) {
                    params.auth = user.token;
                }

                service.set_global_workspace_permissions(params).done(function() {
                    self.global_permission = permission;
                    def.resolve(self);
                }).fail(function() {
                    def.reject(); // TODO: error messagef
                });

                return def.promise();
            };

            this.setWorkspacePermissions = function(userPerms) {
                var def = $.Deferred();

                var perms = {
                    n: [],
                    r: [],
                    w: [],
                    a: []
                };

                // check for invalid perm types
                var error = false;
                $.each(userPerms, function(u,v) {
                    if (! validatePermission(v)) {
                        error = true;
                    }
                });

                if (error) {
                    def.reject(); // TODO: error message
                    return def.promise();
                }

                // check if any user has been removed (if yes, set perm to 'n')
                $.each(self.permissions, function(u,v) {
                    if (userPerms[u] === undefined) {
                        perms.n.push(u);
                    }
                });

                // check for new users and changed ones
                $.each(userPerms, function(u,v) {
                    if (v !== self.permissions[u]) {
                        perms[v].push(u);
                    }
                });

                // make separate calls for each permission value
                var promises = [];
                $.each(perms, function(perm, users) {
                    if (users.length === 0) {
                        return;
                    }

                    var params = {
                        workspace: self.id,
                        new_permission: perm,
                        users: users
                    };

                    if (user) {
                        params.auth = user.token;
                    }

                    var p = service.set_workspace_permissions(params);
                    promises.push(p);
                });

                $.when.apply($, promises).done(function() {
                    self.permissions = userPerms;
                    def.resolve(self);
                }).fail(function() {
                    def.reject(); // TODO: error message
                });

                return def.promise();
            };

            if (!this.isOwned) {
                return;
            }

            this.delete = function() {
                var def = $.Deferred();

                var params = {
                    workspace: self.id
                };

                if (user) {
                    params.auth = user.token;
                }

                service.delete_workspace(params).done(function() {
                    def.resolve(self);
                }).fail(function() {
                    def.reject(); // TODO: error message
                });

                return def.promise();
            };
        }

        function WorkspaceObject(data) {
            var dataFields = ['id', 'type', 'moddate', 'instance', 'command', 'lastmodifier', 'owner', 'workspace', 'ref', 'chsum', 'metadata'];

            for (var i=0; i<dataFields.length; i++) {
                this[dataFields[i]] = data[i];
            }
        }
    }

