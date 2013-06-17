

$.fn.fbaView = function(options) {
    var wsIDs = options.ids;
    var workspaces = options.workspaces;

    this.append('<div id="kbase-fba-view"></div>');
    var self = $('#kbase-fba-view');

    var fba = new fbaModelServices('https://kbase.us/services/fba_model_services/');
    var kbws = new workspaceService('http://kbase.us/services/workspace_service/');

    var tables = ['Overview', 'Reaction Fluxes', 'Compound Fluxes', 'Compound Production']
    var tableIds = ['overview', 'rxn-fluxes', 'cpd-fluxes', 'cpd-prod']


    // build tabs
    var tabs = $('<ul id="table-tabs" class="nav nav-tabs"> \
                    <li class="active" > \
                    <a view="'+tableIds[0]+'" data-toggle="tab" >'+tables[0]+'</a> \
                  </li></ul>')
    for (var i=1; i<tableIds.length; i++) {
        tabs.append('<li><a view="'+tableIds[i]+'" data-toggle="tab">'+tables[i]+'</a></li>')
    }

    // add tabs
    self.append(tabs);

    // add table views (don't hide first one)
    self.append('<div class="'+tableIds[0]+'-view view"> \
                        <table id="'+tableIds[0]+'-table" \
                        class="table table-bordered table-striped"></table>\
                    </div>');

    for (var i=1; i<tableIds.length; i++) {
        self.append('<div class="'+tableIds[i]+'-view view hide"> \
                        <table id="'+tableIds[i]+'-table" \
                        class="table table-bordered table-striped"></table>\
                    </div>');
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
        "sPaginationType": "full_numbers",
        "iDisplayLength": 20,
        "oLanguage": {
        "sSearch": "Search all:"
        }
    }

    var meta_AJAX = kbws.get_objectmeta({type: 'FBA', 
            workspace: workspaces[0], id: wsIDs[0]});
    $('.overview-view').append('<p class="muted loader-overview"> \
                              <img src="/img/ajax-loader.gif"> loading...</p>')
    $.when(meta_AJAX).done(function(data){
        console.log(data)
        var labels = ['ID','Type','Moddate','Instance',
                      'Command','Last Modifier','Owner','Workspace','Ref',
                      'Check Sum']

        for (var i=0; i<data.length-1; i++){
            $('#overview-table').append('<tr><td>'+labels[i]+'</td> \
                                             <td>'+data[i]+'</td></tr>')
        }
        $('.loader-overview').remove();
    })

    var models_AJAX = fba.get_fbas({fbas: wsIDs, workspaces: workspaces});
    $('.view').not('.overview-view').append('<p class="muted loader-tables"> \
                              <img src="/img/ajax-loader.gif"> loading...</p>')
    $.when(models_AJAX).done(function(data){
        var fba = data[0];
        console.log(fba)

        // compartment table
        var dataArray = fba.reactionFluxes;
        var labels = ["rxn id", "flux", "max bound", "min bound", "upper bound", "lower bound", "type", "eq"];
        tableSettings.aoColumns = getColArraySettings(labels);
        var table = $('#rxn-fluxes-table').dataTable(tableSettings);
        table.fnAddData(dataArray);

        // compartment table
        var dataArray = fba.compoundFluxes;
        var labels = ["cpd id", "flux", "max bound", "min bound", "upper bound", "lower bound", "type", "eq"];
        tableSettings.aoColumns = getColArraySettings(labels);
        var table = $('#cpd-fluxes-table').dataTable(tableSettings);
        table.fnAddData(dataArray);

        $('.loader-tables').remove();
    })


    function getColArraySettings(labels) {
        var cols = [];

        for (var i in labels) {
            cols.push({sTitle: labels[i]})
        }
        return cols;
    }

    function getColObjSettings(keys, labels) {
        var cols = [];

        for (var i=0; i<keys.length; i++) {
            cols.push({sTitle: labels[i], mData: keys[i]})
        }
        return cols;
    }


    function events() {}

    this.hideView = function(){
        self.hide()
    }

    this.showView = function(){
        self.show()
    }

    this.destroyView = function(){
        self.remove();
    }

    function adjustContainer() {
        rxn_table.fnAdjustColumnSizing();
        // move table element into new scrollable div with absolute position
        var otable = $('#reaction-table');
        var parts = otable.children()

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

    return this;

}
