'use strict';

var http = require('http');
var httpProxy = require('http-proxy');
var Docker = require('dockerode');
var Auth = require('./auth').Auth;

/*
 * Docker control
 * The narrative associates docker instances with user ids. 
 * It does this by dissassembling the auth token.
 * [ leave aside commentary about that for later ]
 * In this pass, we are simulating that with a simple rest interface
 * /narrative/<username>
 * where <username> is the username associated with the docker.
 */

module.exports.NarrativeApp = Object.create({}, {
    init: {
        value: function () {
            this.containers = {};
            return this;
        }
    },
    repositoryImage: {
        value: 'kbase/narrative'
    },
    repositoryVersion: {
        value: 'latest'
    },
    privatePort: {
        value: 8888
    },
    dockerBaseConfig: {
        value: function () {
            return {
                Hostname: '',
                User: 'nobody',
                Memory: 0,
                MemorySwap: 0,
                AttachStdin: false,
                AttachStdout: false,
                AttachStderr: false,
                PortSpecs: null,
                Privileged: false,
                Tty: false,
                OpenStdin: false,
                StdinOnce: false,
                Env: null,
                Cmd: ['/bin/bash'],
                Dns: null,
                Image: 'base',
                VolumesFrom: '',
                WorkingDir: '',
                Volumes: {
                    '/dev/log': []
                }
            };
        }
    },
    
    tryContainerService: {
        value: function (userContainer, done) {
            var start = new Date().getTime();
            var timeout = 10000;
            var fun = function () {
                http.get(userContainer.target + '/narrative/static/style/style.min.css', function (res) {
                    userContainer.status = 'ready';
                    done();
                }).on('error', function (err) {
                    var elapsed = (new Date().getTime()) - start;
                    console.log('try container startup loop ' + elapsed);
                    if (err.code === 'ECONNRESET') {
                        if (elapsed > timeout) {
                            console.log('Timedout waiting for container to be ready');
                            userContainer.status = 'timedout';
                        } else {
                            setTimeout(function () {
                                fun();
                            }, 1000);
                        }
                    } else {
                        userContainer.status = 'unexpectederror';
                        console.log('Unexpected error from container service.');
                        console.log(err);
                    }
                });
            };
            fun();
        }
    },
    tryUntil: {
        value: function (test, done, err, timeout) {
            var start = new Date().getTime();
            var fun = function () {
                if (test()) {
                    done();
                } else {
                    var elapsed = (new Date()).getTime() - start;
                    console.log('try loop ' + elapsed);
                    if (elapsed > timeout) {
                        err();
                    } else {
                        setTimeout(function () { 
                           fun();
                        }, 1000);
                    }
                }
            };
            fun();
        }
    },
    wrapPage: {
        value: function (content) {
            return '<!DOCTYPE html><html><head><title>TITLE</title></head><body>'+content+'</body></html>';
        }
    },
    
    getContainers: {
        value: function (done) {
            var docker = new Docker({socketPath: '/var/run/docker.sock'});
            var usernames = Object.keys(this.containers);
            var that = this;
            var containers = usernames.map(function (username) {
                var userContainer = that.containers[username];
                return {
                    username: username,
                    id: userContainer.id,
                    createdAt: userContainer.createdAt,
                    accessedAt: userContainer.lastAccessedAt,
                    accessCount: userContainer.accessCount,
                    status: userContainer.status,
                    docker: null
                };
            });
            
            containers.forEach(function (c) {
                var container = docker.getContainer(c.id);
                container.inspect(function (err, data) {
                    c.docker = {};
                    if (err) {
                        c.docker.stats = 'ERROR';
                        c.docker.error = err;
                    } else {
                        c.docker.inspection = data;
                    }
                    if (containers.reduce(function (red, c) {
                        if (!c.docker) {
                            return false;
                        }
                        return red;                        
                    }, true)) {
                        done(containers);
                    }
                });
            });
        }
    },
    
    getUserContainer: {
        value: function (req, done) {
            var userId = Auth.getSession(req);
            var that = this;
            var docker = new Docker({socketPath: '/var/run/docker.sock'});
            var userContainer = this.containers[userId];
            if (userContainer) {
                this.tryUntil(function () {
                    return (userContainer.status === 'ready');
                }, function () {
                    userContainer.lastAccessedAt = new Date();
                    userContainer.accessCount += 1;
                    return done(userContainer);
                }, function () {
                    console.log('Timed out waiting for container to be ready.');
                    return null;
                }, 10000);
                return;
            }
            userContainer = {
                createdAt: new Date(),
                lastAccessedAt: new Date(),
                status: 'requesting',
                accessCount: 0
            };
            this.containers[userId] = userContainer;

            var dockerConfig = this.dockerBaseConfig();
            dockerConfig.Image = this.repositoryImage + ':' + this.repositoryVersion;
            dockerConfig.PortSpecs = [this.privatePort + ''];
            console.log('Creating container for ' + userId + '...');
            docker.createContainer(dockerConfig, function (err, container) {
                if (err) {
                    throw new Error('ERROR creating docker container');
                    userContainer.status = 'error';
                }
                container.defaultOptions.start.PublishAllPorts = true;
                container.start(function (err, data) {
                    if (err) {
                        throw new Error('ERROR starting docker container');
                        return done(null);
                    }
                    container.inspect(function (err, data) {
                        if (err) {
                            throw new Error('ERROR inspecting container');
                            return done(null);
                        }
                        var thePort = data.NetworkSettings.Ports['8888/tcp'][0].HostPort;
                        var target = 'http://127.0.0.1:' + thePort;
                        userContainer.id = container.id;
                        userContainer.port = thePort;
                        userContainer.status = 'starting';
                        userContainer.target = target;
                        userContainer.proxy = httpProxy.createProxyServer({
                            target: target,
                            ws: true,
                            xfwd: true
                        });
                        that.tryContainerService(userContainer, function () {
                            return done(userContainer);
                        });
                    });
                });

            });
        }
    },    
    webProxy: {
        value: function (req, res) {

        }
    }
});
