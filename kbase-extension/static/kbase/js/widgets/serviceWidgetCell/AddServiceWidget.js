define([
    'jquery',
    'base/js/namespace',
    'api/dataProvider',
    'kb_service/utils',

    // for effect
    'css!./AddServiceWidget.css'
], (
    $,
    Jupyter,
    dataProvider,
    serviceUtils
) => {
    const $el = (name) => {
        return $(document.createElement(name));
    }
    class AddServiceWidget {
        constructor() {
            this.state = {
                moduleName: '',
                widgetName: '',
                param1: {name: '', value: ''},
                param2: {name: '', value: ''},
                param3: {name: '', value: ''},
                isDynamic: true
            }
            // this.$objectSelectorWrapper = $el('div');
        }

        insertWidget() {
            // Create basic metadata with the type set to serviceWidget
            const params = {};
            if (this.state.param1.name) {
                params[this.state.param1.name] = this.state.param1.value;
            }
            if (this.state.param2.name) {
                params[this.state.param2.name] = this.state.param2.value;
            }
            if (this.state.param3.name) {
                params[this.state.param3.name] = this.state.param3.value;
            }
            const cellDefinition = {
                type: 'serviceWidget',
                metadata: {
                    service: {
                        moduleName: this.state.moduleName,
                        widgetName: this.state.widgetName,
                        params,
                        // todo: get this from the form.
                        isDynamicService: true
                    }
                }
            };
            const lastCellIndex = Jupyter.notebook.get_cells().length - 1;
            Jupyter.narrative.insertAndSelectCellBelow('code', lastCellIndex, cellDefinition);
        }

        // async fetchObjects() {
        //     const objects = dataProvider.getData();
        //     return objects
        //         .filter(({object_info}) => {
        //             const [_typeModule, typeName, _majorVersion, _minorVersion] = object_info[2].split(/[.-]/);
        //             return typeName !== 'Narrative';
        //         })
        //         .map(({object_info}) => {
        //             return serviceUtils.objectInfoToObject(object_info);
        //         });
        // }

        // renderObjectSelector($into) {
        //     // Do this as a promise so that we can let it fly...
        //     new Promise(async () => {
        //         try {
        //             const objects = await this.fetchObjects();

        //             const $options = objects.map(({ref, name }) => {
        //                 return $el('option')
        //                     .attr('value', ref)
        //                     .text(name);
        //             });

        //             $options.unshift($el('option')
        //                     .attr('value',  '')
        //                     .text('- select an object -'))

        //             const $select = $el('select')
        //                                 .addClass('form-control')
        //                                 .css('margin', '0')
        //                                 .append($options)
        //                                 .on('change', (ev) => {
        //                                     this.setState('objectRef', ev.currentTarget.value);
        //                                 });

        //             // Then update the control.
        //             $into.html($select);
        //         } catch (ex) {
        //             $into.html($el('div').addClass('alert alert-danger').text(ex.message));
        //         }
        //     });

        //     // Show spinner 
        //     return $into.html($el('div').text('loading...'));
        // }

        setState(name, value) {
            const path = name.split('.');
            let temp = this.state;
            // chase the path until the last element.
            for (const element of path.slice(0, -1)) {
                temp = temp[element];
            }
            // then set the last element.
            temp[path[path.length - 1]] = value;
            this.evaluate();
        }

        getState(name) {
            const path = name.split('.');
            let temp = this.state;
            // chase the path until the last element.
            for (const element of path) {
                temp = temp[element];
            }
            return temp;
        }

        evaluate() {
            // If any fields are empty, disable the "Add to Narrative" button.

            const fieldsOk = ['moduleName', 'widgetName'].every((name) => {
                return this.getState(name).length > 0;
            }) && ['param1', 'param2', 'param3'].every((name) => {
                const paramName = this.getState(`${name}.name`);
                const paramValue = this.getState(`${name}.value`);
                if ( paramName && !paramValue ) {
                    return false;
                }
                return true;
            });

            if (fieldsOk) {
                this.$insertButton.removeAttr('disabled');
            } else {
                this.$insertButton.prop('disabled', true);
            }
        }
        
        $renderBody() {
            const $body = $el('form') 
                .addClass('form')
                .on('submit', (ev) => {
                    ev.preventDefault();
                })
                .append(
                    $el('div')
                        .addClass('rotated-table').addClass('add-service-widget')
                        .append(
                                $el('div').addClass('rotated-table-row').append(
                                    $el('div').addClass('rotated-table-header-cell').text('Module'),
                                    $el('div').addClass('rotated-table-value-cell').append(
                                        $el('input')
                                            .addClass('form-control')
                                            .attr('value', this.state.moduleName)
                                            .on('change', (ev) => {
                                                this.setState('moduleName', ev.currentTarget.value);
                                            })
                                    )
                                ),
                                $el('div').addClass('rotated-table-row').append(
                                    $el('div').addClass('rotated-table-header-cell').text('Widget'),
                                    $el('div').addClass('rotated-table-value-cell').append(
                                        $el('input')
                                            .addClass('form-control')
                                            .attr('value', this.state.widgetName)
                                            .on('change', (ev) => {
                                                this.setState('widgetName', ev.currentTarget.value);
                                            })
                                    )
                                ),
                                $el('div').addClass('rotated-table-row').append(
                                    $el('div').addClass('rotated-table-header-cell').text('param name'),
                                    $el('div').addClass('rotated-table-value-cell').text('param value')
                                ),
                                $el('div').addClass('rotated-table-row').append(
                                    $el('div').addClass('rotated-table-header-cell').append(
                                        $el('input')
                                            .addClass('form-control')
                                            .attr('value', this.state.param1.name)
                                            .on('change', (ev) => {
                                                this.setState('param1.name', ev.currentTarget.value);
                                            })
                                    ),
                                    $el('div').addClass('rotated-table-value-cell').append(
                                        $el('input')
                                            .addClass('form-control')
                                            .attr('value', this.state.param1.value)
                                            .on('change', (ev) => {
                                                this.setState('param1.value', ev.currentTarget.value);
                                            })
                                    )
                                ),
                                $el('div').addClass('rotated-table-row').append(
                                    $el('div').addClass('rotated-table-header-cell').append(
                                        $el('input')
                                            .addClass('form-control')
                                            .attr('value', this.state.param1.name)
                                            .on('change', (ev) => {
                                                this.setState('param2.name', ev.currentTarget.value);
                                            })
                                    ),
                                    $el('div').addClass('rotated-table-value-cell').append(
                                        $el('input')
                                            .addClass('form-control')
                                            .attr('value', this.state.param1.value)
                                            .on('change', (ev) => {
                                                this.setState('param2.value', ev.currentTarget.value);
                                            })
                                    )
                                ),
                                $el('div').addClass('rotated-table-row').append(
                                    $el('div').addClass('rotated-table-header-cell').append(
                                        $el('input')
                                            .addClass('form-control')
                                            .attr('value', this.state.param1.name)
                                            .on('change', (ev) => {
                                                this.setState('param3.name', ev.currentTarget.value);
                                            })
                                    ),
                                    $el('div').addClass('rotated-table-value-cell').append(
                                        $el('input')
                                            .addClass('form-control')
                                            .attr('value', this.state.param1.value)
                                            .on('change', (ev) => {
                                                this.setState('param3.value', ev.currentTarget.value);
                                            })
                                    )
                                )
                        )
                )
            this.evaluate();
            return $body;
        }

        $renderButtons() {
            this.$insertButton = $el('button')
                .addClass('btn btn-primary')
                .text('Add to Narrative')

            this.$insertButton.onClick = (dialog) => {
                this.insertWidget();
                dialog.hide();
            }

            const $cancelButton =  $el('button')
                .addClass('btn btn-danger')
                .text('Cancel')
                // The following is detected by bootstrap and 
                // will cause the model to be hidden/closed.
                .attr('data-dismiss', 'modal');
            return [this.$insertButton, $cancelButton]
        }
    }

    return AddServiceWidget;
})
