require.config({
    // not in here, since it's configured elsewhere, but this
    // is expected to be relative to /static/ on the server.
    // Jupyter does some magic where it merges its /static/ directory
    // with this one (kbase-profile/static)
    paths: {
        dropzone: 'ext_components/dropzone/dist/dropzone-amd-module',
        narrativeTour: 'kbase/js/tour',
        kbaseInputTest: 'kbase/js/widgets/function_input/kbaseInputTest',
        api: 'kbase/js/api',
        bluebird: 'ext_components/bluebird/js/browser/bluebird.min',
        plotly: 'ext_components/plotly.js/dist/plotly.min',
        util: 'kbase/js/util/',
        narrative_core: 'kbase/js/widgets/narrative_core',
        configPath: 'kbase',
        narrativeViewers: 'kbase/js/widgets/narrative_core/narrativeViewers',
        domReady: 'ext_components/requirejs/domReady',
        json: 'ext_components/requirejs-plugins/src/json',
        text: 'ext_components/requirejs-plugins/lib/text',
        jquery: 'components/jquery/jquery.min',
        jqueryui: 'components/jquery-ui/ui/minified/jquery-ui.min',
        'jquery-svg': 'ext_components/jquery-extensions/js/jquery.svg',
        'jquery-dataTables': 'ext_components/datatables/media/js/jquery.dataTables.min',
        'jquery-dataTables-bootstrap': 'ext_components/datatables/media/js/dataTables.bootstrap.min',
        'jquery-nearest': 'ext_components/jquery-nearest/src/jquery.nearest.min',
        jqueryCookie: 'ext_components/jquery-extensions/js/jquery.cookie.min',
        select2: 'kbase/js/patched-components/select2/select2',
        bootstrap: 'components/bootstrap/js/bootstrap.min',
        underscore: 'ext_components/underscore/underscore-min',
        'bootstrap-slider': 'ext_components/bootstrap-slider/bootstrap-slider',
        'tipsy': 'ext_components/jquery.tipsy/js/jquery.tipsy',


        // cherrypicked from develop, ugh.
        css: 'ext_components/require-css/css',
        kb_common: 'ext_components/kbase-common-js/dist/kb/common/',
        kb_service: 'ext_components/kbase-service-clients-js/dist/kb_service/',
        uuid: 'ext_components/pure-uuid/uuid',
        css: 'ext_components/require-css/css',
        'google-code-prettify': 'ext_packages/google-code-prettify/1.2.0/',


        narrativeConfig: 'kbase/js/narrativeConfig',
        narrativeMain: 'narrativeMain',
        narrativeTreeMain: 'narrativeTreeMain',
        kbaseLogin: 'kbase/js/widgets/kbaseLoginFuncSite',
        narrativeLogin: 'kbase/js/narrativeLogin',
        kbaseTabs: 'kbase/js/widgets/kbaseTabs',
        kbaseUploadWidget: 'kbase/js/widgets/kbaseUpload',
        kbasePrompt: 'kbase/js/widgets/kbasePromptNew',
        // Non-AMD, still load with Require
        widgetMaxWidthCorrection: 'kbase/js/widgetMaxWidthCorrection',
        kbapi: 'kbase/js/widgets/kbapi',
        'kbase-client-api': 'kbase/js/api/kbase-client-api',
        'kbaseFeatureValues-client-api': 'kbase/js/api/KBaseFeatureValues',
        'kbase-generic-client-api': 'kbase/js/api/GenericClient',
        'catalog-client-api': 'kbase/js/api/Catalog',

        // Data API dynamic service clients
        'GenomeAnnotationAPI-client-api': 'kbase/js/api/GenomeAnnotationAPIClient',
        'AssemblyAPI-client-api': 'kbase/js/api/AssemblyAPIClient',
        'TaxonAPI-client-api': 'kbase/js/api/TaxonAPIClient',
        'GenomeSearchUtil-client-api': 'kbase/js/api/GenomeSearchUtilClient',

        'njs-wrapper-client-api': 'kbase/js/api/NarrativeJobServiceWrapper',
        kbaseNarrativeJobStatus: 'kbase/js/widgets/narrative_core/kbaseNarrativeJobStatus',
        kbaseCellToolbarMenu: 'kbase/js/widgets/narrative_core/kbaseCellToolbarMenu',

        /**
         * New Test Runtime and Widget Framework
         */
        runtimeManager: 'kbase/js/widgetApi/runtimeManager',
        messageManager: 'kbase/js/widgetApi/messageManager',
        narrativeDataWidget: 'kbase/js/widgetApi/narrativeDataWidget',
        narrativeDataWidgetIFrame: 'kbase/js/widgetApi/narrativeDataWidgetIFrame',
        widgetService2: 'kbase/js/widgetApi/widgetService2',


        common: 'kbase/js/common/',
        widgets: 'kbase/js/widgets',


        /***
         * CORE NARRATIVE WIDGETS
         ***/
        'kbaseNarrativePrestart': 'kbase/js/kbaseNarrativePrestart',
        'kbaseNarrative': 'kbase/js/kbaseNarrative',
        'kbaseNarrativeCellMenu': 'kbase/js/widgets/narrative_core/kbaseNarrativeCellMenu',
        'kbaseNarrativeControlPanel': 'kbase/js/widgets/narrative_core/kbaseNarrativeControlPanel',
        'kbaseNarrativeDataPanel': 'kbase/js/widgets/narrative_core/kbaseNarrativeDataPanel',
        'kbaseNarrativeDataList': 'kbase/js/widgets/narrative_core/kbaseNarrativeDataList',
        'kbaseNarrativeSidePanel': 'kbase/js/widgets/narrative_core/kbaseNarrativeSidePanel',
        'kbaseNarrativeJobsPanel': 'kbase/js/widgets/narrative_core/kbaseNarrativeJobsPanel',
        'kbaseNarrativeMethodPanel': 'kbase/js/widgets/narrative_core/kbaseNarrativeMethodPanel',
        'kbaseNarrativeManagePanel': 'kbase/js/widgets/narrative_core/kbaseNarrativeManagePanel',
        'kbaseNarrativeDownloadPanel': 'kbase/js/widgets/narrative_core/kbaseNarrativeDownloadPanel',
        'kbaseNarrativeSharePanel': 'kbase/js/widgets/narrative_core/kbaseNarrativeSharePanel',
        'kbaseNarrativeExampleDataTab': 'kbase/js/widgets/narrative_core/kbaseNarrativeExampleDataTab',
        'kbaseNarrativeSideImportTab': 'kbase/js/widgets/narrative_core/kbaseNarrativeSideImportTab',
        'kbaseNarrativeSidePublicTab': 'kbase/js/widgets/narrative_core/kbaseNarrativeSidePublicTab',
        'kbaseNarrativeCell': 'kbase/js/widgets/narrative_core/kbaseNarrativeCell',
        'kbaseNarrativeDataCell': 'kbase/js/widgets/narrative_core/kbaseNarrativeDataCell',
        'kbaseNarrativeOutputCell': 'kbase/js/widgets/narrative_core/kbaseNarrativeOutputCell',
        'kbaseNarrativeInput': 'kbase/js/widgets/function_input/kbaseNarrativeInput',
        'kbaseNarrativeMethodInput': 'kbase/js/widgets/function_input/kbaseNarrativeMethodInput',
        'kbaseNarrativeParameterInput': 'kbase/js/widgets/function_input/parameter_input/kbaseNarrativeParameterInput',
        'kbaseNarrativeParameterTextInput': 'kbase/js/widgets/function_input/parameter_input/kbaseNarrativeParameterTextInput',
        'kbaseNarrativeParameterDropdownInput': 'kbase/js/widgets/function_input/parameter_input/kbaseNarrativeParameterDropdownInput',
        'kbaseNarrativeParameterCheckboxInput': 'kbase/js/widgets/function_input/parameter_input/kbaseNarrativeParameterCheckboxInput',
        'kbaseNarrativeParameterTextareaInput': 'kbase/js/widgets/function_input/parameter_input/kbaseNarrativeParameterTextareaInput',
        'kbaseNarrativeParameterFileInput': 'kbase/js/widgets/function_input/parameter_input/kbaseNarrativeParameterFileInput',
        'kbaseNarrativeParameterTextSubdataInput': 'kbase/js/widgets/function_input/parameter_input/kbaseNarrativeParameterTextSubdataInput',
        'kbaseNarrativeError': 'kbase/js/widgets/function_output/kbaseNarrativeError',
        'narrativeManager': 'kbase/js/api/NarrativeManager',
        'ipythonCellMenu': 'kbase/js/widgets/narrative_core/ipythonCellMenu',

        // not yet ADMs, but still load with Require
        'kbaseNarrativeAppCell': 'kbase/js/widgets/narrative_core/kbaseNarrativeAppCell',
        'kbaseNarrativeMethodCell': 'kbase/js/widgets/narrative_core/kbaseNarrativeMethodCell',
        'kbaseNarrativeWorkspace': 'kbase/js/widgets/narrative_core/kbaseNarrativeWorkspace',
        'kbaseLogging': 'kbase/js/kbaseLogging',
        'RGBColor': 'kbase/js/rgbcolor',
        'kbStandaloneTable': 'kbase/js/widgets/kbStandaloneTable',
        'kbStandalonePlot': 'kbase/js/widgets/kbStandalonePlot',
        'kbStandaloneGraph': 'kbase/js/widgets/kbStandaloneGraph',
        'kbStandaloneHeatmap': 'kbase/js/widgets/kbStandaloneHeatmap',
        /***
         * END CORE WIDGETS
         ***/

        /***
         * CUSTOM NARRATIVE INPUT WIDGETS
         ***/
        'kbaseDefaultNarrativeInput': 'kbase/js/widgets/function_input/kbaseDefaultNarrativeInput',
        'kbaseBuildMediaInput': 'kbase/js/widgets/function_input/kbaseBuildMediaInput',
        'rastGenomeImportInput': 'kbase/js/widgets/function_input/rastGenomeImportInput',
        'kbaseNcbiGenomeImportInput': 'kbase/js/widgets/function_input/kbaseNcbiGenomeImportInput',
        'kbaseTabbedInput': 'kbase/js/widgets/function_input/kbaseTabbedInput',
        'create_metagenome_set': 'kbase/js/widgets/function_input/create_metagenome_set',
        'kbStandaloneListSelect': 'kbase/js/widgets/function_input/kbStandaloneListselect',
        'devVizSelector': 'kbase/js/widgets/function_input/devDataViz',

        'kbaseGrowthCurvesInput': 'kbase/js/widgets/function_input/kbaseGrowthCurvesInput',
        'kbaseGrowthParamsPlotInput': 'kbase/js/widgets/function_input/kbaseGrowthParamsPlotInput',
        'kbaseGrowthParams2DPlotInput': 'kbase/js/widgets/function_input/kbaseGrowthParams2DPlotInput',
        'kbaseSamplePropertyHistogramInput': 'kbase/js/widgets/function_input/kbaseSamplePropertyHistogramInput',
        'kbaseSampleProperty2DPlotInput': 'kbase/js/widgets/function_input/kbaseSampleProperty2DPlotInput',

        'kbaseNarrativeParameterCustomTextSubdataInput': 'kbase/js/widgets/function_input/parameter_input/kbaseNarrativeParameterCustomTextSubdataInput',
        'kbaseNarrativeParameterCustomButtonInput': 'kbase/js/widgets/function_input/parameter_input/kbaseNarrativeParameterCustomButtonInput',
        'kbaseNarrativeParameterCustomDropdownGroupInput': 'kbase/js/widgets/function_input/parameter_input/kbaseNarrativeParameterCustomDropdownGroupInput',
        'kbaseNarrativeParameterAjaxTextSubdataInput': 'kbase/js/widgets/function_input/parameter_input/kbaseNarrativeParameterAjaxTextSubdataInput',
        /***
         * END CUSTOM INPUT WIDGETS
         ***/



        /***
         * CUSTOM OUTPUT AND VIEWER WIDGETS
         ***/
        'kbaseMatrix2DAbstract': 'kbase/js/widgets/function_output/kbaseMatrix2DAbstract',
        'kbaseGrowthMatrixAbstract': 'kbase/js/widgets/function_output/kbaseGrowthMatrixAbstract',
        'kbaseGrowthMatrix': 'kbase/js/widgets/function_output/kbaseGrowthMatrix',
        'kbaseGrowthCurves': 'kbase/js/widgets/function_output/kbaseGrowthCurves',


        'kbaseGrowthParametersAbstract': 'kbase/js/widgets/function_output/kbaseGrowthParametersAbstract',
        'kbaseGrowthParameters': 'kbase/js/widgets/function_output/kbaseGrowthParameters',
        'kbaseGrowthParamsPlot': 'kbase/js/widgets/function_output/kbaseGrowthParamsPlot',
        'kbaseGrowthParams2DPlot': 'kbase/js/widgets/function_output/kbaseGrowthParams2DPlot',

        'kbaseSamplePropertyMatrixAbstract': 'kbase/js/widgets/function_output/kbaseSamplePropertyMatrixAbstract',
        'kbaseSamplePropertyMatrix': 'kbase/js/widgets/function_output/kbaseSamplePropertyMatrix',
        'kbaseSamplePropertyHistogram': 'kbase/js/widgets/function_output/kbaseSamplePropertyHistogram',
        'kbaseSampleProperty2DPlot': 'kbase/js/widgets/function_output/kbaseSampleProperty2DPlot',
        'kbaseChromatographyMatrix': 'kbase/js/widgets/function_output/kbaseChromatographyMatrix',
        'kbaseChromatograms': 'kbase/js/widgets/function_output/kbaseChromatograms',
        'kbaseDefaultNarrativeOutput': 'kbase/js/widgets/function_output/kbaseDefaultNarrativeOutput',

        'ModelingAPI': 'kbase/js/api/ModelingAPI',
        'KBModeling': 'kbase/js/revised-widgets/src/widgets/modeling/KBModeling', // to be deprecated!
        'kbaseTabTable': 'kbase/js/revised-widgets/src/widgets/modeling/kbaseTabTable',
        'KBaseFBA.FBAModel': 'kbase/js/revised-widgets/src/widgets/modeling/KBaseFBA.FBAModel',
        'KBaseFBA.FBAModelSet': 'kbase/js/revised-widgets/src/widgets/modeling/KBaseFBA.FBAModelSet',
        'KBaseFBA.FBA': 'kbase/js/revised-widgets/src/widgets/modeling/KBaseFBA.FBA',
        'KBaseFBA.FBAComparison': 'kbase/js/revised-widgets/src/widgets/modeling/KBaseFBA.FBAComparison',
        'KBaseFBA.ModelComparison': 'kbase/js/widgets/function_output/kbaseFbaModelComparisonNew',
        'kbaseFbaModelComparisonNew': 'kbase/js/widgets/function_output/kbaseFbaModelComparisonNew',
        'KBaseBiochem.Media': 'kbase/js/revised-widgets/src/widgets/modeling/KBaseBiochem.Media',
        'KBasePhenotypes.PhenotypeSet': 'kbase/js/revised-widgets/src/widgets/modeling/KBasePhenotypes.PhenotypeSet',
        'KBasePhenotypes.PhenotypeSimulationSet': 'kbase/js/revised-widgets/src/widgets/modeling/KBasePhenotypes.PhenotypeSimulationSet',
        'KBaseSearch.GenomeSet': 'kbase/js/revised-widgets/src/widgets/modeling/KBaseSearch.GenomeSet',
        'modelSeedVizConfig': 'kbase/js/revised-widgets/src/widgets/modeling/modelSeedVizConfig',
        'msPathway': 'kbase/js/revised-widgets/src/widgets/modeling/msPathway',
        'kbasePathways': 'kbase/js/revised-widgets/src/widgets/modeling/kbasePathways',
        'kbaseExpressionAnalysis': 'kbase/js/widgets/function_output/kbaseExpressionAnalysis',
        'kbaseEditMedia': 'kbase/js/widgets/function_input/kbaseEditMedia',
        'kbaseMediaEditor': 'kbase/js/widgets/function_input/editors/kbaseMediaEditor',
        'kbaseEditModel': 'kbase/js/widgets/function_input/kbaseEditModel',
        'kbaseModelEditor': 'kbase/js/widgets/function_input/editors/kbaseModelEditor',
        'kbaseEditHistory': 'kbase/js/widgets/function_input/editors/kbaseEditHistory',
        'kbaseHomologySearch': 'kbase/js/widgets/function_input/kbaseHomologySearch',
        'kbaseModal': 'kbase/js/widgets/narrative_core/kbaseModal',

        // another implementation of kbaseTabs needed for kbaseTabTable
        'kbaseTabTableTabs': 'kbase/js/revised-widgets/src/widgets/modeling/kbaseTabs',
        'knhx': 'ext_components/knhxtree/js/knhx',
        'knhx_menu': 'ext_components/knhxtree/js/menu',
        'knhx_excanvas': 'ext_components/knhxtree/js/excanvas',
        'knhx_canvastext': 'ext_components/knhxtree/js/canvastext',
        'knhx_easytree': 'ext_components/knhxtree/js/easytree',
        'kbaseTree': 'kbase/js/widgets/function_output/kbaseTree',
        'kbaseContigBrowserButtons': 'kbase/js/widgets/genomes/kbaseContigBrowserButtons',
        'ContigBrowserPanel': 'kbase/js/widgets/function_output/contigBrowserPanel',
        'kbaseGenomeView': 'kbase/js/widgets/function_output/kbaseGenomeAnnotation',
        'kbaseGenomeAnnotationViewer': 'kbase/js/widgets/function_output/kbaseGenomeAnnotationViewer',
        'kbaseGenomeAnnotationAssembly': 'kbase/js/widgets/function_output/kbaseGenomeAnnotationAssembly',

        'kbaseContigSetView': 'kbase/js/widgets/function_output/kbaseContigSetView',
        'kbaseAssemblyView': 'kbase/js/widgets/function_output/kbaseAssemblyView',
        'AssemblyWidget': 'kbase/js/widgets/function_output/kbaseAssembly',
        'kbaseSeqCompView': 'kbase/js/widgets/function_output/kbaseSeqCompView',
        'FbaModelComparisonWidget': 'kbase/js/widgets/function_output/kbaseFbaModelComparison',
        // for the GenomeComparison object
        'kbaseGenomeComparisonViewer': 'kbase/js/widgets/function_output/kbaseGenomeComparisonViewer',
        // for comparing proteomes
        'GenomeComparisonWidget': 'kbase/js/widgets/function_output/kbaseGenomeComparison',
        'kbasePanGenome': 'kbase/js/widgets/function_output/kbasePanGenome',
        'kbaseDomainAnnotation': 'kbase/js/widgets/function_output/kbaseDomainAnnotation',
        'kbaseGenomeSetBuilder': 'kbase/js/widgets/function_output/kbaseGenomeSetBuilder',
        'kbaseMSA': 'kbase/js/widgets/function_output/kbaseMSA',
        'MetagenomeView': 'kbase/js/widgets/function_output/kbaseMetagenomeView',
        'CollectionView': 'kbase/js/widgets/function_output/kbaseCollectionView',
        'AbundanceDataHeatmap': 'kbase/js/widgets/function_output/kbaseAbundanceDataHeatmap',
        'AbundanceDataPcoa': 'kbase/js/widgets/function_output/kbaseAbundanceDataPcoa',
        'AbundanceDataBoxplot': 'kbase/js/widgets/function_output/kbaseAbundanceDataBoxplot',
        'AbundanceDataTable': 'kbase/js/widgets/function_output/kbaseAbundanceDataTable',
        'AnnotationSetTable': 'kbase/js/widgets/function_output/kbaseAnnotationSetTable',
        'AbundanceDataView': 'kbase/js/widgets/function_output/kbaseAbundanceDataView',
        'RankAbundancePlot': 'kbase/js/widgets/function_output/kbaseRankAbundancePlot',

        'kbaseFeatureSet': 'kbase/js/widgets/function_output/kbaseFeatureSet',

        'kbaseExpressionMatrix': 'kbase/js/widgets/function_output/kbaseExpressionMatrix',
        'kbaseExpressionGenesetBaseWidget': 'kbase/js/widgets/function_output/kbaseExpressionGenesetBaseWidget',
        'kbaseExpressionHeatmap': 'kbase/js/widgets/function_output/kbaseExpressionHeatmap',
        'kbaseExpressionSparkline': 'kbase/js/widgets/function_output/kbaseExpressionSparkline',
        'kbaseExpressionPairwiseCorrelation': 'kbase/js/widgets/function_output/kbaseExpressionPairwiseCorrelation',
        'kbaseExpressionEstimateK': 'kbase/js/widgets/function_output/kbaseExpressionEstimateK',
        'kbaseExpressionClusterSet': 'kbase/js/widgets/function_output/kbaseExpressionClusterSet',
        'kbaseExpressionFeatureClusters': 'kbase/js/widgets/function_output/kbaseExpressionFeatureClusters',
        'kbaseExpressionFeatureTableHeatmap': 'kbase/js/widgets/function_output/kbaseExpressionFeatureTableHeatmap',
        'kbaseExpressionConditionsetBaseWidget': 'kbase/js/widgets/function_output/kbaseExpressionConditionsetBaseWidget',

        'geometry_point': 'kbase/js/ui-common/src/js/geometry/geometry_point',
        'geometry_rectangle': 'kbase/js/ui-common/src/js/geometry/geometry_rectangle',
        'geometry_size': 'kbase/js/ui-common/src/js/geometry/geometry_size',
        'kbaseVisWidget': 'kbase/js/ui-common/src/widgets/kbaseVisWidget',
        'kbaseHeatmap': 'kbase/js/ui-common/src/widgets/vis/kbaseHeatmap',
        'kbaseLinechart': 'kbase/js/ui-common/src/widgets/vis/kbaseLinechart',
        'kbaseBarchart': 'kbase/js/ui-common/src/widgets/vis/kbaseBarchart',
        'kbaseScatterplot': 'kbase/js/ui-common/src/widgets/vis/kbaseScatterplot',
        'kbaseChordchart': 'kbase/js/ui-common/src/widgets/vis/kbaseChordchart',
        'kbaseCircularHeatmap': 'kbase/js/ui-common/src/widgets/vis/kbaseCircularHeatmap',
        'kbaseForcedNetwork': 'kbase/js/ui-common/src/widgets/vis/kbaseForcedNetwork',
        'kbaseHistogram': 'kbase/js/ui-common/src/widgets/vis/kbaseHistogram',
        'kbaseLineSerieschart': 'kbase/js/ui-common/src/widgets/vis/kbaseLineSerieschart',
        'kbasePiechart': 'kbase/js/ui-common/src/widgets/vis/kbasePiechart',
        'kbaseTreechart': 'kbase/js/ui-common/src/widgets/vis/kbaseTreechart',
        'kbaseRNASeqPie': 'kbase/js/ui-common/src/widgets/kbaseRNASeqPie',
        'kbaseRNASeqPieNew': 'kbase/js/ui-common/src/widgets/kbaseRNASeqPieNew',
        'kbaseRNASeqAnalysis': 'kbase/js/ui-common/src/widgets/kbaseRNASeqAnalysis',
        'kbaseRNASeqAnalysisNew': 'kbase/js/ui-common/src/widgets/kbaseRNASeqAnalysisNew',
        'kbaseRNASeqSample': 'kbase/js/ui-common/src/widgets/kbaseRNASeqSample',
        'kbaseButtonControls': 'kbase/js/ui-common/src/widgets/kbaseButtonControls',
        'kbaseSearchControls': 'kbase/js/ui-common/src/widgets/kbaseSearchControls',
        'kbaseRNASeqHistogram': 'kbase/js/ui-common/src/widgets/kbaseRNASeqHistogram',
        'kbaseExpressionMatrixHeatmap': 'kbase/js/ui-common/src/widgets/kbaseExpressionMatrixHeatmap',
        'kbaseFigureObjectHeatmap': 'kbase/js/ui-common/src/widgets/kbaseFigureObjectHeatmap',
        'kbaseCummerbundPlot': 'kbase/js/ui-common/src/widgets/kbaseCummerbundPlot',
        'kbaseExpressionSampleTable': 'kbase/js/ui-common/src/widgets/kbaseExpressionSampleTable',
        'kbaseExpressionSampleTableNew': 'kbase/js/ui-common/src/widgets/kbaseExpressionSampleTableNew',
        'kbasePValueHistogram': 'kbase/js/ui-common/src/widgets/kbasePValueHistogram',
        'kbasePMIBarchart': 'kbase/js/ui-common/src/widgets/vis/plants/kbasePMIBarchart',
        'kbaseVenndiagram': 'kbase/js/ui-common/src/widgets/vis/kbaseVenndiagram',
        'kbaseOntologyDictionary': 'kbase/js/ui-common/src/widgets/kbaseOntologyDictionary',
        'kbaseOntologyTranslation': 'kbase/js/ui-common/src/widgets/kbaseOntologyTranslation',
        'kbaseBlastOutput': 'kbase/js/widgets/function_output/kbaseBlastOutput',

        'kbaseRegisterRepoState': 'kbase/js/widgets/function_output/kbaseRegisterRepoState',
        'kbaseViewLiveRunLog': 'kbase/js/widgets/function_output/kbaseViewLiveRunLog',
        'kbaseReportView': 'kbase/js/widgets/function_output/kbaseReportView',
        'kbaseExpressionVolcanoPlot': 'kbase/js/widgets/function_output/kbaseExpressionVolcanoPlot',
        'css': 'https://ci.kbase.us/cdn/files/require-css/0.1.8/css', //'ext_components/require-css/css.min',



        /***
         * END CUSTOM OUTPUT WIDGETS
         ***/

        'd3': 'ext_components/d3/d3.min', //  'kbase/js/ui-common/ext/d3/d3.v3.min',
        'colorbrewer': 'kbase/js/ui-common/ext/colorbrewer.min',
        'handlebars': 'ext_components/handlebars/handlebars', //kbase/js/ui-common/ext/handlebars/handlebars-v1.3.0',
        'kbwidget': 'kbase/js/ui-common/src/kbwidget',
        'kbaseAccordion': 'kbase/js/ui-common/src/widgets/kbaseAccordion',
        'kbaseAuthenticatedWidget': 'kbase/js/ui-common/src/widgets/kbaseAuthenticatedWidget',
        'kbaseTable': 'kbase/js/ui-common/src/widgets/kbaseTable',
        'kbasePanel': 'kbase/js/ui-common/src/widgets/kbasePanel',
        'kbaseDeletePrompt': 'kbase/js/ui-common/src/widgets/kbaseDeletePrompt',
    },
    shim: {
        underscore: {
            exports: '_'
        },
        jquery: {
            exports: '$'
        },
        jqueryCookie: {
            deps: ['jquery']
        },
        'jquery-nearest': {
            deps: ['jquery']
        },
        'jquery-dataTables': {
            deps: ['jquery']
        },
        'jquery-dataTables-bootstrap': {
            deps: ['jquery', 'jquery-dataTables', 'bootstrap']
        },
        kbaseNarrativeAppCell: {
            deps: ['kbaseNarrativeMethodCell', 'kbaseNarrativeOutputCell',
                'kbaseNarrativeCellMenu'
            ]
        },
        kbaseNarrativeMethodCell: {
            deps: ['kbaseNarrativeMethodInput', 'kbaseNarrativeCellMenu']
        },
        kbaseNarrativeOutputCell: {
            deps: ['jquery', 'kbwidget', 'kbaseNarrativeDataCell', 'kbaseNarrativeCellMenu']
        },
        knhx: {
            deps: ['knhx_menu', 'knhx_excanvas', 'knhx_canvastext', 'knhx_easytree']
        },
        'kbaseModelEditor': {
            // could be removed once code is repackaged and require.js-ified
            'deps': ['KBaseFBA.FBAModel', 'kbaseTabTableTabs']
        },
        'KBModeling': {
            'deps': ['jquery']
        },
        'KBaseFBA.FBAModel': {
            'deps': ['KBModeling']
        },
        'KBaseFBA.FBAModelSet': {
            'deps': ['KBModeling']
        },
        'KBaseFBA.FBA': {
            'deps': ['KBModeling']
        },
        'KBaseFBA.FBAComparison': {
            'deps': ['KBModeling']
        },
        'KBaseBiochem.Media': {
            'deps': ['KBModeling']
        },
        'KBasePhenotypes.PhenotypeSet': {
            'deps': ['KBModeling']
        },
        'KBasePhenotypes.PhenotypeSimulationSet': {
            'deps': ['KBModeling']
        },
        'KBaseSearch.GenomeSet': {
            'deps': ['KBModeling']
        },
        'kbaseTabTableTabs': {
            'exports': 'kbaseTabTableTabs'
        },
        'kbaseTabTable': {
            'deps': ['jquery', 'kbwidget',
                'jquery-dataTables',
                'jquery-dataTables-bootstrap',
                'bootstrap',
                'KBModeling',
                'KBaseFBA.FBAModel',
                'KBaseFBA.FBAModelSet',
                'KBaseFBA.FBA',
                'KBaseFBA.FBAComparison',
                'KBaseBiochem.Media',
                'KBasePhenotypes.PhenotypeSet',
                'KBasePhenotypes.PhenotypeSimulationSet',
                'KBaseFBA.FBAComparison',
                'modelSeedVizConfig',
                'kbasePathways',
                'msPathway',
                'kbaseTabTableTabs',
                'kbasePMIBarchart'
            ]
        },
        'kbasePathways': {
            'deps': ['jquery',
                'kbwidget',
                'KBModeling',
                'jquery-dataTables',
                'jquery-dataTables-bootstrap',
                'bootstrap',
                'msPathway'
            ]
        },
        'msPathway': {
            'deps': ['jquery',
                'modelSeedVizConfig',
                'd3'
            ]
        },
        // 'kbaseTabTableTabs' : {
        //     'deps' : ['jquery',
        //               'jqueryui',
        //               'jquery-dataTables',
        //               'jquery-dataTables-bootstrap',
        //               'bootstrap']
        // },
        kbapi: {
            deps: ['jquery', 'bootstrap', 'kbase-client-api']
        },
        'kbase-client-api': {
            deps: ['jquery']
        },
        kbStandaloneGraph: {
            deps: ['jquery', 'jquery-svg']
        },
        bootstrap: {
            deps: ['jquery', 'jqueryui']
        }
    }
});