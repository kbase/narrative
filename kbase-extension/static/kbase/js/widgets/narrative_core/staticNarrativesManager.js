/**
 * This is a panel that helps a user manage, create, and share Static Narratives created
 * from the currently loaded Narrative.
 *
 * A more global manager for all Narratives a user owns might be here later.
 */
define([
    'jquery', // needed to set up Bootstrap popover
    'bluebird',
    'narrativeConfig',
    'common/runtime',
    'util/display',
    'util/timeFormat',
    'kb_common/jsonRpc/dynamicServiceClient',
    'kb_service/client/workspace',
    'base/js/namespace',
    'handlebars',
    'text!kbase/templates/static_narrative.html',
], (
    $,
    Promise,
    Config,
    Runtime,
    DisplayUtil,
    TimeFormat,
    DynamicServiceClient,
    Workspace,
    Jupyter,
    Handlebars,
    StaticNarrativeTmpl
) => {
    'use strict';

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
            this.userId = runtime.userId();
            this.serviceClient = new DynamicServiceClient({
                module: 'StaticNarrative',
                url: Config.url('service_wizard'),
                token: token,
            });
            this.wsClient = new Workspace(Config.url('workspace'), { token: token });
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
            this.detach();
            const loadingDiv = DisplayUtil.loadingDiv();
            this.container.appendChild(loadingDiv.div[0]);
            const docInfo = Jupyter.narrative.documentVersionInfo;
            if (!docInfo) {
                return Promise.try(() => {
                    this.container.innerHTML = '';
                    this.container.appendChild(
                        this.renderError({
                            code: -1,
                            error: 'Narrative document info not found',
                            name: 'Narrative error',
                            message: 'Unable to find current Narrative version!',
                        })
                    );
                });
            }

            return Promise.all([this.getStaticNarratives(), this.getPermissionInfo()])
                .spread((narrativeInfo, permissions) => {
                    const info = Object.assign(narrativeInfo, permissions);
                    if (info.url) {
                        info.narr_saved = TimeFormat.prettyTimestamp(info.narr_saved);
                        info.static_saved = TimeFormat.prettyTimestamp(info.static_saved);
                        info.url = Config.url('static_narrative_root') + info.url;
                    }
                    info.canMakeStatic = info.isAdmin && info.isPublic;
                    info.currentVersion = docInfo[4];
                    info.currentVersionSaved = TimeFormat.prettyTimestamp(docInfo[3]);
                    info.isCurrentVersion = info.currentVersion === info.version;
                    const tmpl = Handlebars.compile(StaticNarrativeTmpl);
                    this.container.innerHTML = tmpl(info);

                    const createBtn = this.hostNode.querySelector('button.btn-primary');
                    if (createBtn) {
                        createBtn.addEventListener('click', this.saveStaticNarrative.bind(this));
                    }
                    $(this.hostNode.querySelector('#kb-sn-help')).popover();
                })
                .catch((error) => {
                    console.error(JSON.stringify(error));
                    this.container.innerHTML = '';
                    this.container.appendChild(this.renderError(error));
                });
        }

        /**
         * Renders an error panel if something bad occurs.
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
                    name: error.error.error.name,
                };
            }
            return DisplayUtil.createError('Static Narrative Error', error)[0];
        }

        /**
         * Returns a Promise that fetches any Static Narrative information
         * from a service.
         * If an error happens, this renders the error instead.
         * @returns {Promise} - this resolves into an object that describes the existing
         *      Static Narrative info, if any.
         */
        getStaticNarratives() {
            return Promise.resolve(
                this.serviceClient.callFunc('get_static_narrative_info', [
                    { ws_id: this.workspaceId },
                ])
            )
                .then((info) => info[0])
                .catch((error) => {
                    this.detach();
                    this.container.appendChild(this.renderError(error));
                    throw error;
                });
        }

        /**
         * Returns permissions for the current user on this narrative (workspace).
         * @returns {Promise} - resolves into an object with two boolean keys:
         *  isAdmin - true if user has admin (sharing) rights
         *  isPublic - true if the narrative has public access
         *
         * Note that errors will propagate and not be caught here.
         */
        getPermissionInfo() {
            return this.wsClient
                .get_permissions_mass({ workspaces: [{ id: this.workspaceId }] })
                .then((perms) => {
                    const perm = perms.perms[0];
                    return {
                        isAdmin: perm[this.userId] && perm[this.userId] === 'a',
                        isPublic: perm['*'] && perm['*'] === 'r',
                    };
                })
                .catch(() => {
                    return { isAdmin: false, isPublic: false };
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
            this.hostNode
                .querySelector('span[data-element="saving-spinner"]')
                .classList.toggle('hidden');
            return Promise.resolve(
                this.serviceClient.callFunc('create_static_narrative', [
                    { narrative_ref: narrativeRef },
                ])
            )
                .then(() => this.refresh())
                .catch((error) => {
                    this.detach();
                    this.container.appendChild(this.renderError(error));
                });
        }
    }

    return StaticNarrativesPanel;
});
