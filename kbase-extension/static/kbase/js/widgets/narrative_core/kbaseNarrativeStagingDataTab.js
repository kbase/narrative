define([
    'jquery',
    'dropzone',
    'kbwidget',
    'narrativeConfig',
    'common/runtime'
], function(
    $,
    Dropzone,
    KBWidget,
    Config,
    Runtime
) {
    return new KBWidget({
        name: 'kbaseNarrativeStagingDataTab',
        init: function(options) {
            this._super(options);
            return this;
        },

        render: function() {
            this.$elem.empty().append('I am staging zone. Drop stuff on me.');
        }
    });
});
