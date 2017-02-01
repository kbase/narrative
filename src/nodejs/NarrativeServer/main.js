'use strict';

var http = require('http');
var Url = require('url');
var Path = require('path');
var FS = require('fs');

var App = require('./narrativeapp').NarrativeApp;
App.init();
var Utils = require('./utils');
var HttpError = Utils.HttpError;
var Auth = require('./auth').Auth;
var Admin = require('./admin').Admin.init({app: App});

var httpServer = http.createServer();

console.log('Starting Narrative Server...');

function extensionToMime(ext) {
    var map = {
        html: 'text/html',
        js: 'application/javascript',
        css: 'text/stylesheet'
    }
    return map[ext] || 'text/plain';
}

httpServer.on('request', function (req, res) {
    try {
        var url = Url.parse(req.url, true);
        var matched;
        if ( (matched = url.path.match(/\/narrative(:?$|\/(.*))/)) ) {
            App.getUserContainer(req, function (userContainer) {
                userContainer.proxy.web(req, res, {
                    toProxy: '/' + matched[1]
                }, function (err) {
                    console.log('Error proxying');
                    console.log(err);
                    console.log(req.url);
                });
            });
        } else if (url.path.match(/\/login/)) {
            Auth.renderLogin(req, res, url);
        } else if (url.path.match(/\/signin/)) {
            Auth.handleSignin(req, res, url);
        } else if ( (matched = url.path.match(/\/admin\/(.*)/)) ) {
            Admin.route(req, res, url, matched[1]);
        } else {
            var filePath = './htdocs' + url.path;
            FS.stat(filePath, function (err, stats) {
                console.log(filePath);
                if (err) {
                    res.statusCode = 404;
                    res.statusMessage = 'Not found';
                    res.setHeader('Content-Type', 'text/plain');
                    res.write('Path not found: ' + url.path);
                    res.end();
                    return;
                }
                if (!stats.isFile()) {
                    res.statusCode = 404;
                    res.statusMessage = 'Not found';
                    res.setHeader('Content-Type', 'text/plain');
                    res.write('Path not file: ' + url.path);
                    res.end();
                    return;
                }
                res.statusCode = 200;
                res.setHeader('Content-Type', extensionToMime(Path.extname(url.path).substr(1)));
                FS.createReadStream(filePath).pipe(res);
                return;
            });
        } 
    } catch (err) {
        if (err.isHttpError) {
            switch (err.code) {
                case 401:
                    res.statusCode = 302;
                    var location = '/login?return_uri=' + encodeURIComponent(req.url);
                    res.setHeader('Location', location);
                    res.end();
                    handled = true;
                    break;
                default:
                    res.statusCode = err.code;
                    res.statusMessage = err.message;
                    res.setHeader('Content-Type', 'text/plain');            
                    res.end(err.content || '');
            }
             
        } else {
            res.statusCode = 500;
            res.statusMessage = 'Server error';
            res.setHeader('Content-Type', 'text/plain');
            console.log(err);
            res.end('Sorry, server error.');
        }
    }
        
});

httpServer.on('upgrade', function (req, socket, head) {
    App.getUserContainer(req, function (userContainer) {
        userContainer.proxy.ws(req, socket, head, {
        }, function (err) {
            console.log(err);
        });
    });
});

httpServer.listen(8083);
