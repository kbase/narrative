define([
    'jquery',
    'kbaseTabs',
    'StagingServiceClient',
    'bluebird',
    'kbwidget',
    'narrativeConfig',
    'common/runtime',
    'common/html',
    'common/ui',
    'base/js/namespace',
    'handlebars',
    'util/string',
    'util/timeFormat',
    './uploadTour',
    'util/stagingFileCache',
    './importSetup',
    './importErrors',
    'text!kbase/templates/data_staging/ftp_file_table.html',
    'text!kbase/templates/data_staging/ftp_file_header.html',
    'text!kbase/templates/data_staging/file_path.html',
    'kb_service/client/workspace',
    'jquery-dataTables',
    'select2',
], (
    $,
    KBaseTabs,
    StagingServiceClient,
    Promise,
    KBWidget,
    Config,
    Runtime,
    html,
    UI,
    Jupyter,
    Handlebars,
    StringUtil,
    TimeFormat,
    UploadTour,
    StagingFileCache,
    Import,
    Error,
    FtpFileTableHtml,
    FtpFileHeaderHtml,
    FilePathHtml,
    Workspace
) => {
    'use strict';
    const cssBaseClass = 'kb-staging-table',
        tableId = 'kb-staging-table',
        fileMetadataCssBaseClass = `${cssBaseClass}-file-metadata`,
        tableBodyCssBaseClass = `${cssBaseClass}-body`;

    return new KBWidget({
        name: 'StagingAreaViewer',

        options: {
            refreshIntervalDuration: 30000,
            path: '',
        },

        init: function (options) {
            this._super(options);
            const runtime = Runtime.make();

            this.workspaceClient = new Workspace(Config.url('workspace'), {
                token: runtime.authToken(),
            });

            this.stagingServiceClient = new StagingServiceClient({
                root: Config.url('staging_api_url'),
                token: runtime.authToken(),
            });

            this.ftpFileTableTmpl = Handlebars.compile(FtpFileTableHtml);
            this.ftpFileHeaderTmpl = Handlebars.compile(FtpFileHeaderHtml);
            this.filePathTmpl = Handlebars.compile(FilePathHtml);
            this.updatePathFn = options.updatePathFn || this.setPath;
            this.uploaders = Config.get('uploaders');
            this.uploaderNames = this.uploaders.dropdown_order.reduce((acc, uploader) => {
                acc[uploader.id] = uploader.name;
                return acc;
            }, {});
            this.bulkImportTypes = this.uploaders.bulk_import_types;
            this.userInfo = options.userInfo;

            // setting first load so setPath doesn't call updateView() as that will happen via narrativeStagingDataTab
            this.firstLoad = true;
            this.setPath(options.path);
            this.openFileInfo = {}; // key = file path, value = metadata info
            this.selectedFileTypes = {}; // key = file path, value = file info
            this.checkedFiles = new Set(); // set of file paths

            return this;
        },

        activate: function () {
            this.render();
            if (!this.refreshInterval) {
                this.refreshInterval = setInterval(() => {
                    this.render();
                }, this.options.refreshIntervalDuration);
            }
        },

        deactivate: function () {
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
                this.refreshInterval = undefined;
            }
            if (this.fullDataTable) {
                $.fn.DataTable.ext.search.pop();
                this.fullDataTable.destroy();
            }
        },

        /**
         * Returns a Promise that resolves once the rendering is done.
         */
        render: function () {
            // a full render should wipe the entire view.
            // really, this should only be done once. Subsequent data fetching
            // just updates the data in the datatable.
            this.$elem.empty();
            this.renderFileHeader();
            return this.updateView().then(() => {
                this.renderImportButton();
            });
        },

        updateView: function () {
            return StagingFileCache.getFileList(true)
                .then((data) => {
                    const files = JSON.parse(data).map((f) => {
                        f.path = f.path.substring(f.path.indexOf('/') + 1);
                        f.subdir = '/' + f.path.substring(0, f.path.lastIndexOf('/')) || '/';
                        return f;
                    });
                    return this.identifyImporterMappings(files);
                })
                .then((files) => {
                    const scrollTop = this.$elem.parent().scrollTop();
                    $(`.${fileMetadataCssBaseClass}`).detach();

                    if (this.fullDataTable) {
                        this.fullDataTable.clear().rows.add(files).draw(false);
                    } else {
                        this.renderFiles(files);
                    }

                    setTimeout(() => {
                        this.$elem.parent().scrollTop(scrollTop);
                    }, 0);
                })
                .catch((xhr) => {
                    console.error('Staging area failure:', xhr);
                    this.renderError(
                        xhr.responseText
                            ? xhr.responseText
                            : 'Unknown error - directory was not found, or may have been deleted'
                    );
                });
        },

        /**
         * Expect that 'path' is only any subdirectories. The root directory is still the
         * user id.
         */
        setPath: function (path) {
            this.path = path;
            this.updateTableDrawPath();
        },

        renderFileHeader: function () {
            const uploadConfig = Config.get('upload');
            this.$elem.append(
                this.ftpFileHeaderTmpl({
                    globusUrl:
                        uploadConfig.globus_upload_url + '&destination_path=' + this.userInfo.user,
                    userInfo: this.userInfo,
                })
            );

            // Set up the link to the web upload app.
            this.$elem.find('.web_upload_div').click(() => {
                return Import.setupWebUploadCell().then(() => {
                    Jupyter.narrative.hideOverlay();
                });
            });

            // Add ACL before going to the staging area
            // If it fails, it'll just do so silently.
            const $globusLink = this.$elem.find('.globus_acl_link');
            $globusLink.click(() => {
                const globusWindow = window.open('', 'globus');
                globusWindow.document.write(
                    '<html><body><h2 style="text-align:center; font-family:\'Oxygen\', arial, sans-serif;">Loading Globus...</h2></body></html>'
                );
                this.stagingServiceClient.addAcl().done(() => {
                    window.open($globusLink.attr('href'), 'globus');
                    return true;
                });
            });

            // Bind the help button to start the tour.
            this.$elem.find('button#help').click(() => {
                this.startTour();
            });
        },

        renderPath: function () {
            let splitPath = this.path;
            if (splitPath.startsWith('/')) {
                splitPath = splitPath.substring(1);
            }
            splitPath = splitPath.split('/').filter((p) => p.length);
            const pathTerms = [];
            for (let i = 0; i < splitPath.length; i++) {
                let prevPath = '';
                if (i > 0) {
                    prevPath = pathTerms[i - 1].subpath;
                }
                pathTerms[i] = {
                    term: splitPath[i],
                    subpath: prevPath + '/' + splitPath[i],
                };
            }
            // we don't store the username as part of the path, but we still want to display it to the user for navigation purposes
            pathTerms.unshift({ term: this.userInfo.user, subpath: '/' });

            this.$elem
                .find('div.file-path')
                .empty()
                .append(
                    this.filePathTmpl({
                        path: pathTerms,
                    })
                );
            this.$elem.find('div.file-path a').click((e) => {
                this.updatePathFn($(e.currentTarget).data().element);
            });
            this.$elem.find('button#refresh').click(() => {
                this.updateView();
            });
        },

        downloadFile: function (url) {
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

        renderError: function (error) {
            const errorElem = `
                <div class='file-path pull-left'></div>
                <div style='margin-top:2em' class='alert alert-danger'>
                    <b>An error occurred while fetching your files:</b> ${error}
                </div>
            `;
            this.$elem.append(errorElem);
        },

        /**
         * Identifies any potential file type mappings based on a call to the Staging Service,
         * and returns the list of staging file objects with an added 'mappings' field.
         * @param {Array} stagingFiles
         * @returns {Array} the stagingFiles array augmented with a 'mappings' field for each file,
         *  each containing an id, title, and app_weight. If there are no file->type mappings, this
         *  field is null
         */
        identifyImporterMappings: function (stagingFiles) {
            const fileNames = stagingFiles.map((f) => f['path']);

            /* Currently, the mapping info lookup is only a GET request with URL parameters.
             * meaning that we're limited to 2048 characters per request. Additionally, each file
             * is a separate "file_list=" parameter, which adds 10 required characters. If a user
             * has a ton of files, this gets full very quickly, and causes errors.
             *
             * A POST version in the staging service is pending, which would solve this.
             *
             * In the meantime, this ugly pile of code splits the lookup into multiple requests.
             * At least it's commented...
             */
            const importerMappingsProms = [];
            // how many characters a query can be, after the URL and path are given.
            const maxQueryLength =
                2048 - Config.url('staging_api_url').length - '/importer_mappings?'.length;
            // a quickie for roughly how many characters each file param has at minimum.
            const paramLength = 'file_list=&'.length; // kinda off by one at the end, but ok.
            /* Now, go down the list.
             * If there are remaining characters for the next file, add it to this query.
             * Using shift() lets us retain file order when the results are collated.
             * Once the batch is full, use the $.param method (as before) to build URL params.
             * Finally, start the request, then keep the Promise in an array.
             */
            while (fileNames.length) {
                let remainingLength = maxQueryLength;
                const fileBatch = [];
                while (
                    fileNames.length &&
                    remainingLength - paramLength - fileNames[0].length >= 0
                ) {
                    const nextFile = fileNames.shift();
                    fileBatch.push(nextFile);
                    remainingLength -= paramLength + nextFile.length;
                }
                importerMappingsProms.push(
                    this.stagingServiceClient.importer_mappings({
                        file_list: $.param({ file_list: fileBatch }, true),
                    })
                );
            }
            return Promise.all(importerMappingsProms)
                .then((data) => {
                    // data is a list of all results, in the order run.
                    // each data item is a JSON, with a mappings field. That field is a list of file mappings.
                    // When reassembled into one big list, that will still be in the same order as stagingFiles.
                    // Well, it should be.

                    const mappings = data.reduce((accumulator, dataItem) => {
                        return accumulator.concat(JSON.parse(dataItem)['mappings']);
                    }, []);

                    // from each file mapping, if not null, remove any mappings the Narrative doesn't know about
                    for (let i = 0; i < mappings.length; i++) {
                        if (mappings[i]) {
                            mappings[i] = mappings[i].filter(
                                (mapping) => mapping.id in this.uploaders.app_info
                            );
                            if (mappings[i].length === 0) {
                                mappings[i] = null;
                            }
                        }
                    }

                    // Extract mappings, sort by weight, assign mappings to staging files
                    mappings.forEach((mapping) => {
                        if (mapping) {
                            mapping.sort((a, b) => a.app_weight < b.app_weight);
                        }
                    });

                    stagingFiles.map((element, index) => {
                        element['mappings'] = mappings[index] || null;
                    });
                    return stagingFiles;
                })
                .catch((err) => {
                    console.error('Error', err);
                });
        },

        /**
         * This renders the files datatable. If there's no data, it gives a message
         * about no files being present. If there's an error, that gets put in the table instead.
         * @param {object} data
         * keys: files (list of file info) and error (optional error)
         */
        renderFiles: function (files) {
            const stagingAreaViewer = this;
            const option = html.tag('option'),
                button = html.tag('button'),
                span = html.tag('span'),
                select = html.tag('select'),
                div = html.tag('div'),
                optgroup = html.tag('optgroup'),
                input = html.tag('input');
            files = files || [];
            const emptyMsg = 'No files found.',
                filterMsg = 'in directory',
                infoMsg = 'Showing _START_ to _END_ of _TOTAL_ files',
                infoEmptyMsg = 'No files';

            const uploaders = stagingAreaViewer.uploaders.dropdown_order;
            stagingAreaViewer.$elem.append(stagingAreaViewer.ftpFileTableTmpl());
            stagingAreaViewer.fullDataTable = stagingAreaViewer.$elem.find('table').DataTable({
                language: {
                    emptyTable: emptyMsg,
                    infoFiltered: filterMsg,
                    info: infoMsg,
                    infoEmpty: infoEmptyMsg,
                    zeroRecords: emptyMsg,
                },
                data: files,
                dom: '<"file-path pull-left">frtip',
                autoWidth: false,
                order: [[4, 'desc']],
                drawCallback: () => stagingAreaViewer.renderPath(),
                headerCallback: function (thead) {
                    $(thead)
                        .find('th')
                        .eq(0)
                        .on('click keyPress', (e) => {
                            stagingAreaViewer.selectAllOrNone(e);
                        });
                },
                columnDefs: [
                    {
                        // checkboxes
                        targets: 0,
                        data: null,
                        orderable: false,
                        searchable: false,
                        render: function (data) {
                            // render checkboxes disabled until the user selects a type
                            return input({
                                class: `${tableBodyCssBaseClass}__checkbox-input`,
                                type: 'checkbox',
                                role: 'checkbox',
                                disabled: true,
                                ariaChecked: false,
                                tabindex: 0,
                                ariaLabel:
                                    'Select to import file checkbox: disabled until at least one data type is selected',
                                dataFileName: data.path,
                                id: data.path,
                            });
                        },
                    },
                    {
                        // file or folder icon
                        // if file icon, includes caret to toggle subrow
                        targets: 1,
                        data: 'isFolder',
                        createdCell: function (td) {
                            $(td).addClass(`${tableBodyCssBaseClass}__cell--expander`);
                        },
                        render: function (data, type, full) {
                            if (type === 'display') {
                                const isFolder = data;
                                const icon = isFolder ? 'folder' : 'file-o';
                                const disp = span({
                                    class: `fa fa-${icon}`,
                                });
                                if (isFolder) {
                                    return button(
                                        {
                                            dataName: full.path,
                                            class: `${tableBodyCssBaseClass}__button--${icon}`,
                                        },
                                        disp
                                    );
                                }

                                return (
                                    span({
                                        class: 'fa fa-caret-right kb-pointer',
                                        dataCaret: full.path,
                                    }) +
                                    ' ' +
                                    disp
                                );
                            }
                            return data;
                        },
                    },
                    {
                        targets: 2,
                        data: 'name',
                        render: function (data, type, full) {
                            if (type === 'display') {
                                let decompressButton = '';

                                if (
                                    data.match(/\.(zip|tar\.gz|tgz|tar\.bz|tar\.bz2|tar|gz|bz2)$/)
                                ) {
                                    decompressButton = button(
                                        {
                                            class: `${tableBodyCssBaseClass}__button--decompress`,
                                            dataDecompress: data,
                                        },
                                        [
                                            span({
                                                class: 'fa fa-expand',
                                            }),
                                        ]
                                    );
                                }

                                if (full.isFolder) {
                                    data = span(
                                        {
                                            class: `${tableBodyCssBaseClass}__folder`,
                                            dataName: full.path,
                                        },
                                        data
                                    );
                                }

                                return div(
                                    {
                                        class: `${tableBodyCssBaseClass}__name`,
                                    },
                                    [decompressButton, data]
                                );
                            }
                            return data;
                        },
                    },
                    {
                        targets: 3,
                        data: 'size',
                        type: 'num',
                        render: function (data, type) {
                            if (type === 'display') {
                                return StringUtil.readableBytes(Number(data));
                            }
                            return Number(data);
                        },
                    },
                    {
                        targets: 4,
                        data: 'mtime',
                        type: 'num',
                        render: function (data, type) {
                            if (type === 'display') {
                                return TimeFormat.getShortTimeStampStr(Number(data));
                            }
                            return data;
                        },
                    },
                    {
                        targets: 5,
                        createdCell: function (td) {
                            $(td)
                                .addClass(`${tableBodyCssBaseClass}__cell--import`)
                                .attr('role', 'option');
                        },
                        data: function (rowData) {
                            return !rowData.isFolder ? rowData.mappings : null;
                        },
                        render: function (data, _type, rowData) {
                            const fileOrFolder = !rowData.isFolder ? 'file' : 'folder';
                            const deleteBtn = button(
                                {
                                    dataDelete: rowData.path,
                                    class: `${tableBodyCssBaseClass}__button--delete`,
                                    role: 'button',
                                    ariaLabel: `Delete ${fileOrFolder}`,
                                    title: `Delete ${fileOrFolder}`,
                                },
                                span({ class: 'fa fa-trash' })
                            );

                            if (rowData.isFolder) {
                                return deleteBtn;
                            }
                            let uploaderOptions = uploaders.map((uploader) => {
                                return option(
                                    {
                                        value: uploader.id,
                                    },
                                    uploader.name
                                );
                            });
                            let mappedOptions = '';
                            if (data) {
                                mappedOptions = optgroup(
                                    {
                                        label: 'Suggested Types',
                                    },
                                    data.map((uploader) => {
                                        return option(
                                            {
                                                value: uploader.id,
                                            },
                                            stagingAreaViewer.uploaderNames[uploader.id]
                                        );
                                    })
                                );
                                uploaderOptions = optgroup(
                                    {
                                        label: 'Other Types',
                                    },
                                    uploaderOptions
                                );
                            }

                            const selectUploader = select({}, [
                                option(),
                                mappedOptions,
                                uploaderOptions,
                            ]);
                            const downloadBtn = button(
                                {
                                    dataDownload: rowData.path,
                                    class: `${tableBodyCssBaseClass}__button--download`,
                                    role: 'button',
                                    ariaLabel: 'Download Data',
                                    title: 'Download data',
                                },
                                span({ class: 'fa fa-download' })
                            );
                            return div(
                                {
                                    class: `${tableBodyCssBaseClass}__select_container`,
                                },
                                [selectUploader, downloadBtn, deleteBtn]
                            );
                        },
                    },
                ],
                createdRow: function (row, data) {
                    $(row)
                        .addClass('kb-staging-table__row')
                        .attr('data-file-path', data.path)
                        .attr('data-subdir', data.subdir);
                },
                rowCallback: function (row, data) {
                    const $rowCheckbox = $('td:eq(0)', row).find(
                        `.${cssBaseClass}-body__checkbox-input`
                    );
                    stagingAreaViewer.attachFileIconEvents($('td:eq(1)', row), data);
                    stagingAreaViewer.attachImportSelectionEvents(
                        $('td:eq(5)', row),
                        $rowCheckbox,
                        data
                    );
                    stagingAreaViewer.attachFileNameEvents($('td:eq(2)', row), data);

                    // attach events to the row checkbox
                    if (stagingAreaViewer.checkedFiles.has(data.path)) {
                        $rowCheckbox.prop('checked', true);
                    }
                    // bind the change event here so it gets triggered
                    // when selecting a type by the dropdown makes the change
                    $rowCheckbox.off('click change').on('click change', (e) => {
                        stagingAreaViewer.changeCheckboxState(e, data.path);
                    });
                },
            });

            stagingAreaViewer.updateTableDrawPath();
        },

        /*
            Used to manage the select all checkbox in the header
            has to be outside of the main DataTable call
            so that we can get entire table data
            not just what is drawn in the current dom
            aka dealing with pagination
        */
        selectAllOrNone: function (event) {
            const selectAllChecked = event.target.checked;

            //get all of the rows in the data table
            const nodes = this.fullDataTable.column(0).nodes();

            $(`input.${cssBaseClass}-body__checkbox-input:enabled`, nodes)
                .prop('checked', selectAllChecked)
                .attr('aria-checked', selectAllChecked)
                .change();
        },

        /**
         * When a checkbox is checked/unchecked, its path is added/removed from a state saving Set.
         * This way, when a data refresh happens, the right state can be applied to the checkbox.
         * This also updates the import button state: if any files are checked (i.e. included in the
         * checkedFiles Set) the import button is enabled.
         * @param {Event} event the change event fired on the checkbox
         * @param {string} filePath the full path for the file that was changed
         */
        changeCheckboxState: function (event, filePath) {
            const checked = event.currentTarget.checked;
            if (checked) {
                this.enableImportButton();
                this.checkedFiles.add(filePath);
            } else {
                this.checkedFiles.delete(filePath);
                // if we don't have any checked files, disable the import button
                if (!this.checkedFiles.size) {
                    this.disableImportButton();
                }
            }
        },

        attachFileNameEvents: function ($td, data) {
            $td.find(`.${cssBaseClass}-body__name`).tooltip({
                title: data.name,
                placement: 'top',
                delay: {
                    show: Config.get('tooltip').showDelay,
                    hide: Config.get('tooltip').hideDelay,
                },
            });

            $td.find(`span.${cssBaseClass}-body__folder`)
                .off('click')
                .on('click', (e) => {
                    $(e.currentTarget).off('click');
                    const separator = this.path.slice(-1) !== '/' ? '/' : '';
                    this.updatePathFn(this.path + separator + data.name);
                });

            $td.find('button[data-decompress]')
                .off('click')
                .on('click', (e) => {
                    const decompressButton = $(e.currentTarget);
                    decompressButton.replaceWith($.jqElem('i').addClass('fa fa-spinner fa-spin'));

                    this.stagingServiceClient
                        .decompress({
                            path: data.path,
                        })
                        .then(() => this.updateView())
                        .fail((xhr) => {
                            console.error('FAILED', xhr);
                            alert('Error ' + xhr.status + '\r' + xhr.responseText);
                        });
                });
        },

        /**
         *
         * @param {jquery element} $td the DOM element with the select box, download, and delete buttons
         * @param {object} data the file data for that row
         */
        attachImportSelectionEvents: function ($td, $checkboxElem, data) {
            // find the initial singly mapped datatype from the staging service
            const stagingAreaViewer = this;
            let suggestedType = null;
            if (data.mappings && data.mappings.length === 1) {
                suggestedType = data.mappings[0];
            }

            // find the element
            const importDropdown = $td.find('select');

            /**
             * When a data type is selected from the "Import As..." dropdown,
             * enable the checkbox for that row (so user can import).
             * Make sure the "select all" checkbox is also enabled.
             *
             * @param {string} dataType the identifier of what the data type is, e.g.: sra_reads
             * @param {boolean} check if true, checks the now-enabled checkbox. Should generally only
             *  be true if this is called from a user selection event.
             */
            function enableCheckboxes(dataType, check) {
                $td.find('.select2-selection').addClass(
                    `${cssBaseClass}-body__import-type-selected`
                );

                //make checkbox for that row enabled
                //also set the data type so that we have the reference later when importing
                $checkboxElem
                    .prop('disabled', false)
                    .attr('aria-label', 'Select to import file checkbox')
                    .attr('data-type', dataType);

                //make sure select all checkbox is enabled
                $('#staging_table_select_all')
                    .prop('disabled', false)
                    .attr('aria-label', 'Select to import all files checkbox');

                if (check) {
                    $checkboxElem.prop('checked', true).attr('aria-checked', true).change();
                    stagingAreaViewer.enableImportButton();
                }
            }

            const storedFileData = this.selectedFileTypes[data.path];
            // where we have data type set, render those dropdowns correctly
            if (storedFileData) {
                // tell select2 which option to set
                importDropdown
                    .select2({
                        containerCssClass: `${cssBaseClass}-body__import-dropdown`,
                    })
                    .val(storedFileData.dataType)
                    .trigger('change');
                //enable the checkboxes
                enableCheckboxes(storedFileData.dataType);
            } else if (suggestedType) {
                // otherwise we set the dropdowns with a placeholder
                // And if we have a suggested type, select it and enable the checkboxes
                importDropdown
                    .select2({
                        containerCssClass: `${cssBaseClass}-body__import-dropdown ${cssBaseClass}-body__import-type-selected`,
                        placeholder: 'make the empty option disappear',
                    })
                    .val(suggestedType.id)
                    .trigger('change');
                enableCheckboxes(suggestedType.id);
            } else {
                importDropdown.select2({
                    placeholder: 'Select a type',
                    containerCssClass: `${cssBaseClass}-body__import-dropdown`,
                });
            }

            // set the behavior on the import dropdown when a user selects a type
            importDropdown.off('select2:select').on('select2:select', (e) => {
                const dataType = e.currentTarget.value;

                // store the type we selected along with file data so we can persist on a view update
                data.dataType = dataType;
                this.selectedFileTypes[data.path] = data;

                enableCheckboxes(dataType, true);
            });

            $td.find('button[data-download]')
                .off('click')
                .on('click', () => {
                    const url = Config.url('staging_api_url') + '/download/' + data.path;
                    this.downloadFile(url);
                });

            $td.find('button[data-delete]')
                .off('click')
                .on('click', () => {
                    if (window.confirm('Really delete ' + data.path + '?')) {
                        this.stagingServiceClient
                            .delete({
                                path: data.path,
                            })
                            .then(() => {
                                // if the file was in any of the cached states - checked,
                                // open to show metadata, had type set - remove it from
                                // those structures
                                delete this.openFileInfo[data.path];
                                delete this.selectedFileTypes[data.path];
                                this.checkedFiles.delete(data.path);
                                if (!this.checkedFiles.size) {
                                    this.disableImportButton();
                                }
                                this.updateView();
                            })
                            .fail((xhr) => {
                                alert('Error ' + xhr.status + '\r' + xhr.responseText);
                            });
                    }
                });
        },

        /**
         *
         * @param {jquery element} $td the dom element with the file or folder icon
         * @param {object} data the file data for that row
         */
        attachFileIconEvents: function ($td, data) {
            if (data.isFolder) {
                $td.find('button[data-name]')
                    .off('click')
                    .on('click', (e) => {
                        $(e.currentTarget).off('click');
                        const separator = this.path.slice(-1) !== '/' ? '/' : '';
                        this.updatePathFn(this.path + separator + data.name);
                    });
                return;
            }

            // First, we find the expansion caret in the first cell.
            const $caret = $td.find('[data-caret]');

            $caret.off('click');

            // now, if there's openFileInfo on it, that means that the user had the detailed view open during a refresh.
            if ($caret.length && this.openFileInfo[data.path]) {
                //so we note that we've already loaded the info.
                data.loaded = this.openFileInfo[data.path].loaded;
                //toggle the caret
                $caret.toggleClass('fa-caret-down fa-caret-right');
                //and append the detailed view, which we do in a timeout in the next pass through to ensure that everything is properly here.
                setTimeout(() => {
                    $caret.parent().parent().after(this.renderMoreFileInfo(data));
                }, 0);
            }

            $caret.on('click', (e) => {
                const fileExpander = $(e.currentTarget);
                fileExpander.toggleClass('fa-caret-down fa-caret-right');
                const $tr = fileExpander.parent().parent();

                if (fileExpander.hasClass('fa-caret-down')) {
                    $('.kb-dropzone').css('min-height', '75px');
                    this.openFileInfo[data.path] = data;
                    $tr.after(this.renderMoreFileInfo(data));
                } else {
                    $('.kb-dropzone').css('min-height', '200px');
                    $tr.next().detach();
                    delete this.openFileInfo[data.path];
                }
            });
        },

        updateTableDrawPath: function () {
            if (!this.fullDataTable) {
                return;
            }
            const table = this.fullDataTable;
            $.fn.DataTable.ext.search.pop();

            $.fn.DataTable.ext.search.push((_settings, _data, dataIndex) => {
                if (_settings.nTable.id !== tableId) {
                    return true;
                }
                const row = table.row(dataIndex);
                if (row && row.node()) {
                    const subdir = row.node().getAttribute('data-subdir');
                    return subdir === this.path;
                }
                return true;
            });
            this.fullDataTable.draw();
        },

        /**
         *
         * @param {Object} fileData - file data object with attributes:
         *  - loaded: boolean
         *  - subpath: string
         *  - name: string
         *  -
         * @returns
         */
        renderMoreFileInfo: function (fileData) {
            const self = this;

            if (fileData.loaded) {
                return fileData.loaded;
            }

            const $tabsDiv = $.jqElem('div').append(
                '<span class="fa fa-spinner fa-spin"></span> Loading file info...please wait'
            );

            // define our tabs externally. This is so we can do our metadata call and our jgi_metadata call (in serial) and then update
            // the UI after they're completed. It's a smidgen slower this way (maybe 0.25 seconds) - we could load the metadata and display
            // it to the user immediately, then add the JGI tab if it exists. But that causes a brief blink where the JGI tab isn't there and
            // pops into being later. This way, it all shows up fully built. It seemed like the lesser of the evils.
            let $tabs;
            const filePath = fileData.path;

            this.stagingServiceClient
                .metadata({
                    path: filePath,
                })
                .then((dataString) => {
                    const $tabsContainer = $.jqElem('div');
                    const data = JSON.parse(dataString);

                    const fileMetadata = {
                        Name: data.name,
                        Created: TimeFormat.reformatDate(new Date(data.mtime)),
                        Size: StringUtil.readableBytes(Number(data.size)),
                        MD5: data.md5 || 'Not provided',
                    };

                    const lineCount = parseInt(data.lineCount, 10);
                    if (Number.isNaN(lineCount)) {
                        fileMetadata['Line count'] = 'Not provided';
                    } else {
                        fileMetadata['Line count'] = lineCount.toLocaleString();
                    }

                    if (data.UPA) {
                        const $upaField = $.jqElem('span').addClass('fa fa-spinner fa-spin');
                        self.workspaceClient
                            .get_object_info_new({
                                objects: [
                                    {
                                        ref: data.UPA,
                                    },
                                ],
                            })
                            .then((name) => {
                                $upaField.empty();
                                $upaField.append(
                                    $.jqElem('a')
                                        .attr('href', '/#dataview/' + data.UPA)
                                        .attr('target', '_blank')
                                        .append(name[0][1])
                                );
                            })
                            .catch((xhr) => {
                                $upaField.empty();
                                $upaField.addClass('alert alert-danger');
                                $upaField.append(xhr.error.message);
                            })
                            .finally(() => {
                                $upaField.removeClass('fa fa-spinner fa-spin');
                            });
                        fileMetadata['Imported as'] = $upaField;
                    }

                    const $fileDataDl = $.jqElem('dl').addClass(
                        `${fileMetadataCssBaseClass}__def_list`
                    );

                    ['Name', 'Created', 'Size', 'Line count', 'MD5', 'Imported as'].forEach(
                        (item) => {
                            if (fileMetadata[item]) {
                                $fileDataDl
                                    .append(
                                        $.jqElem('dt')
                                            .addClass(`${fileMetadataCssBaseClass}__term`)
                                            .append(item)
                                    )
                                    .append(
                                        $.jqElem('dd')
                                            .addClass(`${fileMetadataCssBaseClass}__def`)
                                            .append(fileMetadata[item])
                                    );
                            }
                        }
                    );

                    const notATextFile = data.head === 'not text file';

                    $tabs = new KBaseTabs($tabsContainer, {
                        tabs: [
                            {
                                tab: 'Info',
                                content: $fileDataDl,
                            },
                            {
                                tab: 'First 1024 chars',
                                content: notATextFile
                                    ? $.jqElem('div').append('Not a text file')
                                    : $.jqElem('div')
                                          .addClass(`${fileMetadataCssBaseClass}__file_lines`)
                                          .append(data.head),
                            },
                            {
                                tab: 'Last 1024 chars',
                                content: notATextFile
                                    ? $.jqElem('div').append('Not a text file')
                                    : $.jqElem('div')
                                          .addClass(`${fileMetadataCssBaseClass}__file_lines`)
                                          .append(data.tail),
                            },
                        ],
                    });

                    // attempt to load up a jgi metadata file, via the jgi-metadata endpoint. It'll only succeed if a jgi metadata file exists
                    // We can't do it in parallel, since if the metadata file doesn't exist the promise wouldn't properly complete.

                    self.stagingServiceClient
                        .jgi_metadata({
                            path: filePath,
                        })
                        .then((_dataString) => {
                            // XXX - while doing this, I ran into a NaN issue in the file, specifically on the key illumina_read_insert_size_avg_insert.
                            //  So we nuke any NaN fields to make it valid again.
                            const metadataJSON = JSON.parse(_dataString.replace(/NaN/g, '""'));
                            const metadataContents = JSON.stringify(metadataJSON, null, 2);

                            $tabs.addTab({
                                tab: 'JGI Metadata',
                                content: $.jqElem('div')
                                    .addClass(`${fileMetadataCssBaseClass}__file_lines`)
                                    .append(metadataContents),
                            });
                        })
                        // there's nothing to catch here - if the jgi_metadata method errors, we just assume the file doesn't have any.
                        .always(() => {
                            // finally, empty and append the tabs container. no matter what
                            $tabsDiv.empty();
                            $tabsDiv.append($tabsContainer);
                        });
                })
                .fail((xhr) => {
                    $tabsDiv.empty();
                    $tabsDiv.append(
                        $.jqElem('div')
                            .addClass('alert alert-danger')
                            .append('Error ' + xhr.status + '<br/>' + xhr.responseText)
                    );
                });

            return (fileData.loaded = $.jqElem('tr')
                .addClass(fileMetadataCssBaseClass)
                .append($.jqElem('td').attr('colspan', 6).append($tabsDiv)));
        },

        renderImportButton: function () {
            const importButton = $('<button></button>')
                .addClass(`${cssBaseClass}-import__button`)
                .text('Import Selected');

            this.$elem.find(`div.${cssBaseClass}-import`).append(importButton);

            /*
                By default import button is disabled until the user selects a data type
            */
            this.disableImportButton();
        },

        disableImportButton: function () {
            this.$elem
                .find(`button.${cssBaseClass}-import__button`)
                .attr('disabled', true)
                .tooltip({
                    title: 'Select a file/s to continue.',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay,
                    },
                    template: `<div class="${cssBaseClass}-import__tooltip tooltip" role="tooltip"><div class="tooltip-inner"></div></div>`,
                })
                .off('click');
        },

        enableImportButton: function () {
            this.$elem
                .find(`button.${cssBaseClass}-import__button`)
                .attr('disabled', false)
                .tooltip('disable')
                .off('click')
                .on('click keyPress', () => {
                    this.initImport();
                });
        },

        /**
         * Initializes the bulk import process. This takes the bulk-importer-supported types and
         * builds a Bulk Import cell to address them. Other types have one import app cell
         * generated for each.
         *
         * For example, if FASTQ files are supported by the bulk import cell, and you have
         * 10 of those selected, and 2 genomes, then a single Bulk import cell will be created for
         * the 10 FASTQ files, and 2 more cells are generated for each genome.
         *
         * If no files are selected by their checkbox, then no new cells will be created.
         *
         * Creating a new bulk import cell returns a Promise, so this returns a Promise.
         */
        initImport: function () {
            if (!this.fullDataTable) {
                return Promise.resolve();
            }
            const checkedBoxSelector = `input.${cssBaseClass}-body__checkbox-input:checked`;
            const selectedRows = this.fullDataTable.rows((_idx, _data, node) => {
                return !!node.querySelector(checkedBoxSelector);
            });
            const fileInfo = [];
            selectedRows.nodes().each((rowNode) => {
                const dataElem = rowNode.querySelector(checkedBoxSelector);
                fileInfo.push({
                    type: dataElem.getAttribute('data-type'),
                    name: dataElem.getAttribute('data-file-name'),
                });
            });

            return Import.setupImportCells(fileInfo)
                .then(() => {
                    Jupyter.narrative.hideOverlay();
                })
                .catch(Error.ImportSetupError, (error) => {
                    console.error(error.toString());
                    // make popup.
                    error.showErrorDialog();
                });
        },

        startTour: function () {
            if (!this.tour) {
                this.tour = new UploadTour.Tour(this.$elem.parent(), this.globus_name);
            }
            this.tour.start();
        },
    });
});
