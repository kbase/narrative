/*global define*/
/*jslint white:true,browser:true*/

define([
    'handlebars',
    'common/runtime',
    'common/props',
    'kb_common/html',
    'kb_service/client/workspace',
    'kbase-generic-client-api',
    './growthCurves',
    './sampleProperty',
    './samplePropertyHistogram',
    './growthCondition'

], function (
    Handlebars,
    Runtime,
    Props,
    html,
    Workspace,
    GenericClient,
    GrowthCurves,
    SampleProperty,
    SamplePropertyHistogram,
    GrowthCondition) {
    'use strict';

    var t = html.tag,
        div = t('div');

    function factory(config) {

        var runtime = Runtime.make();

        function workspaceCall(subObjectIdentity) {
            return new Workspace(runtime.config('services.workspace.url'), {
                    token: runtime.authToken()
                })
                .get_object_subset([subObjectIdentity]);
        }

        function genericClientCall(subdataSelection, subObjectIdentity) {
            var swUrl = runtime.config('services.workspace.url').replace("ws", "service_wizard"),
                genericClient = new GenericClient(swUrl, {
                    token: runtime.authToken()
                });
            return genericClient.sync_call(subdataSelection.service_function, [
                    [subObjectIdentity]
                ], null, null,
                subdataSelection.service_version);
        }

        function makeLabel(item, showSourceObjectName) {
            return div({ style: { wordWrap: 'break-word' } }, [
                div({ style: { fontWeight: 'bold' } }, item.id),
                item.desc,
                (function () {
                    if (showSourceObjectName && item.objectName) {
                        return div({ style: { padding: '0px', fontStyle: 'italic' } }, item.objectName);
                    }
                }())
            ]);
        }

        function standardFetchData(arg) {
            var referenceObjectRef = arg.referenceObjectRef,
                subdataSelection = arg.spec.data.constraints.subdataSelection,
                subObjectIdentity = {
                    ref: referenceObjectRef,
                    included: subdataSelection.subdata_included
                },
                dataCall;
            if (subdataSelection.service_function) {
                dataCall = genericClientCall(subdataSelection, subObjectIdentity);
            } else {
                dataCall = workspaceCall(subObjectIdentity);
            }
            return dataCall
                .then(function (results) {
                    var values = [],
                        selectionId = subdataSelection.selection_id,
                        descriptionFields = subdataSelection.selection_description || [],
                        descriptionTemplateText = subdataSelection.description_template,
                        descriptionTemplate;

                    if (!descriptionTemplateText) {
                        descriptionTemplateText = descriptionFields.map(function (field) {
                            return '{{' + field + '}}';
                        }).join(' - ');
                    }

                    descriptionTemplate = Handlebars.compile(descriptionTemplateText);
                    results.forEach(function (result) {
                        if (!result) {
                            return;
                        }

                        // Check if some generic wrapping is used which wasn't unwrapped by GenericClient
                        if (result instanceof Array) {
                            result = result[0];
                        }

                        var subdata = Props.getDataItem(result.data, subdataSelection.path_to_subdata);

                        if (!subdata) {
                            return;
                        }

                        // if(subdata instanceof Array) {
                        //     for(var k=0; k<subdata.length; k++) {
                        //         var dname = datainfo[1];
                        //         if(includeWsId) { dname = datainfo[6] + '/' + datainfo[1]; }
                        //         var id = subdata[k]; // default id is just the value
                        //         // if the selection_id is set, and the object is an object of somekind, then use that value
                        //         if(selection_id && typeof id === 'object') {
                        //             id = subdata[k][selection_id];
                        //         }
                        //         var autofill = {
                        //             id: id,
                        //             desc: hb_template(subdata[k]),
                        //             dref: datainfo[6] + '/' + datainfo[0] + '/' + datainfo[4],
                        //             dname: dname
                        //         };
                        //         self.autofillData.push(autofill);
                        //     }

                        if (subdata instanceof Array) {
                            // For arrays we pluck off the "selectionId" property from
                            // each item.
                            subdata.forEach(function (datum) {
                                var id = datum;
                                if (selectionId && typeof id === 'object') {
                                    id = datum[selectionId];
                                }
                                values.push({
                                    id: id,
                                    desc: descriptionTemplate(datum), // TODO
                                    objectRef: [result.info[6], result.info[0], result.info[4]].join('/'),
                                    objectName: result.info[1]
                                });
                            });
                        } else {
                            Object.keys(subdata).forEach(function (key) {
                                var datum = subdata[key],
                                    id;

                                if (selectionId) {
                                    switch (typeof datum) {
                                    case 'object':
                                        id = datum[selectionId];
                                        break;
                                    case 'string':
                                    case 'number':
                                        if (selectionId === 'value') {
                                            id = datum;
                                        } else {
                                            id = key;
                                        }
                                        break;
                                    default:
                                        id = key;
                                    }
                                } else {
                                    id = key;
                                }

                                values.push({
                                    id: id,
                                    desc: descriptionTemplate(datum), // todo
                                    // desc: id,
                                    objectRef: [result.info[6], result.info[0], result.info[4]].join('/'),
                                    objectName: result.info[1]
                                });
                            });
                        }
                    });
                    return values.map(function (item) {
                        item.text = makeLabel(item, arg.spec.ui.showSourceObject);
                        return item;
                    });
                })
                .then(function (data) {
                    // sort by id now.
                    data.sort(function (a, b) {
                        if (a.id > b.id) {
                            return 1;
                        }
                        if (a.id < b.id) {
                            return -1;
                        }
                        return 0;
                    });
                    return data;
                });
        }

        function getSubdataInfo(appSpec, paramSpec) {
            switch (appSpec.widgets.input) {
            case 'kbaseSamplePropertyHistogramInput':
                switch (paramSpec.id) {
                case 'input_samples':
                    return SamplePropertyHistogram.make().getMethod();
                default:
                    throw new Error('Unknown custom parameter id for ' + appSpec.widgets.input);
                }
            case 'kbaseSampleProperty2DPlotInput':
                switch (paramSpec.id) {
                case 'input_property_x':
                case 'input_property_y':
                    return SampleProperty.make().getMethod();
                default:
                    throw new Error('Unknown custom parameter id for ' + appSpec.widgets.input);
                }
            case 'kbaseGrowthParamsPlotInput':
                switch (paramSpec.id) {
                case 'input_condition_param':
                    return GrowthCondition.make().getMethod();
                default:
                    throw new Error('Unknown custom parameter id for ' + appSpec.widgets.input);
                }
            case 'kbaseGrowthCurvesInput':
                return GrowthCurves.make().getMethod();
            default:
                throw new Error('Sorry, input widget ' + appSpec.widgets.input + ' is not recognized');
            }
        }

        function customFetchDataNormal(arg) {
            var workspace = new Workspace(runtime.config('services.workspace.url'), {
                    token: runtime.authToken()
                }),
                query = [{
                    ref: arg.referenceObjectRef,
                    included: arg.included
                }];
            return workspace.get_object_subset(query)
                .then(function (result) {
                    return arg.extractItems(result, arg.params);
                });
        }

        function customFetchFromReference(arg) {
            var referenceObjectRef = arg.referenceObjectRef,
                workspace = new Workspace(runtime.config('services.workspace.url'), {
                    token: runtime.authToken()
                });
            return workspace.get_objects([{ ref: referenceObjectRef }])
                .then(function (data) {
                    var nextRef = arg.getRef(data),
                        query = [{
                            ref: nextRef,
                            included: arg.included
                        }];
                    return workspace.get_object_subset(query);
                })
                .then(function (result) {
                    return arg.extractItems(result, arg.params);
                });
        }

        function customFetchData(arg) {
            if (arg.getRef) {
                return customFetchFromReference(arg);
            }
            return customFetchDataNormal(arg);
        }

        return {
            fetchData: standardFetchData,
            standardFetchData: standardFetchData,
            customFetchData: customFetchData,
            getSubdataInfo: getSubdataInfo
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});