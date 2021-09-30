require.config({
    // not in here, since it's configured elsewhere, but this
    // is expected to be relative to /static/ on the server.
    // Jupyter does some magic where it merges its /static/ directory
    // with this one (kbase-profile/static)
    paths: {
        fileSaver: 'ext_components/file-saver/FileSaver.min',
        bluebird: 'ext_components/bluebird/js/browser/bluebird.min',
        'bootstrap-slider': 'ext_components/bootstrap-slider/bootstrap-slider',
        'jquery-dataTables-base': 'ext_components/datatables/media/js/jquery.dataTables.min',
        'jquery-dataTables': 'ext_components/datatables/media/js/dataTables.bootstrap.min',
        'datatables.net': 'ext_components/datatables.net/js/jquery.dataTables.min',
        'datatables.net-bs': 'ext_components/datatables.net-bs/js/dataTables.bootstrap.min',
        'datatables.net-buttons': 'ext_components/datatables.net-buttons/js/dataTables.buttons.min',
        'datatables.net-buttons-bs':
            'ext_components/datatables.net-buttons-bs/js/buttons.bootstrap.min',
        'datatables.net-buttons-html5':
            'ext_components/datatables.net-buttons/js/buttons.html5.min',
        'datatables.net-buttons-colvis':
            'ext_components/datatables.net-buttons/js/buttons.colVis.min',
        'datatables.net-buttons-print':
            'ext_components/datatables.net-buttons/js/buttons.print.min',
        bloodhound: 'ext_components/corejs-typeahead/dist/bloodhound.min',
        // css: 'ext_components/require-css/css',
        d3: 'ext_components/d3/d3.min',
        md5: 'ext_components/spark-md5/spark-md5',
        domReady: 'ext_components/requirejs/domReady',
        dropzone: 'ext_components/dropzone/dist/dropzone-amd-module',
        handlebars: 'ext_components/handlebars/handlebars',
        json: 'ext_components/requirejs-plugins/src/json',
        'jquery-nearest': 'ext_components/jquery-nearest/src/jquery.nearest.min',
        plotly: 'ext_components/plotly.js/dist/plotly.min',
        kb_common: 'ext_components/kbase-common-js/dist/kb_common/',
        kb_service: 'ext_components/kbase-service-clients-js/dist/kb_service/',
        kb_sdk_clients: 'ext_components/kbase-sdk-clients-js/dist/amd/kb_sdk_clients/',
        numeral: 'ext_components/numeral/numeral',
        text: 'ext_components/requirejs-plugins/lib/text',
        tipsy: 'ext_components/jquery.tipsy/js/jquery.tipsy',
        typeahead: 'ext_components/corejs-typeahead/dist/typeahead.jquery.min',
        underscore: 'ext_components/underscore/underscore-min',
        select2: 'ext_components/select2/dist/js/select2.full.min',
        uuid: 'ext_components/pure-uuid/uuid',
        'font-awesome': 'ext_components/font-awesome/css/font-awesome.min',
        yaml: 'ext_components/require-yaml/yaml',
        'js-yaml': 'ext_components/js-yaml/dist/js-yaml.min',

        // not under bower control
        colorbrewer: 'ext_packages/colorbrewer/colorbrewer.min',
        // copied from the cdn
        'google-code-prettify': 'ext_packages/google-code-prettify/1.2.0/',
        'jquery-svg': 'ext_packages/jquery-extensions/js/jquery.svg',
        knhx: 'ext_packages/knhxtree/js/knhx',
        knhx_menu: 'ext_packages/knhxtree/js/menu',
        knhx_excanvas: 'ext_packages/knhxtree/js/excanvas',
        knhx_canvastext: 'ext_packages/knhxtree/js/canvastext',
        knhx_easytree: 'ext_packages/knhxtree/js/easytree',

        narrativeTour: 'kbase/js/tour',
        kbaseInputTest: 'kbase/js/widgets/function_input/kbaseInputTest',
        api: 'kbase/js/api',
        util: 'kbase/js/util',
        jsonrpc: 'kbase/js/jsonrpc',
        config: 'kbase/config',
        styles: 'kbase/css',
        narrative_core: 'kbase/js/widgets/narrative_core',
        configPath: 'kbase',
        narrativeViewers: 'kbase/js/widgets/narrative_core/narrativeViewers',
        jquery: 'ext_components/jquery/dist/jquery.min',
        jqueryui: 'components/jquery-ui/jquery-ui.min',
        bootstrap: 'ext_components/bootstrap/dist/js/bootstrap.min',
        // 'css'                                   : 'ext_components/require-css/css.min',

        narrativeConfig: 'kbase/js/narrativeConfig',
        narrativeMain: 'narrativeMain',
        narrativeTreeMain: 'narrativeTreeMain',
        narrativeLogin: 'kbase/js/narrativeLogin',
        userMenu: 'kbase/js/userMenu',
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
        'SetAPI-client-api': 'kbase/js/api/SetAPIClient',
        'ExpressionUtils-client-api': 'kbase/js/api/ExpressionUtilsClient',
        'Taxonomy-client-api': 'kbase/js/api/TaxonomyAPIClient',
        RestAPIClient: 'kbase/js/api/RestAPIClient',
        StagingServiceClient: 'kbase/js/api/StagingServiceClient',

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

        common: 'kbase/js/common',
        widgets: 'kbase/js/widgets',
        appWidgets: 'kbase/js/widgets/appWidgets2',

        /***
         * CORE NARRATIVE WIDGETS
         ***/
        kbaseNarrativePrestart: 'kbase/js/kbaseNarrativePrestart',
        kbaseNarrative: 'kbase/js/kbaseNarrative',
        kbaseNarrativeCellMenu: 'kbase/js/widgets/narrative_core/kbaseNarrativeCellMenu',
        kbaseNarrativeControlPanel: 'kbase/js/widgets/narrative_core/kbaseNarrativeControlPanel',
        kbaseNarrativeDataPanel: 'kbase/js/widgets/narrative_core/kbaseNarrativeDataPanel',
        kbaseNarrativeDataList: 'kbase/js/widgets/narrative_core/kbaseNarrativeDataList',
        kbaseNarrativeSidePanel: 'kbase/js/widgets/narrative_core/kbaseNarrativeSidePanel',
        jobCommChannel: 'kbase/js/widgets/narrative_core/jobCommChannel',
        kbaseNarrativeAppPanel: 'kbase/js/widgets/narrative_core/kbaseNarrativeAppPanel',
        kbaseNarrativeManagePanel: 'kbase/js/widgets/narrative_core/kbaseNarrativeManagePanel',
        kbaseNarrativeOutlinePanel: 'kbase/js/widgets/narrative_core/kbaseNarrativeOutlinePanel',
        kbaseNarrativeDownloadPanel: 'kbase/js/widgets/narrative_core/kbaseNarrativeDownloadPanel',
        kbaseNarrativeSharePanel: 'kbase/js/widgets/narrative_core/kbaseNarrativeSharePanel',
        kbaseNarrativeExampleDataTab:
            'kbase/js/widgets/narrative_core/kbaseNarrativeExampleDataTab',
        kbaseNarrativeStagingDataTab:
            'kbase/js/widgets/narrative_core/kbaseNarrativeStagingDataTab',
        kbaseNarrativeSideImportTab: 'kbase/js/widgets/narrative_core/kbaseNarrativeSideImportTab',
        kbaseNarrativeSidePublicTab: 'kbase/js/widgets/narrative_core/kbaseNarrativeSidePublicTab',
        kbaseNarrativeCell: 'kbase/js/widgets/narrative_core/kbaseNarrativeCell',
        kbaseNarrativeDataCell: 'kbase/js/widgets/narrative_core/kbaseNarrativeDataCell',
        kbaseNarrativeOutputCell: 'kbase/js/widgets/narrative_core/kbaseNarrativeOutputCell',
        kbaseDataCard: 'kbase/js/widgets/narrative_core/kbaseDataCard',
        kbaseAppCard: 'kbase/js/widgets/narrative_core/kbaseAppCard',
        kbaseCardLayout: 'kbase/js/widgets/narrative_core/kbaseCardLayout',

        kbaseNarrativeInput: 'kbase/js/widgets/function_input/kbaseNarrativeInput',
        kbaseNarrativeMethodInput: 'kbase/js/widgets/function_input/kbaseNarrativeMethodInput',
        kbaseNarrativeParameterInput:
            'kbase/js/widgets/function_input/parameter_input/kbaseNarrativeParameterInput',
        kbaseNarrativeParameterTextInput:
            'kbase/js/widgets/function_input/parameter_input/kbaseNarrativeParameterTextInput',
        kbaseNarrativeParameterDropdownInput:
            'kbase/js/widgets/function_input/parameter_input/kbaseNarrativeParameterDropdownInput',
        kbaseNarrativeParameterCheckboxInput:
            'kbase/js/widgets/function_input/parameter_input/kbaseNarrativeParameterCheckboxInput',
        kbaseNarrativeParameterTextareaInput:
            'kbase/js/widgets/function_input/parameter_input/kbaseNarrativeParameterTextareaInput',
        kbaseNarrativeParameterFileInput:
            'kbase/js/widgets/function_input/parameter_input/kbaseNarrativeParameterFileInput',
        kbaseNarrativeParameterTextSubdataInput:
            'kbase/js/widgets/function_input/parameter_input/kbaseNarrativeParameterTextSubdataInput',
        kbaseNarrativeError: 'kbase/js/widgets/function_output/kbaseNarrativeError',
        ipythonCellMenu: 'kbase/js/widgets/narrative_core/ipythonCellMenu',

        // not yet ADMs, but still load with Require
        kbaseNarrativeAppCell: 'kbase/js/widgets/narrative_core/kbaseNarrativeAppCell',
        kbaseNarrativeMethodCell: 'kbase/js/widgets/narrative_core/kbaseNarrativeMethodCell',
        kbaseNarrativeWorkspace: 'kbase/js/widgets/narrative_core/kbaseNarrativeWorkspace',
        kbaseLogging: 'kbase/js/kbaseLogging',
        RGBColor: 'kbase/js/rgbcolor',
        kbStandaloneTable: 'kbase/js/widgets/kbStandaloneTable',
        kbStandalonePlot: 'kbase/js/widgets/kbStandalonePlot',
        kbStandaloneGraph: 'kbase/js/widgets/kbStandaloneGraph',
        kbStandaloneHeatmap: 'kbase/js/widgets/kbStandaloneHeatmap',
        /***
         * END CORE WIDGETS
         ***/

        /***
         * CUSTOM NARRATIVE INPUT WIDGETS
         ***/
        kbaseDefaultNarrativeInput: 'kbase/js/widgets/function_input/kbaseDefaultNarrativeInput',
        kbaseBuildMediaInput: 'kbase/js/widgets/function_input/kbaseBuildMediaInput',
        rastGenomeImportInput: 'kbase/js/widgets/function_input/rastGenomeImportInput',
        kbaseNcbiGenomeImportInput: 'kbase/js/widgets/function_input/kbaseNcbiGenomeImportInput',
        kbaseTabbedInput: 'kbase/js/widgets/function_input/kbaseTabbedInput',
        create_metagenome_set: 'kbase/js/widgets/function_input/create_metagenome_set',
        kbStandaloneListSelect: 'kbase/js/widgets/function_input/kbStandaloneListselect',
        devVizSelector: 'kbase/js/widgets/function_input/devDataViz',

        kbaseGrowthCurvesInput: 'kbase/js/widgets/function_input/kbaseGrowthCurvesInput',
        kbaseGrowthParamsPlotInput: 'kbase/js/widgets/function_input/kbaseGrowthParamsPlotInput',
        kbaseGrowthParams2DPlotInput:
            'kbase/js/widgets/function_input/kbaseGrowthParams2DPlotInput',
        kbaseSamplePropertyHistogramInput:
            'kbase/js/widgets/function_input/kbaseSamplePropertyHistogramInput',
        kbaseSampleProperty2DPlotInput:
            'kbase/js/widgets/function_input/kbaseSampleProperty2DPlotInput',

        kbaseNarrativeParameterCustomTextSubdataInput:
            'kbase/js/widgets/function_input/parameter_input/kbaseNarrativeParameterCustomTextSubdataInput',
        kbaseNarrativeParameterCustomButtonInput:
            'kbase/js/widgets/function_input/parameter_input/kbaseNarrativeParameterCustomButtonInput',
        kbaseNarrativeParameterCustomDropdownGroupInput:
            'kbase/js/widgets/function_input/parameter_input/kbaseNarrativeParameterCustomDropdownGroupInput',
        kbaseNarrativeParameterAjaxTextSubdataInput:
            'kbase/js/widgets/function_input/parameter_input/kbaseNarrativeParameterAjaxTextSubdataInput',
        /***
         * END CUSTOM INPUT WIDGETS
         ***/

        /***
         * CUSTOM OUTPUT AND VIEWER WIDGETS
         ***/
        kbaseVariation: 'kbase/js/widgets/function_output/kbaseVariation',
        kbaseDefaultObjectView: 'kbase/js/widgets/function_output/kbaseDefaultObjectView',
        kbaseBinnedContigs: 'kbase/js/widgets/function_output/kbaseBinnedContigs',
        kbaseAlignment: 'kbase/js/widgets/function_output/kbaseAlignment',
        kbaseReadsViewer: 'kbase/js/widgets/function_output/kbaseReadsViewer',
        kbaseReadsSetView: 'kbase/js/widgets/function_output/kbaseReadsSetView',
        kbaseMatrix2DAbstract: 'kbase/js/widgets/function_output/kbaseMatrix2DAbstract',
        kbaseGrowthMatrixAbstract: 'kbase/js/widgets/function_output/kbaseGrowthMatrixAbstract',
        kbaseGrowthMatrix: 'kbase/js/widgets/function_output/kbaseGrowthMatrix',
        kbaseGrowthCurves: 'kbase/js/widgets/function_output/kbaseGrowthCurves',

        kbaseGrowthParametersAbstract:
            'kbase/js/widgets/function_output/kbaseGrowthParametersAbstract',
        kbaseGrowthParameters: 'kbase/js/widgets/function_output/kbaseGrowthParameters',
        kbaseGrowthParamsPlot: 'kbase/js/widgets/function_output/kbaseGrowthParamsPlot',
        kbaseGrowthParams2DPlot: 'kbase/js/widgets/function_output/kbaseGrowthParams2DPlot',

        kbaseSamplePropertyMatrixAbstract:
            'kbase/js/widgets/function_output/kbaseSamplePropertyMatrixAbstract',
        kbaseSamplePropertyMatrix: 'kbase/js/widgets/function_output/kbaseSamplePropertyMatrix',
        kbaseSamplePropertyHistogram:
            'kbase/js/widgets/function_output/kbaseSamplePropertyHistogram',
        kbaseSampleProperty2DPlot: 'kbase/js/widgets/function_output/kbaseSampleProperty2DPlot',
        kbaseChromatographyMatrix: 'kbase/js/widgets/function_output/kbaseChromatographyMatrix',
        kbaseChromatograms: 'kbase/js/widgets/function_output/kbaseChromatograms',
        kbaseDefaultNarrativeOutput: 'kbase/js/widgets/function_output/kbaseDefaultNarrativeOutput',

        ModelingAPI: 'kbase/js/api/ModelingAPI',
        KBModeling: 'kbase/js/widgets/function_output/modeling/KBModeling', // to be deprecated!
        kbaseTabTable: 'kbase/js/widgets/function_output/modeling/kbaseTabTable',
        'KBaseFBA.FBAModel': 'kbase/js/widgets/function_output/modeling/KBaseFBA.FBAModel',
        'KBaseFBA.FBAModelSet': 'kbase/js/widgets/function_output/modeling/KBaseFBA.FBAModelSet',
        'KBaseFBA.FBA': 'kbase/js/widgets/function_output/modeling/KBaseFBA.FBA',
        'KBaseFBA.FBAComparison':
            'kbase/js/widgets/function_output/modeling/KBaseFBA.FBAComparison',
        'KBaseFBA.ModelComparison': 'kbase/js/widgets/function_output/kbaseFbaModelComparisonNew',
        kbaseFbaModelComparisonNew: 'kbase/js/widgets/function_output/kbaseFbaModelComparisonNew',
        'KBaseBiochem.CompoundSet':
            'kbase/js/widgets/function_output/modeling/KBaseBiochem.CompoundSet',
        'KBaseBiochem.Media': 'kbase/js/widgets/function_output/modeling/KBaseBiochem.Media',
        'KBasePhenotypes.PhenotypeSet':
            'kbase/js/widgets/function_output/modeling/KBasePhenotypes.PhenotypeSet',
        'KBasePhenotypes.PhenotypeSimulationSet':
            'kbase/js/widgets/function_output/modeling/KBasePhenotypes.PhenotypeSimulationSet',
        'KBaseSearch.GenomeSet': 'kbase/js/widgets/function_output/modeling/KBaseSearch.GenomeSet',
        modelSeedVizConfig: 'kbase/js/widgets/function_output/modeling/modelSeedVizConfig',
        msPathway: 'kbase/js/widgets/function_output/modeling/msPathway',
        kbasePathways: 'kbase/js/widgets/function_output/modeling/kbasePathways',
        kbaseExpressionAnalysis: 'kbase/js/widgets/function_output/kbaseExpressionAnalysis',
        kbaseEditMedia: 'kbase/js/widgets/function_input/kbaseEditMedia',
        kbaseMediaEditor: 'kbase/js/widgets/function_input/editors/kbaseMediaEditor',
        kbaseEditModel: 'kbase/js/widgets/function_input/kbaseEditModel',
        kbaseModelEditor: 'kbase/js/widgets/function_input/editors/kbaseModelEditor',
        kbaseEditHistory: 'kbase/js/widgets/function_input/editors/kbaseEditHistory',
        kbaseHomologySearch: 'kbase/js/widgets/function_input/kbaseHomologySearch',
        kbaseModal: 'kbase/js/widgets/narrative_core/kbaseModal',
        kbaseGenericSetViewer: 'kbase/js/widgets/function_output/kbaseGenericSetViewer',
        kbaseGenericMatrix: 'kbase/js/widgets/function_output/kbaseGenericMatrix',

        // another implementation of kbaseTabs needed for kbaseTabTable
        kbaseTabTableTabs: 'kbase/js/widgets/function_output/modeling/kbaseTabs',
        kbaseTree: 'kbase/js/widgets/function_output/kbaseTree',
        kbaseContigBrowserButtons: 'kbase/js/widgets/genomes/kbaseContigBrowserButtons',
        ContigBrowserPanel: 'kbase/js/widgets/function_output/contigBrowserPanel',
        kbaseGenomeView: 'kbase/js/widgets/function_output/kbaseGenomeAnnotation',
        kbaseAnnotatedMetagenomeAssemblyView:
            'kbase/js/widgets/function_output/kbaseAnnotatedMetagenomeAssembly',
        kbaseTaxonomyBrowser: 'kbase/js/widgets/function_output/kbaseTaxonomyBrowser',
        kbaseGenomeAnnotationViewer: 'kbase/js/widgets/function_output/kbaseGenomeAnnotationViewer',
        kbaseGenomeAnnotationAssembly:
            'kbase/js/widgets/function_output/kbaseGenomeAnnotationAssembly',

        kbaseContigSetView: 'kbase/js/widgets/function_output/kbaseContigSetView',
        kbaseAssemblyView: 'kbase/js/widgets/function_output/kbaseAssemblyView',
        AssemblyWidget: 'kbase/js/widgets/function_output/kbaseAssembly',
        kbaseSeqCompView: 'kbase/js/widgets/function_output/kbaseSeqCompView',
        FbaModelComparisonWidget: 'kbase/js/widgets/function_output/kbaseFbaModelComparison',
        // for the GenomeComparison object
        kbaseGenomeComparisonViewer: 'kbase/js/widgets/function_output/kbaseGenomeComparisonViewer',
        // for comparing proteomes
        GenomeComparisonWidget: 'kbase/js/widgets/function_output/kbaseGenomeComparison',
        kbasePanGenome: 'kbase/js/widgets/function_output/kbasePanGenome',
        kbaseDomainAnnotation: 'kbase/js/widgets/function_output/kbaseDomainAnnotation',
        kbaseGenomeSetBuilder: 'kbase/js/widgets/function_output/kbaseGenomeSetBuilder',
        kbaseMSA: 'kbase/js/widgets/function_output/kbaseMSA',
        MetagenomeView: 'kbase/js/widgets/function_output/kbaseMetagenomeView',
        CollectionView: 'kbase/js/widgets/function_output/kbaseCollectionView',
        AbundanceDataHeatmap: 'kbase/js/widgets/function_output/kbaseAbundanceDataHeatmap',
        AbundanceDataPcoa: 'kbase/js/widgets/function_output/kbaseAbundanceDataPcoa',
        AbundanceDataBoxplot: 'kbase/js/widgets/function_output/kbaseAbundanceDataBoxplot',
        AbundanceDataTable: 'kbase/js/widgets/function_output/kbaseAbundanceDataTable',
        AnnotationSetTable: 'kbase/js/widgets/function_output/kbaseAnnotationSetTable',
        AbundanceDataView: 'kbase/js/widgets/function_output/kbaseAbundanceDataView',
        RankAbundancePlot: 'kbase/js/widgets/function_output/kbaseRankAbundancePlot',
        kbaseAttributeMapping: 'kbase/js/widgets/function_output/kbaseAttributeMapping',
        kbaseConditionSetViewer: 'kbase/js/widgets/function_output/kbaseAttributeMapping',
        kbaseFeatureSet: 'kbase/js/widgets/function_output/kbaseFeatureSet',
        kbaseSampleSetView: 'kbase/js/widgets/function_output/samples/kbaseSampleSet',

        kbaseExpressionMatrix: 'kbase/js/widgets/function_output/kbaseExpressionMatrix',
        kbaseExpressionGenesetBaseWidget:
            'kbase/js/widgets/function_output/kbaseExpressionGenesetBaseWidget',
        kbaseExpressionHeatmap: 'kbase/js/widgets/function_output/kbaseExpressionHeatmap',
        kbaseExpressionSparkline: 'kbase/js/widgets/function_output/kbaseExpressionSparkline',
        kbaseExpressionPairwiseCorrelation:
            'kbase/js/widgets/function_output/kbaseExpressionPairwiseCorrelation',
        kbaseExpressionEstimateK: 'kbase/js/widgets/function_output/kbaseExpressionEstimateK',
        kbaseExpressionClusterSet: 'kbase/js/widgets/function_output/kbaseExpressionClusterSet',
        kbaseExpressionFeatureClusters:
            'kbase/js/widgets/function_output/kbaseExpressionFeatureClusters',
        kbaseExpressionFeatureTableHeatmap:
            'kbase/js/widgets/function_output/kbaseExpressionFeatureTableHeatmap',
        kbaseExpressionConditionsetBaseWidget:
            'kbase/js/widgets/function_output/kbaseExpressionConditionsetBaseWidget',

        geometry_point: 'kbase/js/geometry/geometry_point',
        geometry_rectangle: 'kbase/js/geometry/geometry_rectangle',
        geometry_size: 'kbase/js/geometry/geometry_size',
        kbaseVisWidget: 'kbase/js/widgets/kbaseVisWidget',
        kbaseHeatmap: 'kbase/js/widgets/vis/kbaseHeatmap',
        kbaseLinechart: 'kbase/js/widgets/vis/kbaseLinechart',
        kbaseBarchart: 'kbase/js/widgets/vis/kbaseBarchart',
        kbaseScatterplot: 'kbase/js/widgets/vis/kbaseScatterplot',
        kbaseChordchart: 'kbase/js/widgets/vis/kbaseChordchart',
        kbaseCircularHeatmap: 'kbase/js/widgets/vis/kbaseCircularHeatmap',
        kbaseForcedNetwork: 'kbase/js/widgets/vis/kbaseForcedNetwork',
        kbaseHistogram: 'kbase/js/widgets/vis/kbaseHistogram',
        kbaseLineSerieschart: 'kbase/js/widgets/vis/kbaseLineSerieschart',
        kbasePiechart: 'kbase/js/widgets/vis/kbasePiechart',
        kbaseTreechart: 'kbase/js/widgets/vis/kbaseTreechart',
        kbaseRNASeqPie: 'kbase/js/widgets/function_output/kbaseAlignment',
        kbaseRNASeqPieNew: 'kbase/js/widgets/function_output/kbaseAlignment',
        kbaseRNASeqAnalysis: 'kbase/js/widgets/function_output/rna-seq/kbaseRNASeqAnalysis',
        kbaseRNASeqAnalysisNew: 'kbase/js/widgets/function_output/rna-seq/kbaseRNASeqAnalysisNew',
        kbaseRNASeqSample: 'kbase/js/widgets/function_output/rna-seq/kbaseRNASeqSample',
        kbaseButtonControls: 'kbase/js/widgets/kbaseButtonControls',
        kbaseSearchControls: 'kbase/js/widgets/kbaseSearchControls',
        kbaseRNASeqHistogram: 'kbase/js/widgets/function_output/rna-seq/kbaseRNASeqHistogram',
        kbaseExpressionMatrixHeatmap:
            'kbase/js/widgets/function_output/rna-seq/kbaseExpressionMatrixHeatmap',
        kbaseFigureObjectHeatmap:
            'kbase/js/widgets/function_output/rna-seq/kbaseFigureObjectHeatmap',
        kbaseCummerbundPlot: 'kbase/js/widgets/function_output/rna-seq/kbaseCummerbundPlot',
        kbaseExpressionSampleTable:
            'kbase/js/widgets/function_output/rna-seq/kbaseExpressionSampleTable',
        kbaseExpressionSampleTableNew:
            'kbase/js/widgets/function_output/rna-seq/kbaseExpressionSampleTableNew',
        kbasePValueHistogram: 'kbase/js/widgets/function_output/rna-seq/kbasePValueHistogram',
        kbasePMIBarchart: 'kbase/js/widgets/vis/plants/kbasePMIBarchart',
        kbaseVenndiagram: 'kbase/js/widgets/vis/kbaseVenndiagram',
        kbaseOntologyDictionary:
            'kbase/js/widgets/function_output/ontology/kbaseOntologyDictionary',
        kbaseOntologyTranslation:
            'kbase/js/widgets/function_output/ontology/kbaseOntologyTranslation',
        kbaseBlastOutput: 'kbase/js/widgets/function_output/kbaseBlastOutput',

        kbaseRegisterRepoState: 'kbase/js/widgets/function_output/kbaseRegisterRepoState',
        kbaseReportView: 'kbase/js/widgets/function_output/kbaseReportView',
        kbaseExpressionVolcanoPlot: 'kbase/js/widgets/function_output/kbaseExpressionVolcanoPlot',

        kbaseRESKESearchResultDemo: 'kbase/js/widgets/function_output/kbaseRESKESearchResultDemo',
        kbaseDifferentialExpressionMatrixSetViewer:
            'kbase/js/widgets/function_output/kbaseDifferentialExpressionMatrixSetViewer',
        GenomeClassifierTrainingSet: 'kbase/js/widgets/function_output/GenomeClassifierTrainingSet',
        GenomeCategorizer: 'kbase/js/widgets/function_output/GenomeCategorizer',
        'code-cell': 'kbase/js/widgets/function_output/codeCellLauncher',

        /***
         * END CUSTOM OUTPUT WIDGETS
         ***/

        kbwidget: 'kbase/js/kbwidget',
        kbaseAccordion: 'kbase/js/widgets/kbaseAccordion',
        kbaseAuthenticatedWidget: 'kbase/js/widgets/kbaseAuthenticatedWidget',
        kbaseTable: 'kbase/js/widgets/kbaseTable',
        kbasePanel: 'kbase/js/widgets/kbasePanel',
        kbaseDeletePrompt: 'kbase/js/widgets/kbaseDeletePrompt',
    },
    map: {
        '*': {
            css: 'ext_components/require-css/css',
        },
    },

    shim: {
        select2: {
            deps: ['jquery'],
        },
        bloodhound: {
            deps: ['jquery'],
            exports: 'Bloodhound',
        },
        underscore: {
            exports: '_',
        },
        jquery: {
            exports: '$',
        },
        'jquery-nearest': {
            deps: ['jquery'],
        },
        'jquery-dataTables-base': {
            deps: ['jquery'],
        },
        'jquery-dataTables': {
            deps: ['jquery', 'jquery-dataTables-base', 'bootstrap'],
        },
        kbaseNarrativeAppCell: {
            deps: [
                'kbaseNarrativeMethodCell',
                'kbaseNarrativeOutputCell',
                'kbaseNarrativeCellMenu',
            ],
        },
        kbaseNarrativeMethodCell: {
            deps: ['kbaseNarrativeMethodInput', 'kbaseNarrativeCellMenu'],
        },
        kbaseNarrativeOutputCell: {
            deps: ['jquery', 'kbwidget', 'kbaseNarrativeDataCell', 'kbaseNarrativeCellMenu'],
        },
        knhx: {
            deps: ['knhx_menu', 'knhx_excanvas', 'knhx_canvastext', 'knhx_easytree'],
        },
        kbaseModelEditor: {
            // could be removed once code is repackaged and require.js-ified
            deps: ['KBaseFBA.FBAModel', 'kbaseTabTableTabs'],
        },
        KBModeling: {
            deps: ['jquery'],
        },
        'KBaseFBA.FBAModel': {
            deps: ['KBModeling'],
        },
        'KBaseFBA.FBAModelSet': {
            deps: ['KBModeling'],
        },
        'KBaseFBA.FBA': {
            deps: ['KBModeling'],
        },
        'KBaseFBA.FBAComparison': {
            deps: ['KBModeling'],
        },
        'KBaseBiochem.CompoundSet': {
            deps: ['KBModeling'],
        },
        'KBaseBiochem.Media': {
            deps: ['KBModeling'],
        },
        'KBasePhenotypes.PhenotypeSet': {
            deps: ['KBModeling'],
        },
        'KBasePhenotypes.PhenotypeSimulationSet': {
            deps: ['KBModeling'],
        },
        'KBaseSearch.GenomeSet': {
            deps: ['KBModeling'],
        },
        kbaseTabTableTabs: {
            exports: 'kbaseTabTableTabs',
        },
        kbaseTabTable: {
            deps: [
                'jquery',
                'kbwidget',
                'jquery-dataTables',
                // 'jquery-dataTables-bootstrap',
                'bootstrap',
                'KBModeling',
                'KBaseFBA.FBAModel',
                'KBaseFBA.FBAModelSet',
                'KBaseFBA.FBA',
                'KBaseFBA.FBAComparison',
                'KBaseBiochem.CompoundSet',
                'KBaseBiochem.Media',
                'KBasePhenotypes.PhenotypeSet',
                'KBasePhenotypes.PhenotypeSimulationSet',
                'KBaseFBA.FBAComparison',
                'modelSeedVizConfig',
                'kbasePathways',
                'msPathway',
                'kbaseTabTableTabs',
                'kbasePMIBarchart',
            ],
        },
        kbasePathways: {
            deps: [
                'jquery',
                'kbwidget',
                'KBModeling',
                'jquery-dataTables',
                // 'jquery-dataTables-bootstrap',
                'bootstrap',
                'msPathway',
            ],
        },
        msPathway: {
            deps: ['jquery', 'modelSeedVizConfig', 'd3'],
        },
        kbapi: {
            deps: ['jquery', 'bootstrap', 'kbase-client-api'],
        },
        'kbase-client-api': {
            deps: ['jquery'],
        },
        kbStandaloneGraph: {
            deps: ['jquery', 'jquery-svg'],
        },
        bootstrap: {
            deps: ['jquery', 'jqueryui'],
        },
    },
});
