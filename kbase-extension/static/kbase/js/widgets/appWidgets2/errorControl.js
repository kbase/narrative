/*global define*/
/*jslint white:true,browser:true*/

/* This is a special widget, because it is a factory factory! */

define([
    'kb_common/html',
    'bootstrap'
], function (html) {
    'use strict';
    var t = html.tag,
        div = t('div'), span = t('span');
    
    function factoryFactory(factoryConfig) {
        
        function factory(config) {

            function attach(node) {
                node.innerHTML = div({
                    class: 'alert alert-danger',
                    role: 'alert'
                }, [span({style: {fontWeight: 'bold'}}, 'Error! '), factoryConfig.message]);
            }

            return {
                attach: attach
            };
        }
        return {
            make: function (config) {
                return factory(config);
            }
        };
    }
    
    return {
        make: function (config) {
            return factoryFactory(config);
        }
    };
});