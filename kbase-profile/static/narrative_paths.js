require.config({
    paths : {
        'domReady'                              : 'components/requirejs/domReady',
        'json'                                  : 'components/requirejs-json/json',
        'text'                                  : 'components/requirejs-text/text',
        'jquery'                                : 'components/jquery/jquery.min',
        'jqueryui'                              : 'components/jquery-ui/ui/minified/jquery-ui.min',
        'jquery-svg'                            : 'components/jquery-extensions/js/jquery.svg',
        'jquery-dataTables'                     : 'components/jquery-extensions/js/jquery.dataTables',
        'jquery-dataTables-bootstrap'           : 'components/bootstrap-extensions/js/dataTables.bootstrap',
        'jquery-nearest'                        : 'components/jquery-nearest/jquery.nearest.min',
        'jquery_cookie'                         : 'components/jquery-extensions/js/jquery.cookie.min',
        'select2'                               : 'components/select2/select2.min',
        'bootstrap'                             : 'components/bootstrap/js/bootstrap.min',

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
        'knhx'                                  : 'components/knhxtree/js/knhx',
        'knhx_menu'                             : 'components/knhxtree/js/menu',
        'knhx_excanvas'                         : 'components/knhxtree/js/excanvas',
        'knhx_canvastext'                       : 'components/knhxtree/js/canvastext',
        'knhx_easytree'                         : 'components/knhxtree/js/easytree',
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

        // unfinished ones
        /***
         * END CUSTOM OUTPUT WIDGETS
         ***/

        'd3'                                    : 'kbase/js/ui-common/ext/d3/d3.v3.min',
        'colorbrewer'                           : 'kbase/js/ui-common/ext/colorbrewer/colorbrewer',
        'handlebars'                            : 'kbase/js/ui-common/ext/handlebars/handlebars-v1.3.0',
        'kbwidget'                              : 'kbase/js/ui-common/src/kbwidget',
        'kbaseAccordion'                        : 'kbase/js/ui-common/src/widgets/kbaseAccordion',
        'kbaseAuthenticatedWidget'              : 'kbase/js/ui-common/src/widgets/kbaseAuthenticatedWidget',
        'kbaseModal'                            : 'kbase/js/ui-common/src/widgets/kbaseModal',
        'kbaseTable'                            : 'kbase/js/ui-common/src/widgets/kbaseTable',
        'kbasePanel'                            : 'kbase/js/ui-common/src/widgets/kbasePanel',
        'kbaseDeletePrompt'                     : 'kbase/js/ui-common/src/widgets/kbaseDeletePrompt',
    },
    shim : {
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
            deps : ['jquery', 'bootstrap', 'kbase-client-api']
        },
        'kbase-client-api' : {
            deps : ['jquery']
        },
        'kbStandaloneGraph' : {
            deps : ['jquery', 'jquery-svg']
        }
    }
});