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
        constructor(node, options) {
            this.hostNode = node[0];
            this.container = null;
            this.serviceClient = new GenericClient(
                Config.url('service_wizard'),
                {token: Runtime.make().authToken()}
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
                        href: info.url
                    }, [
                        i({ class: 'fa fa-external-link fa-2x'})
                    ])
                ]),
            ]);
        }

        renderNewStatic(info, events) {
            return div([
                div(b('Make a new static narrative?')),
                div([
                    button({
                        class: 'btn btn-sm btn-primary',
                        id: events.addEvent({
                            type: 'click',
                            handler: this.test
                        })
                    }, [
                        span('Create new Static Narrative')
                    ]),
                ])
            ]);
        }

        test(event) {
            alert(event);
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
            // ask NarrativeService for any static narratives associated
            // with this Narrative

            return Promise.resolve ({
                'url': 'https://kbase.us/n/12345',
                'version': '5',
                'narr_saved': 1572048409328,
                'static_saved': 1572048427534
            });

            return Promise.resolve(this.serviceClient.sync_call('NarrativeService.getStaticNarrativeInfo', [{'id': 123}]))
                .then(ret => ret[0]);
        }

        saveStaticNarrative() {
            // go through either kernel (for now) or NarrativeService?
            // maybe update NarrativeService to do the thing? Eventually...
            // for prototype, make kernel call.
        }
    }

    return StaticNarrativesPanel;
});
