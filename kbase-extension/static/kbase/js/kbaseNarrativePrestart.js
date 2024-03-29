/* global Jupyter */
// Bind all page buttons right at startup.
define(['kbwidget', 'bootstrap', 'jquery', 'narrativeConfig', 'common/runtime', 'api/auth'], (
    KBWidget,
    bootstrap,
    $,
    Config,
    Runtime,
    Auth
) => {
    'use strict';

    function loadDomEvents() {
        // bind menubar buttons
        $('#kb-save-btn').click(() => {
            if (Jupyter && Jupyter.notebook) {
                const narrName = Jupyter.notebook.notebook_name;
                // we do not allow users to leave their narratives untitled
                if (narrName.trim().toLowerCase() === 'untitled' || narrName.trim().length === 0) {
                    Jupyter.save_widget.rename_notebook({ notebook: Jupyter.notebook }); //"Please name your Narrative before saving.", false);
                } else {
                    Jupyter.narrative.saveNarrative();
                }
            }
        });
        $('#kb-kernel-int-btn').click(() => {
            if (Jupyter && Jupyter.notebook && Jupyter.notebook.kernel) {
                Jupyter.notebook.kernel.interrupt();
            }
        });
        $('#kb-kernel-ref-btn').click(() => {
            if (Jupyter && Jupyter.notebook && Jupyter.notebook.kernel) {
                Jupyter.notebook.kernel.restart();
            }
        });
        $('#kb-kernel-rec-btn').click(() => {
            if (Jupyter && Jupyter.notebook && Jupyter.notebook.kernel) {
                Jupyter.notebook.kernel.reconnect();
            }
        });
        $('#kb-del-btn').click(() => {
            if (Jupyter && Jupyter.notebook) {
                Jupyter.notebook.delete_cell();
            }
        });
        $('#kb-jira-btn').attr(
            'href',
            Config.url('submit_jira_ticket') + '%20' + Config.get('version')
        );
        $('#kb-status-btn').attr('href', Config.url('status_page'));

        $('#kb-add-code-cell')
            .click(() => {
                const data = {
                    type: 'code',
                    language: 'python',
                };
                Jupyter.narrative.insertAndSelectCellBelow('code', null, data);
            })
            .tooltip({
                delay: {
                    show: Config.get('tooltip').showDelay,
                    hide: Config.get('tooltip').hideDelay,
                },
            });

        $('#kb-add-md-cell')
            .click(() => {
                Jupyter.narrative.insertAndSelectCellBelow('markdown');
            })
            .tooltip({
                delay: {
                    show: Config.get('tooltip').showDelay,
                    hide: Config.get('tooltip').hideDelay,
                },
            });

        $('#kb-side-toggle-in').click(() => {
            Jupyter.narrative.toggleSidePanel();
        });
    }

    function loadGlobals() {
        /**
         * Error logging for detectable failure conditions.
         * Logs go through the kernel and thus are sent to the
         * main KBase logging facility (Splunk, as of this writing).
         *
         * Usage:
         *    KBFail(<is_it_fatal>, "what you were doing", "what happened");
         * Returns: false if Jupyter not initialized yet, true otherwise
         */
        window._kb_failed_once = false;
        window.KBFail = function (is_fatal, where, what) {
            if (!Jupyter || !Jupyter.notebook || !Jupyter.notebook.kernel) {
                return false;
            }
            let code = '';
            if (window._kb_failed_once === false) {
                code += 'from biokbase.narrative.common import kblogging\n';
                window._kb_failed_once = true;
            }
            code += 'kblogging.NarrativeUIError(';
            if (is_fatal) {
                code += 'True,';
            } else {
                code += 'False,';
            }
            if (where) {
                code += 'where="' + where + '"';
            }
            if (what) {
                if (where) {
                    code += ', ';
                }
                code += 'what="' + what + '"';
            }
            code += ')\n';
            // Log the failure
            if (Jupyter.notebook.kernel.is_connected()) {
                Jupyter.notebook.kernel.execute(code, null, { store_history: false });
            }
            return true;
        };
        /**
         * Syntactic sugar for logging error vs. fatal error.
         *
         * Same as KBFail() with boolean flag replaced by different names
         * for the function.
         */
        window.KBError = function (where, what) {
            return window.KBFail(false, where, what);
        };

        /**
         * KBFatal will, in addition to calling KBFail(),
         * put up a modal dialog showing the error
         * and providing some advice to users on what to do next.
         *
         * @param where (string) Where the error occurred
         * @param what  (string) What happened
         */
        window.KBFatal = function (where, what) {
            window.KBFail(true, where, what);

            const version = Config.get('version') || 'unknown';
            const hash = Config.get('git_commit_hash') || 'unknown';
            let full_version = 'unknown';
            if (version !== 'unknown') {
                if (hash === 'unknown') {
                    full_version = version;
                } else {
                    full_version = version + ' (hash=' + hash + ')';
                }
            }
            const $fatal = $(
                '<div tabindex=-1 role="dialog" aria-labelledby="kb-fatal-error" aria-hidden="true">'
            )
                .addClass('modal fade')
                .append(
                    $('<div>')
                        .addClass('modal-dialog')
                        .append(
                            $('<div>')
                                .addClass('modal-content')
                                .addClass('kb-error-dialog')
                                .append(
                                    $('<div>')
                                        .addClass('modal-header')
                                        .append(
                                            $('<h4>')
                                                .addClass('modal-title')
                                                .append('KBase Narrative Error')
                                        )
                                )
                                .append($('<div>').addClass('modal-body'))
                                .append(
                                    $('<p>')
                                        .css({ margin: '-1em 0 0 1em' })
                                        .text('Hmmm, your narrative seemed to hit a fatal error.')
                                )
                                .append(
                                    $('<p>')
                                        .css({ 'margin-left': '1em' })
                                        .html(
                                            'But, as a wise man once said, ' +
                                                '<strong>"Don\'t Panic!"</strong>'
                                        )
                                )
                                .append(
                                    $('<p>')
                                        .css({ margin: '1em 0 0 1em' })
                                        .text(
                                            'Some errors are caused by the ' +
                                                'way browsers cache information. Try manually clearing your ' +
                                                'browser cache and reloading the page.'
                                        )
                                        .append(
                                            $('<span>')
                                                .append(
                                                    $('<a>')
                                                        .attr({
                                                            href: 'https://www.refreshyourcache.com/en/home/',
                                                            target: '_blank',
                                                        })
                                                        .text('This page')
                                                )
                                                .append(
                                                    $('<span>').text(
                                                        ' has instructions on how to clear the cache on all major browsers.'
                                                    )
                                                )
                                        )
                                )
                                .append(
                                    $('<p>')
                                        .css({ margin: '1em 0 0 1em' })
                                        .html(
                                            "If that doesn't work, please " +
                                                'contact us at ' +
                                                '<a href="https://www.kbase.us/support/">https://www.kbase.us/support/</a> ' +
                                                'and include the following information:'
                                        )
                                )
                                .append(
                                    $('<p>')
                                        .css({ margin: '1em 0 0 2em' })
                                        .addClass('kb-err-text')
                                        .text('Version: ' + full_version)
                                )
                                .append(
                                    $('<p>')
                                        .css({ margin: '0 0 0 2em' })
                                        .addClass('kb-err-text')
                                        .text('Error location: ' + where)
                                )
                                .append(
                                    $('<p>')
                                        .css({ margin: '0 0 0 2em' })
                                        .addClass('kb-err-text')
                                        .text('Error message: ' + what)
                                )
                                .append(
                                    $('<div>')
                                        .addClass('modal-footer')
                                        .append(
                                            $('<div>')
                                                .append(
                                                    $('<span>')
                                                        .addClass('kb-err-warn pull-left')
                                                        .text(
                                                            'Note: the Narrative may not work properly until this error is fixed'
                                                        )
                                                )
                                                .append(
                                                    $('<button type="button" data-dismiss="modal">')
                                                        .addClass('btn btn-default')
                                                        .append('Close')
                                                        .click(() => {
                                                            $fatal.modal('close');
                                                        })
                                                )
                                        )
                                )
                        )
                );
            $fatal.modal('show');
        };

        // Seed the runtime module with narrative environment info.
        initializeRuntime();
    }

    function loadJupyterEvents() {
        // Kickstart the Narrative loading routine once the notebook is loaded.
        $([Jupyter.events]).on('app_initialized.NotebookApp', () => {
            require(['kbaseNarrative'], (Narrative) => {
                Jupyter.narrative = new Narrative();
                Jupyter.narrative.init();

                /*
                 * Override the move-cursor-down-or-next-cell and
                 * move-cursor-up-or-previous-cell actions.
                 *
                 * When editing a textcell (markdown or code), if a user uses
                 * the arrow keys to move to another cell, it normally lands
                 * there in edit mode.
                 *
                 * This is bad for KBase-ified markdown cells, since it shows
                 * the div and script tags that are used to render them, and
                 * screws up the state management. These overrides just
                 * check if the next cell is a KBase cell, and doesn't enable
                 * edit mode if so.
                 */
                Jupyter.keyboard_manager.actions.register(
                    {
                        handler: function (env, event) {
                            const index = env.notebook.get_selected_index();
                            const cell = env.notebook.get_cell(index);
                            if (cell.at_bottom() && index !== env.notebook.ncells() - 1) {
                                if (event) {
                                    event.preventDefault();
                                }
                                env.notebook.command_mode();
                                env.notebook.select_next(true);
                                if (!env.notebook.get_selected_cell().metadata['kb-cell']) {
                                    env.notebook.edit_mode();
                                    const cm = env.notebook.get_selected_cell().code_mirror;
                                    cm.setCursor(0, 0);
                                }
                            }
                            return false;
                        },
                    },
                    'move-cursor-down',
                    'jupyter-notebook'
                );

                Jupyter.keyboard_manager.actions.register(
                    {
                        handler: function (env, event) {
                            let cm = env.notebook.get_selected_cell().code_mirror;
                            const index = env.notebook.get_selected_index(),
                                cell = env.notebook.get_cell(index),
                                cur = cm.getCursor();
                            if (cell && cell.at_top() && index !== 0 && cur.ch === 0) {
                                if (event) {
                                    event.preventDefault();
                                }
                                env.notebook.command_mode();
                                env.notebook.select_prev(true);
                                if (!env.notebook.get_selected_cell().metadata['kb-cell']) {
                                    env.notebook.edit_mode();
                                    cm = env.notebook.get_selected_cell().code_mirror;
                                    cm.setCursor(cm.lastLine(), 0);
                                }
                            }
                            return false;
                        },
                    },
                    'move-cursor-up',
                    'jupyter-notebook'
                );
            });
        });

        $([Jupyter.events]).on('kernel_ready.Kernel', () => {
            const auth = Auth.make({ url: Config.url('auth') });
            Jupyter.notebook.kernel.execute(
                'import os;' +
                    'os.environ["KB_AUTH_TOKEN"]="' +
                    auth.getAuthToken() +
                    '";' +
                    'os.environ["KB_WORKSPACE_ID"]="' +
                    Jupyter.notebook.metadata.ws_name +
                    '"'
            );
        });
    }

    function initializeRuntime() {
        const runtime = Runtime.make();
        runtime.setEnv('workspaceId', Config.get('workspaceId'));
    }

    return {
        loadDomEvents: loadDomEvents,
        loadGlobals: loadGlobals,
        loadJupyterEvents: loadJupyterEvents,
    };
});
