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
    'jquery-dataTables',
    'select2',
], function (
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
    Workspace
) {
    'use strict';
    return new KBWidget({
        name: 'StagingAreaViewer',

        options: {
            refreshIntervalDuration: 30000,
        },

        init: function (options) {
            this._super(options);

            var runtime = Runtime.make();

            this.workspaceClient = new Workspace(Config.url('workspace'), {
                token: runtime.authToken(),
            });

            this.stagingServiceClient = new StagingServiceClient({
                root: Config.url('staging_api_url'),
                token: runtime.authToken()
            });

            this.ftpFileTableTmpl = Handlebars.compile(FtpFileTableHtml);
            this.ftpFileHeaderTmpl = Handlebars.compile(FtpFileHeaderHtml);
            this.filePathTmpl = Handlebars.compile(FilePathHtml);
            this.updatePathFn = options.updatePathFn || this.setPath;
            this.uploaders = Config.get('uploaders');
            this.userInfo = options.userInfo;

            // Get this party started.
            this.setPath(options.path);
            this.openFileInfo = {};

            return this;
        },

        activate: function () {
            this.render();
            if (!this.refreshInterval) {
                this.refreshInterval = setInterval(function () {
                    this.render();
                }.bind(this), this.options.refreshIntervalDuration);
            }
        },

        deactivate: function () {
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
                this.refreshInterval = undefined;
            }
        },

        render: function () {
            this.updateView();
        },

        updateView: function () {
            return this.stagingServiceClient.list({
                path: this.subpath
            })
                .then(function (data) {
                    //list is recursive, so it'd show all files in all subdirectories. This filters 'em out.
                    var files = JSON.parse(data).filter(function (f) {
                        // this is less complicated than you think. The path is the username, subpath, and name concatenated. The subpath may be empty
                        // so we filter it out and only join defined things. If that's the same as the file's path, we're at the right level. If not, we're not.
                        if ([this.userInfo.user, this.subpath, f.name].filter(function (p) {
                            return p.length > 0;
                        }).join('/') === f.path) {
                            return true;
                        } else {
                            return false;
                        }
                    }.bind(this));
                    files.forEach(function (f) {
                        if (!f.isFolder) {
                            f.imported = {};
                        }
                    });
                    var scrollTop = this.$elem.parent().scrollTop();
                    $('.staging-area-file-metadata').detach();
                    this.$elem.empty();
                    this.renderFileHeader();
                    this.renderFiles(files);
                    setTimeout(function () {
                        this.$elem.parent().scrollTop(scrollTop)
                    }.bind(this), 0);
                }.bind(this))
                .fail(function (xhr) {
                    this.$elem.empty();
                    this.$elem.append(
                        $.jqElem('div')
                            .addClass('alert alert-danger')
                            .append('Error ' + xhr.status + '<br/>' + xhr.responseText)
                    );
                }.bind(this));
        },

        /**
         * Expect that 'path' is only any subdirectories. The root directory is still the
         * user id.
         */
        setPath: function (path) {
            this.path = path;
            // factor out the current subdirectory path into its own variable
            var subpath = path.split('/');
            var subpathTokens = subpath.length - 1;
            if (this.path.startsWith('/')) {
                subpathTokens--;
            }
            this.subpath = subpath.slice(subpath.length - subpathTokens).join('/');
            this.updateView();
        },

        renderFileHeader: function () {
            this.$elem.append(this.ftpFileHeaderTmpl({userInfo: this.userInfo}));

            // Set up the link to the web upload app.
            this.$elem.find('.web_upload_div').click(function () {
                this.initImportApp('web_upload');
            }.bind(this));

            // Bind the help button to start the tour.
            this.$elem.find('button#help').click(function () {
                this.startTour();
            }.bind(this));
        },

        renderPath: function () {
            var splitPath = this.path;
            if (splitPath.startsWith('/')) {
                splitPath = splitPath.substring(1);
            }
            // the staging service doesn't want the username as part of the path, but we still want to display it to the user for navigation purposes
            splitPath = splitPath.split('/').filter(function (p) {
                return p.length
            });
            splitPath.unshift(this.userInfo.user);
            var pathTerms = [];
            for (var i = 0; i < splitPath.length; i++) {
                var prevPath = '';
                if (i > 0) {
                    prevPath = pathTerms[i - 1].subpath;
                }
                pathTerms[i] = {
                    term: splitPath[i],
                    subpath: prevPath + '/' + splitPath[i]
                };
            }
            pathTerms[0].subpath = '/';

            this.$elem.find('div.file-path').append(this.filePathTmpl({
                path: pathTerms
            }));
            this.$elem.find('div.file-path a').click(function (e) {
                this.updatePathFn($(e.currentTarget).data().element);
            }.bind(this));
            this.$elem.find('button#refresh').click(function () {
                this.updateView();
            }.bind(this));
        },

        renderFiles: function (files) {

            var parent = this.$elem.parent().get(0);

            var $fileTable = $(this.ftpFileTableTmpl({
                files: files,
                uploaders: this.uploaders.dropdown_order
            }));
            this.$elem.append($fileTable);
            this.$elem.find('table').dataTable({
                dom: '<"file-path pull-left">frtip',
                bAutoWidth: false,
                aaSorting: [
                    [3, 'desc']
                ],
                aoColumnDefs: [{
                    aTargets: [0],
                    mRender: function (data, type, full) {
                        if (type === 'display') {
                            var isFolder = data === 'true' ? true : false;
                            var icon = isFolder ? 'folder' : 'file-o';
                            var disp = '<span><i class="fa fa-' + icon + '"></i></span>';
                            if (isFolder) {
                                disp = '<button data-name="' + full[1] + '" class="btn btn-xs btn-default">' + disp + '</button>';
                            } else {
                                disp = "<i class='fa fa-caret-right' data-caret='" + full[1] + "' style='cursor : pointer'></i> " + disp;
                            }
                            return disp;
                        } else {
                            return data;
                        }
                    }
                }, {
                    aTargets: [1],
                    sClass: 'staging-name',
                    mRender: function (data, type, full) {
                        if (type === 'display') {

                            var decompressButton = '';

                            if (data.match(/\.(zip|tar\.gz|tgz|tar\.bz|tar\.bz2|tar|gz|bz2)$/)) {
                                decompressButton = "<button class='btn btn-default btn-xs' style='border : 1px solid #cccccc; border-radius : 1px' data-decompress='" + data + "'><i class='fa fa-expand'></i></button> ";
                            }

                            return '<div class="kb-data-staging-table-name">' + decompressButton +
                                data +
                                '</div>';
                        }
                        return data;
                    }
                }, {
                    aTargets: [2],
                    mRender: function (data, type) {
                        if (type === 'display') {
                            return StringUtil.readableBytes(Number(data));
                        } else {
                            return Number(data);
                        }
                    },
                    sType: 'numeric'
                }, {
                    aTargets: [3],
                    mRender: function (data, type) {
                        if (type === 'display') {
                            return TimeFormat.getShortTimeStampStr(Number(data));
                        } else {
                            return data;
                        }
                    },
                    sType: 'numeric'
                }],
                rowCallback: function (nRow, aData, iDisplayIndex, iDisplayIndexFull) {
                    var getFileFromName = function (fileName) {
                        return files.filter(function (file) {
                            return file.name === fileName;
                        })[0];
                    };

                    $('td:eq(1)', nRow).find('.kb-data-staging-table-name').tooltip({
                        title: $('td:eq(1)', nRow).find('.kb-data-staging-table-name').text(),
                        placement: 'top',
                        delay: {
                            show: Config.get('tooltip').showDelay,
                            hide: Config.get('tooltip').hideDelay
                        }
                    });
                    $('td:eq(4)', nRow).find('select').select2({
                        placeholder: 'Select format'
                    });
                    $('td:eq(4)', nRow).find('button[data-import]').off('click').on('click', function (e) {
                        var importType = $(e.currentTarget).prevAll('#import-type').val();
                        var importFile = getFileFromName($(e.currentTarget).data().import);
                        this.initImportApp(importType, importFile);
                        this.updateView();
                    }.bind(this));

                    $('td:eq(4)', nRow).find('button[data-download]').off('click').on('click', (e) => {
                        let file = $(e.currentTarget).data('download');
                        if (this.subpath) {
                            file = this.subpath + '/' + file;
                        }
                        const url = Config.url('staging_api_url') + '/download/' + file;
                        console.log(file);
                        let anchor = document.createElement('a');
                        anchor.setAttribute('target', '_blank');
                        anchor.setAttribute('href', url);
                        anchor.setAttribute('download', file);
                        anchor.click();
                        anchor.remove();
                    });

                    $('td:eq(4)', nRow).find('button[data-delete]').off('click').on('click', function (e) {
                        var file = $(e.currentTarget).data('delete');
                        if (window.confirm('Really delete ' + file + '?')) {
                            this.stagingServiceClient.delete({
                                path: this.subpath + '/' + file
                            }).then(function (d, s, x) {
                                this.updateView();
                            }.bind(this))
                                .fail(function (xhr) {
                                    alert('Error ' + xhr.status + '\r' + xhr.responseText);
                                }.bind(this));
                        }
                    }.bind(this));


                    $('td:eq(0)', nRow).find('button[data-name]').off('click').on('click', function (e) {
                        this.updatePathFn(this.path += '/' + $(e.currentTarget).data().name);
                    }.bind(this));

                    $('td:eq(0)', nRow).find('i[data-caret]').off('click');

                    // What a @#*$!ing PITA. First, we find the expansion caret in the first cell.
                    var $caret = $('td:eq(0)', nRow).find('i[data-caret]'),
                        fileName,
                        myFile;
                    if ($caret.length) {
                        //next, we use that caret to find the fileName, and the file Data.
                        fileName = $caret.data().caret;
                        myFile = getFileFromName(fileName);
                    }


                    //now, if there's openFileInfo on it, that means that the user had the detailed view open during a refresh.
                    if (fileName && this.openFileInfo[fileName]) {
                        //so we note that we've already loaded the info.
                        myFile.loaded = this.openFileInfo[fileName].loaded;
                        //toggle the caret
                        $caret.toggleClass('fa-caret-down fa-caret-right');
                        //and append the detailed view, which we do in a timeout in the next pass through to ensure that everything is properly here.
                        setTimeout(function () {
                            $caret.parent().parent().after(
                                this.renderMoreFileInfo(myFile)
                            )
                        }.bind(this), 0);

                    }

                    $('td:eq(0)', nRow).find('i[data-caret]').on('click', function (e) {

                        $(e.currentTarget).toggleClass('fa-caret-down fa-caret-right');
                        var $tr = $(e.currentTarget).parent().parent();

                        if ($(e.currentTarget).hasClass('fa-caret-down')) {
                            $('.kb-dropzone').css('min-height', '75px');
                            $('.dz-message').css('margin', '0em 0');
                            this.openFileInfo[fileName] = myFile;
                            $tr.after(
                                this.renderMoreFileInfo(myFile)
                            );
                        } else {
                            $('.kb-dropzone').css('min-height', '200px');
                            $('.dz-message').css('margin', '3em 0');
                            $tr.next().detach();
                            delete this.openFileInfo[fileName];
                        }
                    }.bind(this));

                    $('td:eq(1)', nRow).find('button[data-decompress]').off('click');
                    $('td:eq(1)', nRow).find('button[data-decompress]').on('click', function (e) {
                        var fileName = $(e.currentTarget).data().decompress;
                        var myFile = getFileFromName(fileName);

                        $(e.currentTarget).replaceWith($.jqElem('i').addClass('fa fa-spinner fa-spin'));

                        this.stagingServiceClient.decompress({
                            path: myFile.name
                        })
                            .then(function () {
                                this.updateView();
                            }.bind(this))
                            .fail(function (xhr) {
                                console.log("FAILED", xhr);
                                alert(xhr.responseText);
                            }.bind(this));

                    }.bind(this));
                }.bind(this)
            });
            this.renderPath();
        },

        renderMoreFileInfo: function (fileData) {

            var self = this;

            if (fileData.loaded) {
                return fileData.loaded;
            }

            var $tabsDiv = $.jqElem('div')
                .append('<i class="fa fa-spinner fa-spin"></i> Loading file info...please wait');

            var filePath = this.subpath;
            if (filePath.length) {
                filePath += '/';
            }

            filePath += fileData.name;

            // define our tabs externally. This is so we can do our metadata call and our jgi_metadata call (in serial) and then update
            // the UI after they're completed. It's a smidgen slower this way (maybe 0.25 seconds) - we could load the metadata and display
            // it to the user immediately, then add the JGI tab if it exists. But that causes a brief blink where the JGI tab isn't there and
            // pops into being later. This way, it all shows up fully built. It seemed like the lesser of the evils.
            var $tabs;

            this.stagingServiceClient.metadata({
                path: filePath
            })
                .then(function (dataString, status, xhr) {
                    var $tabsContainer = $.jqElem('div');
                    var data = JSON.parse(dataString);

                    var $upaField = $.jqElem('span')
                        .append('<i class="fa fa-spinner fa-spin">');

                    var $upa = data.UPA ?
                        $.jqElem('li').append($.jqElem('span').addClass('kb-data-staging-metadata-list').append('Imported as')).append($upaField) :
                        '';

                    self.workspaceClient.get_object_info_new({
                        objects: [{
                            ref: data.UPA
                        }]
                    })
                        .then(function (name) {
                            $upaField.empty();
                            $upaField.append(
                                $.jqElem('a')
                                    .attr('href', '/#dataview/' + data.UPA)
                                    .attr('target', '_blank')
                                    .append(name[0][1])
                            );
                        })
                        .catch(function (xhr) {
                            $upaField.empty();
                            $upaField.addClass('alert alert-danger');
                            $upaField.css({
                                padding: '0px',
                                margin: '0px'
                            });
                            $upaField.append(xhr.error.message);
                        });

                    var lineCount = parseInt(data.lineCount, 10);
                    if (!Number.isNaN(lineCount)) {
                        lineCount = lineCount.toLocaleString()
                    } else {
                        lineCount = 'Not provided';
                    }

                    $tabs = new KBaseTabs($tabsContainer, {
                        tabs: [{
                            tab: 'Info',
                            content: $.jqElem('ul')
                                .css('list-style', 'none')
                                .append($.jqElem('li').append($.jqElem('span').addClass('kb-data-staging-metadata-list').append('Name')).append(data.name))
                                .append($.jqElem('li').append($.jqElem('span').addClass('kb-data-staging-metadata-list').append('Created')).append(TimeFormat.reformatDate(new Date(data.mtime))))
                                .append($.jqElem('li').append($.jqElem('span').addClass('kb-data-staging-metadata-list').append('Size')).append(StringUtil.readableBytes(Number(data.size))))
                                .append($.jqElem('li').append($.jqElem('span').addClass('kb-data-staging-metadata-list').append('Line Count')).append(lineCount))
                                .append($.jqElem('li').append($.jqElem('span').addClass('kb-data-staging-metadata-list').append('MD5')).append(data.md5 || 'Not provided'))
                                .append($upa)
                        },
                        {
                            tab: 'First 10 lines',
                            content: $.jqElem('div')
                                .addClass('kb-data-staging-metadata-file-lines')
                                .append(data.head)
                        },
                        {
                            tab: 'Last 10 lines',
                            content: $.jqElem('div')
                                .addClass('kb-data-staging-metadata-file-lines')
                                .append(data.tail)
                        }]
                    });

                    // attempt to load up a jgi metadata file, via the jgi-metadata endpoint. It'll only succeed if a jgi metadata file exists
                    // We can't do it in parallel, since if the metadata file doesn't exist the promise wouldn't properly complete.

                    self.stagingServiceClient.jgi_metadata({
                        path: filePath
                    })
                        .then(function (dataString, status, xhr) {
                            // XXX - while doing this, I ran into a NaN issue in the file, specifically on the key illumina_read_insert_size_avg_insert.
                            //       So we nuke any NaN fields to make it valid again.
                            var metadataJSON = JSON.parse(dataString.replace(/NaN/g, '\"\"'));
                            var metadataContents = JSON.stringify(metadataJSON, null, 2)

                            $tabs.addTab({
                                tab: 'JGI Metadata',
                                content: $.jqElem('div')
                                    .addClass('kb-data-staging-metadata-file-lines')
                                    .append(metadataContents)
                            });
                        })
                        // there's nothing to catch here - if the jgi_metadata method errors, we just assume the file doesn't have any.
                        .always(function () {
                            // finally, empty and append the tabs container. no matter what
                            $tabsDiv.empty();
                            $tabsDiv.append($tabsContainer);
                        });

                })
                .fail(function (xhr) {
                    console.log("FAILED TO LOAD METADATA : ", fileData, xhr);
                    $tabsDiv.empty();
                    $tabsDiv.append(
                        $.jqElem('div')
                            .addClass('alert alert-danger')
                            .append('Error ' + xhr.status + '<br/>' + xhr.responseText)
                    );
                });

            return fileData.loaded = $.jqElem('tr')
                .addClass('staging-area-file-metadata')
                .append(
                    $.jqElem('td')
                        .attr('colspan', 5)
                        .css('vertical-align', 'top')
                        .append($tabsDiv)
                );
        },

        /**
         * Initializes an import app using the given file info as input.
         * Expects 'type' to match a KBase object type string that maps onto an importer.
         * Expects 'file' to be an object with the following attributes:
         *   name = string, name of the file
         */
        initImportApp: function (type, file) {
            var appInfo = this.uploaders.app_info[type];
            if (appInfo) {
                var tag = APIUtil.getAppVersionTag(),
                    fileParam = file ? file.name : '',
                    inputs = {};
                if (this.subpath) {
                    fileParam = this.subpath + '/' + file.name;
                }
                if (appInfo.app_input_param_type && appInfo.app_input_param_type === 'list') {
                    fileParam = [fileParam];
                }
                if (appInfo.app_input_param) {
                    inputs[appInfo.app_input_param] = fileParam;
                }
                if (appInfo.app_output_param) {
                    inputs[appInfo.app_output_param] = file.name.replace(/\s/g, '_') + appInfo.app_output_suffix;
                }
                if (appInfo.app_static_params) {
                    for (var p in appInfo.app_static_params) {
                        if (appInfo.app_static_params.hasOwnProperty(p)) {
                            inputs[p] = appInfo.app_static_params[p];
                        }
                    }
                }
                Jupyter.narrative.addAndPopulateApp(appInfo.app_id, tag, inputs);
                Jupyter.narrative.hideOverlay();
            }
        },

        startTour: function () {
            var tourStartFn = function () {}

            if (!this.tour) {
                this.tour = new UploadTour.Tour(
                    this.$elem.parent(), this.globus_name, tourStartFn, this.updateView.bind(this)
                );
            }
            this.tour.start();
        }
    });
});