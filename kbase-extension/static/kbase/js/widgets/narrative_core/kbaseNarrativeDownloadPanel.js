/**
 * "Download" panel for each element in data list panel.
 * @author Roman Sutormin <rsutormin@lbl.gov>
 * @public
 */
define([
    'bluebird',
    'kbwidget',
    'jquery',
    'narrativeConfig',
    'util/kbaseApiUtil',
    'kbase-client-api',
    'kbase-generic-client-api',
    'base/js/namespace',
], (Promise, KBWidget, $, Config, APIUtil, kbase_client_api, GenericClient, Jupyter) => {
    const STAGING_EXPORT_APP = 'kb_staging_exporter/export_to_staging';
    const JSON_EXPORT_APP = 'kb_staging_exporter/export_json_to_staging';

    return KBWidget({
        name: 'kbaseNarrativeDownloadPanel',
        version: '1.0.0',
        // TODO: remove / refactor duplication in options.
        options: {
            token: null,
            type: null,
            objId: null,
            upa: null,
            objName: null,
            downloadSpecCache: null, // {'lastUpdateTime': <millisec.>, 'types': {<type>: <spec>}}
        },
        loadingImage: Config.get('loading_gif'),
        eeURL: Config.url('execution_engine2'),
        timer: null,
        timeInterval: 5000,

        init: function (options) {
            this._super(options);
            Object.assign(this, options);
            this.renderStructure();
            this.downloadSpecCache = options.downloadSpecCache;
            if (this.downloadSpecCache.lastUpdateTime) {
                this.renderDownloadButtons();
                return this;
            } else {
                // TODO: remove this, and fetch downloader info from NarrativeService, in a TBD function.
                // eslint-disable-next-line no-undef
                const nms = new NarrativeMethodStore(Config.url('narrative_method_store'), {
                    token: this.token,
                });
                return Promise.resolve(
                    nms.list_categories({ load_methods: 0, load_apps: 0, load_types: 1 })
                )
                    .then((data) => {
                        this.updateDownloadSpecCache(data);
                        this.renderDownloadButtons();
                    })
                    .catch((error) => this.showError(error))
                    .finally(() => this);
            }
        },

        updateDownloadSpecCache: function (data) {
            const types = {};
            Object.keys(data[3]).forEach((key) => {
                types[key] = data[3][key];
            });
            this.downloadSpecCache = {
                types,
                lastUpdateTime: Date.now(),
            };
        },

        makeDownloaderButton: function (dlInfo, makeCell) {
            const $dlBtn = $('<button>').addClass('kb-data-list-btn').append(dlInfo.name);
            $dlBtn.click(() => {
                if (makeCell) {
                    Jupyter.narrative.addAndPopulateApp(dlInfo.appId, APIUtil.getAppVersionTag(), {
                        input_ref: this.objName,
                    });
                } else {
                    $dlBtn.parent().find('.kb-data-list-btn').prop('disabled', true);
                    this.startDownloader(dlInfo)
                        .then(([jobId, wsObjectName]) => {
                            this.waitForDownloadJob(jobId, wsObjectName);
                        })
                        .catch((error) => {
                            this.showError(error);
                        });
                }
            });
            return $dlBtn;
        },

        renderStructure: function () {
            const $container = $('<div>');
            const $label = $('<div>')
                .addClass('kb-download-label')
                .css({ 'white-space': 'nowrap', padding: '1px', 'align-self': 'center' })
                .append('Export as:');
            const $buttons = $('<div>')
                .addClass('kb-download-buttons')
                .css({ padding: '1px', 'text-align': 'left' });
            $container.css({ display: 'flex' }).append($label).append($buttons);

            this.$elem.append($container);
            this.$statusDiv = $('<div>')
                .addClass('kb-download-status')
                .css({ margin: '15px', 'word-wrap': 'wrap-word', overflow: 'none' });
            this.$elem.append(this.$statusDiv.hide());
        },

        renderDownloadButtons: function () {
            const downloaders = this.prepareDownloaders(this.type);
            const $btnPanel = this.$elem.find('.kb-download-buttons');
            downloaders.forEach((dlInfo) => {
                if (dlInfo.name.toLocaleLowerCase() === 'staging') {
                    $btnPanel.append(
                        this.makeDownloaderButton(
                            {
                                name: 'STAGING',
                                appId: STAGING_EXPORT_APP,
                            },
                            true
                        )
                    );
                } else {
                    $btnPanel.append(this.makeDownloaderButton(dlInfo));
                }
            });
            $btnPanel.append(
                this.makeDownloaderButton(
                    {
                        name: 'JSON',
                        appId: JSON_EXPORT_APP,
                    },
                    true
                )
            );

            $btnPanel.append(
                $('<button>')
                    .addClass('kb-data-list-cancel-btn')
                    .append('Cancel')
                    .click(() => {
                        this.stopTimer();
                        this.$elem.empty();
                    })
            );
        },

        // TODO: move this to result of as-yet-unwritten NarrativeService call
        prepareDownloaders: function (type) {
            const ret = [];
            if (!this.downloadSpecCache['types']) {
                return ret;
            }
            const module = type.split('.', 1)[0];
            const typeSpec = this.downloadSpecCache['types'][type]
                ? this.downloadSpecCache['types'][type]
                : this.downloadSpecCache['types'][module];
            if (typeSpec && typeSpec['export_functions']) {
                Object.keys(typeSpec['export_functions']).forEach((name) => {
                    ret.push({ name: name, appId: typeSpec['export_functions'][name] });
                });
            }
            return ret;
        },

        startDownloader: function (appInfo) {
            this.showMessage(
                '<img src="' + this.loadingImage + '" /> Export status: Preparing data'
            );
            this.$statusDiv.show();
            const tag = APIUtil.getAppVersionTag();
            const method = appInfo.appId.replace('/', '.');
            const eeClient = new GenericClient(this.eeURL, { token: this.token }, null, false);

            return Promise.resolve(
                eeClient.sync_call('execution_engine2.run_job', [
                    {
                        method: method,
                        params: [{ input_ref: this.upa }],
                        service_ver: tag,
                        app_id: method,
                    },
                ])
            ).then(([jobId]) => [jobId]);
        },

        waitForDownloadJob: function (jobId) {
            const eeClient = new GenericClient(this.eeURL, { token: this.token }, null, false);
            let skipLogLines = 0;
            const timeLst = () => {
                Promise.resolve(
                    eeClient.sync_call('execution_engine2.check_job', [{ job_id: jobId }])
                )
                    .then(([jobState]) => {
                        if (!jobState.running) {
                            return [{}, []];
                        }
                        return Promise.resolve(
                            eeClient.sync_call('execution_engine2.get_job_logs', [
                                { job_id: jobId, skip_lines: skipLogLines },
                            ])
                        ).then((logData) => {
                            return [jobState, logData[0].lines];
                        });
                    })
                    .then(([jobState, logLines]) => {
                        if (jobState.finished) {
                            this.stopTimer();
                            if (jobState.error) {
                                this.showError(jobState.error.message);
                            } else {
                                this.finishDownload(jobState.job_output.result[0].shock_id);
                            }
                        } else if (logLines.length) {
                            skipLogLines += logLines.length;
                            const line = logLines[logLines.length - 1].line;
                            const status = skipLogLines === 0 ? jobState.status : line;
                            this.showMessage(
                                `<img src="${this.loadingImage}"/> Export status: ${status}`
                            );
                        }
                    })
                    .catch((error) => {
                        this.stopTimer();
                        this.showError(error);
                    });
            };

            this.timer = setInterval(timeLst, this.timeInterval);
            timeLst();
        },

        finishDownload: function (shockNode) {
            this.$statusDiv.empty().hide();
            this.$elem.find('.kb-data-list-btn').prop('disabled', false);
            // once upon a time, there were versions where shockNode ids, or other results
            // from the download run, could result in URL formats like:
            // https://some_shock_url/path/to/shock/some_shock_id?param=1&param=2
            // where "some_shock_id" is really what we care about. This extracts
            // that id out of those URLs.
            let elems = shockNode.split('/');
            if (elems.length > 1) {
                shockNode = elems[elems.length - 1];
            }
            elems = shockNode.split('?');
            if (elems.length > 0) {
                shockNode = elems[0];
            }
            const downloadUrl = `${Config.url('blobstore')}/node/${shockNode}?download&del`;
            this.downloadFile(downloadUrl);
        },

        downloadFile: function (downloadUrl) {
            const hiddenIFrameID = 'hiddenDownloader';
            let iframe = document.getElementById(hiddenIFrameID);
            if (iframe === null) {
                iframe = document.createElement('iframe');
                iframe.id = hiddenIFrameID;
                iframe.style.display = 'none';
                document.body.appendChild(iframe);
            }
            iframe.src = downloadUrl;
        },

        showMessage: function (msg) {
            this.$statusDiv.empty().append(msg);
        },

        showError: function (error) {
            if (typeof error === 'object') {
                if (error.error) {
                    error = error.error;
                } else if (error.message) {
                    error = error.message;
                }
            }
            // error is final state, so reactivate!
            this.$elem.find('.kb-data-list-btn').prop('disabled', false);
            this.$statusDiv.empty().append(
                $('<span>')
                    .css({ color: '#F44336' })
                    .append('Error: ' + error)
            );
        },

        stopTimer: function () {
            if (this.timer != null) {
                clearInterval(this.timer);
                this.timer = null;
            }
        },
    });
});
