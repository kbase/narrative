/*global define*/
/*jslint browser:true,white:true,single:true */

/*
 * Provides app spec functionality.
 */

define([
    './sdk',
    './specValidation'
], function (sdk, Validation) {
   'use strict';
   
   function factory(config) {
       var spec;
       
       if (config.spec) {
           spec = config.spec;
       } else if (config.appSpec) {
           spec = sdk.convertAppSpec(config.appSpec);
       } else {
           throw new Error('Either a spec or appSpec must be provided');
       }
       
       function getSpec() {
           return spec;
       }
       
       /*
        * Make a "shell" model based on the spec. Recursively build an object
        * with properties as defined by the spec.
        * Effectively this means that only the top level is represented, since 
        */
       function makeEmptyModel() {
           var model = {};
           console.log('making empty model from ', spec);
           spec.parameters.layout.forEach(function (id) {
               model[id] = spec.parameters.specs[id].data.defaultValue || spec.parameters.specs[id].data.nullValue;
           });
           return model;
       }

       function makeDefaultedModel() {
           var model = {};
           console.log('making empty model from ', spec);
           spec.parameters.layout.forEach(function (id) {
               console.log('DDEEFF??', id, spec.parameters.specs[id]);
               model[id] = spec.parameters.specs[id].data.defaultValue || spec.parameters.specs[id].data.nullValue;
           });
           console.log('DEFAULTED', model);
           return model;
       }
       
       
       function validateModel(model) {
           // TODO: spec at the top level should be a struct...
           var results = {};
           var validation = Validation.make();
           console.log('validating with', spec);
           return spec.parameters.layout.forEach(function (id) {
                results[id] = validation.validateModel(spec.parameters.specs[id], model[id]);
           });
           console.log('validation results', results);
           return results;
       }
       
       return Object.freeze({
           getSpec: getSpec,
           makeEmptyModel: makeEmptyModel,
           makeDefaultedModel: makeDefaultedModel,
           validateModel: validateModel
       });
   }
   
   return {
       make: function (config) {
           return factory(config);
       }
   };
});