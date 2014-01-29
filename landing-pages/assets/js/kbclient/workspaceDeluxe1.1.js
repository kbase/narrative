

function Workspace(url, auth, auth_cb) {

    this.url = url;
    var _url = url;
    var deprecationWarningSent = false;

    function deprecationWarning() {
        if (!deprecationWarningSent) {
            deprecationWarningSent = true;
            if (!window.console) return;
            console.log(
                "DEPRECATION WARNING: '*_async' method names will be removed",
                "in a future version. Please use the identical methods without",
                "the'_async' suffix.");
        }
    }

    if (typeof(_url) != "string" || _url.length == 0) {
        _url = "http://kbase.us/services/ws/";
    }
    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;


    this.create_workspace = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.create_workspace",
        [params], 1, _callback, _errorCallback);
};

    this.create_workspace_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.create_workspace", [params], 1, _callback, _error_callback);
    };

    this.clone_workspace = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.clone_workspace",
        [params], 1, _callback, _errorCallback);
};

    this.clone_workspace_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.clone_workspace", [params], 1, _callback, _error_callback);
    };

    this.lock_workspace = function (wsi, _callback, _errorCallback) {
    return json_call_ajax("Workspace.lock_workspace",
        [wsi], 1, _callback, _errorCallback);
};

    this.lock_workspace_async = function (wsi, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.lock_workspace", [wsi], 1, _callback, _error_callback);
    };

    this.get_workspacemeta = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.get_workspacemeta",
        [params], 1, _callback, _errorCallback);
};

    this.get_workspacemeta_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.get_workspacemeta", [params], 1, _callback, _error_callback);
    };

    this.get_workspace_info = function (wsi, _callback, _errorCallback) {
    return json_call_ajax("Workspace.get_workspace_info",
        [wsi], 1, _callback, _errorCallback);
};

    this.get_workspace_info_async = function (wsi, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.get_workspace_info", [wsi], 1, _callback, _error_callback);
    };

    this.get_workspace_description = function (wsi, _callback, _errorCallback) {
    return json_call_ajax("Workspace.get_workspace_description",
        [wsi], 1, _callback, _errorCallback);
};

    this.get_workspace_description_async = function (wsi, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.get_workspace_description", [wsi], 1, _callback, _error_callback);
    };

    this.set_permissions = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.set_permissions",
        [params], 0, _callback, _errorCallback);
};

    this.set_permissions_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.set_permissions", [params], 0, _callback, _error_callback);
    };

    this.set_global_permission = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.set_global_permission",
        [params], 0, _callback, _errorCallback);
};

    this.set_global_permission_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.set_global_permission", [params], 0, _callback, _error_callback);
    };

    this.set_workspace_description = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.set_workspace_description",
        [params], 0, _callback, _errorCallback);
};

    this.set_workspace_description_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.set_workspace_description", [params], 0, _callback, _error_callback);
    };

    this.get_permissions = function (wsi, _callback, _errorCallback) {
    return json_call_ajax("Workspace.get_permissions",
        [wsi], 1, _callback, _errorCallback);
};

    this.get_permissions_async = function (wsi, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.get_permissions", [wsi], 1, _callback, _error_callback);
    };

    this.save_object = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.save_object",
        [params], 1, _callback, _errorCallback);
};

    this.save_object_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.save_object", [params], 1, _callback, _error_callback);
    };

    this.save_objects = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.save_objects",
        [params], 1, _callback, _errorCallback);
};

    this.save_objects_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.save_objects", [params], 1, _callback, _error_callback);
    };

    this.get_object = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.get_object",
        [params], 1, _callback, _errorCallback);
};

    this.get_object_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.get_object", [params], 1, _callback, _error_callback);
    };

    this.get_objects = function (object_ids, _callback, _errorCallback) {
    return json_call_ajax("Workspace.get_objects",
        [object_ids], 1, _callback, _errorCallback);
};

    this.get_objects_async = function (object_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.get_objects", [object_ids], 1, _callback, _error_callback);
    };

    this.get_object_subset = function (sub_object_ids, _callback, _errorCallback) {
    return json_call_ajax("Workspace.get_object_subset",
        [sub_object_ids], 1, _callback, _errorCallback);
};

    this.get_object_subset_async = function (sub_object_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.get_object_subset", [sub_object_ids], 1, _callback, _error_callback);
    };

    this.get_object_history = function (object, _callback, _errorCallback) {
    return json_call_ajax("Workspace.get_object_history",
        [object], 1, _callback, _errorCallback);
};

    this.get_object_history_async = function (object, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.get_object_history", [object], 1, _callback, _error_callback);
    };

    this.list_referencing_objects = function (object_ids, _callback, _errorCallback) {
    return json_call_ajax("Workspace.list_referencing_objects",
        [object_ids], 1, _callback, _errorCallback);
};

    this.list_referencing_objects_async = function (object_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.list_referencing_objects", [object_ids], 1, _callback, _error_callback);
    };

    this.list_workspaces = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.list_workspaces",
        [params], 1, _callback, _errorCallback);
};

    this.list_workspaces_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.list_workspaces", [params], 1, _callback, _error_callback);
    };

    this.list_workspace_info = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.list_workspace_info",
        [params], 1, _callback, _errorCallback);
};

    this.list_workspace_info_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.list_workspace_info", [params], 1, _callback, _error_callback);
    };

    this.list_workspace_objects = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.list_workspace_objects",
        [params], 1, _callback, _errorCallback);
};

    this.list_workspace_objects_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.list_workspace_objects", [params], 1, _callback, _error_callback);
    };

    this.list_objects = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.list_objects",
        [params], 1, _callback, _errorCallback);
};

    this.list_objects_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.list_objects", [params], 1, _callback, _error_callback);
    };

    this.get_objectmeta = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.get_objectmeta",
        [params], 1, _callback, _errorCallback);
};

    this.get_objectmeta_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.get_objectmeta", [params], 1, _callback, _error_callback);
    };

    this.get_object_info = function (object_ids, includeMetadata, _callback, _errorCallback) {
    return json_call_ajax("Workspace.get_object_info",
        [object_ids, includeMetadata], 1, _callback, _errorCallback);
};

    this.get_object_info_async = function (object_ids, includeMetadata, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.get_object_info", [object_ids, includeMetadata], 1, _callback, _error_callback);
    };

    this.rename_workspace = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.rename_workspace",
        [params], 1, _callback, _errorCallback);
};

    this.rename_workspace_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.rename_workspace", [params], 1, _callback, _error_callback);
    };

    this.rename_object = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.rename_object",
        [params], 1, _callback, _errorCallback);
};

    this.rename_object_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.rename_object", [params], 1, _callback, _error_callback);
    };

    this.copy_object = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.copy_object",
        [params], 1, _callback, _errorCallback);
};

    this.copy_object_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.copy_object", [params], 1, _callback, _error_callback);
    };

    this.revert_object = function (object, _callback, _errorCallback) {
    return json_call_ajax("Workspace.revert_object",
        [object], 1, _callback, _errorCallback);
};

    this.revert_object_async = function (object, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.revert_object", [object], 1, _callback, _error_callback);
    };

    this.hide_objects = function (object_ids, _callback, _errorCallback) {
    return json_call_ajax("Workspace.hide_objects",
        [object_ids], 0, _callback, _errorCallback);
};

    this.hide_objects_async = function (object_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.hide_objects", [object_ids], 0, _callback, _error_callback);
    };

    this.unhide_objects = function (object_ids, _callback, _errorCallback) {
    return json_call_ajax("Workspace.unhide_objects",
        [object_ids], 0, _callback, _errorCallback);
};

    this.unhide_objects_async = function (object_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.unhide_objects", [object_ids], 0, _callback, _error_callback);
    };

    this.delete_objects = function (object_ids, _callback, _errorCallback) {
    return json_call_ajax("Workspace.delete_objects",
        [object_ids], 0, _callback, _errorCallback);
};

    this.delete_objects_async = function (object_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.delete_objects", [object_ids], 0, _callback, _error_callback);
    };

    this.undelete_objects = function (object_ids, _callback, _errorCallback) {
    return json_call_ajax("Workspace.undelete_objects",
        [object_ids], 0, _callback, _errorCallback);
};

    this.undelete_objects_async = function (object_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.undelete_objects", [object_ids], 0, _callback, _error_callback);
    };

    this.delete_workspace = function (wsi, _callback, _errorCallback) {
    return json_call_ajax("Workspace.delete_workspace",
        [wsi], 0, _callback, _errorCallback);
};

    this.delete_workspace_async = function (wsi, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.delete_workspace", [wsi], 0, _callback, _error_callback);
    };

    this.undelete_workspace = function (wsi, _callback, _errorCallback) {
    return json_call_ajax("Workspace.undelete_workspace",
        [wsi], 0, _callback, _errorCallback);
};

    this.undelete_workspace_async = function (wsi, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.undelete_workspace", [wsi], 0, _callback, _error_callback);
    };

    this.request_module_ownership = function (mod, _callback, _errorCallback) {
    return json_call_ajax("Workspace.request_module_ownership",
        [mod], 0, _callback, _errorCallback);
};

    this.request_module_ownership_async = function (mod, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.request_module_ownership", [mod], 0, _callback, _error_callback);
    };

    this.register_typespec = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.register_typespec",
        [params], 1, _callback, _errorCallback);
};

    this.register_typespec_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.register_typespec", [params], 1, _callback, _error_callback);
    };

    this.register_typespec_copy = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.register_typespec_copy",
        [params], 1, _callback, _errorCallback);
};

    this.register_typespec_copy_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.register_typespec_copy", [params], 1, _callback, _error_callback);
    };

    this.release_module = function (mod, _callback, _errorCallback) {
    return json_call_ajax("Workspace.release_module",
        [mod], 1, _callback, _errorCallback);
};

    this.release_module_async = function (mod, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.release_module", [mod], 1, _callback, _error_callback);
    };

    this.list_modules = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.list_modules",
        [params], 1, _callback, _errorCallback);
};

    this.list_modules_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.list_modules", [params], 1, _callback, _error_callback);
    };

    this.list_module_versions = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.list_module_versions",
        [params], 1, _callback, _errorCallback);
};

    this.list_module_versions_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.list_module_versions", [params], 1, _callback, _error_callback);
    };

    this.get_module_info = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.get_module_info",
        [params], 1, _callback, _errorCallback);
};

    this.get_module_info_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.get_module_info", [params], 1, _callback, _error_callback);
    };

    this.get_jsonschema = function (type, _callback, _errorCallback) {
    return json_call_ajax("Workspace.get_jsonschema",
        [type], 1, _callback, _errorCallback);
};

    this.get_jsonschema_async = function (type, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.get_jsonschema", [type], 1, _callback, _error_callback);
    };

    this.translate_from_MD5_types = function (md5_types, _callback, _errorCallback) {
    return json_call_ajax("Workspace.translate_from_MD5_types",
        [md5_types], 1, _callback, _errorCallback);
};

    this.translate_from_MD5_types_async = function (md5_types, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.translate_from_MD5_types", [md5_types], 1, _callback, _error_callback);
    };

    this.translate_to_MD5_types = function (sem_types, _callback, _errorCallback) {
    return json_call_ajax("Workspace.translate_to_MD5_types",
        [sem_types], 1, _callback, _errorCallback);
};

    this.translate_to_MD5_types_async = function (sem_types, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.translate_to_MD5_types", [sem_types], 1, _callback, _error_callback);
    };

    this.get_type_info = function (type, _callback, _errorCallback) {
    return json_call_ajax("Workspace.get_type_info",
        [type], 1, _callback, _errorCallback);
};

    this.get_type_info_async = function (type, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.get_type_info", [type], 1, _callback, _error_callback);
    };

    this.get_func_info = function (func, _callback, _errorCallback) {
    return json_call_ajax("Workspace.get_func_info",
        [func], 1, _callback, _errorCallback);
};

    this.get_func_info_async = function (func, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.get_func_info", [func], 1, _callback, _error_callback);
    };

    this.grant_module_ownership = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.grant_module_ownership",
        [params], 0, _callback, _errorCallback);
};

    this.grant_module_ownership_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.grant_module_ownership", [params], 0, _callback, _error_callback);
    };

    this.remove_module_ownership = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.remove_module_ownership",
        [params], 0, _callback, _errorCallback);
};

    this.remove_module_ownership_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.remove_module_ownership", [params], 0, _callback, _error_callback);
    };

    this.administer = function (command, _callback, _errorCallback) {
    return json_call_ajax("Workspace.administer",
        [command], 1, _callback, _errorCallback);
};

    this.administer_async = function (command, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.administer", [command], 1, _callback, _error_callback);
    };
 

    /*
     * JSON call using jQuery method.
     */
    function json_call_ajax(method, params, numRets, callback, errorCallback) {
        var deferred = $.Deferred();

        if (typeof callback === 'function') {
           deferred.done(callback);
        }

        if (typeof errorCallback === 'function') {
           deferred.fail(errorCallback);
        }

        var rpc = {
            params : params,
            method : method,
            version: "1.1",
            id: String(Math.random()).slice(2),
        };

        var beforeSend = null;
        var token = (_auth_cb && typeof _auth_cb === 'function') ? _auth_cb()
            : (_auth.token ? _auth.token : null);
        if (token != null) {
            beforeSend = function (xhr) {
                xhr.setRequestHeader("Authorization", token);
            }
        }

        var xhr = jQuery.ajax({
            url: _url,
            dataType: "text",
            type: 'POST',
            processData: false,
            data: JSON.stringify(rpc),
            beforeSend: beforeSend,
            success: function (data, status, xhr) {
                var result;
                try {
                    var resp = JSON.parse(data);
                    result = (numRets === 1 ? resp.result[0] : resp.result);
                } catch (err) {
                    deferred.reject({
                        status: 503,
                        error: err,
                        url: _url,
                        resp: data
                    });
                    return;
                }
                deferred.resolve(result);
            },
            error: function (xhr, textStatus, errorThrown) {
                var error;
                if (xhr.responseText) {
                    try {
                        var resp = JSON.parse(xhr.responseText);
                        error = resp.error;
                    } catch (err) { // Not JSON
                        error = "Unknown error - " + xhr.responseText;
                    }
                } else {
                    error = "Unknown Error";
                }
                deferred.reject({
                    status: 500,
                    error: error
                });
            }
        });

        var promise = deferred.promise();
        promise.xhr = xhr;
        return promise;
    }
}


