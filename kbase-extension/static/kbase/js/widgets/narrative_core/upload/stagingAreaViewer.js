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
    'util/bootstrapDialog',
    'text!kbase/templates/data_staging/ftp_file_table.html',
    'text!kbase/templates/data_staging/ftp_file_header.html',
    'text!kbase/templates/data_staging/file_path.html',
    'kb_service/client/workspace',
    'api/auth',
    'jquery-dataTables',
    'select2',
], function(
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
    BootstrapDialog,
    FtpFileTableHtml,
    FtpFileHeaderHtml,
    FilePathHtml,
    Workspace,
    Auth
) {
    'use strict';
    return new KBWidget({
        name: 'StagingAreaViewer',

        init: function(options) {

            this._super(options);

            var runtime = Runtime.make();

            this.workspaceClient = new Workspace(Config.url('workspace'), {
              token: runtime.authToken(),
            });

            this.stagingServiceClient = new StagingServiceClient({
                root : Config.url('staging_api_url'),
                token : runtime.authToken()
            });

            this.ftpFileTableTmpl = Handlebars.compile(FtpFileTableHtml);
            this.ftpFileHeaderTmpl = Handlebars.compile(FtpFileHeaderHtml);
            this.filePathTmpl = Handlebars.compile(FilePathHtml);
            this.updatePathFn = options.updatePathFn || this.setPath;
            this.uploaders = Config.get('uploaders');
            this.userId = runtime.userId();

            var self = this; // GAH I miss fat arrow functions.
            this.authClient = Auth.make({url: Config.url('auth')});
            this.authClient.getCurrentProfile( runtime.authToken() ).then( function(res) {

              // check out the identities available for the user - if globus is a provider, then hang onto the user name and re-render the page.
              res.idents.forEach( function(i) {
                if (i.provider === 'Globus') {
                  self.globus_name = res.user;
                  this.render();
                }
              });
            })
            .catch(function(xhr) {
              // we really don't care here, honestly. If the auth service fails, it'll just prevent the globus link from showing up.
            });

            // Get this party started.
            this.setPath(options.path);
            return this;
        },

        render: function() {
            this.updateView();
        },

        updateView: function() {
            return this.stagingServiceClient.list({path: this.subpath})
                .then(function(data) {
                    var files = JSON.parse(data);
                    files.forEach(function(f) {
                        if (!f.isFolder) {
                            f.imported = {};
                        }
                    });
                    this.$elem.empty();
                    this.renderFileHeader();
                    this.renderFiles(files);
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
        setPath: function(path) {
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

        renderFileHeader: function() {
            this.$elem.append(this.ftpFileHeaderTmpl());

            if (this.globus_name) {
              var $globus_link = this.$elem.find('.globus_link');
              var href = $globus_link.attr('href');
              href += this.globus_name;
              $globus_link.attr('href', href);
            }
            else {
              this.$elem.find('.globus_div').remove();
            }
            this.$elem.find('button#help').click(function() {
                this.startTour();
            }.bind(this));
        },

        renderPath: function() {
            var splitPath = this.path;
            if (splitPath.startsWith('/')) {
                splitPath = splitPath.substring(1);
            }
            splitPath = splitPath.split('/');
            var pathTerms = [];
            for (var i=0; i<splitPath.length; i++) {
                var prevPath = '';
                if (i > 0) {
                    prevPath = pathTerms[i-1].subpath;
                }
                pathTerms[i] = {
                    term: splitPath[i],
                    subpath: prevPath + '/' + splitPath[i]
                };
            }
            this.$elem.find('div.file-path').append(this.filePathTmpl({path: pathTerms}));
            this.$elem.find('div.file-path a').click(function(e) {
                this.updatePathFn($(e.currentTarget).data().element);
            }.bind(this));
            this.$elem.find('button#refresh').click(function() {
                this.updateView();
            }.bind(this));
        },

        renderFiles: function(files) {
            var $fileTable = $(this.ftpFileTableTmpl({files: files, uploaders: this.uploaders.dropdown_order}));
            this.$elem.append($fileTable);
            this.$elem.find('table').dataTable({
                dom: '<"file-path pull-left">frtip',
                bAutoWidth: false,
                aaSorting: [[3, 'desc']],
                aoColumnDefs: [{
                    aTargets: [ 0 ],
                    mRender: function(data, type, full) {
                        if (type === 'display') {
                            var isFolder = data === 'true' ? true : false;
                            var icon = isFolder ? 'folder' : 'file-o';
                            var disp = '<span><i class="fa fa-' + icon + '"></i></span>';
                            if (isFolder) {
                                disp = '<button data-name="' + full[1] + '" class="btn btn-xs btn-default">' + disp + '</button>';
                            }
                            else {
                              disp = "<i class='fa fa-caret-right' data-caret='" + full[1] + "' style='cursor : pointer'></i> " + disp;
                            }
                            return disp;
                        } else {
                            return data;
                        }
                    }
                }, {
                    aTargets: [ 1 ],
                    sClass: 'staging-name',
                    mRender: function(data, type, full) {
                        if (type === 'display') {

                            var decompressButton = '';

                            if (data.match(/\.(zip|tar\.gz|tgz|tar\.bz|tar\.bz2|tar|gz|bz2)$/)) {
                              decompressButton = " <button class='btn btn-default btn-xs' style='border : 1px solid #cccccc; border-radius : 1px' data-decompress='" + data + "'><i class='fa fa-expand'></i>";
                            }

                            return '<div class="kb-data-staging-table-name">' + data
                              + decompressButton
                            + '</div>';
                        }
                        return data;
                    }
                }, {
                    aTargets: [ 2 ],
                    mRender: function(data, type) {
                        if (type === 'display') {
                            return StringUtil.readableBytes(Number(data));
                        } else {
                            return Number(data);
                        }
                    },
                    sType: 'numeric'
                }, {
                    aTargets: [ 3 ],
                    mRender: function(data, type) {
                        if (type === 'display') {
                            return TimeFormat.getShortTimeStampStr(Number(data));
                        } else {
                            return data;
                        }
                    },
                    sType: 'numeric'
                }],
                rowCallback: function(nRow, aData, iDisplayIndex, iDisplayIndexFull) {
                    var getFileFromName = function(fileName) {
                        return files.filter(function(file) {
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
                        placeholder: 'Select a format'
                    });
                    $('td:eq(4)', nRow).find('button[data-import]').off('click').on('click', function(e) {
                        var importType = $(e.currentTarget).prevAll('#import-type').val();
                        var importFile = getFileFromName($(e.currentTarget).data().import);
                        this.initImportApp(importType, importFile);
                        this.updateView();
                    }.bind(this));
                    $('td:eq(0)', nRow).find('button[data-name]').off('click').on('click', function(e) {
                        this.updatePathFn(this.path += '/' + $(e.currentTarget).data().name);
                    }.bind(this));

                    $('td:eq(0)', nRow).find('i[data-caret]').off('click');
                    $('td:eq(0)', nRow).find('i[data-caret]').on('click', function(e) {
                        var fileName = $(e.currentTarget).data().caret;
                        var myFile = getFileFromName(fileName);

                        $(e.currentTarget).toggleClass('fa-caret-down fa-caret-right');
                        var $tr = $(e.currentTarget).parent().parent();

                        if ($(e.currentTarget).hasClass('fa-caret-down')) {
                          $('.kb-dropzone').css('min-height', '75px');
                          $('.dz-message').css('margin', '0em 0');
                          $tr.after(
                            this.renderMoreFileInfo( myFile )
                          );
                        }
                        else {
                          $('.kb-dropzone').css('min-height', '200px');
                          $('.dz-message').css('margin', '3em 0');
                          $tr.next().remove();
                        }
                    }.bind(this));

                    $('td:eq(1)', nRow).find('button[data-decompress]').off('click');
                    $('td:eq(1)', nRow).find('button[data-decompress]').on('click', function(e) {
                        var fileName = $(e.currentTarget).data().decompress;
                        var myFile = getFileFromName(fileName);

                        this.stagingServiceClient.decompress({ path : myFile.name })
                            .then(function(data) {
                              this.updateView();
                            }.bind(this))
                            .fail(function (xhr) {
                              console.log("FAILED", xhr);
                              alert(xhr.responseText);
                            }.bind(this));

                    }.bind(this));
                }.bind(this)
            });
            // this.$elem.find('table button[data-report]').on('click', function(e) {
            //     alert("Show report for reference '" + $(e.currentTarget).data().report + "'");
            // });
            this.renderPath();
        },

        renderMoreFileInfo : function (fileData) {

          var self = this;

          if (fileData.loaded) {
            return fileData.loaded;
          }

          var $tabsDiv = $.jqElem('div')
            .css({'width' : '90%', display : 'inline-block'})
            .append('Loading file info...please wait');

          var filePath = this.subpath;
          if (filePath.length) {
              filePath += '/';
          }

          // we need to chop up the file to see if a metadata file exists. Assume that the first part of the file name is the ID
          // and that it ends in .metadata. Route it into the appropriate subfolder.
          var fileParts = fileData.name.split('.');
          var metaDataFilePath = filePath + fileParts[0] + '.metadata';

          filePath += fileData.name;

          this.stagingServiceClient.metadata({ path : filePath }).then( function(dataString, status, xhr) {
            $tabsDiv.empty();
            var data = JSON.parse(dataString);

            var $upaField = $.jqElem('span')
              .append('<i class="fa fa-spinner fa-spin">')
            ;

            var $upa = data.UPA
              ? $.jqElem('li').append($.jqElem('span').addClass('kb-data-staging-metadata-list').append('Imported as')).append($upaField )
              : '';

            self.workspaceClient.get_object_info_new({ objects : [{ref : data.UPA}] } )
              .then( function (name) {
                $upaField.empty();
                $upaField.append(
                  $.jqElem('a')
                    .attr('href', '/#dataview/' + data.UPA)
                    .attr('target', '_blank')
                    .append(name[0][1])
                );
              })
            .catch(function(xhr) {
              $upaField.empty();
              $upaField.addClass('alert alert-danger');
              $upaField.css({padding : '0px', margin : '0px'});
              $upaField.append(xhr.error.message);
            });

            var lineCount = parseInt(data.lineCount, 10);
            if (!Number.isNaN(lineCount)) {
              lineCount = lineCount.toLocaleString()
            }
            else {
              lineCount = 'Not provided';
            }

            var $tabs = new KBaseTabs($tabsDiv, {
              tabs : [
                {
                  tab : 'Info',
                  content :
                    $.jqElem('ul')
                      .css('list-style', 'none')
                      .append( $.jqElem('li').append($.jqElem('span').addClass('kb-data-staging-metadata-list').append('Name')).append(data.name) )
                      .append( $.jqElem('li').append($.jqElem('span').addClass('kb-data-staging-metadata-list').append('Created')).append(TimeFormat.reformatDate(new Date(data.mtime)) ) )
                      .append( $.jqElem('li').append($.jqElem('span').addClass('kb-data-staging-metadata-list').append('Size')).append(StringUtil.readableBytes(Number(data.size)) ) )
                      .append( $.jqElem('li').append($.jqElem('span').addClass('kb-data-staging-metadata-list').append('Line Count')).append( lineCount ) )
                      .append( $.jqElem('li').append($.jqElem('span').addClass('kb-data-staging-metadata-list').append('MD5')).append(data.md5 || 'Not provided' ) )
                      .append( $upa )
                },
                {
                  tab : 'First 10 lines',
                  content : $.jqElem('div')
                    .addClass('kb-data-staging-metadata-file-lines')
                    .append( data.head )
                },
                {
                  tab : 'Last 10 lines',
                  content : $.jqElem('div')
                    .addClass('kb-data-staging-metadata-file-lines')
                    .append( data.tail )
                }
              ]
            });

            // if the metaDataFilePath is not our file (i.e., the user didn't click on a metadata file, then we want to extract out that metadata file itself.
            // We can't do it in parallel, since if the metadata file doesn't exist the promise wouldn't properly complete. The net effect is a quick blink
            // wherein the table loads and a split second later we get the metadata tab.
            if (filePath !== metaDataFilePath) {
              self.stagingServiceClient.metadata({ path : metaDataFilePath }).then( function(dataString, status, xhr) {
                var metadataFile = JSON.parse(dataString);
                // these files are always a single line, so the head will contain the contents.
                // but we parse it out and re-stringify it so it's pretty.
                // XXX - while doing this, I ran into a NaN issue in the file, specifically on the key illumina_read_insert_size_avg_insert.
                //       So we nuke any NaN fields to make it valid again.
                var metadataJSON = JSON.parse(metadataFile.head.replace(/NaN/g, '\"\"'));
                var metadataContents = JSON.stringify(metadataJSON, null, 2)

                $tabs.addTab(
                  {
                    tab : 'Metadata',
                    content : $.jqElem('div')
                      .addClass('kb-data-staging-metadata-file-lines')
                      .append( metadataContents )
                  }
                );
              })
              .fail(function(xhr) {
                // Don't actually need to do anything here - we assume that if it failed, it was due to the metadata file not existing. Yes, we generate
                // a lot of messy extra metadata calls here since it's the only way to know if there's metadata is to look.
              });
            }

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
            .append(
              $.jqElem('td')
                .attr('colspan', 5)
                .css('vertical-align', 'top')
                .append($tabsDiv)
                .append(
                  $.jqElem('button')
                    .css({'float' : 'right', border : '1px solid #CCCCCC', 'border-radius' : '2px'})
                    .addClass('btn btn-default btn-xs')
                    .tooltip({ title : 'Delete ' + fileData.name })
                    .on('click', function(e) {
                      if (window.confirm('Really delete file ' + fileData.name + '?')) {
                        this.stagingServiceClient.delete({ path : fileData.name}).then(function(d,s,x) {
                          this.updateView();
                        }.bind(this))
                        .fail(function(xhr) {
                          $tabsDiv.empty();
                          $tabsDiv.append(
                            $.jqElem('div')
                              .addClass('alert alert-danger')
                              .append('Error ' + xhr.status + '<br/>' + xhr.responseText)
                          );
                      }.bind(this));
                      }
                    }.bind(this))
                  .append($.jqElem('i').addClass('fa fa-trash'))
                )
            );
        },

        /**
         * Initializes an import app using the given file info as input.
         * Expects 'type' to match a KBase object type string that maps onto an importer.
         * Expects 'file' to be an object with the following attributes:
         *   name = string, name of the file
         */
        initImportApp: function(type, file) {
            var appInfo = this.uploaders.app_info[type];
            if (appInfo) {
                var tag = APIUtil.getAppVersionTag(),
                    fileParam = file.name,
                    inputs = {};
                if (this.subpath) {
                    fileParam = this.subpath + '/' + file.name;
                }
                if (appInfo.app_input_param_type === 'list') {
                    fileParam = [fileParam];
                }
                inputs[appInfo.app_input_param] = fileParam;
                inputs[appInfo.app_output_param] = file.name.replace(/\s/g, '_') + appInfo.app_output_suffix;
                for (var p in appInfo.app_static_params) {
                    if (appInfo.app_static_params.hasOwnProperty(p)) {
                        inputs[p] = appInfo.app_static_params[p];
                    }
                }
                Jupyter.narrative.addAndPopulateApp(appInfo.app_id, tag, inputs);
                Jupyter.narrative.hideOverlay();
            }
        },

        startTour: function() {
            if (!this.tour) {
                this.tour = new UploadTour.Tour(this.$elem.parent());
            }
            this.tour.start();
        }
    });
});
