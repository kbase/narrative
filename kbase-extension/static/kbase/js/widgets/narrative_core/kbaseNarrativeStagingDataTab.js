define([
    'jquery',
    'dropzone',
    'kbwidget',
    'narrativeConfig',
    'common/runtime',
    'util/string'
], function(
    $,
    Dropzone,
    KBWidget,
    Config,
    Runtime,
    StringUtil
) {
    return new KBWidget({
        name: 'kbaseNarrativeStagingDataTab',
        init: function(options) {
            this._super(options);
            return this;
        },

        render: function() {
            var dzId = StringUtil.uuid() + '-dropzone';
            var $mainElem = $('<div>')
                .css({
                    'height': '604px'
                });
            var $dropzoneElem = $('<div>')
                .attr('id', dzId)
                .css({
                    'border': '2px dashed #2196F3',
                    'height': '50px',
                    'margin': '5px',
                    'text-align': 'center'
                })
                .append('I am staging zone. Drop stuff on me.');
            this.$elem
                .empty()
                .append($mainElem.append($dropzoneElem));

            var dz = new Dropzone($dropzoneElem.get(0), {
                url: 'file/post',
                accept: function(file, done) {
                    done("Haha, nope");
                }
            });
        }
    });
});
