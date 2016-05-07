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
    'narrativeConfig'
], function (Promise, RuntimeManager, NarrativeConfig) {
    'use strict';
    function factory(config) {
        var packageName = config.package,
            packageVersion = config.version,
            widgetName = config.widget,
            widgetTitle = config.title,
            widgetParentNode = config.parent,
            authRequired = config.authRequired,
            config = NarrativeConfig.getConfig();

        function showErrorMessage(message) {
            widgetParentNode.innerHTML = '<div style="margin: 1em; padding: 1em; border: 2px red solid;"><h1>Error in ' + widgetTitle + '</h1><p>' + message + '</p></div>';
        }

        function runWidget(objectRefs, options) {
            return new Promise(function (resolve, reject) {
                try {
                    var runtimeManager = RuntimeManager.make({
                        cdnUrl: config.services.cdn.url
                    }),

                    // This runtime object is provided for the boot up of the widget invocation
                    // machinery, NOT running the widget.
                    // Note -- need to use the global require in order to generate additional require objects
                    // via require.config()
                        req = runtimeManager.getModuleLoader('0.1.1', require, '/narrative/widgetApi/kbase/js/widgetApi');

                    req([
                        'kb_widget_service/widgetManager',
                        // 'yaml!./config.yml',
                        'kb_common/props',
                        'kb_common/session',
                        'kb_common/html'
                    ],
                        function (WidgetManager, Props, Session, Html) {
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
                            var widgetManager = WidgetManager.make({
                                widgetServiceUrl: config.services.widget.url,
                                cdnUrl: config.services.cdn.url
                            });
                            var widgetDiv = widgetManager.addWidget({
                                package: packageName,
                                version: packageVersion,
                                widget: widgetName,
                                panel: true,
                                title: widgetTitle
                            });

                            // The "widget" is provided as simple markup (string) with an id set and mapped 
                            // internally to the right widget invocation stuff.
                            widgetParentNode.innerHTML = widgetDiv;

                            // After the widget wrapper is placed into the dom, we can launch the widget.
                            widgetManager.loadWidgets(makeWidgetHostAdapter(objectRefs, options))
                                .then(function () {
                                    resolve();
                                })
                                .catch(function (err) {
                                    console.error('load widgets error', err);
                                    reject(err);
                                });
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