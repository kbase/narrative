'use strict';

const http = require('http');
const httpProxy = require('http-proxy');
const Docker = require('dockerode');
const Auth = require('./auth').Auth;

/*
 * Docker control
 * The narrative associates docker instances with user ids.
 * It does this by dissassembling the auth token.
 * [ leave aside commentary about that for later ]
 * In this pass, we are simulating that with a simple rest interface
 * /narrative/<username>
 * where <username> is the username associated with the docker.
 */

module.exports.NarrativeApp = Object.create(
    {},
    {
        init: {
            value: function () {
                this.containers = {};
                return this;
            },
        },
        repositoryImage: {
            value: 'kbase/narrative',
        },
        repositoryVersion: {
            value: 'latest',
        },
        privatePort: {
            value: 8888,
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
                        '/dev/log': [],
                    },
                };
            },
        },

        tryContainerService: {
            value: function (userContainer, done) {
                const start = new Date().getTime();
                const timeout = 10000;
                var fun = function () {
                    http.get(
                        userContainer.target + '/narrative/static/style/style.min.css',
                        (res) => {
                            userContainer.status = 'ready';
                            done();
                        }
                    ).on('error', (err) => {
                        const elapsed = new Date().getTime() - start;
                        console.log('try container startup loop ' + elapsed);
                        if (err.code === 'ECONNRESET') {
                            if (elapsed > timeout) {
                                console.log('Timedout waiting for container to be ready');
                                userContainer.status = 'timedout';
                            } else {
                                setTimeout(() => {
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
            },
        },
        tryUntil: {
            value: function (test, done, err, timeout) {
                const start = new Date().getTime();
                var fun = function () {
                    if (test()) {
                        done();
                    } else {
                        const elapsed = new Date().getTime() - start;
                        console.log('try loop ' + elapsed);
                        if (elapsed > timeout) {
                            err();
                        } else {
                            setTimeout(() => {
                                fun();
                            }, 1000);
                        }
                    }
                };
                fun();
            },
        },
        wrapPage: {
            value: function (content) {
                return (
                    '<!DOCTYPE html><html><head><title>TITLE</title></head><body>' +
                    content +
                    '</body></html>'
                );
            },
        },

        getContainers: {
            value: function (done) {
                const docker = new Docker({ socketPath: '/var/run/docker.sock' });
                const usernames = Object.keys(this.containers);
                const that = this;
                const containers = usernames.map((username) => {
                    const userContainer = that.containers[username];
                    return {
                        username: username,
                        id: userContainer.id,
                        createdAt: userContainer.createdAt,
                        accessedAt: userContainer.lastAccessedAt,
                        accessCount: userContainer.accessCount,
                        status: userContainer.status,
                        docker: null,
                    };
                });

                containers.forEach((c) => {
                    const container = docker.getContainer(c.id);
                    container.inspect((err, data) => {
                        c.docker = {};
                        if (err) {
                            c.docker.stats = 'ERROR';
                            c.docker.error = err;
                        } else {
                            c.docker.inspection = data;
                        }
                        if (
                            containers.reduce((red, c) => {
                                if (!c.docker) {
                                    return false;
                                }
                                return red;
                            }, true)
                        ) {
                            done(containers);
                        }
                    });
                });
            },
        },

        getUserContainer: {
            value: function (req, done) {
                const userId = Auth.getSession(req);
                const that = this;
                const docker = new Docker({ socketPath: '/var/run/docker.sock' });
                let userContainer = this.containers[userId];
                if (userContainer) {
                    this.tryUntil(
                        () => {
                            return userContainer.status === 'ready';
                        },
                        () => {
                            userContainer.lastAccessedAt = new Date();
                            userContainer.accessCount += 1;
                            return done(userContainer);
                        },
                        () => {
                            console.log('Timed out waiting for container to be ready.');
                            return null;
                        },
                        10000
                    );
                    return;
                }
                userContainer = {
                    createdAt: new Date(),
                    lastAccessedAt: new Date(),
                    status: 'requesting',
                    accessCount: 0,
                };
                this.containers[userId] = userContainer;

                const dockerConfig = this.dockerBaseConfig();
                dockerConfig.Image = this.repositoryImage + ':' + this.repositoryVersion;
                dockerConfig.PortSpecs = [this.privatePort + ''];
                console.log('Creating container for ' + userId + '...');
                docker.createContainer(dockerConfig, (err, container) => {
                    if (err) {
                        throw new Error('ERROR creating docker container');
                        userContainer.status = 'error';
                    }
                    container.defaultOptions.start.PublishAllPorts = true;
                    container.start((err, data) => {
                        if (err) {
                            throw new Error('ERROR starting docker container');
                            return done(null);
                        }
                        container.inspect((err, data) => {
                            if (err) {
                                throw new Error('ERROR inspecting container');
                                return done(null);
                            }
                            const thePort = data.NetworkSettings.Ports['8888/tcp'][0].HostPort;
                            const target = 'http://127.0.0.1:' + thePort;
                            userContainer.id = container.id;
                            userContainer.port = thePort;
                            userContainer.status = 'starting';
                            userContainer.target = target;
                            userContainer.proxy = httpProxy.createProxyServer({
                                target: target,
                                ws: true,
                                xfwd: true,
                            });
                            that.tryContainerService(userContainer, () => {
                                return done(userContainer);
                            });
                        });
                    });
                });
            },
        },
        webProxy: {
            value: function (req, res) {},
        },
    }
);
