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
         * Lists files in the user's directory. A given subdirectory can be
         * used to list files there.
         */
        var list = function(directory, deep) {
            var path = 'list/' + userId;
            if (directory) {
                if (directory[0] !== '/') {
                    path += '/';
                }
                path += directory;
            }
            return makeFtpCall('GET', path);
        };

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
