/* eslint-disable indent */
define([
    'preact',
    'htm',
    'base/js/namespace',
    'api/dataProvider',
    'kb_service/utils',
    'preactComponents/RotatedTable',

    // for effect
    'css!./AddServiceWidgetDataViewer.css',
], (preact, htm, Jupyter, dataProvider, serviceUtils, RotatedTable) => {
    'use strict';

    const { h, Component, createRef } = preact;
    const html = htm.bind(h);
    class AddServiceWidgetDataViewer extends Component {
        constructor(props) {
            super(props);
            this.defaultInputRef = createRef();
            this.state = {
                form: {
                    completed: false,
                },
                fields: {
                    moduleName: '',
                    widgetName: '',
                    title: '',
                    subtitle: '',
                    ref: '',
                    typeName: '',
                    isDynamic: true,
                },
                objects: null,
                objectsMap: null,
            };
        }

        async componentDidMount() {
            this.defaultInputRef.current.focus();
            const objects = await this.fetchObjects();
            const objectsMap = objects.reduce((accum, objectInfo) => {
                accum[objectInfo.ref] = objectInfo;
                return accum;
            }, {});
            this.setState({
                objects,
                objectsMap,
            });
        }

        async fetchObjects() {
            const objects = await dataProvider.getData();
            return objects
                .filter(({ object_info }) => {
                    const typeParts = object_info[2].split(/[.-]/);
                    const typeName = typeParts[1];
                    return typeName !== 'Narrative';
                })
                .map(({ object_info }) => {
                    return serviceUtils.objectInfoToObject(object_info);
                });
        }

        insertWidget() {
            // Create basic metadata with the type set to serviceWidget
            const { moduleName, widgetName, title, subtitle, ref, typeName } = this.state.fields;

            const params = { ref };

            const cellDefinition = {
                type: 'serviceWidget',
                attributes: {
                    title,
                    subtitle,
                    icon: {
                        type: 'data',
                        params: {
                            type: typeName,
                            stacked: false,
                        },
                    },
                },
                params: {
                    service: {
                        moduleName,
                        widgetName,
                        params,
                        // todo: get this from the form.
                        isDynamicService: true,
                    },
                },
            };

            const lastCellIndex = Jupyter.notebook.get_cells().length - 1;
            Jupyter.narrative.insertAndSelectCellBelow('code', lastCellIndex, cellDefinition);
        }

        onSubmit() {
            this.insertWidget();
            this.props.done();
        }

        onCancel() {
            this.props.done();
        }

        formComplete() {
            // If any fields are empty, disable the "Add to Narrative" button.
            const { moduleName, widgetName, ref } = this.state.fields;

            if (!moduleName) {
                return false;
            }

            if (!widgetName) {
                return false;
            }

            if (!ref) {
                return false;
            }

            return true;
        }

        renderObjectSelector() {
            if (this.state.objects === null) {
                return;
            }

            const options = this.state.objects.map(({ ref, name, typeName }) => {
                return html`<option value=${ref}>${name} (${typeName})</option>`;
            });
            options.unshift(html`<option value="">- select an object -</option>`);

            return html`<select
                className="form-control"
                onChange=${(e) => {
                    const ref = e.target.value;
                    const { name, version, type, typeName } = this.state.objectsMap[ref];
                    const title = name;
                    const subtitle = `v${version} ${type}`;
                    this.setState({
                        // We use Object.assign because the minifier currently in use
                        // chokes on some usages of object spread.
                        fields: Object.assign(/* NOSONAR */ {}, this.state.fields, {
                            ref: e.target.value,
                            typeName,
                            title,
                            subtitle,
                        }),
                    });
                }}
            >
                ${options}
            </select> `;
        }

        render() {
            return html`
                <form
                    className="form AddServiceWidgetDataViewer"
                    onSubmit=${(e) => e.preventDefault()}
                >
                    <${RotatedTable.Table}>
                        <${RotatedTable.Row}>
                            <${RotatedTable.HeaderCell}> Module </${RotatedTable.HeaderCell}>
                            <${RotatedTable.DisplayCell}>
                                <input
                                    className="form-control"
                                    ref=${this.defaultInputRef}
                                    value=${this.state.moduleName}
                                    onInput=${(e) =>
                                        this.setState({
                                            // We use Object.assign because the minifier currently in use
                                            // chokes on some usages of object spread.
                                            fields: Object.assign(
                                                /* NOSONAR */ {},
                                                this.state.fields,
                                                {
                                                    moduleName: e.target.value,
                                                }
                                            ),
                                        })}
                                />
                            </${RotatedTable.DisplayCell}>
                        </${RotatedTable.Row}>

                        <${RotatedTable.Row}>
                            <${RotatedTable.HeaderCell}> Widget </${RotatedTable.HeaderCell}>
                            <${RotatedTable.DisplayCell}>
                                <input
                                    className="form-control"
                                    value=${this.state.fields.widgetName}
                                    onInput=${(e) =>
                                        this.setState({
                                            // We use Object.assign because the minifier currently in use
                                            // chokes on some usages of object spread.
                                            fields: Object.assign(
                                                /* NOSONAR */ {},
                                                this.state.fields,
                                                {
                                                    widgetName: e.target.value,
                                                }
                                            ),
                                        })}
                                />
                            </${RotatedTable.DisplayCell}>
                        </${RotatedTable.Row}>

                        <${RotatedTable.Row}>
                            <${RotatedTable.HeaderCell}> Data Object </${RotatedTable.HeaderCell}>
                            <${RotatedTable.DisplayCell}>
                                ${this.renderObjectSelector()}
                            </${RotatedTable.DisplayCell}>
                        </${RotatedTable.Row}>

                        <${RotatedTable.Row}>
                            <${RotatedTable.HeaderCell}> Title </${RotatedTable.HeaderCell}>
                            <${RotatedTable.DisplayCell}>
                                <input
                                    className="form-control"
                                    value=${this.state.fields.title}
                                    onInput=${(e) =>
                                        this.setState({
                                            // We use Object.assign because the minifier currently in use
                                            // chokes on some usages of object spread.
                                            fields: Object.assign(
                                                /* NOSONAR */ {},
                                                this.state.fields,
                                                {
                                                    title: e.target.value,
                                                }
                                            ),
                                        })}
                                />
                            </${RotatedTable.DisplayCell}>
                        </${RotatedTable.Row}>
                        <${RotatedTable.Row}>
                            <${RotatedTable.HeaderCell}> Subtitle </${RotatedTable.HeaderCell}>
                            <${RotatedTable.DisplayCell}>
                                <input
                                    className="form-control"
                                    value=${this.state.fields.subtitle}
                                    onInput=${(e) =>
                                        this.setState({
                                            // We use Object.assign because the minifier currently in use
                                            // chokes on some usages of object spread.
                                            fields: Object.assign(
                                                /* NOSONAR */ {},
                                                this.state.fields,
                                                {
                                                    subtitle: e.target.value,
                                                }
                                            ),
                                        })}
                                />
                            </${RotatedTable.DisplayCell}>
                        </${RotatedTable.Row}>
                    </${RotatedTable.Table}>

                    <div
                        className="btn-toolbar btn-toolbar-centered"
                        style=${{ textAlign: 'center', marginTop: '1rem' }}
                    >
                        <button
                            className="btn btn-primary"
                            onClick=${this.onSubmit.bind(this)}
                            disabled=${!this.formComplete()}
                        >
                            Insert Service Widget Cell
                        </button>
                        <button className="btn btn-danger" onClick=${this.onCancel.bind(this)}>
                            Cancel
                        </button>
                    </div>
                </form>
            `;
        }
    }

    return AddServiceWidgetDataViewer;
});
