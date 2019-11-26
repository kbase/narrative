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
    'base/js/namespace',
    'kb_service/client/workspace'
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
    Jupyter,
    Workspace
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
        constructor(node, options) {
            this.hostNode = node[0];
            this.container = null;
            const runtime = Runtime.make();
            const token = runtime.authToken();
            this.workspaceId = runtime.workspaceId();
            this.serviceClient = new GenericClient(
                Config.url('service_wizard'),
                {token: token}
            );
            this.workspace = new Workspace(
                Config.url('workspace'),
                {token: token}
            );
        }

        refresh() {
            this.detach();
            return this.render();
        }

        detach() {
            if (this.container) {
                this.container.innerHTML = '';
            }
        }

        render() {
            let events = Events.make();
            this.container = this.hostNode.appendChild(document.createElement('div'));
            this.ui = UI.make({node: this.container});
            const loadingDiv = DisplayUtil.loadingDiv();
            this.container.appendChild(loadingDiv.div[0]);
            this.getStaticNarratives()
                .then(info => {
                    this.container.innerHTML = this.renderNarrativeInfo(info, events) +
                        this.renderNewStatic(info, events);
                    events.attachEvents(this.container);
                })
                .catch(error => {
                    this.container.innerHTML = '';
                    this.container.appendChild(this.renderError(error)[0]);
                });
        }

        renderNarrativeInfo(info, events) {
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

        renderNewStatic(info, events) {
            let self = this;
            const docInfo = Jupyter.narrative.documentVersionInfo;
            if (!docInfo) {
                return this.renderError('Unable to find current Narrative version!');
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

        renderError(error) {
            if (error && error.error && error.error.error) {
                error = {
                    status: error.status,
                    code: error.error.error.code,
                    message: error.error.error.message || 'No further detail',
                    name: error.error.error.name
                };
            }
            console.error(error);
            return DisplayUtil.createError('Static Narrative Error', error);
        }

        getStaticNarratives() {
            return Promise.resolve(this.serviceClient.sync_call(
                'StaticNarrative.get_static_narrative_info',
                [{ws_id: this.workspaceId}]
            ))
                .then(info => info[0])
                .catch(error => {
                    this.detach();
                    this.container.appendChild(this.renderError(error)[0]);
                });
        }

        saveStaticNarrative() {
            // go through either kernel (for now) or NarrativeService?
            // maybe update NarrativeService to do the thing? Eventually...
            // for prototype, make kernel call.
            const docInfo = Jupyter.narrative.documentVersionInfo;
            const narrativeRef = docInfo[6] + '/' + docInfo[0] + '/' + docInfo[4];
            this.ui.showElement('saving-spinner');
            Promise.resolve(this.serviceClient.sync_call(
                'StaticNarrative.create_static_narrative',
                [{'narrative_ref': narrativeRef}])
            )
                .then(() => { this.refresh(); })
                .catch(error => {
                    this.detach();
                    this.container.appendChild(this.renderError(error)[0]);
                });
        }
    }

    return StaticNarrativesPanel;
});
