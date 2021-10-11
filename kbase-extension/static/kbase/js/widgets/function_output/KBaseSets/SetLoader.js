define([
    'react',
    'prop-types',
    'kb_common/jsonRpc/genericClient',
    'kb_common/jsonRpc/dynamicServiceClient',
    'kb_service/utils',
    'react_components/ErrorMessage',
    'widgets/function_output/KBaseSets/SetViewer',

], (
    React,
    PropTypes,
    ServiceClient,
    DynamicServiceClient,
    ServiceUtils,
    ErrorMessage,
    Viewer,
) => {
    'use strict';

    const { createElement: e, Component } = React;

    const SET_TYPE_TO_MODULE_MAPPING = {
        'KBaseSets.ReadsAlignmentSet': {
            method: 'get_reads_alignment_set_v1'
        },
        'KBaseSets.AssemblySet': {
            method: 'get_assembly_set_v1'
        }
    };

    /**
     * A class implementing a component which essentially forms the data backbone for
     * the set component
     */
    class SetLoader extends Component {
        constructor(props) {
            super(props);
            this.state = {
                status: null,
            };
            this.selectedItemRef = null;
        }

        componentDidMount() {
            // We wait on this so we are sure that the set is fetched before attempting
            // to set the default selected item.
            this.getSet();
        }

        async getSet() {
            this.setState({
                status: 'loading'
            });
            try {
                const { description, setType, elementType, items } = await this.fetchSet();

                this.setState({
                    status: 'loaded',
                    value: {
                        description,
                        setType,
                        elementType,
                        items,
                    },
                });
            } catch (error) {
                console.error('Error fetching set', error);
                this.setState({
                    status: 'error',
                    error
                });
                return;
            }
        }

        async fetchSet() {
            // Get the object info, to determine the exact type.
            const workspace = new ServiceClient({
                url: this.props.workspaceURL,
                module: 'Workspace',
                token: this.props.token
            });

            const [infos] = await workspace.callFunc('get_object_info_new', [{
                objects: [{
                    ref: this.props.objectRef
                }]
            }]);

            // Get a nicer object info (an object rather than array)
            const objectInfo = ServiceUtils.objectInfoToObject(infos[0]);

            // Make a versionless object type id for lookup in the set of supported
            // set types defined above.
            const setType = [objectInfo.typeModule, objectInfo.typeName].join('.');

            const mapping = SET_TYPE_TO_MODULE_MAPPING[setType];
            if (!mapping) {
                throw new Error(`Unsupported set type: ${setType}`);
            }

            // Then get the set via the set api.

            const setApi = new DynamicServiceClient({
                url: this.props.serviceWizardURL,
                module: 'SetAPI',
                token: this.props.token,
            });
            const [{ data: { description, items } }] = await setApi.callFunc(mapping.method, [{
                ref: this.props.objectRef,
                include_item_info: 1
            }]);

            if (items.length === 0) {
                throw new Error('Sets with no elements not currently supported');
            }

            // Augment the items with objectinfo in the object form (native form is an array).
            items.forEach((item) => {
                item.objectInfo = ServiceUtils.objectInfoToObject(item.info);
            });

            return { description, setType, elementType: items[0].objectInfo.type, items };
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

        renderLoaded() {
            return e(Viewer, {
                ...this.state.value
            });
        }

        render() {
            switch (this.state.status) {
                case null:
                case 'loading':
                    return this.renderLoading();
                case 'error':
                    return this.renderError(this.state.error);
                case 'loaded':
                    return this.renderLoaded();
                default:
                    this.renderError(new Error(`Unsupported status ${this.state.status}`));
            }
        }
    }

    SetLoader.propTypes = {
        workspaceURL: PropTypes.string,
        serviceWizardURL: PropTypes.string,
        token: PropTypes.string,
        objectRef: PropTypes.string,
    };

    return SetLoader;
});
