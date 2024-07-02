/* eslint-disable no-console */
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
            ref: null,
            objName: null,
            downloadSpecCache: null, // {'lastUpdateTime': <millisec.>, 'types': {<type>: <spec>}}
        },
        loadingImage: Config.get('loading_gif'),
        shockURL: Config.url('shock'),
        exportURL: Config.url('data_import_export'),
        nmsURL: Config.url('narrative_method_store'),
        eeURL: Config.url('execution_engine2'),
        timer: null,

        init: function (options) {
            this._super(options);
            Object.assign(this, options);
            if (!this.objId) {
                // we need the actual object id, so if we get an upa path (or just an upa),
                // extract the object id from that.
                // '1/2/3;4/5/6;7/8/9' would break down to:
                // ['1/2/3', '4/5/6', '7/8/9']
                // pop + trim -> '7/8/9'
                // split on '/' and take the second element = the object id.
                this.objId = this.ref.split(';').pop().trim().split('/')[1];
            }
            this.downloadSpecCache = options.downloadSpecCache;
            if (this.downloadSpecCache.lastUpdateTime) {
                this.render();
                return this;
            } else {
                // TODO: remove this, and fetch downloader info from NarrativeService, in a TBD function.
                // eslint-disable-next-line no-undef
                const nms = new NarrativeMethodStore(this.nmsURL, { token: this.token });
                return Promise.resolve(
                    nms.list_categories({ load_methods: 0, load_apps: 0, load_types: 1 })
                )
                    .then((data) => {
                        this.updateDownloadSpecCache(data);
                        this.render();
                    })
                    .catch((error) => this.showError(error))
                    .finally(() => this);
            }
        },

        updateDownloadSpecCache: function (data) {
            const types = {};
            Object.keys(data[3]).forEach((key) => {
                if (data[3][key].loading_error) {
                    console.error(`Error loading type [${key}]: ${data[3][key].loading_error}`);
                }
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
                    this.startDownloader(dlInfo).then(([jobId, wsObjectName]) => {
                        this.waitForDownloadJob(jobId, wsObjectName);
                    });
                }
            });
            return $dlBtn;
        },

        render: function () {
            const downloadPanel = this.$elem;

            // TODO: migrate to SCSS
            const $labeltd = $('<td>')
                .css({ 'white-space': 'nowrap', padding: '1px' })
                .append('Export as:');
            const $btnTd = $('<td>').css({ padding: '1px' });
            downloadPanel.append(
                $('<table>').css({ width: '100%' }).append('<tr>').append($labeltd).append($btnTd)
            );

            const downloaders = this.prepareDownloaders(this.type);
            downloaders.forEach((dlInfo) => {
                if (dlInfo.name.toLocaleLowerCase() === 'staging') {
                    $btnTd.append(
                        this.makeDownloaderButton(
                            {
                                name: 'STAGING',
                                appId: STAGING_EXPORT_APP,
                            },
                            true
                        )
                    );
                } else {
                    $btnTd.append(this.makeDownloaderButton(dlInfo));
                }
            });
            $btnTd.append(
                this.makeDownloaderButton(
                    {
                        name: 'JSON',
                        appId: JSON_EXPORT_APP,
                    },
                    true
                )
            );

            $btnTd.append(
                $('<button>')
                    .addClass('kb-data-list-cancel-btn')
                    .append('Cancel')
                    .click(() => {
                        this.stopTimer();
                        downloadPanel.empty();
                    })
            );

            this.$statusDiv = $('<div>').css({ margin: '15px' });
            this.$statusDivContent = $('<div>');
            this.$statusDiv.append(this.$statusDivContent);
            downloadPanel.append(this.$statusDiv.hide());
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
            } else {
                console.log(
                    'Type [' +
                        type +
                        "] was skipped (no 'export_functions' block in " +
                        'type-spec).'
                );
            }
            return ret;
        },

        startDownloader: function (appInfo) {
            this.showMessage(
                '<img src="' + this.loadingImage + '" /> Export status: Preparing data'
            );
            this.$statusDiv.show();
            const wsObjectName =
                this.objName + '.' + appInfo.name.replace(/[^a-zA-Z0-9|.\-_]/g, '_');
            const tag = APIUtil.getAppVersionTag();
            const method = appInfo.appId.replace('/', '.');
            const eeClient = new GenericClient(this.eeURL, { token: this.token }, null, false);

            return Promise.resolve(
                eeClient.sync_call('execution_engine2.run_job', [
                    {
                        method: method,
                        params: [{ input_ref: this.ref }],
                        service_ver: tag,
                        app_id: method,
                    },
                ])
            )
                .then(([jobId]) => {
                    console.log(
                        'Running ' + appInfo.appId + ' (tag="' + tag + '"), ' + 'job ID: ' + jobId
                    );
                    return [jobId, wsObjectName];
                })
                .catch((error) => {
                    console.error(error);
                    this.showError(error);
                });
        },

        waitForDownloadJob: function (jobId, wsObjectName) {
            const eeClient = new GenericClient(this.eeURL, { token: this.token }, null, false);
            let skipLogLines = 0;
            const timeLst = () => {
                Promise.resolve(
                    eeClient.sync_call('execution_engine2.check_job', [{ job_id: jobId }])
                )
                    .then(([jobState]) => {
                        console.log('got job state', jobState);
                        if (!jobState.running) {
                            return [{}, []];
                        }
                        return Promise.resolve(
                            eeClient.sync_call('execution_engine2.get_job_logs', [
                                { job_id: jobId, skip_lines: skipLogLines },
                            ])
                        ).then((logData) => [jobState, logData[0].lines]);
                    })
                    .then(([jobState, logLines]) => {
                        if (jobState.finished) {
                            this.stopTimer();
                            if (jobState.error) {
                                console.error(jobState.error);
                                this.showError(jobState.error.message);
                            } else {
                                console.log('Export is complete');
                                this.finishDownload(
                                    jobState.job_output.result[0].shock_id,
                                    wsObjectName
                                );
                            }
                        } else if (logLines.length) {
                            logLines.forEach((line) => console.log(line.line));
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
                        console.log(error);
                        this.showError(error.error.message);
                    });
            };

            this.timer = setInterval(timeLst, 5000);
            timeLst();
        },

        finishDownload: function (shockNode, wsObjectName) {
            this.$statusDiv.hide();
            this.$elem.find('.kb-data-list-btn').prop('disabled', false);
            // once upon a time, there were versions where shockNode ids, or other results
            // from the download run, could result in URL formats like:
            // https://some_shock_url/path/to/shock/some_shock_id?param=1&param=2
            // where "some_shock_id" is really what we care about. This extracts
            // that id out of those URLs.
            // This is slated for demolition in the move to the blobstore.
            let elems = shockNode.split('/');
            if (elems.length > 1) {
                shockNode = elems[elems.length - 1];
            }
            elems = shockNode.split('?');
            if (elems.length > 0) {
                shockNode = elems[0];
            }
            console.log('Shock node ID: ' + shockNode);
            const name = encodeURIComponent(wsObjectName + '.zip');
            const urlSuffix = `/download?id=${shockNode}&del=1&name=${name}&url=${encodeURIComponent(this.shockURL)}`;
            this.downloadFile(urlSuffix);
        },

        downloadFile: function (urlSuffix) {
            const url = this.exportURL + urlSuffix;
            console.log('Downloading url=' + url);
            const hiddenIFrameID = 'hiddenDownloader';
            let iframe = document.getElementById(hiddenIFrameID);
            if (iframe === null) {
                iframe = document.createElement('iframe');
                iframe.id = hiddenIFrameID;
                iframe.style.display = 'none';
                document.body.appendChild(iframe);
            }
            iframe.src = url;
        },

        showMessage: function (msg) {
            this.$statusDivContent.empty().append(msg);
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
            this.$statusDivContent.empty().append(
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
