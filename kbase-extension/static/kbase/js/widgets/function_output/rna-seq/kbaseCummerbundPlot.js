

define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'colorbrewer',
		'd3',
		'kbaseBarchart',
		'kbaseTable',
		'kbaseAuthenticatedWidget',
		'kbaseTabs'
	], function(
		KBWidget,
		bootstrap,
		$,
		colorbrewer,
		d3,
		kbaseBarchart,
		kbaseTable,
		kbaseAuthenticatedWidget,
		kbaseTabs
	) {

    'use strict';

    /*
        for the ajaxTransport method below
        The MIT License (MIT)

        Copyright (c) 2014 Henry Algus

        Permission is hereby granted, free of charge, to any person obtaining a copy of
        this software and associated documentation files (the "Software"), to deal in
        the Software without restriction, including without limitation the rights to
        use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
        the Software, and to permit persons to whom the Software is furnished to do so,
        subject to the following conditions:

        The above copyright notice and this permission notice shall be included in all
        copies or substantial portions of the Software.

        THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
        IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
        FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
        COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
        IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
        CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
    */
    $.ajaxTransport("+binary", function(options, originalOptions, jqXHR){
        // check for conditions and support for blob / arraybuffer response type

        if (window.FormData && ((options.dataType && (options.dataType == 'binary')) || (options.data && ((window.ArrayBuffer && options.data instanceof ArrayBuffer) || (window.Blob && options.data instanceof Blob)))))
        {

            return {
                // create new XMLHttpRequest
                send: function(headers, callback){
            // setup all variables
                    var xhr = new XMLHttpRequest(),
            url = options.url,
            type = options.type,
            async = options.async || true,
            // blob or arraybuffer. Default is blob
            dataType = options.responseType || "blob",
            data = options.data || null,
            username = options.username || null,
            password = options.password || null;

                    xhr.addEventListener('load', function(){

                var data = {};
                data[options.dataType] = xhr.response;
                // make callback and send data
                callback(xhr.status, xhr.statusText, data, xhr.getAllResponseHeaders());
                    });

                    xhr.open(type, url, async, username, password);
                    for (var i in headers ) {
                        xhr.setRequestHeader(i, headers[i] );
                    }
                    xhr.overrideMimeType('image/png');
                    xhr.responseType = dataType;
                    xhr.send(data);

                },
                abort: function(){
                    jqXHR.abort();
                }
            };
        }
    });
    //end MIT licensed section

    return KBWidget({

	    name: "kbaseCummerbundPlot",
	    parent : kbaseAuthenticatedWidget,

        version: "1.0.0",
        options: {

        },

        _accessors : [
            {name: 'dataset', setter: 'setDataset'},
        ],


        setDataset : function setDataset(newDataset) {

            var $plot = this;

            if (this.data('loader')) {
                this.data('loader').hide();
                this.data('plotElem').show();
                this.data('formElem').show();
            }

            if (this.data('selectbox')) {
                this.data('selectbox').empty();

                $.each(
                    newDataset,
                    function(i,v) {
                        $plot.data('selectbox')
                            .append(
                                $.jqElem('option')
                                    .attr('value', v.plot_title)
                                    .append(v.plot_title)
                            )
                    }
                );
            }

            this.setValueForKey('dataset', newDataset);

            this.displayPlot(newDataset[0].plot_title);

        },


        init : function init(options) {

            this._super(options);

            var $plot = this;

            var ws = new Workspace(window.kbconfig.urls.workspace, {token : $plot.authToken()});

            var ws_params = {
                workspace : this.options.workspaceName,
                wsid : window.kbconfig.workspaceId,
                name : this.options.ws_cummerbund_output || this.options.generate_cummerbund_plots
            };

            if (this.options.workspaceName) {
                delete ws_params['wsid'];
            }

            ws.get_objects([ws_params]).then(function (d) {
                $plot.setDataset(d[0].data.cummerbundplotSet);
            }).fail(function(d) {
                $plot.$elem.empty();
                $plot.$elem
                    .addClass('alert alert-danger')
                    .html("Could not load object : " + d.error.message);
            });

            this.appendUI(this.$elem);

            return this;
        },

        displayPlot : function displayPlot(plot) {

            var $plot = this;

            $.each(
                this.dataset(),
                function (i,v) {

                    if (v.plot_title == plot) {
                        $plot.data('imgElem').attr('src', undefined);
                        $plot.data('descElem').html(v.plot_description);


                        $.ajax({
                            url : window.kbconfig.urls.shock + '/node/' + v.png_handle.id + '?download_raw',
                            type : 'GET',
                            processData : false,
                            dataType : 'binary',
                            headers : {'Authorization' : 'Oauth ' + $plot.authToken()},
                        })
                        .then(function(d) {

                            var reader = new FileReader();
                            reader.readAsDataURL(d);
                            reader.onloadend = function() {
                                var base64data = reader.result;
                                $plot.data('imgElem').attr('src', base64data);
                            }

                        }).fail(function(d) {
                            $plot.$elem.empty();
                            $plot.$elem
                                .addClass('alert alert-danger')
                                .html("Could not load plot : " + (d.error.message || d.statusText));
                        });
                    }
                }
            );
        },

        appendUI : function appendUI($elem) {

            var $plot = this;

            var $container = $.jqElem('div')
                .append(
                    $.jqElem('div')
                        .css('display', 'none')
                        .attr('id', 'formElem')
                        .append($.jqElem('span').append("Select plot:&nbsp;&nbsp;").css('float', 'left'))
                        .append(
                            $.jqElem('form')
                                .append(
                                    $.jqElem('select').attr('id', 'selectbox')
                                    .on('change', function(e) {
                                        $plot.displayPlot($(this).val());
                                    })
                                )
                        )
                )
                .append(
                    $.jqElem('div')
                        .attr('id', 'plotElem')
                        .css('display', 'none')
                        .css('width', 800)
                        .css('height', 500)
                            .append(
                                $.jqElem('img')
                                    .attr('id', 'imgElem')
                                    .css({width : '798px'})
                            )
                            .append(
                                $.jqElem('div')
                                    .attr('id', 'descElem')
                                    .css({width : '798px'})
                            )
                )

                .append(
                    $.jqElem('div')
                        .attr('id', 'loader')
                        .append('<br>&nbsp;Loading data...<br>&nbsp;please wait...')
                        .append($.jqElem('br'))
                        .append(
                            $.jqElem('div')
                                .attr('align', 'center')
                                .append($.jqElem('i').addClass('fa fa-spinner').addClass('fa fa-spin fa fa-4x'))
                        )
                )
            ;

            this._rewireIds($container, this);


            $elem.append($container);


        },

    });

} );
