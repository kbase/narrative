'use strict';

const http = require('http');
const Url = require('url');
const Path = require('path');
const FS = require('fs');

const App = require('./narrativeapp').NarrativeApp;
App.init();
const Utils = require('./utils');
const HttpError = Utils.HttpError;
const Auth = require('./auth').Auth;
const Admin = require('./admin').Admin.init({app: App});

const httpServer = http.createServer();

console.log('Starting Narrative Server...');

function extensionToMime(ext) {
    const map = {
        html: 'text/html',
        js: 'application/javascript',
        css: 'text/stylesheet'
    }
    return map[ext] || 'text/plain';
}

httpServer.on('request', (req, res) => {
    try {
        const url = Url.parse(req.url, true);
        let matched;
        if ( (matched = url.path.match(/\/narrative(:?$|\/(.*))/)) ) {
            App.getUserContainer(req, (userContainer) => {
                userContainer.proxy.web(req, res, {
                    toProxy: '/' + matched[1]
                }, (err) => {
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
            const filePath = './htdocs' + url.path;
            FS.stat(filePath, (err, stats) => {
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

httpServer.on('upgrade', (req, socket, head) => {
    App.getUserContainer(req, (userContainer) => {
        userContainer.proxy.ws(req, socket, head, {
        }, (err) => {
            console.log(err);
        });
    });
});

httpServer.listen(8083);
