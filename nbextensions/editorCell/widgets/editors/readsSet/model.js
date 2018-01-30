/*global define*/
/*jslint white:true,browser:true*/

/*
 * Okay, I give in.
 * Lets just do MVC
 * ish.
 * Our models are aware of the app spec, though, that is how they
 * configure their properties, validation, and relationships.
 * Data operations are custom coded here, though.
 * 
 */

define([
    'kb_common/props',
    'kb_service/client/narrativeMethodStore'
], function(
    Props,
    NarrativeMethodStore
) {
    'use strict';

    function factory(config) {
        var model = Props.make(),
            runtime = config.runtime,
            appId = config.appId,
            appTag = config.appTag,
            appSpec = config.spec;

        // SUPPORT

        function fetchAppSpec(appId, appTag) {
            var appRef = {
                    ids: [appId],
                    tag: appTag
                },
                nms = new NarrativeMethodStore(runtime.config('services.narrative_method_store.url'), {
                    token: runtime.authToken()
                });

            return nms.get_method_spec(appRef)
                .then(function(data) {
                    if (!data[0]) {
                        throw new Error('App not found');
                    }
                    // Just keep a copy around for debugging.                    
                    // appSpec = data[0];

                    return data[0];

                    // Now 

                    // Get an input field widget per parameter


                    //                    var parameterMap = {},
                    //                        parameters = getParameters().map(function (parameterSpec) {
                    //                            // tee hee
                    //                            var param = ParameterSpec.make({parameterSpec: parameterSpec});
                    //                            parameterMap[param.id()] = param;
                    //                            return param;
                    //                        });
                    //                    env.parameters = parameters;
                    //                    env.parameterMap = parameterMap;
                    //                    
                    //                    
                    //                   
                    //                    return parameters;
                });
        }

        function fetchAppSpec_fake(appId, appTag) {

            var appSpec = {
                parameters: [{
                        id: 'name',
                        description: 'Name of the reads set',
                        short_hint: 'The name of the set of sequence reads',
                        default_values: [''],
                        optional: 0,
                        disabled: 0,
                        advanced: 0,
                        allow_multiple: 0,
                        field_type: 'text',
                        text_options: {
                            is_output_name: 1,
                            placeholder: 'Reads Set Name',
                            valid_ws_types: ['KBaseSets.ReadsSet']
                        },
                        ui_class: 'output',
                        ui_name: 'Reads Set Name'
                    },
                    {
                        id: 'description',
                        description: 'Description of the reads set',
                        short_hint: 'The description of the set of sequence reads',
                        default_values: [''],
                        optional: 1,
                        disabled: 0,
                        advanced: 0,
                        allow_multiple: 0,
                        field_type: 'textarea',
                        textarea_options: {
                            is_output_name: 0,
                            placeholder: 'Description',
                            regex_constraint: [],
                            validate_as: 'string',
                            n_rows: 5
                        },
                        ui_class: 'parameter',
                        ui_name: 'Description'
                    },
                    {
                        id: 'items',
                        field_type: 'text',
                        description: 'A set of reads objects',
                        short_hint: 'A set of reads objects',
                        default_values: [''],
                        optional: 1,
                        disabled: 0,
                        advanced: 0,
                        allow_multiple: 1,
                        text_options: {
                            is_output_name: 0,
                            placeholder: 'Items',
                            regex_constraint: [],
                            valid_ws_types: ['KBaseFile.SingleEndLibrary', 'KBaseFile.PairedEndLibrary']
                        },
                        ui_class: 'input',
                        ui_name: 'Set of Reads Objects'
                    }
                ]
            };
        }


        function createModelForApp(appId, appTag) {
            fetchAppSpec(appId, appTag)
                .then(function() {
                    // For each parameter, we build up our model.

                    // Now we layer on relationships

                    // ...
                });
        }

        /*
         * Creates a model object from a given app spec.
         */
        function createModelFromSpec() {

        }

        function updateModel() {

        }

        function getJson() {

        }

        function setJson() {

        }

        function validateModel() {

        }

        function resetModel() {

        }

        function onChanged() {

        }


        /*
         * Service model
         */
        function start() {
            return fetchAppSpec(appId, appTag)
                .then(function(appSpec) {
                    return true;
                });
        }

        function stop() {}



        return {
            start: start,
            stop: stop
        };
    };


    return {
        make: function(config) {
            return factory(config);
        }
    };
});