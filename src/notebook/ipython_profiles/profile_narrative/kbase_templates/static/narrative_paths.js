define([], function() {
    require.config({
        baseUrl: "static",
        urlArgs: "v=" + (new Date()).getTime(),
        // baseUrl: 'static',
        waitSeconds : 30,
        paths : {
            'IPythonMain'                           : 'notebook/js/main',
            'IPythonCustom'                         : 'custom/custom',
            'narrativeRequire'                      : 'narrative_paths',
            'domReady'                              : 'components/requirejs/domReady',
            'json'                                  : 'components/requirejs/json',
            'text'                                  : 'components/requirejs/text',
            'jquery'                                : 'components/jquery/jquery.min',
            'jqueryui'                              : 'components/jquery-ui/ui/minified/jquery-ui.min',
            'jquery-svg'                            : 'components/jquery-extensions/js/jquery.svg',
            'jquery-dataTables'                     : 'components/jquery-extensions/js/jquery.dataTables',
            'jquery-dataTables-bootstrap'           : 'components/bootstrap-extensions/js/dataTables.bootstrap',
            'jquery-nearest'                        : 'components/jquery-nearest/jquery.nearest.min',
            'bootstrap'                             : 'components/bootstrap-3/js/bootstrap.min',
            'underscore'                            : 'components/underscore/1.8.2/underscore-min',
            'jquery_cookie'                         : 'components/jquery-extensions/js/jquery.cookie.min',
            'select2'                               : 'select2-v3.5.2/select2.min',

        'narrativeConfig'                       : 'kbase/js/narrativeConfig',
        'narrativeMain'                         : 'narrativeMain',
        'kbaseLogin'                            : 'kbase/js/widgets/kbaseLoginFuncSite',
        'narrativeLogin'                        : 'kbase/js/narrativeLogin',
        'kbaseTabs'                             : 'kbase/js/widgets/kbaseTabs',
        'kbaseUploadWidget'                     : 'kbase/js/widgets/kbaseUpload',
        'kbasePrompt'                           : 'kbase/js/widgets/kbasePromptNew',
        // Non-AMD, still load with Require
        'widgetMaxWidthCorrection'              : 'kbase/js/widgetMaxWidthCorrection',
        'kbapi'                                 : 'kbase/js/widgets/kbapi',
        'kbase-client-api'                      : 'kbase/js/api/kbase-client-api.min',
        'kbaseFeatureValues-client-api'         : 'kbase/js/api/KBaseFeatureValues',

        /***
         * CORE NARRATIVE WIDGETS
         ***/
        'kbaseNarrativePrestart'                : 'kbase/js/kbaseNarrativePrestart',
        'kbaseNarrative'                        : 'kbase/js/kbaseNarrative',
        'kbaseNarrativeCellMenu'                : 'kbase/js/widgets/narrative_core/kbaseNarrativeCellMenu',
        'kbaseNarrativeControlPanel'            : 'kbase/js/widgets/narrative_core/kbaseNarrativeControlPanel',
        'kbaseNarrativeDataPanel'               : 'kbase/js/widgets/narrative_core/kbaseNarrativeDataPanel',
        'kbaseNarrativeDataList'                : 'kbase/js/widgets/narrative_core/kbaseNarrativeDataList',
        'kbaseNarrativeSidePanel'               : 'kbase/js/widgets/narrative_core/kbaseNarrativeSidePanel',
        'kbaseNarrativeJobsPanel'               : 'kbase/js/widgets/narrative_core/kbaseNarrativeJobsPanel',
        'kbaseNarrativeMethodPanel'             : 'kbase/js/widgets/narrative_core/kbaseNarrativeMethodPanel',
        'kbaseNarrativeManagePanel'             : 'kbase/js/widgets/narrative_core/kbaseNarrativeManagePanel',
        'kbaseNarrativeDownloadPanel'           : 'kbase/js/widgets/narrative_core/kbaseNarrativeDownloadPanel',
        'kbaseNarrativeSharePanel'              : 'kbase/js/widgets/narrative_core/kbaseNarrativeSharePanel',
        'kbaseNarrativeExampleDataTab'          : 'kbase/js/widgets/narrative_core/kbaseNarrativeExampleDataTab',
        'kbaseNarrativeSideImportTab'           : 'kbase/js/widgets/narrative_core/kbaseNarrativeSideImportTab',
        'kbaseNarrativeSidePublicTab'           : 'kbase/js/widgets/narrative_core/kbaseNarrativeSidePublicTab',
        'kbaseNarrativeCell'                    : 'kbase/js/widgets/narrative_core/kbaseNarrativeCell',
        'kbaseNarrativeDataCell'                : 'kbase/js/widgets/narrative_core/kbaseNarrativeDataCell',
        'kbaseNarrativeOutputCell'              : 'kbase/js/widgets/narrative_core/kbaseNarrativeOutputCell',
        'kbaseNarrativeInput'                   : 'kbase/js/widgets/function_input/kbaseNarrativeInput',
        'kbaseNarrativeMethodInput'             : 'kbase/js/widgets/function_input/kbaseNarrativeMethodInput',
        'kbaseNarrativeParameterInput'          : 'kbase/js/widgets/function_input/parameter_input/kbaseNarrativeParameterInput',
        'kbaseNarrativeParameterTextInput'      : 'kbase/js/widgets/function_input/parameter_input/kbaseNarrativeParameterTextInput',
        'kbaseNarrativeParameterDropdownInput'  : 'kbase/js/widgets/function_input/parameter_input/kbaseNarrativeParameterDropdownInput',
        'kbaseNarrativeParameterCheckboxInput'  : 'kbase/js/widgets/function_input/parameter_input/kbaseNarrativeParameterCheckboxInput',
        'kbaseNarrativeParameterTextareaInput'  : 'kbase/js/widgets/function_input/parameter_input/kbaseNarrativeParameterTextareaInput',
        'kbaseNarrativeParameterFileInput'      : 'kbase/js/widgets/function_input/parameter_input/kbaseNarrativeParameterFileInput',
        'kbaseNarrativeParameterTextSubdataInput' : 'kbase/js/widgets/function_input/parameter_input/kbaseNarrativeParameterTextSubdataInput',
        'kbaseNarrativeError'                   : 'kbase/js/widgets/function_output/kbaseNarrativeError',
        'NarrativeManager'                      : 'kbase/js/api/NarrativeManager',
        'ipythonCellMenu'                       : 'kbase/js/widgets/narrative_core/ipythonCellMenu',

            // not yet ADMs, but still load with Require
            'kbaseNarrativeAppCell'                 : 'kbase/js/widgets/narrative_core/kbaseNarrativeAppCell',
            'kbaseNarrativeMethodCell'              : 'kbase/js/widgets/narrative_core/kbaseNarrativeMethodCell',
            'kbaseNarrativeWorkspace'               : 'kbase/js/widgets/narrative_core/kbaseNarrativeWorkspace',
            'kbaseLogging'                          : 'kbase/js/kbaseLogging',
            'RGBColor'                              : 'kbase/js/rgbcolor',
            'kbStandaloneTable'                     : 'kbase/js/widgets/kbStandaloneTable',
            'kbStandalonePlot'                      : 'kbase/js/widgets/kbStandalonePlot',
            'kbStandaloneGraph'                     : 'kbase/js/widgets/kbStandaloneGraph',
            'kbStandaloneHeatmap'                   : 'kbase/js/widgets/kbStandaloneHeatmap',
            /***
             * END CORE WIDGETS
             ***/

            /***
             * CUSTOM NARRATIVE INPUT WIDGETS
             ***/
            'kbaseDefaultNarrativeInput'            : 'kbase/js/widgets/function_input/kbaseDefaultNarrativeInput',
            'kbaseBuildMediaInput'                  : 'kbase/js/widgets/function_input/kbaseBuildMediaInput',
            'rastGenomeImportInput'                 : 'kbase/js/widgets/function_input/rastGenomeImportInput', 
            'kbaseNcbiGenomeImportInput'            : 'kbase/js/widgets/function_input/kbaseNcbiGenomeImportInput', 
            'kbaseTabbedInput'                      : 'kbase/js/widgets/function_input/kbaseTabbedInput',
            'create_metagenome_set'                 : 'kbase/js/widgets/function_input/create_metagenome_set',
            'kbStandaloneListSelect'                : 'kbase/js/widgets/function_input/kbStandaloneListselect',
            'devVizSelector'                        : 'kbase/js/widgets/function_input/devDataViz',
            /***
             * END CUSTOM INPUT WIDGETS
             ***/

        /***
         * CUSTOM OUTPUT AND VIEWER WIDGETS
         ***/
        'kbaseDefaultNarrativeOutput'           : 'kbase/js/widgets/function_output/kbaseDefaultNarrativeOutput',
        'kbaseTabTable'                         : 'kbase/js/revised-widgets/src/widgets/modeling/kbaseTabTable',
        'KBObjects'                             : 'kbase/js/revised-widgets/src/widgets/modeling/KBObjects',
        'KBaseFBA.FBAModel'                     : 'kbase/js/revised-widgets/src/widgets/modeling/KBaseFBA.FBAModel',
        'KBaseFBA.FBAModelSet'                  : 'kbase/js/revised-widgets/src/widgets/modeling/KBaseFBA.FBAModelSet',
        'KBaseFBA.FBA'                          : 'kbase/js/revised-widgets/src/widgets/modeling/KBaseFBA.FBA',
        'KBaseBiochem.Media'                    : 'kbase/js/revised-widgets/src/widgets/modeling/KBaseBiochem.Media',
        'KBasePhenotypes.PhenotypeSet'          : 'kbase/js/revised-widgets/src/widgets/modeling/KBasePhenotypes.PhenotypeSet',
        'KBasePhenotypes.PhenotypeSimulationSet': 'kbase/js/revised-widgets/src/widgets/modeling/KBasePhenotypes.PhenotypeSimulationSet',
        // another implementation of kbaseTabs needed for kbaseTabTable
        'kbaseTabTableTabs'                     : 'kbase/js/revised-widgets/src/widgets/modeling/kbaseTabs',
        'knhx'                                  : 'knhxtree/js/knhx',
        'knhx_menu'                             : 'knhxtree/js/menu',
        'knhx_excanvas'                         : 'knhxtree/js/excanvas',
        'knhx_canvastext'                       : 'knhxtree/js/canvastext',
        'knhx_easytree'                         : 'knhxtree/js/easytree',
        'kbaseTree'                             : 'kbase/js/widgets/function_output/kbaseTree',
        'kbaseContigBrowserButtons'             : 'kbase/js/widgets/genomes/kbaseContigBrowserButtons',
        'ContigBrowserPanel'                    : 'kbase/js/widgets/function_output/contigBrowserPanel',
        'kbaseGenomeView'                       : 'kbase/js/widgets/function_output/kbaseGenomeAnnotation',
        'kbaseContigSetView'                    : 'kbase/js/widgets/function_output/kbaseContigSetView',
        'kbaseAssemblyView'                     : 'kbase/js/widgets/function_output/kbaseAssemblyView',
        'AssemblyWidget'                        : 'kbase/js/widgets/function_output/kbaseAssembly',
        'FbaModelComparisonWidget'              : 'kbase/js/widgets/function_output/kbaseFbaModelComparison',
        // for the GenomeComparison object
        'kbaseGenomeComparisonViewer'           : 'kbase/js/widgets/function_output/kbaseGenomeComparisonViewer',
        // for comparing proteomes
        'GenomeComparisonWidget'                : 'kbase/js/widgets/function_output/kbaseGenomeComparison',
        'kbasePanGenome'                        : 'kbase/js/widgets/function_output/kbasePanGenome',
        'kbaseDomainAnnotation'                 : 'kbase/js/widgets/function_output/kbaseDomainAnnotation',
        'kbaseGenomeSetBuilder'                 : 'kbase/js/widgets/function_output/kbaseGenomeSetBuilder',
        'kbaseMSA'                              : 'kbase/js/widgets/function_output/kbaseMSA',
        'MetagenomeView'                        : 'kbase/js/widgets/function_output/kbaseMetagenomeView',
        'CollectionView'                        : 'kbase/js/widgets/function_output/kbaseCollectionView',
        'AbundanceDataHeatmap'                  : 'kbase/js/widgets/function_output/kbaseAbundanceDataHeatmap',
        'AbundanceDataPcoa'                     : 'kbase/js/widgets/function_output/kbaseAbundanceDataPcoa',
        'AbundanceDataBoxplot'                  : 'kbase/js/widgets/function_output/kbaseAbundanceDataBoxplot',
        'AbundanceDataTable'                    : 'kbase/js/widgets/function_output/kbaseAbundanceDataTable',
        'AnnotationSetTable'                    : 'kbase/js/widgets/function_output/kbaseAnnotationSetTable',
        'AbundanceDataView'                     : 'kbase/js/widgets/function_output/kbaseAbundanceDataView',
        'RankAbundancePlot'                     : 'kbase/js/widgets/function_output/kbaseRankAbundancePlot',
        'kbaseFeatureSet'                       : 'kbase/js/widgets/function_output/kbaseFeatureSet',

        'kbaseExpressionMatrix'                 : 'kbase/js/widgets/function_output/kbaseExpressionMatrix',
        'kbaseExpressionGenesetBaseWidget'      : 'kbase/js/widgets/function_output/kbaseExpressionGenesetBaseWidget',
        'kbaseExpressionHeatmap'                : 'kbase/js/widgets/function_output/kbaseExpressionHeatmap',
        'kbaseExpressionSparkline'              : 'kbase/js/widgets/function_output/kbaseExpressionSparkline',    
        'kbaseExpressionPairwiseCorrelation'    : 'kbase/js/widgets/function_output/kbaseExpressionPairwiseCorrelation',
        'kbaseExpressionEstimateK'              : 'kbase/js/widgets/function_output/kbaseExpressionEstimateK',
        'kbaseExpressionFeatureClusters'             : 'kbase/js/widgets/function_output/kbaseExpressionFeatureClusters',



        'geometry_point'                        : 'kbase/js/ui-common/src/widgets/../js/geometry/geometry_point',
        'geometry_rectangle'                    : 'kbase/js/ui-common/src/widgets/../js/geometry/geometry_rectangle',
        'geometry_size'                         : 'kbase/js/ui-common/src/widgets/../js/geometry/geometry_size',
        'kbaseVisWidget'                        : 'kbase/js/ui-common/src/widgets/kbaseVisWidget',
        'kbaseHeatmap'                          : 'kbase/js/ui-common/src/widgets/vis/kbaseHeatmap',
        'kbaseLinechart'                        : 'kbase/js/ui-common/src/widgets/vis/kbaseLinechart',


        // unfinished ones
        /***
         * END CUSTOM OUTPUT WIDGETS
         ***/

            'd3'                                    : 'kbase/js/ui-common/ext/d3/d3.v3.min',
            'colorbrewer'                           : 'kbase/js/ui-common/ext/colorbrewer/colorbrewer',
            'handlebars'                            : 'kbase/js/ui-common/ext/handlebars/handlebars-v1.3.0',
            'kbwidget'                          : 'kbase/js/ui-common/src/widgets/../kbwidget',
            'kbaseAccordion'                    : 'kbase/js/ui-common/src/widgets/kbaseAccordion',
            'kbaseAuthenticatedWidget'          : 'kbase/js/ui-common/src/widgets/kbaseAuthenticatedWidget',
            'kbaseModal'                        : 'kbase/js/ui-common/src/widgets/kbaseModal',
            'kbaseTable'                        : 'kbase/js/ui-common/src/widgets/kbaseTable',
            'kbasePanel'                        : 'kbase/js/ui-common/src/widgets/kbasePanel',
            'kbaseDeletePrompt'                 : 'kbase/js/ui-common/src/widgets/kbaseDeletePrompt',

            // Not currently needed for the Narrative, but left in, commented, for posterity.
            // We can uncomment as we go.
            // 'CDMI_API'                              : 'kbase/js/ui-common/src/widgets/../js/CDMI_API',
            // 'narrativeMethodStore'                  : 'kbase/js/ui-common/src/widgets/../js/narrativeMethodStore',
            // 'IdMapClient'                           : 'kbase/js/ui-common/src/widgets/../js/IdMapClient',
            // 'KbaseNetworkServiceClient'             : 'kbase/js/ui-common/src/widgets/../js/KbaseNetworkServiceClient',
            // 'MetaTool'                              : 'kbase/js/ui-common/src/widgets/../js/MetaTool',
            // 'OntologyServiceClient'                 : 'kbase/js/ui-common/src/widgets/../js/OntologyServiceClient',
            // 'RGBColor'                              : 'kbase/js/ui-common/src/widgets/../js/RGBColor',
            // 'geometry_point'                        : 'kbase/js/ui-common/src/widgets/../js/geometry/geometry_point',
            // 'geometry_rectangle'                : 'kbase/js/ui-common/src/widgets/../js/geometry/geometry_rectangle',
            // 'geometry_size'                     : 'kbase/js/ui-common/src/widgets/../js/geometry/geometry_size',
            // 'Client'                            : 'kbase/js/ui-common/src/widgets/../js/workspaceService/Client',
            // 'kbapplication'                     : 'kbase/js/ui-common/src/widgets/../kbapplication',
            // 'all'                               : 'kbase/js/ui-common/src/widgets/all',
            // 'jim'                               : 'kbase/js/ui-common/src/widgets/jim',
            // 'kbaseBambiMotifCard'               : 'kbase/js/ui-common/src/widgets/bambi/kbaseBambiMotifCard',
            // 'kbaseBambiRawOutputCard'           : 'kbase/js/ui-common/src/widgets/bambi/kbaseBambiRawOutputCard',
            // 'kbaseBambiRunParametersCard'       : 'kbase/js/ui-common/src/widgets/bambi/kbaseBambiRunParametersCard',
            // 'kbaseBambiRunResultCard'           : 'kbase/js/ui-common/src/widgets/bambi/kbaseBambiRunResultCard',
            // 'kbaseBioCpdTable'                  : 'kbase/js/ui-common/src/widgets/biochemistry/kbaseBioCpdTable',
            // 'kbaseBioRxnTable'                  : 'kbase/js/ui-common/src/widgets/biochemistry/kbaseBioRxnTable',
            // 'kbaseCpd'                          : 'kbase/js/ui-common/src/widgets/biochemistry/kbaseCpd',
            // 'kbaseRxn'                          : 'kbase/js/ui-common/src/widgets/biochemistry/kbaseRxn',
            // 'kbaseRxnModal'                     : 'kbase/js/ui-common/src/widgets/biochemistry/kbaseRxnModal',
            // 'kbaseCmonkeyClusterCard'           : 'kbase/js/ui-common/src/widgets/cmonkey/kbaseCmonkeyClusterCard',
            // 'kbaseCmonkeyMotifCard'             : 'kbase/js/ui-common/src/widgets/cmonkey/kbaseCmonkeyMotifCard',
            // 'kbaseCmonkeyRunResultCard'         : 'kbase/js/ui-common/src/widgets/cmonkey/kbaseCmonkeyRunResultCard',
            // 'kbaseExpressionSeries'             : 'kbase/js/ui-common/src/widgets/expression/kbaseExpressionSeries',
            // 'kbaseFbaMeta'                      : 'kbase/js/ui-common/src/widgets/fbas/kbaseFbaMeta',
            // 'kbaseFbaTabs'                      : 'kbase/js/ui-common/src/widgets/fbas/kbaseFbaTabs',
            // 'kbaseFormulationForm'              : 'kbase/js/ui-common/src/widgets/fbas/kbaseFormulationForm',
            // 'kbaseRunFba'                       : 'kbase/js/ui-common/src/widgets/fbas/kbaseRunFba',
            // 'kbaseContigBrowser'                : 'kbase/js/ui-common/src/widgets/genomes/kbaseContigBrowser',
            //'kbaseContigBrowserButtons'         : 'kbase/js/ui-common/src/widgets/genomes/kbaseContigBrowserButtons',
            // 'kbaseGeneBiochemistry'             : 'kbase/js/ui-common/src/widgets/genomes/kbaseGeneBiochemistry',
            // 'kbaseGeneDomains'                  : 'kbase/js/ui-common/src/widgets/genomes/kbaseGeneDomains',
            // 'kbaseGeneInfo'                     : 'kbase/js/ui-common/src/widgets/genomes/kbaseGeneInfo',
            // 'kbaseGeneInstanceInfo'             : 'kbase/js/ui-common/src/widgets/genomes/kbaseGeneInstanceInfo',
            // 'kbaseGeneOperon'                   : 'kbase/js/ui-common/src/widgets/genomes/kbaseGeneOperon',
            // 'kbaseGeneSequence'                 : 'kbase/js/ui-common/src/widgets/genomes/kbaseGeneSequence',
            // 'kbaseGenomeLineage'                : 'kbase/js/ui-common/src/widgets/genomes/kbaseGenomeLineage',
            // 'kbaseGenomeOverview'               : 'kbase/js/ui-common/src/widgets/genomes/kbaseGenomeOverview',
            // 'kbaseLitWidget'                    : 'kbase/js/ui-common/src/widgets/genomes/kbaseLitWidget',
            // 'kbaseMultiContigBrowser'           : 'kbase/js/ui-common/src/widgets/genomes/kbaseMultiContigBrowser',
            // 'kbaseObjectMeta'                   : 'kbase/js/ui-common/src/widgets/genomes/kbaseObjectMeta',
            //'kbasePhenotypeSet'                 : 'kbase/js/ui-common/src/widgets/genomes/kbasePhenotypeSet',
            //'kbaseSEEDFunctions'                : 'kbase/js/ui-common/src/widgets/genomes/kbaseSEEDFunctions',
            //'kbaseSimulationSet'                : 'kbase/js/ui-common/src/widgets/genomes/kbaseSimulationSet',
            // 'kbaseWikiDescription'              : 'kbase/js/ui-common/src/widgets/genomes/kbaseWikiDescription',
            // 'kbaseGWASGeneListTable'            : 'kbase/js/ui-common/src/widgets/gwas/kbaseGWASGeneListTable',
            // 'kbaseGWASPop'                      : 'kbase/js/ui-common/src/widgets/gwas/kbaseGWASPop',
            // 'kbaseGWASPopMaps'                  : 'kbase/js/ui-common/src/widgets/gwas/kbaseGWASPopMaps',
            // 'kbaseGWASPopTable'                 : 'kbase/js/ui-common/src/widgets/gwas/kbaseGWASPopTable',
            // 'kbaseGWASTopVariations'            : 'kbase/js/ui-common/src/widgets/gwas/kbaseGWASTopVariations',
            // 'kbaseGWASTopVariationsTable'       : 'kbase/js/ui-common/src/widgets/gwas/kbaseGWASTopVariationsTable',
            // 'kbaseGWASTraitMaps'                : 'kbase/js/ui-common/src/widgets/gwas/kbaseGWASTraitMaps',
            // 'kbaseGWASTraitTable'               : 'kbase/js/ui-common/src/widgets/gwas/kbaseGWASTraitTable',
            // 'kbaseGWASVarTable'                 : 'kbase/js/ui-common/src/widgets/gwas/kbaseGWASVarTable',
            // 'kbaseInferelatorHitsCard'          : 'kbase/js/ui-common/src/widgets/inferelator/kbaseInferelatorHitsCard',
            // 'kbaseInferelatorRunResultCard'     : 'kbase/js/ui-common/src/widgets/inferelator/kbaseInferelatorRunResultCard',
            // 'kbaseIrisTerminalDispatch'         : 'kbase/js/ui-common/src/widgets/iris/config/kbaseIrisTerminalDispatch',
            // 'kbaseIrisTerminalDispatchAuth'     : 'kbase/js/ui-common/src/widgets/iris/config/kbaseIrisTerminalDispatchAuth',
            // 'kbaseIrisTerminalDispatchEnv'      : 'kbase/js/ui-common/src/widgets/iris/config/kbaseIrisTerminalDispatchEnv',
            // 'kbaseIrisTerminalDispatchFile'     : 'kbase/js/ui-common/src/widgets/iris/config/kbaseIrisTerminalDispatchFile',
            // 'kbaseIrisTerminalDispatchHelp'     : 'kbase/js/ui-common/src/widgets/iris/config/kbaseIrisTerminalDispatchHelp',
            // 'kbaseIrisTerminalDispatchHistory'  : 'kbase/js/ui-common/src/widgets/iris/config/kbaseIrisTerminalDispatchHistory',
            // 'kbaseIrisTerminalDispatchScript'   : 'kbase/js/ui-common/src/widgets/iris/config/kbaseIrisTerminalDispatchScript',
            // 'kbaseIrisTerminalDispatchTutorial' : 'kbase/js/ui-common/src/widgets/iris/config/kbaseIrisTerminalDispatchTutorial',
            // 'iris'                              : 'kbase/js/ui-common/src/widgets/iris/iris',
            // 'kbaseIrisCommands'                 : 'kbase/js/ui-common/src/widgets/iris/kbaseIrisCommands',
            // 'kbaseIrisConfig'                   : 'kbase/js/ui-common/src/widgets/iris/kbaseIrisConfig',
            // 'kbaseIrisContainerWidget'          : 'kbase/js/ui-common/src/widgets/iris/kbaseIrisContainerWidget',
            // 'kbaseIrisEchoWidget'               : 'kbase/js/ui-common/src/widgets/iris/kbaseIrisEchoWidget',
            // 'kbaseIrisFileBrowser'              : 'kbase/js/ui-common/src/widgets/iris/kbaseIrisFileBrowser',
            // 'kbaseIrisFileEditor'               : 'kbase/js/ui-common/src/widgets/iris/kbaseIrisFileEditor',
            // 'kbaseIrisGUIWidget'                : 'kbase/js/ui-common/src/widgets/iris/kbaseIrisGUIWidget',
            // 'kbaseIrisGrammar'                  : 'kbase/js/ui-common/src/widgets/iris/kbaseIrisGrammar',
            // 'kbaseIrisProcessList'              : 'kbase/js/ui-common/src/widgets/iris/kbaseIrisProcessList',
            // 'kbaseIrisTerminal'                 : 'kbase/js/ui-common/src/widgets/iris/kbaseIrisTerminal',
            // 'kbaseIrisTerminalWidget'           : 'kbase/js/ui-common/src/widgets/iris/kbaseIrisTerminalWidget',
            // 'kbaseIrisTextWidget'               : 'kbase/js/ui-common/src/widgets/iris/kbaseIrisTextWidget',
            // 'kbaseIrisTutorial'                 : 'kbase/js/ui-common/src/widgets/iris/kbaseIrisTutorial',
            // 'kbaseIrisWhatsNew'                 : 'kbase/js/ui-common/src/widgets/iris/kbaseIrisWhatsNew',
            // 'kbaseIrisWidget'                   : 'kbase/js/ui-common/src/widgets/iris/kbaseIrisWidget',
            // 'kbaseIrisWorkspace'                : 'kbase/js/ui-common/src/widgets/iris/kbaseIrisWorkspace',
            // 'jquery.kbase.ws-selector'          : 'kbase/js/ui-common/src/widgets/jquery.kbase.ws-selector',
            // 'kbaseBox'                          : 'kbase/js/ui-common/src/widgets/kbaseBox',
            // 'kbaseButtonControls'               : 'kbase/js/ui-common/src/widgets/kbaseButtonControls',
            // 'kbaseCardLayoutManager'            : 'kbase/js/ui-common/src/widgets/kbaseCardLayoutManager',
            // 'kbaseDataBrowser'                  : 'kbase/js/ui-common/src/widgets/kbaseDataBrowser',
            // 'kbaseErrorPrompt'                  : 'kbase/js/ui-common/src/widgets/kbaseErrorPrompt',
            // 'kbaseFormBuilder'                  : 'kbase/js/ui-common/src/widgets/kbaseFormBuilder',
            // 'kbaseGeneTable'                    : 'kbase/js/ui-common/src/widgets/kbaseGeneTable',
            // 'kbaseLogin'                        : 'kbase/js/ui-common/src/widgets/kbaseLogin',
            // 'kbaseLoginFuncSite'                : 'kbase/js/ui-common/src/widgets/kbaseLoginFuncSite',
            // 'kbaseMethodGallery'                : 'kbase/js/ui-common/src/widgets/kbaseMethodGallery',
            // 'kbasePopularMethods'                : 'kbase/js/ui-common/src/widgets/kbasePopularMethods',
            // 'kbaseWalkablePath'                : 'kbase/js/ui-common/src/widgets/kbaseWalkablePath',
            // 'kbaseCarousel'                : 'kbase/js/ui-common/src/widgets/kbaseCarousel',
            // 'kbaseMethodDescription'                : 'kbase/js/ui-common/src/widgets/kbaseMethodDescription',
            // 'kbasePrompt'                       : 'kbase/js/ui-common/src/widgets/kbasePrompt',
            // 'kbaseSearchControls'               : 'kbase/js/ui-common/src/widgets/kbaseSearchControls',
            // 'kbaseTabs'                         : 'kbase/js/ui-common/src/widgets/kbaseTabs',
            // 'kbaseVisWidget'                    : 'kbase/js/ui-common/src/widgets/kbaseVisWidget',
            // 'Heatmap_widget'                    : 'kbase/js/ui-common/src/widgets/mak/Heatmap_widget',
            // 'LineChart_widget'                  : 'kbase/js/ui-common/src/widgets/mak/LineChart_widget',
            // 'Tiling_widget'                     : 'kbase/js/ui-common/src/widgets/mak/Tiling_widget',
            // 'kbaseBarChartCard'                 : 'kbase/js/ui-common/src/widgets/mak/kbaseBarChartCard',
            // 'kbaseHeatmapCard'                  : 'kbase/js/ui-common/src/widgets/mak/kbaseHeatmapCard',
            // 'kbaseJSONReflector'                : 'kbase/js/ui-common/src/widgets/kbaseJSONReflector',
            // 'kbaseLineChartCard'                : 'kbase/js/ui-common/src/widgets/mak/kbaseLineChartCard',
            // 'kbaseMAKBiclusterCard'             : 'kbase/js/ui-common/src/widgets/mak/kbaseMAKBiclusterCard',
            // 'kbaseMAKResultCard'                : 'kbase/js/ui-common/src/widgets/mak/kbaseMAKResultCard',
            // 'kbaseMAKTilingCard'                : 'kbase/js/ui-common/src/widgets/mak/kbaseMAKTilingCard',
            // 'kbasePathway'                      : 'kbase/js/ui-common/src/widgets/maps/kbasePathway',
            // 'kbaseMediaEditor'                  : 'kbase/js/ui-common/src/widgets/media/kbaseMediaEditor',
            // 'kbaseMastHitsCard'                 : 'kbase/js/ui-common/src/widgets/meme/kbaseMastHitsCard',
            // 'kbaseMastRunParametersCard'        : 'kbase/js/ui-common/src/widgets/meme/kbaseMastRunParametersCard',
            // 'kbaseMastRunResultCard'            : 'kbase/js/ui-common/src/widgets/meme/kbaseMastRunResultCard',
            // 'kbaseMemeMotifCard'                : 'kbase/js/ui-common/src/widgets/meme/kbaseMemeMotifCard',
            // 'kbaseMemeRawOutputCard'            : 'kbase/js/ui-common/src/widgets/meme/kbaseMemeRawOutputCard',
            // 'kbaseMemeRunParametersCard'        : 'kbase/js/ui-common/src/widgets/meme/kbaseMemeRunParametersCard',
            // 'kbaseMemeRunResultCard'            : 'kbase/js/ui-common/src/widgets/meme/kbaseMemeRunResultCard',
            // 'kbaseMemeTable'                    : 'kbase/js/ui-common/src/widgets/meme/kbaseMemeTable',
            // 'kbaseTomtomHitsCard'               : 'kbase/js/ui-common/src/widgets/meme/kbaseTomtomHitsCard',
            // 'kbaseTomtomRunParametersCard'      : 'kbase/js/ui-common/src/widgets/meme/kbaseTomtomRunParametersCard',
            // 'kbaseTomtomRunResultCard'          : 'kbase/js/ui-common/src/widgets/meme/kbaseTomtomRunResultCard',
            // 'logo'                              : 'kbase/js/ui-common/src/widgets/meme/logo',
            // 'kbaseSeqSearch'                    : 'kbase/js/ui-common/src/widgets/misc/kbaseSeqSearch',
            // 'kbaseDeleteRxn'                    : 'kbase/js/ui-common/src/widgets/models/kbaseDeleteRxn',
            //'kbaseModelCore'                    : 'kbase/js/ui-common/src/widgets/models/kbaseModelCore',
            // 'kbaseModelMeta'                    : 'kbase/js/ui-common/src/widgets/models/kbaseModelMeta',
            // 'kbaseModelOpts'                    : 'kbase/js/ui-common/src/widgets/models/kbaseModelOpts',
            // 'kbaseModelTable'                   : 'kbase/js/ui-common/src/widgets/models/kbaseModelTable',
            //'kbaseModelTabs'                    : 'kbase/js/ui-common/src/widgets/models/kbaseModelTabs',
            // 'force-directed'                    : 'kbase/js/ui-common/src/widgets/networks/force-directed',
            // 'kbaseNetworkCard'                  : 'kbase/js/ui-common/src/widgets/networks/kbaseNetworkCard',
            // 'kbasePPICard'                      : 'kbase/js/ui-common/src/widgets/networks/kbasePPICard',
            // 'kbaseWSObjGraphCenteredView'       : 'kbase/js/ui-common/src/widgets/objgraphs/kbaseWSObjGraphCenteredView',
            // 'kbaseWSObjGraphView'               : 'kbase/js/ui-common/src/widgets/objgraphs/kbaseWSObjGraphView',
            // 'kbaseRegulomeCard'                 : 'kbase/js/ui-common/src/widgets/regprecise/kbaseRegulomeCard',
            // 'kbaseRegulonCard'                  : 'kbase/js/ui-common/src/widgets/regprecise/kbaseRegulonCard',
            //'kbasePromConstraint'               : 'kbase/js/ui-common/src/widgets/regulation/kbasePromConstraint',
            // 'kbaseRegulome'                     : 'kbase/js/ui-common/src/widgets/regulation/kbaseRegulome',
            // 'kbaseNarrativesUsingData'          : 'kbase/js/ui-common/src/widgets/social/kbaseNarrativesUsingData',
            // 'kbaseWSObjRefUsers'                : 'kbase/js/ui-common/src/widgets/social/kbaseWSObjRefUsers',
            // 'kbaseSpecFunctionCard'             : 'kbase/js/ui-common/src/widgets/spec/kbaseSpecFunctionCard',
            // 'kbaseSpecModuleCard'               : 'kbase/js/ui-common/src/widgets/spec/kbaseSpecModuleCard',
            // 'kbaseSpecStorageCard'              : 'kbase/js/ui-common/src/widgets/spec/kbaseSpecStorageCard',
            // 'kbaseSpecTypeCard'                 : 'kbase/js/ui-common/src/widgets/spec/kbaseSpecTypeCard',
            // 'kbaseTaxonOverview'                : 'kbase/js/ui-common/src/widgets/taxa/kbaseTaxonOverview',
            //'kbaseTree'                         : 'kbase/js/ui-common/src/widgets/trees/kbaseTree',
            // 'kbaseBarchart'                     : 'kbase/js/ui-common/src/widgets/vis/kbaseBarchart',
            // 'kbaseHistogram'                    : 'kbase/js/ui-common/src/widgets/vis/kbaseHistogram',
            // 'kbaseChordchart'                   : 'kbase/js/ui-common/src/widgets/vis/kbaseChordchart',
            // 'kbaseCircularHeatmap'              : 'kbase/js/ui-common/src/widgets/vis/kbaseCircularHeatmap',
            // 'kbaseForcedNetwork'                : 'kbase/js/ui-common/src/widgets/vis/kbaseForcedNetwork',
            // 'kbaseHeatmap'                      : 'kbase/js/ui-common/src/widgets/vis/kbaseHeatmap',
            // 'kbaseLineSerieschart'              : 'kbase/js/ui-common/src/widgets/vis/kbaseLineSerieschart',
            // 'kbaseLinechart'                    : 'kbase/js/ui-common/src/widgets/vis/kbaseLinechart',
            // 'kbasePiechart'                     : 'kbase/js/ui-common/src/widgets/vis/kbasePiechart',
            // 'kbaseScatterplot'                  : 'kbase/js/ui-common/src/widgets/vis/kbaseScatterplot',
            // 'kbaseTreechart'                    : 'kbase/js/ui-common/src/widgets/vis/kbaseTreechart',
            // 'kbaseVenndiagram'                  : 'kbase/js/ui-common/src/widgets/vis/kbaseVenndiagram',
            // 'kbasePlantsNTO'                    : 'kbase/js/ui-common/src/widgets/vis/plants/kbasePlantsNTO',
            // 'kbasePlantsNetworkNarrative'       : 'kbase/js/ui-common/src/widgets/vis/plants/kbasePlantsNetworkNarrative',
            // 'kbasePlantsNetworkTable'           : 'kbase/js/ui-common/src/widgets/vis/plants/kbasePlantsNetworkTable',
            // 'vis'                               : 'kbase/js/ui-common/src/widgets/vis/vis',
            // 'kbaseSimpleWSSelect'               : 'kbase/js/ui-common/src/widgets/workspaces/kbaseSimpleWSSelect',
            // 'kbaseWSFbaTable'                   : 'kbase/js/ui-common/src/widgets/workspaces/kbaseWSFbaTable',
            // 'kbaseWSHandler'                    : 'kbase/js/ui-common/src/widgets/workspaces/kbaseWSHandler',
            // 'kbaseWSMediaTable'                 : 'kbase/js/ui-common/src/widgets/workspaces/kbaseWSMediaTable',
            // 'kbaseWSModelTable'                 : 'kbase/js/ui-common/src/widgets/workspaces/kbaseWSModelTable',
            // 'kbaseWSObjectTable'                : 'kbase/js/ui-common/src/widgets/workspaces/kbaseWSObjectTable',
            // 'kbaseWSReferenceList'              : 'kbase/js/ui-common/src/widgets/workspaces/kbaseWSReferenceList',
            // 'kbaseWSSelector'                   : 'kbase/js/ui-common/src/widgets/workspaces/kbaseWSSelector',

        },
        shim : {
            'bootstrap' : { 
                deps : ['jquery'] 
            },
            'underscore' : {
                exports : '_'
            },
            'jquery-nearest' : {
                deps : ['jquery']
            },
            'jquery-dataTables' : {
                deps : ['jquery']
            },
            'jquery-dataTables-bootstrap' : {
                deps : ['jquery', 'jquery-dataTables', 'bootstrap']
            },
            'kbaseNarrativeAppCell' : {
                deps : ['kbaseNarrativeMethodCell', 'kbaseNarrativeOutputCell', 
                        'kbaseNarrativeCellMenu']
            },
            'kbaseNarrativeMethodCell' : {
                deps : ['kbaseNarrativeMethodInput', 'kbaseNarrativeCellMenu']
            },
            'kbaseNarrativeOutputCell' : {
                deps : ['jquery', 'kbwidget', 'kbaseNarrativeDataCell', 'kbaseNarrativeCellMenu']
            },
            'knhx' : {
                deps : ['knhx_menu', 'knhx_excanvas', 'knhx_canvastext', 'knhx_easytree']
            },
            'KBaseFBA.FBAModel' : {
                deps : ['KBObjects']
            },
            'KBaseFBA.FBAModelSet' : {
                deps : ['KBObjects']
            },
            'KBaseFBA.FBA' : {
                deps : ['KBObjects']
            },
            'KBaseBiochem.Media' : {
                deps : ['KBObjects']
            },
            'KBasePhenotypes.PhenotypeSet' : {
                deps : ['KBObjects']
            },
            'KBasePhenotypes.PhenotypeSimulationSet' : {
                deps : ['KBObjects']
            },
            'kbaseTabTable' : {
                deps : ['jquery', 'jquery-dataTables', 'jquery-dataTables-bootstrap',
                        'KBObjects', 'KBaseFBA.FBAModel',
                        'KBaseFBA.FBAModelSet', 'KBaseFBA.FBA', 'KBaseBiochem.Media', 
                        'KBasePhenotypes.PhenotypeSet', 'KBasePhenotypes.PhenotypeSimulationSet', 
                        'kbaseTabTableTabs']
            },
            'kbapi' : {
                deps : ['jquery', 'bootstrap']
            },
            'kbase-client-api' : {
                deps : ['jquery']
            },
            'kbStandaloneGraph' : {
                deps : ['jquery', 'jquery-svg']
            }
        }
    });
    return require;
});