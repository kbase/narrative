/*

    var dataset = [];

    var points = 200;

    var randomColor = function() {
        var colors = ['red', 'green', 'blue', 'cyan', 'magenta', 'yellow', 'orange', 'black'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    var randomShape = function() {
    //return 'circle';
        var shapes = ['circle', 'circle', 'circle', 'circle', 'circle', 'circle', 'square', 'triangle-up', 'triangle-down', 'diamond', 'cross'];
        return shapes[Math.floor(Math.random() * shapes.length)];
    }

    for (var idx = 0; idx < points; idx++) {
        dataset.push(
            {
                x : Math.random() * 500,
                y : Math.random() * 500,
                weight : Math.random() * 225,
                color : randomColor(),
                label : 'Data point ' + idx,
                shape : randomShape(),
            }
        );
    }

    var $scatter =  new kbaseScatterplot($('#scatterplot').css({width : '800px', height : '500px'}), {
            scaleAxes   : true,

            //xLabel      : 'Some useful experiment',
            //yLabel      : 'Meaningful data',

            dataset : dataset,

        }
    );

*/

define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'd3',
		'kbaseBarchart',
		'kbaseAuthenticatedWidget',
		'bootstrap'
	], function(
		KBWidget,
		bootstrap,
		$,
		d3,
		kbaseBarchart,
		kbaseAuthenticatedWidget,
		bootstrap
	) {

    //'use strict';

    return KBWidget({

	    name: "kbasePMIBarchart",
	    parent : kbaseAuthenticatedWidget,

        version: "1.0.0",
        options: {
            subsystem_annotation_object    : 'PlantSEED_Subsystems',
            subsystem_annotation_workspace : 'PlantSEED',
            selected_subsystems : ["Central Carbon: Glycolysis_and_Gluconeogenesis_in_plants"],
        },

        _accessors : [
            {name: 'dataset', setter: 'setDataset'},
        ],

        setDataset : function setDataset(newDataset) {

            var $pmi = this;

            if (this.data('loader')) {
                this.data('loader').hide();
                this.data('barchartElem').show();
                this.data('formElem').show();
            }

            var colorScale = d3.scale.category20();
            var groups = {};

            if (this.data('selectbox')) {
                this.data('selectbox').empty();

                var keys = Object.keys(newDataset.subsystems).sort();

                for (var f = 0; f < keys.length; f++) {
                    var func = keys[f];

                    var name = func.replace(/_/g, ' ');
                    var group = name.replace(/:.+/, "");
                    var sub_name = name.replace(/.+:\s*/, "");

                    this.data('selectbox')
                        .append(
                            $.jqElem('option')
                                .attr('value', func)
                                .prop('selected', f == 0 ? true : false)
                                .css('background-color', colorScale(f))
                                .append(name)
                        )

                    for (var bar = 0; bar < newDataset.subsystems[func].length; bar++) {
                        newDataset.subsystems[func][bar].color = colorScale(f);
                    }

                    if (! groups[group]) {

                        var $groupButton = $.jqElem('div')
                            .addClass('btn-group dropup')
                            .css({'padding-right' : '5px'})
                            .append(
                                $.jqElem('button')
                                    .attr('type', 'button')
                                    .addClass('btn btn-sm btn-default')
                                    .append(
                                        $.jqElem('span')
                                            .css('display', 'none')
                                            .addClass('check fa fa-check')
                                            .append('&nbsp;')
                                    )
                                    .append(group)
                                    .on('click', function(e) {
                                        /*var isOpen = $(this).parent().hasClass('open');
                                        $pmi.data('formElem').find('.btn-group').removeClass('open');
                                        if (! isOpen) {
                                            $(this).parent().addClass('open');
                                        }*/

                                        if ( $(this).parent().hasClass( 'open') ) {
                                            $(this).parent().removeClass('open');
                                            var $span = $(this).next().find('span');
                                            $span.toggleClass('fa-plus fa-caret-up');
                                        }

                                        var $check = $(this).parent().find('.check');
                                        var shouldOpen = $check.data('checked')
                                            ? false
                                            : true;

                                        $.each(
                                            $(this).parent().find('.subsystem-checkbox'),
                                            function(i, c) {
                                                if (shouldOpen && ! c.checked) {
                                                    $(c).prop('checked', true);
                                                }
                                                else if (! shouldOpen && c.checked) {
                                                    $(c).prop('checked', false);
                                                }
                                            }
                                        );

                                        if (shouldOpen) {
                                            $check.show();
                                            $check.data('checked', $(this).parent().find('.subsystem-checkbox').length);
                                            $check.addClass('fa-check-square-o');
                                            $check.removeClass('fa-check');
                                        }
                                        else {
                                            $check.hide();
                                            $check.data('checked', 0);
                                            $check.removeClass('fa-check-square-o');
                                            $check.addClass('fa-check');

                                        }

                                        var selected_subsystems = [];
                                        $.each(
                                            $pmi.$elem.find('.subsystem-checkbox'),
                                            function(i,c) {
                                                if (c.checked) {
                                                    selected_subsystems.push($(c).val());
                                                }
                                            }
                                        );

                                        $pmi.displaySubsystems(selected_subsystems);

                                    })
                            )
                            .append(
                                $.jqElem('button')
                                    .attr('type', 'button')
                                    .addClass('btn btn-sm btn-default dropdown-toggle')
                                    .append($.jqElem('span').addClass('fa fa-caret-up'))
                                    .on('click', function(e) {
                                        var isOpen = $(this).parent().hasClass('open');
                                        $pmi.data('formElem').find('.btn-group').removeClass('open');
                                        if (! isOpen) {
                                            $(this).parent().addClass('open');
                                        }

                                            $(this).find('span').toggleClass('fa-caret-up');
                                            $(this).find('span').toggleClass('fa-plus');

                                        var $check = $pmi.data('formElem').find('.check');
                                        if (this.checked) {
                                            $check.data('checked', ($check.data('checked') || 0) + 1);
                                            if ($check.data('checked') == $(this).closest('.btn-group').find('.subsystem-checkbox').length) {
                                                $check.addClass('fa-check-square-o');
                                                $check.removeClass('fa-check');
                                            }
                                            else {
                                                $check.removeClass('fa-check-square-o');
                                                $check.addClass('fa-check');
                                            }
                                            $check.show();
                                        }
                                        else {
                                            $check.data('checked', $check.data('checked') - 1);
                                            $check.removeClass('fa-check-square-o');
                                            $check.addClass('fa-check');
                                            if ($check.data('checked') == 0) {
                                                $check.hide();
                                            }
                                        }

                                        var selected_subsystems = [];
                                        $.each(
                                            $pmi.$elem.find('.subsystem-checkbox'),
                                            function(i,c) {
                                                if (c.checked) {
                                                    selected_subsystems.push($(c).val());
                                                }
                                            }
                                        );

                                        $pmi.displaySubsystems(selected_subsystems);

                                    })
                            )
                            .append(
                                $.jqElem('ul')
                                    .addClass('dropdown-menu')
                                    .css({ width : '450px', 'padding-left' : '5px', 'text-align' : 'left' })
                            )
                        ;


                        this.data('formElem').append($groupButton);

                        groups[group] = $groupButton;
                    }

                    groups[group].find('ul').append(
                        $.jqElem('li')
                            .append(
                                $.jqElem('label')
                                    .append(
                                        $.jqElem('input')
                                            .attr('type', 'checkbox')
                                            .attr('value', func)
                                            .addClass('subsystem-checkbox')
                                            .on('change', function(e) {
return;
                                                var $check = $(this).closest('.btn-group').find('.check');
                                                if (this.checked) {
                                                    $check.data('checked', ($check.data('checked') || 0) + 1);
                                                    if ($check.data('checked') == $(this).closest('.btn-group').find('.subsystem-checkbox').length) {
                                                        $check.addClass('fa-check-square-o');
                                                        $check.removeClass('fa-check');
                                                    }
                                                    else {
                                                        $check.removeClass('fa-check-square-o');
                                                        $check.addClass('fa-check');
                                                    }
                                                    $check.show();
                                                }
                                                else {
                                                    $check.data('checked', $check.data('checked') - 1);
                                                    $check.removeClass('fa-check-square-o');
                                                    $check.addClass('fa-check');
                                                    if ($check.data('checked') == 0) {
                                                        $check.hide();
                                                    }
                                                }

                                                var selected_subsystems = [];
                                                $.each(
                                                    $pmi.$elem.find('.subsystem-checkbox'),
                                                    function(i,c) {
                                                        if (c.checked) {
                                                            selected_subsystems.push($(c).val());
                                                        }
                                                    }
                                                );

                                                $pmi.displaySubsystems(selected_subsystems);
                                            })
                                    )
                                    .append(
                                        $.jqElem('span')
                                            .css('color', colorScale(f))
                                            .append('&nbsp;&nbsp;' + sub_name)
                                    )
                            )
                    )

                }

            }

            this.setValueForKey('dataset', newDataset);

            if (this.data('barchart') && this.options.selected_subsystems) {
                //this.displaySubsystems(this.options.selected_subsystems);
            }
        },

        setBarchartDataset : function setBarchartDataset(newDataset, legend) {
            this.data('barchart').setDataset(newDataset);

            this.data('barchart').options.xAxisTransform = this.data('barchart').yScale()(0);
            this.data('barchart').renderXAxis();
            this.data('barchart').setLegend(legend);

        },

        parseWorkspaceData : function parseWorkspaceData(d1, d2) {

            var $pmi = this;
                var sub_anno = d1[0].data;
                var fba_obj = d2[0].data;

            /* //for easy testing
            $.when(
                $.ajax('./sub_anno.json'),
                $.ajax('./fba_obj.json')
            ).then(function(r1, r2) {
                var sub_anno = r1[0];//JSON.parse(r1[0]);
                var fba_obj = r2[0];//JSON.parse(r2[0]);*/

                var subsystem_fluxes = {};

                var all_subsystems = Object.keys(sub_anno.subsystems);

                $.each(
                    all_subsystems,
                    function (i, subsystem) {

                        if (subsystem_fluxes[subsystem] == undefined) {
                            subsystem_fluxes[subsystem] = {};
                        }

                        var my_fluxes = subsystem_fluxes[subsystem];

                        $.each(
                            sub_anno.subsystems[subsystem],
                            function (i, val) {
                                var ss_rxn = val[0];
                                var rxn_dict = val[1];

                                $.each(
                                    fba_obj.FBAReactionVariables,
                                    function (i, fba_rxn) {
                                        var model_rxn = fba_rxn.modelreaction_ref;
                                        var tmp = model_rxn.split(/\//);
                                        model_rxn = tmp[tmp.length - 1];

                                        var biochem_rxn = model_rxn;
                                        biochem_rxn = biochem_rxn.replace(/_\w\d+$/, '');

                                        if (biochem_rxn == ss_rxn) {

                                            if (my_fluxes[model_rxn] == undefined) {
                                                my_fluxes[model_rxn] = {};
                                            }

                                            my_fluxes[model_rxn]['flux'] = fba_rxn.value;

                                            var tooltip = rxn_dict.tooltip

                                            tooltip = tooltip.replace(/\n/g, "<br>");
                                            //tooltip = tooltip.replace(/:(.+?)<br>/g, ": <i>$1</i><br>");
                                            tooltip = tooltip.replace(/^(.+?):/g, "<b>$1:</b>");
                                            tooltip = tooltip.replace(/<br>(.+?):/g, "<br><b>$1:</b>");
                                            //tooltip = tooltip.replace(/Equation:(.+?)<br>/, "<div style = 'text-align : right'>$1</div>");
                                            my_fluxes[model_rxn].tooltip = tooltip;
                                            //'<span style = "white-space : nowrap">' + tooltip + '</span>';
                                        }
                                    }
                                );

                            }
                        );
                    }
                );

                var dataset = {subsystems:{}};

                $.each(
                    subsystem_fluxes,
                    function (subsystem, data) {

                        var sortedKeys = Object.keys(data).sort();

                        $.each(
                            sortedKeys,
                            function (i,k) {

                                var v = data[k];

                                if (dataset.subsystems[subsystem] == undefined) {
                                    dataset.subsystems[subsystem] = [];
                                }

                                dataset.subsystems[subsystem].push(
                                    {
                                        bar : k,
                                        value : v.flux,
                                        tooltip : v.tooltip,
                                        id : k,
                                    }
                                );

                            }
                        );
                    }
                );

                $pmi.setDataset(dataset);

        },

        init : function init(options) {

            this.$elem.parent().rmLoading();

            this._super(options);

            var $pmi = this;

            var ws = new Workspace(window.kbconfig.urls.workspace, {token : $pmi.authToken()});

            var subanno_params = {
                workspace : this.options.subsystem_annotation_workspace,
                name : this.options.subsystem_annotation_object,
            };

            var fbaobj_params = {
                workspace : this.options.fba_workspace,
                name : this.options.fba_object,
            };

            $.when(
                ws.get_objects([subanno_params])    ,
                ws.get_objects([fbaobj_params])
            ).then(function (d1, d2) {

                var interval = setInterval(function(){
                    if ($pmi.data('loader').is(':visible')) {
                        clearInterval(interval);
                        $pmi.parseWorkspaceData(d1, d2);
                    }
                }, 2000);

            })
            .fail(function(d) {

                $pmi.$elem.empty();
                $pmi.$elem
                    .addClass('alert alert-danger')
                    .html("Could not load object : " + d.error.message);
            })

            this.appendUI(this.$elem);

            return this
        },

        displaySubsystems : function displaySubsystems(subsystems) {

            var lastSubsystems = this.lastSubsystems;

            if (lastSubsystems != undefined) {
                var newKeys = {};
                $.each(
                    subsystems,
                    function (i,v) {
                        newKeys[v] = 1;
                    }
                );

                var oldKeys = {};
                $.each(
                    lastSubsystems,
                    function (i,v) {
                        oldKeys[v] = 1;
                    }
                );

                var newSubsystems = [];
                $.each(
                    lastSubsystems,
                    function (i,v) {
                        if (newKeys[v]) {
                            newSubsystems.push(v);
                        }
                    }
                );

                $.each(
                    subsystems,
                    function (i,v) {
                        if (! oldKeys[v]) {
                            newSubsystems.push(v);
                        }
                    }
                );

                subsystems = newSubsystems;
            }

            this.lastSubsystems = subsystems;

            var $pmi = this;
            var merged = {};
            var legend = {};
            $.each(
                subsystems,
                function (i,subsystem) {

                    var $check = $pmi.$elem.find("[value='" + subsystem + "']");
                    $check.prop('checked', true);
                    $check.closest('.btn-group').find('.check').show();
                    $check.closest('.btn-group').find('.check').data('checked', subsystems.length);

                    $.each(
                        $pmi.dataset().subsystems[subsystem],
                        function (i, bar) {

                            if (legend[subsystem] == undefined) {
                                legend[subsystem] = bar.color;
                            }

                            if (merged[bar.bar] == undefined) {
                                merged[bar.bar] = {
                                    bar : bar.bar,
                                    value : [bar.value],
                                    color : [bar.color],
                                    tooltip : [bar.tooltip],
                                    id : bar.bar
                                };
                            }
                            else {
                                merged[bar.bar].value.push(bar.value);
                                merged[bar.bar].color.push(bar.color);
                                merged[bar.bar].tooltip.push(bar.tooltip);
                            }
                        }
                    );
                }
            );

            var sortedKeys = Object.keys(merged).sort();
            var bars = [];
            $.each(
                sortedKeys,
                function (i,bar) {
                    bars.push(merged[bar]);
                }
            );

            var sortedLegendKeys = Object.keys(legend).sort();
            var sortedLegend = [];
            $.each(
                sortedLegendKeys,
                function (i, key) {
                    sortedLegend.push(
                        {
                            label : key,
                            color : legend[key],
                            shape : 'square'
                        }
                    )
                }
            );

            //$pmi.setBarchartDataset($pmi.dataset().subsystems[$(this).val()[0]]);
            $pmi.setBarchartDataset(bars, sortedLegend);
        },

        appendUI : function appendUI($elem) {

            var $pmi = this;

            var $container = $.jqElem('div')
                .append(
                    $.jqElem('div')
                        .css('display', 'none')
                        .attr('id', 'old-formElem')
                        .append($.jqElem('span').append("Select subsystem(s):&nbsp;&nbsp;").css('float', 'left'))
                        .append(
                            $.jqElem('form')
                                .append(
                                    $.jqElem('select').attr('id', 'selectbox')
                                    .prop('multiple', true)
                                    .css('border', '1px solid black')
                                    .on('change', function(e) {
                                        //alert('changed! ' + this.value);
                                        //$pmi.setBarchartDataset($pmi.dataset().subsystems[this.value]);
                                        $pmi.displaySubsystems($(this).val());


                                    })
                                )
                        )
                )
                .append(
                    $.jqElem('div')
                        .attr('id', 'barchartElem')
                        .css('display', 'none')
                        .css('width', 1100) //$elem.width())
                        .css('height', 500) //$elem.height() - 30)
                )
                .append(
                    $.jqElem('div')
                        .attr('id', 'formElem')
                        .css({width : '100%', 'text-align' : 'center'})
                )
                .append(
                    $.jqElem('div')
                        .attr('id', 'loader')
                        .append('<br>&nbsp;Loading data...<br>&nbsp;please wait...<br>&nbsp;Data parsing may take upwards of 30 seconds, during which time this narrative may be unresponsive.')
                        .append($.jqElem('br'))
                        .append(
                            $.jqElem('div')
                                .attr('align', 'center')
                                .append($.jqElem('i').addClass('fa fa-spinner').addClass('fa fa-spin fa fa-4x'))
                        )
                )
            ;

            this._rewireIds($container, this);

            this.data('barchart',
                 new kbaseBarchart(this.data('barchartElem'), {
                        scaleAxes   : true,

                        yLabelRegion : 'xPadding',
                        xGutter : 300,

                        xAxisRegion : 'chart',
                        xAxisVerticalLabels : true,
                        yLabel      : 'Reaction Flux',
                        hGrid : true,
                        useUniqueID : true,
                        legendRegion : 'xGutter',
                    }
                )
            );

            var $barchart = this.data('barchart');
            $barchart.superYDomain = $barchart.defaultYDomain;
            $barchart.defaultYDomain = function() {
                var domain = $barchart.superYDomain();

                var max = Math.max(Math.abs(domain[0]), Math.abs(domain[1]))

                return [-max, max]

            }

            $barchart.superRenderChart = $barchart.renderChart;
            $barchart.renderChart = function() {
                $barchart.superRenderChart();

                this.D3svg()
                    .selectAll('.xAxis .tick text')
                    .data(this.dataset())
                    .on('mouseover', function(L, i) {
                        $barchart.showToolTip(
                            {
                                label : $barchart.dataset()[i].tooltip[0],
                            }
                        );
                    })
                    .on('mouseout', function(d) {
                        $barchart.hideToolTip();
                    })
            };

            $barchart.superToolTip = $barchart.showToolTip;
            $barchart.showToolTip = function(args) {
                args.maxWidth = 1500;
                $barchart.superToolTip(args);
            }

            this.data('barchart').initialized = false;
            if (this.dataset()) {
                this.setDataset(this.dataset());
            }

            $elem.append($container);

        },

    });

} );
