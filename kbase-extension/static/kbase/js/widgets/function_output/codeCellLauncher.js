/**
 * Output widget to generate a code cell with vis output.
 * @public
 */

define ([
    'uuid',
    'jquery',
    'kbwidget',
    'narrativeConfig',
    'base/js/namespace',
    'common/utils',
    // For effect
    'bootstrap',
], function(
    Uuid,
    $,
    KBWidget,
    Config,
    Jupyter,
    utils
) {
    'use strict';

    return KBWidget({
        name: 'codeCellLauncher',
        version: '1.0.2',
        options: {
            output: null,
            workspaceID: null,
            loadingImage: Config.get('loading_gif')
        },

        init: function(options) {
            this._super(options);
            // Create a message pane
            this.$messagePane = $('<div/>').addClass('kbwidget-message-pane kbwidget-hide-message');
            this.$elem.append(this.$messagePane);
            console.log(this.options);
            const type = this.options.output_type,
                matrix_ref = this.options.matrix_ref;

            const code = this.get_python_code(type, matrix_ref);
            if (code) this.launchCodeCell(code);
            return this;
        },

        launchCodeCell: function (code) {
            const thisCell = this.$elem[0].parentElement.parentElement.kb_obj.cell,
                cellId = utils.getMeta(thisCell, 'attributes', 'id'),
                cellIndex = Jupyter.notebook.find_cell_index(thisCell),
                newCellId = new Uuid(4).format(),
                setupData = {
                    type: 'code',
                    cellId: newCellId,
                    parentCellId: cellId,
                };

            let newCell = Jupyter.notebook.insert_cell_below('code', cellIndex, setupData);
            newCell.set_text(code);
            newCell.execute();

            // Don't want duplicate child cells on load. This is the best way I can think to do it right now
            Jupyter.notebook.delete_cell(cellIndex)
        },

        get_python_code: function (type, matrix_ref) {
            let code;
            if (type === 'dataframe') {
                code = 'from biokbase.narrative.viewers import get_df\n' +
                    `df = get_df('${matrix_ref}')\ndf`
            } else if (type === 'clustergrammer') {
                code = 'from biokbase.narrative.viewers import view_as_clustergrammer\n' +
                    `view_as_clustergrammer('${matrix_ref}')`
            } else if (type === 'seaborn box') {
                code = 'import seaborn as sns\n' +
                    'from biokbase.narrative.viewers import get_df\n' +
                    `df = get_df('${matrix_ref}', None, None)\n` +
                    'sns.boxplot(data=df).set(xlabel="Columns", ylabel="Row Values");'
            } else if (type === 'plotly stackedbars') {
                code = 'import plotly\n' +
                    'import plotly.graph_objs as go\n' +
                    'from biokbase.narrative.viewers import get_df\n\n' +
                    `df = get_df('${matrix_ref}', None, None)\n` +
                    'plotly.offline.init_notebook_mode(connected=True)\n' +
                    'plotly.offline.iplot({\n' +
                    '    "data": [go.Bar(x=df.columns, y=row, name=i) for i, row in df.iterrows()],\n' +
                    '    "layout": go.Layout(title="Stacked bars" xaxis={"title": "Columns"}, yaxis={"title": "Row Values"}, barmode="stack")\n' +
                    '})'

            } else {
                this.showMessage(`Unsupported output type ${type}`);
            }
            return code;
        }
    });
});
