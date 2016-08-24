/*global define*/
/*jslint white:true,browser:true*/

define([
    'kb_common/html'
], function (
    html
    ) {
    'use strict';
    
    var t = html.tag,
        div = t('div');

    function factory(config) {
        var parent, container,
            // our state
            appId, appVersion, appTag,
            appSpec;
        
        
        function render() {
            var content = div([
                div(['app id is ', appId]),
                div(['app version is ', appVersion]),
                div(['app tag is ', appTag])
            ]);
            
            return content;
        }


        function start(params) {
            parent = params.root;
            var container = document.createElement('div');
            container = parent.appendChild(container);

            // Get sorted out with the app and the input widget.
            appId = params.appId;
            appVersion = params.appVersion;
            appTag = params.appTag;
            
            container.innerHTML = render();
        }

        function stop() {

        }

        return {
            start: start,
            stop: stop
        }
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});