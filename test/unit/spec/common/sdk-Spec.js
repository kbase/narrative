/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/

define ([
    'common/sdk',
    'json!/test/data/NarrativeTest.test_simple_inputs.spec.json',
    'json!/test/data/NarrativeTest.test_input_params.spec.json'
], function(
    SDK,
    SimpleAppSpec,
    ComplexAppSpec
) {
    'use strict';
    var validateConvertedSpec = function(spec) {
        if (!spec || !('parameters' in spec)) {
            return false;
        }
        if (!('layout' in spec.parameters) || !('specs' in spec.parameters)) {
            return false;
        }
        var paramKeys = ['id', 'multipleItems', 'ui', 'data', '_position'];
        var passedInternal = true;
        spec.parameters.layout.forEach(function(param) {
            paramKeys.forEach(function(key) {
                if (!(key in spec.parameters.specs[param])) {
                    passedInternal = false;
                    console.error('TEST ERROR: param ' + param + ' missing key ' + key);
                }
            });
        });
        return passedInternal;
    };

    describe('Test SDK convertor tool', function() {
        it('Is alive!', function() {
            expect(SDK).toBeTruthy();
        });

        it('Can convert a simple app spec', function() {
            var spec = SDK.convertAppSpec(SimpleAppSpec);
            expect(validateConvertedSpec(spec)).toBe(true);
        });

        it('Can convert a rather complex app spec', function() {
            var spec = SDK.convertAppSpec(ComplexAppSpec);
            console.log(JSON.stringify(spec, null, 4));
            expect(validateConvertedSpec(spec)).toBe(true);

        });

        it('Throws an error with an app spec with missing stuff', function() {
            try {
                SDK.convertAppSpec(null);
            } catch (error) {
                expect(error).not.toBeNull();
            }
        });
    });

});
