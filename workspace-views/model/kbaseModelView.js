(function( $, undefined ) {

$.kbWidget("kbaseModelView", 'kbaseWidget', {
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        this._super(options);
        var models = options.ids;
        var workspaces = options.workspaces;

        extendDefaults();

        this.$elem.append('<div id="kbase-model-view"></div>');
        var container = $('#kbase-model-view');

        var fba = new fbaModelServices('https://kbase.us/services/fba_model_services/');
        var kbws = new workspaceService('http://kbase.us/services/workspace_service/');

        var tables = ['Overview', 'Compartment', 'Reactions', 'Compounds', 'Biomass', 'Gapfilling', 'Gapgen']
        var tableIds = ['overview', 'compartment', 'reaction', 'compound', 'biomass', 'gapfilling', 'gapgen']

        // build tabs
        var tabs = $('<ul id="table-tabs" class="nav nav-tabs"> \
                        <li class="active" > \
                        <a view="'+tableIds[0]+'" data-toggle="tab" >'+tables[0]+'</a> \
                      </li></ul>')
        for (var i=1; i<tableIds.length; i++) {
            tabs.append('<li><a view="'+tableIds[i]+'" data-toggle="tab">'+tables[i]+'</a></li>')
        }

        // add tabs
        container.append(tabs);


        // add table views (don't hide first one)
        container.append('<div class="'+tableIds[0]+'-view view"> \
                            <table cellpadding="0" cellspacing="0" border="0" id="'+tableIds[0]+'-table" \
                            class="table table-bordered table-striped"></table>\
                        </div>');

        for (var i=1; i<tableIds.length; i++) {
            var tableDiv = $('<div class="'+tableIds[i]+'-view view">');
            var table = $('<table cellpadding="0" cellspacing="0" border="0" id="'+tableIds[i]+'-table" \
                            class="table table-striped table-bordered">');
            tableDiv.append(table);
            tableDiv.addClass('hide');
            container.append(tableDiv);
        }

        // tab events
        $('.nav-tabs li').click(function(){
            $('.view').hide(); // hide all views
            $('.nav-tabs li').removeClass('active'); //fixme: this is not neccessary
            $(this).addClass('active')

            var view = $(this).children('a').attr('view');
            $('.'+view+'-view').show();
        })

        var tableSettings = {"fnDrawCallback": events,
            sScrollY: '100px',
            sScrollX: '100%',
            "sPaginationType": "full_numbers",
            "iDisplayLength": 20,
            "aaData": [],
            "oLanguage": {
            "sSearch": "Search all:"
            }
        }

        var meta_AJAX = kbws.get_objectmeta({type: 'Model',
                workspace: workspaces[0], id: models[0]});
        $('.overview-view').append('<p class="muted loader-overview"> \
                                  <img src="../img/ajax-loader.gif"> loading...</p>')
        $.when(meta_AJAX).done(function(data){
            var labels = ['ID','Type','Moddate','Instance',
                          'Command','Last Modifier','Owner','Workspace','Ref',
                          'Check Sum']

            for (var i=0; i<data.length-1; i++){
                $('#overview-table').append('<tr><td>'+labels[i]+'</td> \
                                                 <td>'+data[i]+'</td></tr>')
            }
            $('.loader-overview').remove();
        })

        var models_AJAX = fba.get_models({models: models, workspaces: workspaces});
        $('.view').not('.overview-view').append('<p class="muted loader-tables"> \
                                  <img src="../img/ajax-loader.gif"> loading...</p>')
        $.when(models_AJAX).done(function(data){
            var model = data[0];

            // compartment table
            var dataDict = model.compartments;
            var keys = ["id", "index", "name", "pH", "potential"];
            var labels = ["id", "index", "name", "pH", "potential"];
            var cols = getColumns(keys, labels);
            tableSettings.aoColumns = getColumns(keys, labels);
            var table = $('#compartment-table').dataTable(tableSettings);
            table.fnAddData(dataDict);

            // reaction table
            var dataDict = model.reactions;
            var keys = ["compartment", "definition", "direction", "equation",
                        "features","id","name","reaction"];
            var labels = ["compartment", "definition", "direction", "equation",
                        "features","id","name","reaction"];
            var cols = getColumns(keys, labels)
            tableSettings.aoColumns = getColumns(keys, labels)
            var table = $('#reaction-table').dataTable(tableSettings);
            table.fnAddData(dataDict);
            //firstSelect(table)            

            // compound table
            var dataDict = model.compounds;
            var keys = ["compartment", "compound", "id", "name"];
            var labels = ["compartment", "compound", "id", "name"];
            var cols = getColumns(keys, labels);
            tableSettings.aoColumns = getColumns(keys, labels);
            var table = $('#compound-table').dataTable(tableSettings);
            table.fnAddData(dataDict);

            // biomass table
            var dataDict = model.biomasses;
            var keys = ["definition", "id", "name"];
            var labels = ["definition", "id", "name"];
            var cols = getColumns(keys, labels);
            tableSettings.aoColumns = getColumns(keys, labels);
            var table = $('#biomass-table').dataTable(tableSettings);
            table.fnAddData(dataDict);

            // gapfilling table
            var dataDict = model.compounds;
            var keys = ["id", "index", "name", "pH","potential"];
            var labels = ["id", "index", "name", "pH","potential"];
            var cols = getColumns(keys, labels);
            tableSettings.aoColumns = getColumns(keys, labels);
            var table = $('#gapfill-table').dataTable(tableSettings);

            // gapgen table
            var model_gapgen = model.gapgen;
            var keys = ["id", "index", "name", "pH","potential"];
            var labels = ["id", "index", "name", "pH","potential"];
            var cols = getColumns(keys, labels);
            tableSettings.aoColumns = getColumns(keys, labels);
            var table = $('#gapgen-table').dataTable(tableSettings);
    

            $('.loader-tables').remove();
        })

        function getColumns(keys, labels) {
            var cols = [];

            for (var i=0; i<keys.length; i++) {
                cols.push({sTitle: labels[i], mData: keys[i]})
            }
            return cols;
        }

        function events() {
        }

        this.hideView = function(){
            container.hide()
        }

        this.showView = function(){
            container.show()
        }

        this.destroyView = function(){
            container.remove();
        }

          // this function is called upon the first selection event
        //  it sets absolute position for the data table so that it scrolls nicely
        function firstSelect(table) {
            $('.reaction-view').fnAdjustColumnSizing();

            // move table element into new scrollable div with absolute position
            var otable = $('.reaction-view');
            var parts = otable.children().children();
                    
            var header = parts.eq(0);
            var table = parts.eq(1);
            var footer = parts.eq(2);

            header.css({
                position: 'absolute',
                top: '0px',
                left: '0px',
                right: '0px'
            });

            table.css({
                position: 'absolute',
                top: (header.height() + 2) + 'px',
                left: '0px',
                right: '0px',
                bottom: (footer.height() + 2) + 'px'
            });

            table.find('.dataTables_scrollBody').css({
                position: 'absolute',
                height: '',
                width: '',
                top: table.find('.dataTables_scrollHead').height(),
                left: '0px',
                right: '0px',
                bottom: '0px'
            });

            footer.css({
                position: 'absolute',
                bottom: '0px',
                left: '0px',
                right: '0px'
            });
        }


        function extendDefaults() {
            /*
             *  Modifications to get DataTables working with Bootstrap
             *    Taken from here: http://datatables.net/blog/Twitter_Bootstrap_2
             */

            /* Set the defaults for DataTables initialisation */
            $.extend( true, $.fn.dataTable.defaults, {
                "sDom": "<'row-fluid'<'span12 obj-opts'f>r>t<'row-fluid'<'span6'il><'span6'p>>",
                "sPaginationType": "bootstrap",
                "oLanguage": {
                    "sLengthMenu": "_MENU_ records per page"
                }
            } );


            /* Default class modification */
            $.extend( $.fn.dataTableExt.oStdClasses, {
                "sWrapper": "dataTables_wrapper form-inline"
            } );


            /* API method to get paging information */
            $.fn.dataTableExt.oApi.fnPagingInfo = function ( oSettings )
            {
                return {
                    "iStart":         oSettings._iDisplayStart,
                    "iEnd":           oSettings.fnDisplayEnd(),
                    "iLength":        oSettings._iDisplayLength,
                    "iTotal":         oSettings.fnRecordsTotal(),
                    "iFilteredTotal": oSettings.fnRecordsDisplay(),
                    "iPage":          Math.ceil( oSettings._iDisplayStart / oSettings._iDisplayLength ),
                    "iTotalPages":    Math.ceil( oSettings.fnRecordsDisplay() / oSettings._iDisplayLength )
                };
            };


            /* Bootstrap style pagination control */
            $.extend( $.fn.dataTableExt.oPagination, {
                "bootstrap": {
                    "fnInit": function( oSettings, nPaging, fnDraw ) {
                        var oLang = oSettings.oLanguage.oPaginate;
                        var fnClickHandler = function ( e ) {
                            e.preventDefault();
                            if ( oSettings.oApi._fnPageChange(oSettings, e.data.action) ) {
                                fnDraw( oSettings );
                            }
                        };

                        $(nPaging).addClass('pagination').append(
                            '<ul>'+
                                '<li class="prev disabled"><a href="#">&larr; '+oLang.sPrevious+'</a></li>'+
                                '<li class="next disabled"><a href="#">'+oLang.sNext+' &rarr; </a></li>'+
                                '</ul>'
                            );
                        var els = $('a', nPaging);
                        $(els[0]).bind( 'click.DT', { action: "previous" }, fnClickHandler );
                        $(els[1]).bind( 'click.DT', { action: "next" }, fnClickHandler );
                    },

                    "fnUpdate": function ( oSettings, fnDraw ) {
                        var iListLength = 5;
                        var oPaging = oSettings.oInstance.fnPagingInfo();
                        var an = oSettings.aanFeatures.p;
                            var i, j, sClass, iStart, iEnd, iHalf=Math.floor(iListLength/2);

                        if ( oPaging.iTotalPages < iListLength) {
                            iStart = 1;
                            iEnd = oPaging.iTotalPages;
                        }
                        else if ( oPaging.iPage <= iHalf ) {
                            iStart = 1;
                            iEnd = iListLength;
                        } else if ( oPaging.iPage >= (oPaging.iTotalPages-iHalf) ) {
                            iStart = oPaging.iTotalPages - iListLength + 1;
                            iEnd = oPaging.iTotalPages;
                        } else {
                            iStart = oPaging.iPage - iHalf + 1;
                            iEnd = iStart + iListLength - 1;
                        }

                        for ( i=0, iLen=an.length ; i<iLen ; i++ ) {
                            // Remove the middle elements
                            $('li:gt(0)', an[i]).filter(':not(:last)').remove();

                            // Add the new list items and their event handlers
                            for ( j=iStart ; j<=iEnd ; j++ ) {
                                sClass = (j==oPaging.iPage+1) ? 'class="active"' : '';
                                $('<li '+sClass+'><a href="#">'+j+'</a></li>')
                                    .insertBefore( $('li:last', an[i])[0] )
                                    .bind('click', function (e) {
                                        e.preventDefault();
                                        oSettings._iDisplayStart = (parseInt($('a', this).text(),10)-1) * oPaging.iLength;
                                        fnDraw( oSettings );
                                    } );
                            }

                            // Add / remove disabled classes from the static elements
                            if ( oPaging.iPage === 0 ) {
                                $('li:first', an[i]).addClass('disabled');
                            } else {
                                $('li:first', an[i]).removeClass('disabled');
                            }

                            if ( oPaging.iPage === oPaging.iTotalPages-1 || oPaging.iTotalPages === 0 ) {
                                $('li:last', an[i]).addClass('disabled');
                            } else {
                                $('li:last', an[i]).removeClass('disabled');
                            }
                        }
                    }
                }
            } );
        }


        //
        //this._rewireIds(this.$elem, this);

        return this;

    }  //end init





})
}( jQuery ) );
