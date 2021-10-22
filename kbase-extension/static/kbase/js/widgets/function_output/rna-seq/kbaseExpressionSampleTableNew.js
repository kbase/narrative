define([
    'kbwidget',
    'kbaseAuthenticatedWidget',
    'kb_common/jsonRpc/genericClient',
    'narrativeConfig',
    'base/js/namespace',
    'widgets/common/jQueryUtils',
    'widgets/common/ErrorMessage',
    'widgets/common/LoadingMessage',
    'widgets/function_output/rna-seq/kbaseExpressionSample',

    // For effect
    'bootstrap',
    'css!widgets/function_output/rna-seq/kbaseExpressionSampleTableNew.css',
], (
    KBWidget,
    kbaseAuthenticatedWidget,
    ServiceClient,
    Config,
    Jupyter,
    jQueryUtils,
    $ErrorMessage,
    $LoadingMessage,
    KBaseExpressionSample
) => {
    'use strict';

    const { $el, $row, $col } = jQueryUtils;

    return KBWidget({
        name: 'kbaseExpressionSampleTableNew',
        parent: kbaseAuthenticatedWidget,

        version: '1.0.0',
        options: {
            numBins: 50,
            minCutoff: 0.001,
        },

        init: function (options) {
            this._super(options);

            this.ref = this.options.upas.output;
            this.workspaceClient = new ServiceClient({
                url: Config.url('workspace'),
                module: 'Workspace',
                token: Jupyter.narrative.getAuthToken()
            });

            this.render();

            return this;
        },

        render: async function () {
            try {
                this.$elem.addClass('KBaseExpressionSampleTableNew');
                this.$elem.html($LoadingMessage('Loading data...'));
                const { moduleName, typeName } = await this.getObjectType();
                switch (`${moduleName}.${typeName}`) {
                    case 'KBaseRNASeq.RNASeqExpressionSet':
                    case 'KBaseSets.ExpressionSet':
                        return this.renderExpressionSet();
                    case 'KBaseRNASeq.RNASeqExpression':
                        this.renderExpressionSample();
                }
            } catch (ex) {
                this.$elem.html($ErrorMessage(ex));
            }
        },

        renderExpressionSample: function () {
            this.$elem.empty();
            const $donor = $el('div');
            this.$elem.html($donor);
            new KBaseExpressionSample($donor, { ref: this.ref });
        },

        fetchObject: async function () {
            const [result] = await this.workspaceClient.callFunc('get_objects2', [{
                objects: [{
                    ref: this.ref
                }]
            }]);
            return result.data[0];
        },

        getObjectType: async function () {
            const [result] = await this.workspaceClient.callFunc('get_object_info3', [{
                objects: [{
                    ref: this.ref
                }]
            }]);

            const [moduleName, typeName, majorVersion, minorVersion] = result.infos[0][2].split(/[.-]/);
            return { moduleName, typeName, majorVersion, minorVersion };
        },

        getExpressionRefs: async function (dataObject) {
            const objectIdentifiers = (() => {
                if (dataObject.data.items) {
                    return dataObject.data.items.map(({ ref }) => {
                        return { ref };
                    });
                }
                return dataObject.data.sample_expression_ids.map((ref) => {
                    return { ref };
                });
            })();

            const [result] = await this.workspaceClient.callFunc('get_object_info3', [{ objects: objectIdentifiers }]);

            return result.infos.map((objectInfo, index) => {
                return {
                    ref: objectIdentifiers[index].ref,
                    name: objectInfo[1]
                };
            });
        },

        renderExpressionSet: async function () {
            const dataObject = await this.fetchObject();
            const expressionRefs = await this.getExpressionRefs(dataObject);

            if (expressionRefs.length === 0) {
                throw new Error('No elements in set');
            }

            const $sampleView = $el('div');

            new KBaseExpressionSample($sampleView, { ref: expressionRefs[0].ref });

            const $selectControl = $el('select')
                .addClass('form-control')
                .on('change', () => {
                    const $donor = $el('div');
                    $sampleView.html($donor);
                    new KBaseExpressionSample($donor, { ref: $selectControl.val() });
                });

            for (const { ref, name } of expressionRefs) {
                $selectControl.append(
                    $el('option')
                        .attr('value', ref)
                        .append(name)
                );
            }

            const $header = $el('div').addClass('KBaseExpressionSampleTableNew-header');

            if (dataObject.data.description) {
                $header.append($row()
                    .append($col().text('Description'))
                    .append($col().text(dataObject.data.description)));
            }

            $header.append($row()
                .append($col().text('Expression Level'))
                .append($col().html($selectControl)));

            this.$elem
                .empty()
                .append($header)
                .append($sampleView);
        }
    });
});
