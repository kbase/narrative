/* eslint-disable indent */
define([
    'preact',
    'htm',
    'base/js/namespace',
    'preactComponents/RotatedTable',

    // for effect
    'css!./AddServiceWidget.css',
], (preact, htm, Jupyter, RotatedTable) => {
    'use strict';

    const { h, Component, createRef } = preact;
    const html = htm.bind(h);
    class AddServiceWidget extends Component {
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
                    iconName: 'flask',
                    iconColor: 'red',
                    param1: { name: '', value: '' },
                    param2: { name: '', value: '' },
                    param3: { name: '', value: '' },
                    isDynamic: true,
                },
            };
        }

        componentDidMount() {
            this.defaultInputRef.current.focus();
        }

        insertWidget() {
            // Create basic metadata with the type set to serviceWidget
            const params = {};
            const {
                moduleName,
                widgetName,
                title,
                subtitle,
                iconName,
                iconColor,
                param1,
                param2,
                param3,
            } = this.state.fields;
            if (param1.name) {
                params[param1.name] = param1.value;
            }
            if (param2.name) {
                params[param2.name] = param2.value;
            }
            if (param3.name) {
                params[param3.name] = param3.value;
            }
            const cellDefinition = {
                type: 'serviceWidget',
                attributes: {
                    title,
                    subtitle,
                    icon: {
                        type: 'generic',
                        params: {
                            name: iconName,
                            color: iconColor,
                        },
                    },
                },
                params: {
                    service: {
                        moduleName,
                        widgetName,
                        params,
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
            const { moduleName, widgetName, param1, param2, param3 } = this.state.fields;

            if (!moduleName) {
                return false;
            }

            if (!widgetName) {
                return false;
            }

            // We only consider a parameter if it has a name or value.

            if ((param1.name || param1.value) && (!param1.name || !param1.value)) {
                return false;
            }

            if ((param2.name || param2.value) && (!param2.name || !param2.value)) {
                return false;
            }

            if ((param3.name || param3.value) && (!param3.name || !param3.value)) {
                return false;
            }

            return true;
        }

        render() {
            return html`
                <form className="form AddServiceWidget" onSubmit=${(e) => e.preventDefault()}>
                    <${RotatedTable.Table}>
                        <${RotatedTable.Row}>
                            <${RotatedTable.HeaderCell}> Module </${RotatedTable.HeaderCell}>
                            <${RotatedTable.DisplayCell}>
                                <input
                                    className="form-control"
                                    name="moduleName"
                                    autoFocus
                                    ref=${this.defaultInputRef}
                                    value=${this.state.moduleName}
                                    onInput=${(e) =>
                                        this.setState({
                                            fields: Object.assign({}, this.state.fields, {
                                                moduleName: e.target.value,
                                            }),
                                        })}
                                />
                            </${RotatedTable.DisplayCell}>
                        </${RotatedTable.Row}>

                        <${RotatedTable.Row}>
                            <${RotatedTable.HeaderCell}> Widget </${RotatedTable.HeaderCell}>
                            <${RotatedTable.DisplayCell}>
                                <input
                                    className="form-control"
                                    name="widgetName"
                                    value=${this.state.fields.widgetName}
                                    onInput=${(e) =>
                                        this.setState({
                                            fields: Object.assign({}, this.state.fields, {
                                                widgetName: e.target.value,
                                            }),
                                        })}
                                />
                            </${RotatedTable.DisplayCell}>
                        </${RotatedTable.Row}>
                        <${RotatedTable.Row}>
                            <${RotatedTable.HeaderCell}> Title </${RotatedTable.HeaderCell}>
                            <${RotatedTable.DisplayCell}>
                                <input
                                    className="form-control"
                                    name="title"
                                    value=${this.state.fields.title}
                                    onInput=${(e) =>
                                        this.setState({
                                            fields: Object.assign({}, this.state.fields, {
                                                title: e.target.value,
                                            }),
                                        })}
                                />
                            </${RotatedTable.DisplayCell}>
                        </${RotatedTable.Row}>
                        <${RotatedTable.Row}>
                            <${RotatedTable.HeaderCell}> Subtitle </${RotatedTable.HeaderCell}>
                            <${RotatedTable.DisplayCell}>
                                <input
                                    className="form-control"
                                    name="subtitle"
                                    value=${this.state.fields.subtitle}
                                    onInput=${(e) =>
                                        this.setState({
                                            fields: Object.assign({}, this.state.fields, {
                                                subtitle: e.target.value,
                                            }),
                                        })}
                                />
                            </${RotatedTable.DisplayCell}>
                        </${RotatedTable.Row}>
                        <${RotatedTable.Row}>
                            <${RotatedTable.HeaderCell}> Icon Name </${RotatedTable.HeaderCell}>
                            <${RotatedTable.DisplayCell}>
                                <input
                                    className="form-control"
                                    name="iconName"
                                    value=${this.state.fields.iconName}
                                    onInput=${(e) =>
                                        this.setState({
                                            fields: Object.assign({}, this.state.fields, {
                                                iconName: e.target.value,
                                            }),
                                        })}
                                />
                            </${RotatedTable.DisplayCell}>
                        </${RotatedTable.Row}>
                        <${RotatedTable.Row}>
                            <${RotatedTable.HeaderCell}> Icon Color </${RotatedTable.HeaderCell}>
                            <${RotatedTable.DisplayCell}>
                                <input
                                    className="form-control"
                                    name="iconColor"
                                    value=${this.state.fields.iconColor}
                                    onInput=${(e) =>
                                        this.setState({
                                            fields: Object.assign({}, this.state.fields, {
                                                iconColor: e.target.value,
                                            }),
                                        })}
                                />
                            </${RotatedTable.DisplayCell}>
                        </${RotatedTable.Row}>
                        <${RotatedTable.Row}>
                            <${RotatedTable.HeaderCell}> param name </${RotatedTable.HeaderCell}>
                            <${RotatedTable.DisplayCell}> param value </${RotatedTable.DisplayCell}>
                        </${RotatedTable.Row}>
                        <${RotatedTable.Row}>
                            <${RotatedTable.HeaderCell}>
                                <input
                                    className="form-control"
                                    name="param1_name"
                                    value=${this.state.fields.param1.name}
                                    onInput=${(e) =>
                                        this.setState({
                                            fields: Object.assign({}, this.state.fields, {
                                                param1: Object.assign(
                                                    {},
                                                    this.state.fields.param1,
                                                    {
                                                        name: e.target.value,
                                                    }
                                                ),
                                            }),
                                        })}
                                />
                            </${RotatedTable.HeaderCell}>
                            <${RotatedTable.DisplayCell}>
                                <input
                                    className="form-control"
                                    name="param1_value"
                                    value=${this.state.fields.param1.value}
                                    onInput=${(e) =>
                                        this.setState({
                                            fields: Object.assign({}, this.state.fields, {
                                                param1: Object.assign(
                                                    {},
                                                    this.state.fields.param1,
                                                    {
                                                        value: e.target.value,
                                                    }
                                                ),
                                            }),
                                        })}
                                />
                            </${RotatedTable.DisplayCell}>
                        </${RotatedTable.Row}>
                        <${RotatedTable.Row}>
                            <${RotatedTable.HeaderCell}>
                                <input
                                    className="form-control"
                                    name="param2_name"
                                    value=${this.state.fields.param2.name}
                                    onInput=${(e) =>
                                        this.setState({
                                            fields: Object.assign({}, this.state.fields, {
                                                param2: Object.assign(
                                                    {},
                                                    this.state.fields.param2,
                                                    {
                                                        name: e.target.value,
                                                    }
                                                ),
                                            }),
                                        })}
                                />
                            </${RotatedTable.HeaderCell}>
                            <${RotatedTable.DisplayCell}>
                                <input
                                    className="form-control"
                                    name="param_value"
                                    value=${this.state.fields.param2.value}
                                    onInput=${(e) =>
                                        this.setState({
                                            fields: Object.assign({}, this.state.fields, {
                                                param2: Object.assign(
                                                    {},
                                                    this.state.fields.param2,
                                                    {
                                                        value: e.target.value,
                                                    }
                                                ),
                                            }),
                                        })}
                                />
                            </${RotatedTable.DisplayCell}>
                        </${RotatedTable.Row}>
                        <${RotatedTable.Row}>
                            <${RotatedTable.HeaderCell}>
                                <input
                                    className="form-control"
                                    name="param3_name"
                                    value=${this.state.fields.param3.name}
                                    onInput=${(e) =>
                                        this.setState({
                                            fields: Object.assign({}, this.state.fields, {
                                                param3: Object.assign(
                                                    {},
                                                    this.state.fields.param3,
                                                    {
                                                        name: e.target.value,
                                                    }
                                                ),
                                            }),
                                        })}
                                />
                            </${RotatedTable.HeaderCell}>
                            <${RotatedTable.DisplayCell}>
                                <input
                                    className="form-control"
                                    name="param3_value"
                                    value=${this.state.fields.param3.value}
                                    onInput=${(e) =>
                                        this.setState({
                                            fields: Object.assign({}, this.state.fields, {
                                                param3: Object.assign(
                                                    {},
                                                    this.state.fields.param3,
                                                    {
                                                        value: e.target.value,
                                                    }
                                                ),
                                            }),
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

    return AddServiceWidget;
});
