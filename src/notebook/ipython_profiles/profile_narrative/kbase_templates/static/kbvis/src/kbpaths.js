
define('kbvis/src/kbpaths',[], function (paths) {

 requirejs.config({
 waitSeconds : 30,
    baseUrl : '/narrative/static/',
    //baseUrl : '../../src/widgets',
    //baseUrl : '/static',
    //urlArgs: "bust=" + (new Date()).getTime(),
    paths : {
     jquery : 'kbvis/ext/jquery/jquery-1.10.2.min',
     jqueryui : 'kbvis/ext/jquery-ui/1.10.3/js/jquery-ui-1.10.3.custom.min',
     bootstrap : "kbvis/ext/bootstrap/3.0.3/js/bootstrap.min",
     d3 : "kbvis/ext/d3/d3.v3.min",
//     datavis : './jquery/kbase/datavis',
//     kbaseapi : './jquery/ui-js/kbase-api',
     kbwidget : 'kbvis/src/kbwidget',

    kbaseAccordion : 'kbvis/src/widgets/kbaseAccordion',
    kbaseAuthenticatedWidget : 'kbvis/src/widgets/kbaseAuthenticatedWidget',
    kbaseBox : 'kbvis/src/widgets/kbaseBox',
    kbaseButtonControls : 'kbvis/src/widgets/kbaseButtonControls',
    kbaseCardLayoutManager : 'kbvis/src/widgets/kbaseCardLayoutManager',
    kbaseDataBrowser : 'kbvis/src/widgets/kbaseDataBrowser',
    kbaseDeletePrompt : 'kbvis/src/widgets/kbaseDeletePrompt',
    kbaseErrorPrompt : 'kbvis/src/widgets/kbaseErrorPrompt',
    kbaseFormBuilder : 'kbvis/src/widgets/kbaseFormBuilder',
    kbaseHello : 'kbvis/src/widgets/kbaseHello',
    kbaseIrisCommands : 'kbvis/src/widgets/kbaseIrisCommands',
    kbaseIrisFileBrowser : 'kbvis/src/widgets/kbaseIrisFileBrowser',
    kbaseIrisFileEditor : 'kbvis/src/widgets/kbaseIrisFileEditor',
    kbaseIrisGrammar : 'kbvis/src/widgets/kbaseIrisGrammar',
    kbaseIrisProcessList : 'kbvis/src/widgets/kbaseIrisProcessList',
    kbaseIrisTerminal : 'kbvis/src/widgets/kbaseIrisTerminal',
    kbaseIrisTutorial : 'kbvis/src/widgets/kbaseIrisTutorial',
    kbaseLandingPageCard : 'kbvis/src/widgets/kbaseLandingPageCard',
    kbaseLogin : 'kbvis/src/widgets/kbaseLogin',
    kbaseLoginFuncSite : 'kbvis/src/widgets/kbaseLoginFuncSite',
    kbaseModal : 'kbvis/src/widgets/kbaseModal',
    kbasePanel : 'kbvis/src/widgets/kbasePanel',
    kbasePrompt : 'kbvis/src/widgets/kbasePrompt',
    kbaseSearchControls : 'kbvis/src/widgets/kbaseSearchControls',
    kbaseTable : 'kbvis/src/widgets/kbaseTable',
    kbaseTabs : 'kbvis/src/widgets/kbaseTabs',
    kbaseVisWidget : 'kbvis/src/widgets/kbaseVisWidget',
    kbaseWorkspaceBrowser : 'kbvis/src/widgets/kbaseWorkspaceBrowser',

     kbaseVisWidget : 'kbvis/src/widgets/kbaseVisWidget',
     kbaseHeatmap : 'kbvis/src/widgets/vis/kbaseHeatmap',
     kbaseBarchart : 'kbvis/src/widgets/vis/kbaseBarchart',
     kbaseScatterplot : 'kbvis/src/widgets/vis/kbaseScatterplot',
     kbaseLinechart : 'kbvis/src/widgets/vis/kbaseLinechart',
     kbaseLineSerieschart : 'kbvis/src/widgets/vis/kbaseLineSerieschart',
     kbasePiechart : 'kbvis/src/widgets/vis/kbasePiechart',
     kbaseForcedNetwork : 'kbvis/src/widgets/vis/kbaseForcedNetwork',

     kbasePlantsNetworkTable : 'kbvis/src/widgets/vis/plants/kbasePlantsNetworkTable',
     kbasePlantsNetworkNarrative : 'kbvis/src/widgets/vis/plants/kbasePlantsNetworkNarrative',

        //iris widgets
        iris              : 'kbvis/src/widgets/iris/iris',
        vis               : 'kbvis/src/widgets/vis/vis',
        kbaseIrisCommands : 'kbvis/src/widgets/iris/kbaseIrisCommands',
        kbaseIrisContainerWidget : 'kbvis/src/widgets/iris/kbaseIrisContainerWidget',
        kbaseIrisEchoWidget : 'kbvis/src/widgets/iris/kbaseIrisEchoWidget',
        kbaseIrisFileBrowser : 'kbvis/src/widgets/iris/kbaseIrisFileBrowser',
        kbaseIrisFileEditor : 'kbvis/src/widgets/iris/kbaseIrisFileEditor',
        kbaseIrisGrammar : 'kbvis/src/widgets/iris/kbaseIrisGrammar',
        kbaseIrisGUIWidget : 'kbvis/src/widgets/iris/kbaseIrisGUIWidget',
        kbaseIrisProcessList : 'kbvis/src/widgets/iris/kbaseIrisProcessList',
        kbaseIrisTerminal : 'kbvis/src/widgets/iris/kbaseIrisTerminal',
        kbaseIrisTerminalWidget : 'kbvis/src/widgets/iris/kbaseIrisTerminalWidget',
        kbaseIrisTextWidget : 'kbvis/src/widgets/iris/kbaseIrisTextWidget',
        kbaseIrisTutorial : 'kbvis/src/widgets/iris/kbaseIrisTutorial',
        kbaseIrisWidget : 'kbvis/src/widgets/iris/kbaseIrisWidget',
        kbaseIrisWorkspace : 'kbvis/src/widgets/iris/kbaseIrisWorkspace',

        RGBColor : 'kbvis/src/js/RGBColor',
        geometry_point : 'kbvis/src/js/geometry/point',
        geometry_rectangle : 'kbvis/src/js/geometry/rectangle',
        geometry_size : 'kbvis/src/js/geometry/size',

        KbaseNetworkServiceClient : 'kbvis/src/js/KbaseNetworkServiceClient',
        CDMI_API : 'kbvis/src/js/CDMI_API',
        IdMapClient : 'kbvis/src/js/IdMapClient',
        OntologyServiceClient : 'kbvis/src/js/OntologyServiceClient',
    },
    shim: {
        bootstrap:    { deps: ["jquery"] },
    }
 });
});


