define([
    'jquery',
    'kbaseTabs',
    'StagingServiceClient',
    'bluebird',
    'kbwidget',
    'narrativeConfig',
    'common/runtime',
    'base/js/namespace',
    'handlebars',
    'util/string',
    'util/timeFormat',
    './uploadTour',
    'util/kbaseApiUtil',
    'text!kbase/templates/data_staging/ftp_file_table.html',
    'text!kbase/templates/data_staging/ftp_file_header.html',
    'text!kbase/templates/data_staging/file_path.html',
    'kb_service/client/workspace',
    'uuid',
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
    Jupyter,
    Handlebars,
    StringUtil,
    TimeFormat,
    UploadTour,
    APIUtil,
    FtpFileTableHtml,
    FtpFileHeaderHtml,
    FilePathHtml,
    Workspace,
    UUID
) => {
    'use strict';
    const cssBaseClass = 'kb-staging-table',
        fileMetadataCssBaseClass = `${cssBaseClass}-file-metadata`;

    return new KBWidget({
        name: 'StagingAreaViewer',

        options: {
            refreshIntervalDuration: 30000,
            path: '/',
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
            this.bulkImportTypes = this.uploaders.bulk_import_types;
            this.userInfo = options.userInfo;

            // Get this party started.
            //setting first load so setPath doesn't call updateView() as that will happen via narrativeStagingDataTab
            this.firstLoad = true;
            this.setPath(options.path);
            this.openFileInfo = {};
            this.selectedFileTypes = {};

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
        },

        /**
         * Returns a Promise that resolves once the rendering is done.
         */
        render: function () {
            return this.updateView();
        },

        updateView: function () {
            return Promise.resolve(
                this.stagingServiceClient.list({
                    path: this.subpath,
                })
            )
                .then((data) => {
                    //list is recursive, so it'd show all files in all subdirectories. This filters 'em out.
                    const files = JSON.parse(data).filter((f) => {
                        // this is less complicated than you think. The path is the username,
                        // subpath, and name concatenated. The subpath may be empty so we
                        // filter it out and only join defined things. If that's the same as
                        // the file's path, we're at the right level. If not, we're not.
                        return (
                            [this.userInfo.user, this.subpath, f.name]
                                .filter((p) => p.length > 0)
                                .join('/') === f.path
                        );
                    });
                    files.forEach((f) => {
                        if (!f.isFolder) {
                            f.imported = {};
                        }
                    });
                    return this.identifyImporterMappings(files);
                })
                .then((files) => {
                    const scrollTop = this.$elem.parent().scrollTop();
                    $(`.${fileMetadataCssBaseClass}`).detach();
                    this.$elem.empty();
                    this.renderFileHeader();
                    this.renderFiles(files);

                    setTimeout(() => {
                        this.$elem.parent().scrollTop(scrollTop);
                    }, 0);
                })
                .catch((xhr) => {
                    console.error('Staging area failure:', xhr);
                    this.$elem.empty();
                    this.renderFileHeader();
                    this.renderError(
                        xhr.responseText
                            ? xhr.responseText
                            : 'Unknown error - directory was not found, or may have been deleted'
                    );
                })
                .finally(() => {
                    this.renderPath();
                    this.renderImportButton();
                });
        },

        /**
         * Expect that 'path' is only any subdirectories. The root directory is still the
         * user id.
         */
        setPath: function (path) {
            this.path = path;
            // factor out the current subdirectory path into its own variable
            const subpath = path.split('/');
            let subpathTokens = subpath.length - 1;
            if (this.path.startsWith('/')) {
                subpathTokens--;
            }
            this.subpath = subpath.slice(subpath.length - subpathTokens).join('/');

            //we don't need to call to update the view if it's the first time as narrative staging data tab will do the rendering for us
            if (this.firstLoad) {
                this.firstLoad = false;
            } else {
                return this.updateView();
            }
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
                this.initImportApp('web_upload');
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
            // the staging service doesn't want the username as part of the path, but we still want to display it to the user for navigation purposes
            splitPath = splitPath.split('/').filter((p) => p.length);
            splitPath.unshift(this.userInfo.user);
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
            pathTerms[0].subpath = '/';

            this.$elem.find('div.file-path').append(
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

        identifyImporterMappings: function (stagingFiles) {
            /*
                Add a list of top matches for each file, sorted by weight
            */
            const fileNames = stagingFiles.map((f) => f['path']);
            const fileList = $.param({ file_list: fileNames }, true);
            let mappings = [];
            return Promise.resolve(
                this.stagingServiceClient.importer_mappings({
                    file_list: fileList,
                })
            )
                .then((data) => {
                    //Extract mappings, sort by weight, assign mappings to staging files
                    mappings = JSON.parse(data)['mappings'];
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
            files = files || [];
            const emptyMsg = 'No files found.';

            const $fileTable = $(
                stagingAreaViewer.ftpFileTableTmpl({
                    files: files,
                    uploaders: stagingAreaViewer.uploaders.dropdown_order,
                })
            );

            stagingAreaViewer.$elem.append($fileTable);

            stagingAreaViewer.fullDataTable = stagingAreaViewer.$elem.find('table').DataTable({
                language: {
                    emptyTable: emptyMsg,
                },
                dom: '<"file-path pull-left">frtip',
                autoWidth: false,
                order: [[4, 'desc']],
                headerCallback: function (thead) {
                    $(thead)
                        .find('th')
                        .eq(0)
                        .on('click keyPress', (e) => {
                            selectAllOrNone(e);
                        });
                },
                columnDefs: [
                    {
                        targets: 0,
                        orderable: false,
                        searchable: false,
                        render: function (data) {
                            const fileId = new UUID(4).format();
                            //render checkboxes disabled until the user selects a type
                            return (
                                `<input class="${cssBaseClass}-body__checkbox-input"` +
                                'type="checkbox" role="checkbox" disabled=true ' +
                                'aria-checked="false" tabindex="0"' +
                                'aria-label="Select to import file checkbox: disabled until at least one data type is selected"' +
                                'data-file-name="' +
                                data +
                                '"' +
                                'id="' +
                                fileId +
                                '">'
                            );
                        },
                    },
                    {
                        targets: 1,
                        render: function (data, type, full) {
                            if (type === 'display') {
                                const isFolder = data === 'true' ? true : false;
                                const icon = isFolder ? 'folder' : 'file-o';
                                const disp = '<span class="fa fa-' + icon + '"></span>';
                                if (isFolder) {
                                    return (
                                        '<button data-name="' +
                                        full[0] +
                                        `" class="${cssBaseClass}-body__button--${icon}">` +
                                        disp +
                                        '</button>'
                                    );
                                }

                                return (
                                    '<span class="fa fa-caret-right kb-pointer" data-caret="' +
                                    full[0] +
                                    '"></span> ' +
                                    disp
                                );
                            }
                            return data;
                        },
                    },
                    {
                        targets: 2,
                        render: function (data, type, full) {
                            if (type === 'display') {
                                let decompressButton = '';

                                if (
                                    data.match(/\.(zip|tar\.gz|tgz|tar\.bz|tar\.bz2|tar|gz|bz2)$/)
                                ) {
                                    decompressButton =
                                        `<button class="${cssBaseClass}-body__button--decompress" data-decompress="` +
                                        data +
                                        '"><span class="fa fa-expand"></span></button>';
                                }

                                if (full[1] === 'true') {
                                    data =
                                        `<span class="${cssBaseClass}-body__folder" data-name="` +
                                        data +
                                        '">' +
                                        data +
                                        '</span>';
                                }

                                return (
                                    `<div class="${cssBaseClass}-body__name">` +
                                    decompressButton +
                                    data +
                                    '</div>'
                                );
                            }
                            return data;
                        },
                    },
                    {
                        targets: 3,
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
                        type: 'num',
                        render: function (data, type) {
                            if (type === 'display') {
                                return TimeFormat.getShortTimeStampStr(Number(data));
                            }
                            return data;
                        },
                    },
                ],
                rowCallback: function (row, data) {
                    const getFileFromName = function (fileData) {
                        return files.filter((file) => {
                            return file.name === fileData;
                        })[0];
                    };

                    //get the file (or folder) name for this row
                    const rowFileName = data[2];
                    //use the name to look up all the data we have
                    const rowFileData = getFileFromName(rowFileName);

                    //find the initial singly mapped datatype from the staging service
                    const suggestedTypes = $(data[5]).find('optgroup[label="Suggested Types"]');
                    let suggestedType = null;
                    if (suggestedTypes.children().length == 1) {
                        const option = suggestedTypes.find('option');
                        suggestedType = { id: option.val(), title: option.html() };
                    }

                    //Get selected
                    function changeImportButton(event) {
                        const checked = event.currentTarget.checked;
                        if (checked) {
                            stagingAreaViewer.enableImportButton();
                        } else {
                            /*
                            check state of all checkboxes
                            if any are checked we leave import button enabled
                            */
                            const anyCheckedBoxes = $(
                                `input.${cssBaseClass}-body__checkbox-input:checked`
                            );

                            if (!anyCheckedBoxes.length) {
                                stagingAreaViewer.disableImportButton();
                            }
                        }
                    }

                    $('td:eq(0)', row)
                        .find(`input.${cssBaseClass}-body__checkbox-input`)
                        .off('click')
                        .on('click keyPress', (e) => {
                            changeImportButton(e);
                        });

                    $('td:eq(1)', row)
                        .find('button[data-name]')
                        .off('click')
                        .on('click', (e) => {
                            $(e.currentTarget).off('click');
                            stagingAreaViewer.updatePathFn((this.path += '/' + rowFileName));
                        });

                    //First, we find the expansion caret in the first cell.
                    const $caret = $('td:eq(1)', row).find('[data-caret]');

                    $caret.off('click');

                    //now, if there's openFileInfo on it, that means that the user had the detailed view open during a refresh.
                    if ($caret.length && stagingAreaViewer.openFileInfo[rowFileName]) {
                        //so we note that we've already loaded the info.
                        rowFileData.loaded = stagingAreaViewer.openFileInfo[rowFileName].loaded;
                        //toggle the caret
                        $caret.toggleClass('fa-caret-down fa-caret-right');
                        //and append the detailed view, which we do in a timeout in the next pass through to ensure that everything is properly here.
                        setTimeout(() => {
                            $caret
                                .parent()
                                .parent()
                                .after(stagingAreaViewer.renderMoreFileInfo(rowFileData));
                        }, 0);
                    }

                    $caret.on('click', (e) => {
                        const fileExpander = $(e.currentTarget);
                        fileExpander.toggleClass('fa-caret-down fa-caret-right');
                        const $tr = fileExpander.parent().parent();

                        if (fileExpander.hasClass('fa-caret-down')) {
                            $('.kb-dropzone').css('min-height', '75px');
                            stagingAreaViewer.openFileInfo[rowFileName] = rowFileData;
                            $tr.after(this.renderMoreFileInfo(rowFileData));
                        } else {
                            $('.kb-dropzone').css('min-height', '200px');
                            $tr.next().detach();
                            delete stagingAreaViewer.openFileInfo[rowFileName];
                        }
                    });

                    $('td:eq(2)', row)
                        .find(`.${cssBaseClass}-body__name`)
                        .tooltip({
                            title: rowFileName,
                            placement: 'top',
                            delay: {
                                show: Config.get('tooltip').showDelay,
                                hide: Config.get('tooltip').hideDelay,
                            },
                        });

                    $('td:eq(2)', row)
                        .find(`span.${cssBaseClass}-body__folder`)
                        .off('click')
                        .on('click', (e) => {
                            $(e.currentTarget).off('click');
                            this.updatePathFn((this.path += '/' + rowFileName));
                        });

                    $('td:eq(2)', row)
                        .find('button[data-decompress]')
                        .off('click')
                        .on('click', (e) => {
                            const decompressButton = $(e.currentTarget);
                            decompressButton.replaceWith(
                                $.jqElem('i').addClass('fa fa-spinner fa-spin')
                            );

                            stagingAreaViewer.stagingServiceClient
                                .decompress({
                                    path: rowFileName,
                                })
                                .then(() => stagingAreaViewer.updateView())
                                .fail((xhr) => {
                                    console.error('FAILED', xhr);
                                    alert('Error ' + xhr.status + '\r' + xhr.responseText);
                                });
                        });

                    // find the element
                    const importDropdown = $('td:eq(5)', row).find('select');

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
                        $('td:eq(5)', row)
                            .find('.select2-selection')
                            .addClass(`${cssBaseClass}-body__import-type-selected`);

                        //make checkbox for that row enabled
                        //also set the data type so that we have the reference later when importing
                        $('td:eq(0)', row)
                            .find(`.${cssBaseClass}-body__checkbox-input`)
                            .prop('disabled', false)
                            .attr('aria-label', 'Select to import file checkbox')
                            .attr('data-type', dataType);

                        //make sure select all checkbox is enabled
                        $('#staging_table_select_all')
                            .prop('disabled', false)
                            .attr('aria-label', 'Select to import all files checkbox');

                        if (check) {
                            $('td:eq(0)', row)
                                .find(`.${cssBaseClass}-body__checkbox-input`)
                                .prop('checked', true)
                                .attr('aria-checked', true);
                            stagingAreaViewer.enableImportButton();
                        }
                    }

                    const storedFileData = stagingAreaViewer.selectedFileTypes[rowFileName];
                    //where we have data type set, render those dropdowns correctly
                    if (storedFileData) {
                        //tell select2 which option to set
                        importDropdown
                            .select2({
                                containerCssClass: `${cssBaseClass}-body__import-dropdown`,
                            })
                            .val(storedFileData.dataType)
                            .trigger('change');
                        //enable the checkboxes
                        enableCheckboxes(storedFileData.dataType);
                    }

                    //otherwise we set the dropdowns with a placeholder
                    else {
                        // And if we have a suggested type, select it and enable the checkboxes
                        if (suggestedType) {
                            importDropdown
                                .select2({
                                    containerCssClass: `${cssBaseClass}-body__import-dropdown ${cssBaseClass}-body__import-type-selected`,
                                    placeholder: 'make the empty option disappear',
                                })
                                .val(suggestedType.id)
                                .trigger('change')
                                .trigger({
                                    type: 'select2:select',
                                });
                            enableCheckboxes(suggestedType.id);
                        } else {
                            importDropdown.select2({
                                placeholder: 'Select a type',
                                containerCssClass: `${cssBaseClass}-body__import-dropdown`,
                            });
                        }
                    }

                    //set the behavior on the import dropdown when a user selects a type
                    importDropdown.on('select2:select', (e) => {
                        const dataType = e.currentTarget.value;

                        //store the type we selected along with file data so we can persist on a view update
                        rowFileData.dataType = dataType;
                        stagingAreaViewer.selectedFileTypes[rowFileName] = rowFileData;

                        enableCheckboxes(dataType, true);
                    });

                    $('td:eq(5)', row)
                        .find('button[data-import]')
                        .off('click')
                        .on('click', (e) => {
                            const dataImportButton = $(e.currentTarget);
                            const importType = dataImportButton.prevAll('select').val();
                            stagingAreaViewer.initImportApp(importType, rowFileName);
                            stagingAreaViewer.updateView();
                        });

                    $('td:eq(5)', row)
                        .find('button[data-download]')
                        .off('click')
                        .on('click', () => {
                            let filePath = rowFileName;

                            if (stagingAreaViewer.subpath) {
                                filePath = stagingAreaViewer.subpath + '/' + rowFileName;
                            }

                            const url = Config.url('staging_api_url') + '/download/' + filePath;
                            stagingAreaViewer.downloadFile(url);
                        });

                    $('td:eq(5)', row)
                        .find('button[data-delete]')
                        .off('click')
                        .on('click', () => {
                            if (window.confirm('Really delete ' + rowFileName + '?')) {
                                stagingAreaViewer.stagingServiceClient
                                    .delete({
                                        path: stagingAreaViewer.subpath + '/' + rowFileName,
                                    })
                                    .then(() => {
                                        stagingAreaViewer.updateView();
                                    })
                                    .fail((xhr) => {
                                        alert('Error ' + xhr.status + '\r' + xhr.responseText);
                                    });
                            }
                        });
                }.bind(stagingAreaViewer),
            });

            /*
                Used to manage the select all checkbox in the header
                has to be outside of the main DataTable call
                so that we can get entire table data
                not just what is drawn in the current dom
                aka dealing with pagination
            */
            function selectAllOrNone(event) {
                const selectAllChecked = event.target.checked;

                //get all of the rows in the data table
                const nodes = fullDataTable.fnGetNodes();

                $(`input.${cssBaseClass}-body__checkbox-input:enabled`, nodes)
                    .prop('checked', selectAllChecked)
                    .attr('aria-checked', selectAllChecked);

                //enable or disable import appropriately
                if (selectAllChecked) {
                    stagingAreaViewer.enableImportButton();
                } else {
                    stagingAreaViewer.disableImportButton();
                }
            }
        },

        renderMoreFileInfo: function (fileData) {
            const self = this;

            if (fileData.loaded) {
                return fileData.loaded;
            }

            const $tabsDiv = $.jqElem('div').append(
                '<span class="fa fa-spinner fa-spin"></span> Loading file info...please wait'
            );

            let filePath = this.subpath;
            if (filePath.length) {
                filePath += '/';
            }

            filePath += fileData.name;

            // define our tabs externally. This is so we can do our metadata call and our jgi_metadata call (in serial) and then update
            // the UI after they're completed. It's a smidgen slower this way (maybe 0.25 seconds) - we could load the metadata and display
            // it to the user immediately, then add the JGI tab if it exists. But that causes a brief blink where the JGI tab isn't there and
            // pops into being later. This way, it all shows up fully built. It seemed like the lesser of the evils.
            let $tabs;

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
            const stagingAreaViewer = this;

            this.$elem
                .find(`button.${cssBaseClass}-import__button`)
                .attr('disabled', false)
                .tooltip('disable')
                .off('click')
                .on('click keyPress', () => {
                    stagingAreaViewer.initBulkImport();
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
        initBulkImport: function () {
            const stagingAreaViewer = this;
            /*
             * We're building up a structure like this to send to the
             * bulk import cell initializer:
             * {
             *   fileType: {
             *     appId: string,
             *     files: list of files
             *   }
             * }
             */
            const bulkMapping = {};
            // get all of the selected checkbox file names and import type

            const checkedBoxSelector = `input.${cssBaseClass}-body__checkbox-input:checked`;
            const selectedRows = stagingAreaViewer.fullDataTable.rows((idx, data, node) => {
                return !!node.querySelector(checkedBoxSelector);
            });
            selectedRows.nodes().each((rowNode) => {
                const dataElem = rowNode.querySelector(checkedBoxSelector);
                const importType = $(dataElem).attr('data-type');
                let importFile = $(dataElem).attr('data-file-name');
                if (stagingAreaViewer.bulkImportTypes.includes(importType)) {
                    if (!(importType in bulkMapping)) {
                        bulkMapping[importType] = {
                            appId: stagingAreaViewer.uploaders.app_info[importType].app_id,
                            files: [],
                        };
                    }
                    if (stagingAreaViewer.subpath) {
                        importFile = stagingAreaViewer.subpath + '/' + importFile;
                    }
                    bulkMapping[importType].files.push(importFile);
                } else {
                    stagingAreaViewer.initImportApp(importType, importFile);
                }
            });
            Jupyter.narrative.hideOverlay();
            if (Object.keys(bulkMapping).length) {
                return Jupyter.narrative.insertBulkImportCell(bulkMapping);
            } else {
                return Promise.resolve();
            }
        },

        /**
         * Initializes an import app using the given file info as input.
         * Expects 'type' to match a KBase object type string that maps onto an importer.
         * Expects 'file' to be a string that is the name of the file
         */
        initImportApp: function (type, file) {
            const appInfo = this.uploaders.app_info[type];
            if (appInfo) {
                const tag = APIUtil.getAppVersionTag();
                let fileParam = file || '';
                const inputs = {};

                if (this.subpath) {
                    fileParam = this.subpath + '/' + file;
                }

                if (appInfo.app_input_param_type && appInfo.app_input_param_type === 'list') {
                    fileParam = [fileParam];
                }

                if (appInfo.app_input_param) {
                    inputs[appInfo.app_input_param] = fileParam;
                }

                if (appInfo.app_output_param) {
                    inputs[appInfo.app_output_param] =
                        file.replace(/\s/g, '_') + appInfo.app_output_suffix;
                }

                if (appInfo.app_static_params) {
                    for (const p of Object.keys(appInfo.app_static_params)) {
                        inputs[p] = appInfo.app_static_params[p];
                    }
                }

                Jupyter.narrative.addAndPopulateApp(appInfo.app_id, tag, inputs);
                Jupyter.narrative.hideOverlay();
            }
        },

        startTour: function () {
            if (!this.tour) {
                this.tour = new UploadTour.Tour(this.$elem.parent(), this.globus_name);
            }
            this.tour.start();
        },
    });
});
