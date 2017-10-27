define([
    'bluebird',
    'jquery',
    'narrativeConfig'
], function(Promise, $, Config) {
    'use strict';

    /**
     * Like other apis...
     * url = (base) endpoint url from config
     * auth = { token: token, userId: user id (optional) }
     */
    var FileStaging = function(url, userId, auth) {
        if (!auth || !auth.token) {
            throw new Error('auth token required!');
        }
        var token = auth.token;
        if (!userId) {
            throw new Error('valid user id required!');
        }
        if (url[url.length-1] !== '/') {
            url = url + '/';
        }
        var rootPath = Config.url('ftp_api_root');

        /**
         * @method
         * @public
         * Lists files in the given directory path.
         * options -
         *   userId {boolean|string} - if true, prepend with the current userId (if a string, use that string)
         *   deep {boolean} - if true, list deeply by getting the whole file tree from that point
         *
         * So now there's options. Our FTP service expects to see the userId at the front of the path.
         * Other consumers of this (for other reasons) want to include that in the path submitted to
         * this client. Optionally, it can be separated and set as a boolean. So these all do the
         * same search (assuming the client was instantiated with user wjriehl):
         *
         * list('wjriehl/some_dir')
         * list('some_dir', { userId: 'wjriehl' })
         * list('some_dir', { userId: true })
         *
         * It also tries to be smart about constructing a path with slashes in the right place.
         * All of these should reduce down to a GET call against /list/wjriehl/some_dir:
         *
         * list('/wjriehl/some_dir')
         * list('some_dir', {userId: true})
         * list('/some_dir', {userId: true})
         * list('wjriehl/some_dir/')
         *
         * Note that if options.userId is set, it will ALWAYS be used, even if redundant. You
         * never know if a crazy user made a top-level subdirectory with their own username in it.
         */
        var list = function(directory, options) {
            options = options || {};
            var path = 'list/';
            if (options.userId) {
                if (typeof options.userId === 'boolean') {
                    path += userId;
                }
                else if (typeof options.userId === 'string') {
                    path += options.userId;
                }
                if (!path.endsWith('/')) {
                    path += '/';
                }
            }
            if (directory) {
                if (directory[0] === '/') {
                    directory = directory.substring(1);
                }
                path += directory;
            }
            return makeFtpCall('GET', path)
                .catch(function(error) {
                    return [];
                });
        };

        /**
         * @method
         * @public
         */
        var search = function(term) {
            var path = 'search/' + encodeURIComponent(term);
            return makeFtpCall('GET', path)
                .then(function(files) {
                    files.forEach(function(file) {
                        file.subdir = file.path.slice(rootPath.length, -file.name.length);
                    });
                    return files;
                });
        };

        /**
         * Wraps up the actual AJAX REST call. Given a method and path, it will populate headers
         * as needed, then return a Promise with the call.
         */
        var makeFtpCall = function(method, path) {
            return Promise.resolve($.ajax({
                url: url + path,
                method: method,
                headers: {
                    Authorization: token
                }
            }));
        };

        return {
            list: list,
            search: search
        };
    };

    return FileStaging;
});
