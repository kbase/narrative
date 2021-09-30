define([
    'React',
    'kb_common/jsonRpc/genericClient',
    'kb_common/jsonRpc/dynamicServiceClient',
    'kb_service/utils',
    '../../ShowError'
], (
    React,
    ServiceClient,
    DynamicServiceClient,
    ServiceUtils,
    ShowError
) => {
    'use strict';

    const { createElement: e, Component } = React;

    class Loader extends Component {
        constructor(props) {
            super(props);
            if (!props.method) {
                console.error('method not supplied to Loader');
                this.state = {
                    state: 'error',
                    error: new Error('Prop "method" required for Loader Component')
                };
                return;
            }

            if (!props.module) {
                console.error('module not supplied to Loader Component');
                this.state = {
                    state: 'error',
                    error: new Error('Prop "method" required for Loader Component')
                };
                return;
            }
            this.method = props.method;
            this.module = props.module;
            this.state = {
                state: null, // 'loading', 'error', 'loaded'
                data: {
                    items: {
                        value: null,
                        error: null
                    },
                    currentItem: {
                        objectRef: null,
                        value: null,
                        error: null,
                        loading: false
                    }
                },
                error: null
            };
            this.currentItemRef = null;
        }

        componentDidMount() {
            this.setState({
                state: 'loading'
            });
            this.fetchSet()
                .then((items) => {
                    if (items.length > 0) {
                        this.currentItemRef = items[0].ref;
                    }
                    this.setState({
                        state: 'loaded',
                        data: {
                            ...this.state.data,
                            items: {
                                value: items,
                                error: null
                            }
                        }
                    });
                    this.getCurrentItem();
                })
                .catch((error) => {
                    console.error('Error fetching the set', error);
                    this.setState({
                        state: 'error',
                        error
                    });
                });
        }

        fetchSet() {
            const setApi = new DynamicServiceClient({
                url: this.props.serviceWizardURL,
                module: 'SetAPI',
                token: this.props.token,
            });
            return setApi.callFunc(this.method, [{
                ref: this.props.objectRef,
                include_item_info: 1
            }])
                .then(([result]) => {
                    const { data: { description, items } } = result;
                    items.forEach((item) => {
                        item.objectInfo = ServiceUtils.objectInfoToObject(item.info);
                    });
                    return items;
                });
        }

        getCurrentItem() {
            if (!this.currentItemRef) {
                return;
            }
            this.setState({
                data: {
                    ...this.state.data,
                    currentItem: {
                        ...this.state.data.currentItem,
                        loading: true
                    }
                }
            });
            this.fetchSetElement(this.currentItemRef)
                .then((item) => {
                    this.setState({
                        data: {
                            ...this.state.data,
                            currentItem: {
                                value: item,
                                loading: false,
                                error: false
                            }
                        }
                    });
                })
                .catch((error) => {
                    this.setState({
                        data: {
                            ...this.state.data,
                            currentItem: {
                                value: null,
                                loading: false,
                                error
                            }
                        }
                    });
                });
        }

        fetchSetElement(ref) {
            const workspace = new ServiceClient({
                url: this.props.workspaceURL,
                module: 'Workspace',
                token: this.props.token
            });
            return workspace.callFunc('get_objects2', [{
                objects: [{
                    ref
                }]
            }])
                .then(([result]) => {
                    const item = result.data[0];
                    item.objectInfo = ServiceUtils.objectInfoToObject(item.info);
                    return item;
                });
        }

        selectItem(itemRef) {
            this.currentItemRef = itemRef;
            this.getCurrentItem();
        }

        renderError() {
            return e(ShowError, {
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
            switch (this.state.state) {
                case null:
                case 'loading':
                    return this.renderLoading();
                case 'error':
                    return this.renderError();
                case 'loaded':
                    return e(this.module, {
                        items: this.state.data.items,
                        currentItem: this.state.data.currentItem,
                        selectItem: (itemRef) => {
                            this.selectItem(itemRef);
                        }
                    });
            }
        }
    }

    return Loader;
});
