define([
    'react',
    'kb_common/jsonRpc/genericClient',
    'kb_common/jsonRpc/dynamicServiceClient',
    'kb_service/utils',
    'react_components/ErrorMessage'
], (
    React,
    ServiceClient,
    DynamicServiceClient,
    ServiceUtils,
    ErrorMessage
) => {
    'use strict';

    const { createElement: e, Component } = React;

    /**
     * A class implementing a component which essentially forms the data backbone for
     * the set component
     */
    class Loader extends Component {
        constructor(props) {
            super(props);
            if (!props.method) {
                console.error('method not supplied to Loader');
                this.state = {
                    status: 'error',
                    error: new Error('Prop "method" required for Loader Component')
                };
                return;
            }

            if (!props.module) {
                console.error('module not supplied to Loader Component');
                this.state = {
                    status: 'error',
                    error: new Error('Prop "method" required for Loader Component')
                };
                return;
            }
            this.method = props.method;
            this.module = props.module;
            this.state = {
                status: 'ok',
                set: {
                    status: null
                }
            };
            this.selectedItemRef = null;
        }

        async componentDidMount() {
            // We wait on this so we are sure that the set is fetched before attempting
            // to set the default selected item.
            await this.getSet();

            // Note that we don't catch the error for fetching an item here,
            // we let it be a runaway promise. Error catching for fetching an item
            // is handled separately.
            this.getSelectedItem();
        }

        async getSet() {
            this.setState((state) => {
                return {
                    ...state,
                    set: {
                        status: 'loading'
                    }
                };
            });
            try {
                const { description, items } = await this.fetchSet();

                // Sets the first item as selected if there are any.
                if (items.length > 0) {
                    this.selectedItemRef = items[0].ref;
                    const selectedItem = await this.fetchSetElement(items[0].ref);
                    // DATAGEN: place in test/widgets/function_output/KBaseSets/data/type_#.json
                    // where type is the KBaseSets type, # is just a serial number to enable
                    // more than one test data per type.
                    // console.log('SEL', JSON.stringify({
                    //     status: 'loaded',
                    //     value: {
                    //         description,
                    //         type: selectedItem.objectInfo.type,
                    //         items,
                    //     },
                    //     selectedItem: {
                    //         status: 'loaded',
                    //         value: selectedItem
                    //     }

                    // }));
                    this.setState((state) => {
                        return {
                            ...state,
                            set: {
                                status: 'loaded',
                                value: {
                                    description,
                                    type: selectedItem.objectInfo.type,
                                    items,
                                },
                                selectedItem: {
                                    status: 'loaded',
                                    value: selectedItem
                                }

                            }
                        };
                    });
                } else {
                    this.setState((state) => {
                        return {
                            ...state,
                            set: {
                                status: 'loaded',
                                value: {
                                    description,
                                    type: null,
                                    items,
                                },
                                selectedItem: {
                                    status: null
                                }

                            }
                        };
                    });
                }

            } catch (error) {
                console.error('Error fetching the set', error);
                this.setState((state) => {
                    return {
                        ...state,
                        set: {
                            status: 'error',
                            error
                        }
                    };
                });
                return;
            }
        }

        async fetchSet() {
            const setApi = new DynamicServiceClient({
                url: this.props.serviceWizardURL,
                module: 'SetAPI',
                token: this.props.token,
            });
            const [{ data: { description, items } }] = await setApi.callFunc(this.method, [{
                ref: this.props.objectRef,
                include_item_info: 1
            }]);

            // Augment the items with objectinfo in the object form (native form is an array).
            items.forEach((item) => {
                item.objectInfo = ServiceUtils.objectInfoToObject(item.info);
            });
            return { description, items };
        }

        async getSelectedItem() {
            if (!this.selectedItemRef) {
                return;
            }
            this.setState((state) => {
                return {
                    ...state,
                    set: {
                        ...this.state.set,
                        selectedItem: {
                            // note that we keep the selected item even if we are
                            // (re)loading.
                            ...this.state.set.selectedItem,
                            status: 'loading'
                        }
                    }
                };
            });
            try {
                const item = await this.fetchSetElement(this.selectedItemRef);
                this.setState((state) => {
                    return {
                        ...state,
                        set: {
                            ...this.state.set,
                            selectedItem: {
                                status: 'loaded',
                                value: item
                            }
                        }
                    };
                });
            } catch (error) {
                this.setState((state) => {
                    return {
                        ...state,
                        set: {
                            ...this.state.set,
                            selectedItem: {
                                status: 'error',
                                error
                            }
                        }
                    };
                });
            }
        }

        async fetchSetElement(ref) {
            const workspace = new ServiceClient({
                url: this.props.workspaceURL,
                module: 'Workspace',
                token: this.props.token
            });
            const [result] = await workspace.callFunc('get_objects2', [{
                objects: [{
                    ref
                }]
            }]);

            const object = result.data[0];
            const item = object.data;
            item.objectInfo = ServiceUtils.objectInfoToObject(object.info);
            return item;
        }

        selectItem(itemRef) {
            this.selectedItemRef = itemRef;
            this.getSelectedItem();
        }

        renderError() {
            return e(ErrorMessage, {
                error: this.state.error
            });
        }

        renderLoading() {
            return e('div', {
            }, e('i', {
                className: `fa fa-spinner fa-3x fa-pulse fa-fw`
            }));
        }

        render() {
            switch (this.state.status) {
                case null:
                case 'loading':
                    return this.renderLoading();
                case 'error':
                    return this.renderError(this.state.error);
                case 'ok':
                    return e(this.module, {
                        set: this.state.set,
                        selectItem: (itemRef) => {
                            this.selectItem(itemRef);
                        }
                    });
                default:
                    this.renderError(new Error(`Unsupported status ${this.state.status}`));
            }
        }
    }

    return Loader;
});
