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
    class AddServiceWidgetData {
        constructor() {
            this.state = {
                moduleName: '',
                widgetName: '',
                objectRef: '',
                isDynamic: true
            }
            this.$objectSelectorWrapper = $el('div');
            this.$widgetSelectorWrapper = $el('div');
        }

        insertWidget() {
            // Create basic metadata with the type set to serviceWidget
            const cellDefinition = {
                type: 'serviceWidget',
                metadata: {
                    service: {
                        moduleName: this.state.moduleName,
                        widgetName: this.state.widgetName,
                        params: {
                            ref: this.state.objectRef
                        },
                        // todo: get this from the form.
                        isDynamicService: true
                    }
                }
            };
            const lastCellIndex = Jupyter.notebook.get_cells().length - 1;
            Jupyter.narrative.insertAndSelectCellBelow('code', lastCellIndex, cellDefinition);
        }

        async fetchObjects() {
            const objects = dataProvider.getData();
            return objects
                .filter(({object_info}) => {
                    const [_typeModule, typeName, _majorVersion, _minorVersion] = object_info[2].split(/[.-]/);
                    return typeName !== 'Narrative';
                })
                .map(({object_info}) => {
                    return serviceUtils.objectInfoToObject(object_info);
                });
        }

        renderObjectSelector($into) {
            // Do this as a promise so that we can let it fly...
            new Promise(async () => {
                try {
                    const objects = await this.fetchObjects();

                    const $options = objects.map(({ref, name, typeName }) => {
                        return $el('option')
                            .attr('value', ref)
                            .text(`${name} (${typeName})`);
                    });

                    $options.unshift($el('option')
                            .attr('value',  '')
                            .text('- select an object -'))

                    const $select = $el('select')
                                        .addClass('form-control')
                                        .css('margin', '0')
                                        .append($options)
                                        .on('change', (ev) => {
                                            this.setState('objectRef', ev.currentTarget.value);
                                        });

                    // Then update the control.
                    $into.html($select);
                } catch (ex) {
                    $into.html($el('div').addClass('alert alert-danger').text(ex.message));
                }
            });

            // Show spinner 
            return $into.html($el('div').text('loading...'));
        }

        // TODO: revive when we have a widget info api endpoint.
        // renderWidgetSelector($into) {
        //     const widgets = [
        //         ['media_viewer', 'Media Viewer'],
        //         ['protein_structures_viewer', 'Protein Structures Viewer'],
        //         ['', '- select a viewer -']
        //     ];

        //     const $options = widgets.map(([value, label]) => {
        //                 return $el('option')
        //                     .attr('value', value)
        //                     .text(label);
        //             });

        //     const $select = $el('select')
        //         .addClass('form-control')
        //         .css('margin', '0')
        //         .append($options)
        //         .on('change', (ev) => {
        //             this.setState('widgetName', ev.currentTarget.value);
        //         });

        //     // Then update the control.
        //     $into.html($select);
        // }

        setState(name, value) {
            this.state[name] = value;
            this.evaluate();
        }

        evaluate() {
            // If any fields are empty, disable the "Add to Narrative" button.
            if (['moduleName', 'widgetName', 'objectRef'].some((name) => {
                return this.state[name].length === 0;
            })) {
                this.$insertButton.prop('disabled', true);
            } else {
                this.$insertButton.removeAttr('disabled');
            }
        }

        $renderInputField(title, stateKey) {
            return $el('div').addClass('rotated-table-row').append(
                $el('div').addClass('rotated-table-header-cell').text(title),
                $el('div').addClass('rotated-table-value-cell').append(
                    $el('input')
                        .addClass('form-control')
                        .attr('value', this.state[stateKey])
                        .on('change', (ev) => {
                            this.setState(stateKey, ev.currentTarget.value);
                        })
                )
            );
        }

        $renderModuleField() {
            return this.$renderInputField('Module', 'moduleName');
        }

        $renderWidgetField() {
            return this.$renderInputField('Widget', 'widgetName');
        }
        
        $renderBody() {
            this.renderObjectSelector(this.$objectSelectorWrapper);
            // this.renderWidgetSelector(this.$widgetSelectorWrapper);
            const $body = $el('form') 
                .addClass('form')
                .on('submit', (ev) => {
                    ev.preventDefault();
                })
                .append(
                    $el('div')
                        .addClass('rotated-table').addClass('add-service-widget')
                        .append(
                                // $el('div').addClass('rotated-table-row').append(
                                //     $el('div').addClass('rotated-table-header-cell').text('Module'),
                                //     $el('div').addClass('rotated-table-value-cell').append(
                                //         $el('input')
                                //             .addClass('form-control')
                                //             .attr('value', this.state.moduleName)
                                //             .on('change', (ev) => {
                                //                 this.setState('moduleName', ev.currentTarget.value);
                                //             })
                                //     )
                                // ),
                                // $el('div').addClass('rotated-table-row').append(
                                //     $el('div').addClass('rotated-table-header-cell').text('Widget'),
                                //     $el('div').addClass('rotated-table-value-cell').append(
                                //         this.$widgetSelectorWrapper
                                //     )
                                // ),
                                this.$renderModuleField(),
                                this.$renderWidgetField(),
                                $el('div').addClass('rotated-table-row').append(
                                    $el('div').addClass('rotated-table-header-cell').text('Object'),
                                    $el('div').addClass('rotated-table-value-cell').append(
                                        this.$objectSelectorWrapper
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

    return AddServiceWidgetData;
})
