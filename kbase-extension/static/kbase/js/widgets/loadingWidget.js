define([
    'jquery',
    'common/ui',
    'kb_common/html'
], function ($, UI, HTML) {
    'use strict';
    var t = HTML.tag,
        div = t('div'),
        span = t('span');

    function factory (config) {
        var node = config.node,
            container = node.querySelector('.progress-container'),
            progress = {
                data: false,
                jobs: false,
                apps: false,
                kernel: false,
                narrative: false
            },
            progressBar = node.querySelector('.progress-bar'),
            totalDone = 0,
            totalSteps = Object.keys(progress).length;

        function start () {
            // renderLayout();
        }

        function updateProgress(name, done, error) {
            var text = '<i class="fa fa-check" aria-hidden="true" style="color:green"></i>';
            if (error) {
                text = '... error while loading.';
            }
            var prog = container.querySelector('[data-element="' + name + '"] .kb-progress-stage');
            prog.innerHTML = text;
            totalDone++;
            progressBar.style.width = (totalDone / totalSteps * 100) + '%';
            if (totalDone >= totalSteps) {
                remove();
            }
        }

        function remove () {
            $(node).fadeOut('slow');
        }

        return {
            start: start,
            stop: stop,
            remove: remove,
            updateProgress: updateProgress
        };
    }

    return {
        make: factory
    };
});
