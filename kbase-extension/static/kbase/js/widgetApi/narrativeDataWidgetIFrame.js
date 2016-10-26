/*global define,require*/
/*jslint white:true,browser:true */
/*
 * Narrative Data Widget
 * 
 * Embodies a KBase data widget which can be safely displayed in a Narrative.
 * Handles
 * - fetching widget
 * - building runtime env
 * - insert widget
 * - load widget
 * - listen for widget events
 * - provide widget event implementation within the narrative.
 */
define([
    'bluebird',
    'runtimeManager',
    'messageManager',
    'narrativeConfig',
    // Use our locally defined widget service for protyping the iframe stuff, then merge that in
    'widgetService2'
], function (Promise, RuntimeManager, MessageManager, NarrativeConfig, WidgetService) {
    'use strict';
    function factory(config) {
        var widgetTitle = config.title,
            widgetParentNode = config.parent,
            authRequired = config.authRequired,
            narrativeConfig = NarrativeConfig.getConfig(),
            messageManager = MessageManager({
                root: window,
                name: 'parent'
            });

        function showErrorMessage(message) {
            widgetParentNode.innerHTML = '<div style="margin: 1em; padding: 1em; border: 2px red solid;"><h1>Error in ' + widgetTitle + '</h1><p>' + message + '</p></div>';
        }

        function runWidget(objectRefs, options) {
            return new Promise(function (resolve, reject) {
                try {
                    var runtimeManager = RuntimeManager.make({
                        cdnUrl: narrativeConfig.services.cdn.url
                    }),
                        // This runtime object is provided for the boot up of the widget invocation
                        // machinery, NOT running the widget.
                        // Note -- need to use the global require in order to generate additional require objects
                        // via require.config()
                        req = runtimeManager.getModuleLoader('0.1.1', require, '/narrative/widgetApi/kbase/js/widgetApi');

                    req([
                        //'kb_widget_service/widgetManager',
                        // 'yaml!./config.yml',
                        'kb_common/props',
                        'kb_common/session',
                        'kb_common/html',
                        'uuid'
                    ],
                        function (Props, Session, Html, Uuid) {
                            // just a little synchronous auth token business for now
                            function getAuthToken() {
                                var session = Session.make({cookieName: 'kbase_session'});
                                return session.getAuthToken();
                            }
                            function makeWidgetHostAdapter(objectRefs, options) {
                                var configProps = Props.make({data: NarrativeConfig.getConfig()});
                                return function (bus) {
                                    bus.subscribe('ready', function () {
                                        bus.publish('start', {
                                            objectRefs: objectRefs,
                                            options: options
                                        });
                                    });

                                    bus.subscribe('config', function (data) {
                                        return {
                                            value: configProps.getItem(data.property, data.defaultValue)
                                        };
                                    });

                                    bus.subscribe('authToken', function () {
                                        var token = getAuthToken();
                                        return {
                                            value: token
                                        };
                                    });

                                    bus.subscribe('error', function (data) {
                                        showErrorMessage(data.message);

                                    });
                                };
                            }
                            var waitingPartners = {};
                            function findWaiting(frameWindow) {
                                var keys = Object.keys(waitingPartners), i;
                                for (i = 0; i < keys.length; i += 1) {
                                    var key = keys[i], partner = waitingPartners[key];
                                    if (frameWindow === partner.window) {
                                        return partner;
                                    }
                                }
                            }
                            
                            function urlToHost(urlString) {
                                var url = new URL(urlString);
                                return url.protocol + '//' + url.host;
                            }
                            
                            function renderIFrameWidget(node, url, host) {
                                var div = Html.tag('div'),
                                    iframe = Html.tag('iframe'),
                                    iframeId = (new Uuid(4)).format(),
                                    iframeNodeId = 'frame_' + iframeId,
                                    iframeHost = urlToHost(url);
                                
                               
                                node.innerHTML = div({class: 'row'}, [
                                    div({class: 'col-md-12'}, [
                                        Html.makePanel({
                                            title: 'iFrame Remote Loading Example ' + iframeId,
                                            content: iframe({
                                                dataFrame: iframeNodeId,
                                                dataParams: encodeURIComponent(JSON.stringify({
                                                    parentHost: host,
                                                    frameId: 'frame_' + iframeId,
                                                    objectRef: '4079/2/1'
                                                })),
                                                style: {width: '100%', height: 'auto', border: '0px green dotted'},
                                                src: url})
                                        })
                                    ])
                                ]);
                                // Note that this listener needs to be effective before the iframe loads.
                                // This is not a problem since although the iframe will be present in the DOM 
                                // at this point in the code, the content will not have loaded yet.
                                waitingPartners[iframeId] = {
                                    name: iframeId,
                                    window: node.querySelector('[data-frame="'+iframeNodeId+'"]').contentWindow,
                                    host: iframeHost
                                };
                            }
                            messageManager.listen({
                                name: 'ready',
                                handler: function (message, event) {

                                    // Now we only add the parter after the initial handshake.

                                    // Do we have the partner?
                                    var source = event.source,
                                        waitingPartner = findWaiting(source);

                                    if (!waitingPartner) {
                                        console.error('Not a waiting parter ', source, waitingPartners);
                                        throw new Error('Not a waiting parter');
                                    }

                                    // frameId = source.frameElement.getAttribute('data-frame'),
                                    delete waitingPartners[waitingPartner.name];

                                    messageManager.addPartner({
                                        name: waitingPartner.name,
                                        window: source,
                                        host: waitingPartner.host
                                    });

                                    console.log('Sending to ' + waitingPartner.name);
                                    messageManager.send(waitingPartner.name, {
                                        name: 'start',
                                        config: {
                                            frameId: waitingPartner.name,                            
                                            host: 'http://localhost:8888'
                                        },
                                        params: {
                                            objectRef: '4079/2/1'
                                        }
                                    });
                                }
                            });
                            
                            messageManager.listen({
                                name: 'authStatus',
                                handler: function (message) {
                                    messageManager.send(message.from, {
                                        name: 'authStatus',
                                        id: message.id,
                                        auth: {
                                            token: getAuthToken()
                                        }
                                    });
                                }
                            });

                            messageManager.listen({
                                name: 'config',
                                handler: function (message) {
                                    var configProps = Props.make({data: NarrativeConfig.getConfig()});
                                    messageManager.send(message.from, {
                                        name: 'config',
                                        id: message.id,
                                        value: configProps.getItem(message.property, message.defaultValue)
                                    });
                                }
                            });

                            messageManager.listen({
                                name: 'rendered',
                                handler: function (message, event) {
                                    // adjust height of source window...
                                    console.log('rendering ...' + message.from);
                                    var height = message.height; // event.source.contentWindow.height;
                                    var iframe = document.querySelector('[data-frame="frame_' + message.from + '"]');
                                    iframe.style.height = height + 'px';
                                }
                            });
                            
                            /*
                             * Loading...
                             */
                            widgetParentNode.innerHTML = Html.loading('Loading widget');

                            /*
                             * Enforce preconditions
                             * This is handy for anything we can handle before we
                             * even get to the widget.
                             */
                            if (authRequired && !getAuthToken()) {
                                // All errors need to be thrown via reject with a real error object.
                                reject(new Error('This widget requires authorization'));
                                return;
                            }

                            /*
                             * This function creates a function which, given a pubsub bus object, creates
                             * the necessary hooks for implementing the interface.
                             */
                            
                            // use raw widget service for now.
                            var widgetService = WidgetService.make({
                                url: 'http://widget.kbase.us/wsvc'
                            });
                            var widget = widgetService.getWidget(config.package, config.version, config.widget);
                            if (!widget) {
                                throw new Error('Cannot find widget: ' + config.package + ', ' + config.version + ', ' + config.widget);
                            }
                            
//                            var widgetManager = WidgetManager.make({
//                                widgetServiceUrl: config.services.widget.url,
//                                cdnUrl: config.services.cdn.url
//                            });
//                            var widgetDiv = widgetManager.addWidget({
//                                package: packageName,
//                                version: packageVersion,
//                                widget: widgetName,
//                                panel: true,
//                                title: widgetTitle
//                            });

                            // The "widget" is provided as simple markup (string) with an id set and mapped 
                            // internally to the right widget invocation stuff.
                            renderIFrameWidget(widgetParentNode, widget.widget.url, 'http://localhost:8888');
                            
                            messageManager.listen({
                                name: 'ready',
                                handler: function (message, event) {

                                    // Now we only add the parter after the initial handshake.

                                    // Do we have the partner?
                                    var source = event.source,
                                        waitingPartner = findWaiting(source);

                                    if (!waitingPartner) {
                                        console.error('Not a waiting parter ', source, waitingPartners);
                                        throw new Error('Not a waiting parter');
                                    }

                                    // frameId = source.frameElement.getAttribute('data-frame'),
                                    delete waitingPartners[waitingPartner.name];

                                    messageManager.addPartner({
                                        name: waitingPartner.name,
                                        window: source,
                                        host: waitingPartner.host
                                    });

                                    console.log('Sending to ' + waitingPartner.name);
                                    messageManager.send(waitingPartner.name, {
                                        name: 'start',
                                        config: {
                                            frameId: waitingPartner.name,                            
                                            host: 'http://localhost:8080'
                                        },
                                        params: {
                                            objectRef: '4079/2/1'
                                        }
                                    });
                                }
                            });

                            // After the widget wrapper is placed into the dom, we can launch the widget.
//                            widgetManager.loadWidgets(makeWidgetHostAdapter(objectRefs, options))
//                                .then(function () {
//                                    resolve();
//                                })
//                                .catch(function (err) {
//                                    console.error('load widgets error', err);
//                                    reject(err);
//                                });
                        });
                } catch (ex) {
                    reject(ex);
                }
            });
        }


        return {
            runWidget: runWidget,
            showErrorMessage: showErrorMessage
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});