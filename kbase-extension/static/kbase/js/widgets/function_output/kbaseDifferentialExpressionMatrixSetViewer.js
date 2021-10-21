define([
    'kbwidget',
    'kbaseAuthenticatedWidget',
    'kbaseExpressionVolcanoPlot',
    'kb_common/jsonRpc/genericClient',
    'narrativeConfig',
    'common/runtime',
    'widgets/common/LoadingMessage',
    'widgets/common/ErrorMessage',
    'widgets/common/AlertMessage',
    'widgets/common/jQueryUtils',

    // For effect
    'bootstrap'
], (
    KBWidget,
    kbaseAuthenticatedWidget,
    KBaseExpressionVolcanoPlot,
    ServiceClient,
    Config,
    Runtime,
    $LoadingMessage,
    $ErrorMessage,
    $AlertMessage,
    jQueryUtils
) => {
    'use strict';

    const { $el } = jQueryUtils;

    return KBWidget({
        name: 'kbaseDifferentialExpressionMatrixSetViewer',
        parent: kbaseAuthenticatedWidget,

        version: '1.0.0',

        init: function init(options) {
            this._super(options);
            this.objectRef = this.options.upas.obj_ref;

            this.render();
        },

        render: async function () {
            this.renderLoading();
            try {
                const { data: set, info } = await this.fetchSetObject();
                this.objectName = info[1];
                this.renderLayout();
                this.$elem.find('[data-id="set-description"]').text(set.description);
                const $options = set.items.map(({ label, ref }) => {
                    return $el('option')
                        .text(label)
                        .val(ref);
                });
                this.$elem.find('[data-id="set-elements"]').html($options);

                if (set.items.length === 0) {
                    return this.$elem.html($AlertMessage('This set has no elements', { type: 'warning' }));
                }

                this.renderVolcanoPlot(set.items[0].ref);
            } catch (ex) {
                this.renderError(ex);
            }
        },

        renderLoading: function () {
            this.$elem.html($LoadingMessage('Loading Set...'));
        },

        renderError: function (error) {
            this.$elem.html($ErrorMessage(error));
        },

        renderLayout: function () {
            this.$elem
                .empty()
                .append(
                    $el('div')
                        .css('margin-bottom', '10px')
                        .append(
                            this.$renderHeader()
                        ))
                .append(
                    $el('div').append(
                        this.readerElement(),
                    ));
        },

        $renderHeader: function () {
            return $el('table').addClass('table PropTable')
                .append($el('tbody')
                    .append(
                        $el('tr')
                            .append(
                                $el('th').css('width', '9em').text('Description')
                            )
                            .append(
                                $el('td').attr('data-id', 'set-description')
                            )
                    )
                    .append(
                        $el('tr')
                            .append(
                                $el('th').text('Condition Pair')
                            )
                            .append(
                                $el('td').append(
                                    $el('div').addClass('form-inline').append(
                                        $el('select')
                                            .addClass('form-control')
                                            .css('margin-left', '0')
                                            .attr('data-id', 'set-elements')
                                            .on('change', this.changeSelectElement.bind(this))
                                    )
                                )
                            )
                    )
                );
        },

        changeSelectElement: function (ev) {
            try {
                this.renderVolcanoPlot(ev.target.value);
            } catch (ex) {
                console.error('ERROR', ex);
            }
        },

        renderVolcanoPlot: function (ref) {
            const $elementViewer = this.$elem.find('[data-id="element-viewer"]');
            const $node = $el('div');
            $elementViewer.html($node);
            new KBaseExpressionVolcanoPlot($node, {
                ref,
                setRef: this.objectRef,
                setObjectName: this.objectName
            });
        },

        readerElement: function () {
            return $el('div').attr('data-id', 'element-viewer');
        },

        fetchSetObject: async function () {
            const workspace = new ServiceClient({
                module: 'Workspace',
                url: Config.url('workspace'),
                token: Runtime.make().authToken()
            });

            const [result] = await workspace.callFunc('get_objects2', [{
                objects: [{
                    ref: this.objectRef
                }]
            }]);

            return result.data[0];
        }
    });
});
