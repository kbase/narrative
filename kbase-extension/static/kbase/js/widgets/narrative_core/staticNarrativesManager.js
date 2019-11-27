/**
 * This is a panel that helps a user manage, create, and share Static Narratives created
 * from the currently loaded Narrative.
 *
 * A more global manager for all Narratives a user owns might be here later.
 */
define([
    'bluebird',
    'narrativeConfig',
    'common/runtime',
    'common/events',
    'common/ui',
    'util/display',
    'util/timeFormat',
    'kbase-generic-client-api',
    'kb_common/html',
    'base/js/namespace'
],
function(
    Promise,
    Config,
    Runtime,
    Events,
    UI,
    DisplayUtil,
    TimeFormat,
    GenericClient,
    HTML,
    Jupyter
) {
    'use strict';

    let t=HTML.tag,
        div=t('div'),
        a=t('a'),
        i=t('i'),
        b=t('b'),
        button=t('button'),
        span=t('span');

    class StaticNarrativesPanel {
        /**
         * Builds the widget. This doesn't actually do any rendering - it expects
         * the render function to be called separately.
         * @param {DOMElement} node - expected to be a jquery element, like most other things
         *   in this codebase...
         */
        constructor(node) {
            this.hostNode = node[0];
            this.container = null;
            const runtime = Runtime.make();
            const token = runtime.authToken();
            this.workspaceId = runtime.workspaceId();
            this.serviceClient = new GenericClient(
                Config.url('service_wizard'),
                {token: token}
            );
        }

        /**
         * Refreshes this widget by clearing its DOM node and re-rendering.
         */
        refresh() {
            this.detach();
            return this.render();
        }

        /**
         * Clears out this DOM node by setting its HTML to empty string.
         */
        detach() {
            this.hostNode.innerHTML = '';
            this.container = this.hostNode.appendChild(document.createElement('div'));
        }

        /**
         * Renders the widget. This returns a Promise that resolves once it's done
         * rendering. If any errors happen, an error panel gets rendered.
         */
        render() {
            let events = Events.make();
            this.detach();
            this.ui = UI.make({node: this.container});
            const loadingDiv = DisplayUtil.loadingDiv();
            this.container.appendChild(loadingDiv.div[0]);

            return this.getStaticNarratives()
                .then(info => {
                    this.container.innerHTML = this.renderNarrativeInfo(info) +
                        this.renderNewStatic(events);
                    events.attachEvents(this.container);
                })
                .catch(error => {
                    this.container.innerHTML = '';
                    this.container.appendChild(this.renderError(error)[0]);
                });
        }

        /**
         * Renders the block containing static Narrative information, if available.
         * This judges that by seeing if info.url is defined or not.
         * This returns a DIV DOM element that can be put in place by the main
         * renderer function.
         * @param {Object} info - a data object, expected to contain the following:
         * - version - the version of the narrative saved
         * - url - the path to the static Narrative, based on the configured URL.
         * - narr_saved - the time (ms since epoch) that the Narrative used to create a
         *      static narrative was saved.
         * - static_saved - the time (ms since epoch) that the Static Narrative was saved.
         */
        renderNarrativeInfo(info) {
            if (info.url) {
                return div({
                    style: {
                        display: 'flex',
                        'border-bottom': '1px solid #eee',
                        'margin-bottom': '0.5em',
                        'padding-bottom': '0.5em'
                    }}, [
                    div([
                        div(b('A static version of this Narrative exists.')),
                        div('Based on version ' + info.version),
                        div('Originally saved ' + TimeFormat.prettyTimestamp(info.narr_saved)),
                        div('And made static ' + TimeFormat.prettyTimestamp(info.static_saved))
                    ]),
                    div({style: {'margin-left': 'auto'}}, [
                        a({
                            target: '_blank',
                            title: 'Go to existing static Narrative',
                            href: Config.url('static_narrative_root') + info.url
                        }, [
                            i({ class: 'fa fa-external-link fa-2x'})
                        ])
                    ]),
                ]);
            }
            else {
                return div({
                    style: {
                        'border-bottom': '1px solid #eee',
                        'margin-bottom': '0.5em',
                        'padding-bottom': '0.5em'
                    }
                }, [
                    div(b('No static version exists for this Narrative yet!')),
                    div('You can create one by clicking below.')
                ]);
            }
        }

        /**
         * Renders the panel that invites the user to create a new static narrative.
         * This uses the documentVersionInfo available in the main Narrative object
         * (maybe that should be in Runtime?).
         * This returns a DIV DOM element that can be put in place by the main
         * renderer function.
         * @param {Object} events - the Events object used to add click events to the
         *      create static narrative button.
         */
        renderNewStatic(events) {
            let self = this;
            const docInfo = Jupyter.narrative.documentVersionInfo;
            if (!docInfo) {
                throw new Error({
                    code: -1,
                    error: docInfo,
                    name: 'Narrative error',
                    message: 'Unable to find current Narrative version!'
                });
            }
            return div([
                div(b('This is version ' + docInfo[4] + ' of this Narrative, and was saved ' + TimeFormat.prettyTimestamp(docInfo[3]))),
                div(b('Make a new static narrative?')),
                div([
                    button({
                        class: 'btn btn-sm btn-primary',
                        id: events.addEvent({
                            type: 'click',
                            handler: () => self.saveStaticNarrative()
                        })
                    }, [
                        span('Create new Static Narrative')
                    ]),
                    span({
                        dataElement: 'saving-spinner',
                        class: 'hidden fa fa-spinner fa-pulse fa-ex fa-fw',
                        style: {
                            'margin-left': '0.5em'
                        }
                    })
                ])
            ]);
        }

        /**
         * Renders an error panel if something bad occurs.
         * Also dumps the error to console.error.
         * @param {Object} error - the error to render. Often a JSON-RPC error from some
         *      KBase service, so it'll have a wacky format, like:
         *      {
         *          error: {
         *              error: {
         *                  message: string,
         *                  name: string,
         *                  code: number
         *              }
         *          },
         *          status: string
         *      }
         */
        renderError(error) {
            if (error && error.error && error.error.error) {
                error = {
                    status: error.status,
                    code: error.error.error.code,
                    message: error.error.error.message || 'No further detail',
                    name: error.error.error.name
                };
            }
            return DisplayUtil.createError('Static Narrative Error', error);
        }

        /**
         * Returns a Promise that fetches any Static Narrative information
         * from a service.
         * If an error happens, this renders the error instead.
         * @returns {Promise} - this resolves into an object that describes the existing
         *      Static Narrative info, if any.
         */
        getStaticNarratives() {
            return Promise.resolve(this.serviceClient.sync_call(
                'StaticNarrative.get_static_narrative_info',
                [{ws_id: this.workspaceId}]
            ))
                .then(info => info[0])
                .catch(error => {
                    this.detach();
                    this.container.appendChild(this.renderError(error)[0]);
                    throw error;
                });
        }

        /**
         * Calls out to the StaticNarrative service to create a new Static Narrative
         * from the currently loaded Narrative document.
         * Returns a Promise that resolves when it's finished.
         */
        saveStaticNarrative() {
            const docInfo = Jupyter.narrative.documentVersionInfo;
            const narrativeRef = docInfo[6] + '/' + docInfo[0] + '/' + docInfo[4];
            this.ui.showElement('saving-spinner');
            return Promise.resolve(this.serviceClient.sync_call(
                'StaticNarrative.create_static_narrative',
                [{'narrative_ref': narrativeRef}])
            )
                .then(() => this.refresh() )
                .catch(error => {
                    this.detach();
                    this.container.appendChild(this.renderError(error)[0]);
                });
        }
    }

    return StaticNarrativesPanel;
});
