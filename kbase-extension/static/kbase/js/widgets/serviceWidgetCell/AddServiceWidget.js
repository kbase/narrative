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

    const { h, Component } = preact;
    const html = htm.bind(h);
    class AddServiceWidget extends Component {
        constructor(props) {
            super(props);
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
            const { moduleName, widgetName, param1, param2, param3 } = this.state.fields;

            if (!moduleName) {
                return false;
            }

            if (!widgetName) {
                return false;
            }

            if (param1.name && !param1.value) {
                return false;
            }

            if (param2.name && !param2.value) {
                return false;
            }

            if (param3.name && !param3.value) {
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
                                    value=${this.state.moduleName}
                                    onInput=${(e) =>
                                        this.setState({
                                            fields: {
                                                ...this.state.fields,
                                                moduleName: e.target.value,
                                            },
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
                                            fields: {
                                                ...this.state.fields,
                                                widgetName: e.target.value,
                                            },
                                        })}
                                />
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
                                            fields: {
                                                ...this.state.fields,
                                                title: e.target.value,
                                            },
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
                                            fields: {
                                                ...this.state.fields,
                                                subtitle: e.target.value,
                                            },
                                        })}
                                />
                            </${RotatedTable.DisplayCell}>
                        </${RotatedTable.Row}>
                        <${RotatedTable.Row}>
                            <${RotatedTable.HeaderCell}> Icon Name </${RotatedTable.HeaderCell}>
                            <${RotatedTable.DisplayCell}>
                                <input
                                    className="form-control"
                                    value=${this.state.fields.iconName}
                                    onInput=${(e) =>
                                        this.setState({
                                            fields: {
                                                ...this.state.fields,
                                                iconName: e.target.value,
                                            },
                                        })}
                                />
                            </${RotatedTable.DisplayCell}>
                        </${RotatedTable.Row}>
                        <${RotatedTable.Row}>
                            <${RotatedTable.HeaderCell}> Icon Color </${RotatedTable.HeaderCell}>
                            <${RotatedTable.DisplayCell}>
                                <input
                                    className="form-control"
                                    value=${this.state.fields.iconColor}
                                    onInput=${(e) =>
                                        this.setState({
                                            fields: {
                                                ...this.state.fields,
                                                iconColor: e.target.value,
                                            },
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
                                    value=${this.state.fields.param1.name}
                                    onInput=${(e) =>
                                        this.setState({
                                            fields: {
                                                ...this.state.fields,
                                                param1: {
                                                    ...this.state.fields.param1,
                                                    name: e.target.value,
                                                },
                                            },
                                        })}
                                />
                            </${RotatedTable.HeaderCell}>
                            <${RotatedTable.DisplayCell}>
                                <input
                                    className="form-control"
                                    value=${this.state.fields.param1.name}
                                    onInput=${(e) =>
                                        this.setState({
                                            fields: {
                                                ...this.state.fields,
                                                param1: {
                                                    ...this.state.fields.param1,
                                                    value: e.target.value,
                                                },
                                            },
                                        })}
                                />
                            </${RotatedTable.DisplayCell}>
                        </${RotatedTable.Row}>
                        <${RotatedTable.Row}>
                            <${RotatedTable.HeaderCell}>
                                <input
                                    className="form-control"
                                    value=${this.state.fields.param2.name}
                                    onInput=${(e) =>
                                        this.setState({
                                            fields: {
                                                param2: {
                                                    ...this.state.fields.param2,
                                                    name: e.target.value,
                                                },
                                            },
                                        })}
                                />
                            </${RotatedTable.HeaderCell}>
                            <${RotatedTable.DisplayCell}>
                                <input
                                    className="form-control"
                                    value=${this.state.fields.param2.name}
                                    onInput=${(e) =>
                                        this.setState({
                                            fields: {
                                                ...this.state.fields,
                                                param2: {
                                                    ...this.state.fields.param2,
                                                    value: e.target.value,
                                                },
                                            },
                                        })}
                                />
                            </${RotatedTable.DisplayCell}>
                        </${RotatedTable.Row}>
                        <${RotatedTable.Row}>
                            <${RotatedTable.HeaderCell}>
                                <input
                                    className="form-control"
                                    value=${this.state.fields.param2.name}
                                    onInput=${(e) =>
                                        this.setState({
                                            fields: {
                                                param2: {
                                                    ...this.state.fields.param2,
                                                    name: e.target.value,
                                                },
                                            },
                                        })}
                                />
                            </${RotatedTable.HeaderCell}>
                            <${RotatedTable.DisplayCell}>
                                <input
                                    className="form-control"
                                    value=${this.state.fields.param3.name}
                                    onInput=${(e) =>
                                        this.setState({
                                            fields: {
                                                ...this.state.fields,
                                                param3: {
                                                    ...this.state.fields.param3,
                                                    value: e.target.value,
                                                },
                                            },
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
