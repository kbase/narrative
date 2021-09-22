define([
    'widgets/appWidgets2/customWidgetWrapper',
    'widgets/appWidgets2/errorControl',
    'widgets/appWidgets2/fieldWidget',
    'widgets/appWidgets2/fieldWidgetCompact',
    'widgets/appWidgets2/fieldWidgetMicro',
    'widgets/appWidgets2/inputUtils',
    'widgets/appWidgets2/parameterSpec',
    'widgets/appWidgets2/paramResolver',
    'widgets/appWidgets2/validation',
    'widgets/appWidgets2/display/multiIntDisplay',
    'widgets/appWidgets2/display/multiObjectDisplay',
    'widgets/appWidgets2/display/multiTextDisplay',
    'widgets/appWidgets2/display/singleCheckboxDisplay',
    'widgets/appWidgets2/display/singleIntDisplay',
    'widgets/appWidgets2/display/singleObjectDisplay',
    'widgets/appWidgets2/display/singleSelectDisplay',
    'widgets/appWidgets2/display/singleTextDisplay',
    'widgets/appWidgets2/display/undefinedDisplay',
    'widgets/appWidgets2/editors/readsSetEditor',
    'widgets/appWidgets2/editors/readsSetEditorView',
    'widgets/appWidgets2/input/checkboxInput',
    'widgets/appWidgets2/input/customSubdataInput',
    'widgets/appWidgets2/input/fileInput',
    'widgets/appWidgets2/input/floatInput',
    'widgets/appWidgets2/input/intInput',
    'widgets/appWidgets2/input/newObjectInput',
    'widgets/appWidgets2/input/select2ObjectInput',
    'widgets/appWidgets2/input/selectInput',
    'widgets/appWidgets2/input/sequenceInput',
    'widgets/appWidgets2/input/structInput',
    'widgets/appWidgets2/input/subdataInput',
    'widgets/appWidgets2/input/taxonomyRefInput',
    'widgets/appWidgets2/input/textareaInput',
    'widgets/appWidgets2/input/textInput',
    'widgets/appWidgets2/input/toggleButtonInput',
    'widgets/appWidgets2/input/undefinedInput',
    'widgets/appWidgets2/subdataMethods/growthCondition',
    'widgets/appWidgets2/subdataMethods/growthCurves',
    'widgets/appWidgets2/subdataMethods/manager',
    'widgets/appWidgets2/subdataMethods/sampleProperty',
    'widgets/appWidgets2/subdataMethods/samplePropertyHistogram',
    'widgets/appWidgets2/validators/common',
    'widgets/appWidgets2/validators/customSubdata',
    'widgets/appWidgets2/validators/float',
    'widgets/appWidgets2/validators/int',
    'widgets/appWidgets2/validators/resolver',
    'widgets/appWidgets2/validators/sequence',
    'widgets/appWidgets2/validators/struct',
    'widgets/appWidgets2/validators/subdata',
    'widgets/appWidgets2/validators/text',
    'widgets/appWidgets2/validators/workspaceObjectName',
    'widgets/appWidgets2/validators/workspaceObjectRef',
    'widgets/appWidgets2/view/autocompleteView',
    'widgets/appWidgets2/view/checkboxView',
    'widgets/appWidgets2/view/customSelectView',
    'widgets/appWidgets2/view/customSubdataView',
    'widgets/appWidgets2/view/fileView',
    'widgets/appWidgets2/view/floatView',
    'widgets/appWidgets2/view/intView',
    'widgets/appWidgets2/view/newObjectView',
    'widgets/appWidgets2/view/objectRefView',
    'widgets/appWidgets2/view/objectView',
    'widgets/appWidgets2/view/select2ObjectView',
    'widgets/appWidgets2/view/selectView',
    'widgets/appWidgets2/view/sequenceView',
    'widgets/appWidgets2/view/structView',
    'widgets/appWidgets2/view/subdataView',
    'widgets/appWidgets2/view/taxonomyRefView',
    'widgets/appWidgets2/view/textareaView',
    'widgets/appWidgets2/view/textView',
    'widgets/appWidgets2/view/toggleButtonView',
    'widgets/appWidgets2/view/undefinedView',
    'common/busEventManager',
    'common/cellUtils',
    'common/clock',
    'common/data',
    'common/dom',
    'common/error',
    'common/events',
    'common/format',
    'common/fsm',
    'common/html',
    'common/jobs',
    'common/jupyter',
    'common/lang',
    'common/messages',
    'common/microBus',
    'common/miniBus',
    'common/monoBus',
    'common/parameterSpec',
    'common/props',
    'common/pythonInterop',
    'common/runtime',
    'common/sdk',
    'common/semaphore',
    'common/spec',
    'common/specValidation',
    'common/ui',
    'common/validation',
    'util/icon',
], () => {
    'use strict';
    return;
});
