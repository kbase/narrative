define([
    'bluebird',
    'jquery'
], function(Promise, $) {
    'use strict';

    /**
     * Like other apis...
     * url = (base) endpoint url from config
     * auth = { token: token, userId: user id (optional) }
     */
    var FileStaging = function(url, userId, auth) {
        var token = auth.token;
        if (!token) {
            throw new Error('auth token required!');
        }
        if (!userId) {
            throw new Error('valid user id required!');
        }
        if (!url.endsWith('/')) {
            url = url + '/';
        }
        var rootPath = 'data/bulk/';

        /**
         * @method
         * @public
         * Lists files in the user's directory. A given subdirectory can be
         * used to list files there.
         */
        var listFiles = function(directory, deep) {
            var path = 'list/' + userId;
            if (directory) {
                if (!directory.startsWith('/')) {
                    path += '/';
                }
                path += directory;
            }
            return makeFtpCall('GET', path);
        };

        var searchFiles = function(term) {
            var path = 'search/' + encodeURIComponent(term);
            return makeFtpCall('GET', path)
                .then(function(files) {
                    files.forEach(function(file) {
                        file.subdir = file.path.slice(rootPath.length, -file.name.length);
                    });
                    return files;
                });
        };

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
            listFiles: listFiles,
            searchFiles: searchFiles
        };
    };

    return FileStaging;
});
