/*
kbaseGenericSetViewer

A widget which can display a data object visualization for several types of objects
in the "KBaseSets" type module.

The primary task of this viewer is to look up the object type it is provided, and, based
on the type of the object, either dispatch to the set viewer if it is supported, or
display a warning that the type is not supported if it isn't.

Support is indicated in the module-level `SET_TYPE_TO_MODULE_MAPPING`.

At present just ReadsAlignmentSet and AssemblySet are supported; others should display
an error message, or are handled by other viewers.

Note that this widget is a wrapper dispatching to the specific viewer, most of the
implementation is in the React components referred two in the AMD dependencies. The only
UI supported herein is the loading indicator and an error message, if necessary.
*/
define([
    'react',
    'prop-types',
    'kb_common/jsonRpc/genericClient',
    'kb_service/utils',
    'widgets/function_output/KBaseSets/SetElements/ReadsAlignmentSetViewer',
    'widgets/function_output/KBaseSets/SetElements/AssemblySetViewer',
    'react_components/ErrorMessage',
    'narrativeConfig',
    'base/js/namespace',

    // For effect
    'bootstrap',
    'css!./SetElementLoader.css'
], (
    React,
    PropTypes,
    ServiceClient,
    ServiceUtils,
    ReadsAlignmentSetViewer,
    AssemblySetViewer,
    ErrorMessage,
    Config,
    Jupyter
) => {
    'use strict';

    const { createElement: e, Component } = React;

    // Note that any modules referenced must be imported above, and that such modules
    // must be components implemented as defined in `react_components/genericSets`.
    const SET_TYPE_TO_MODULE_MAPPING = {
        'KBaseSets.ReadsAlignmentSet': {
            module: ReadsAlignmentSetViewer,
            method: 'get_reads_alignment_set_v1'
        },
        'KBaseSets.AssemblySet': {
            module: AssemblySetViewer,
            method: 'get_assembly_set_v1'
        }
    };

    /*
    Implements a React component which primarily dispatches to the component which
    matches the type of object provided in the prop 'objectRef'.
    */
    class SetElementLoader extends Component {
        constructor(props) {
            super(props);
            this.state = {
                status: null,
            };
        }

        componentDidMount() {
            this.getSetElement();
        }

        componentDidUpdate(prevProps) {
            if (prevProps.item.ref === this.props.item.ref) {
                return;
            }
            this.getSetElement();
        }

        async getSetElement() {
            this.setState({
                status: 'loading'
            });

            try {
                const { object, objectInfo } = await this.fetchSetElement(this.props.item.ref);
                const mapping = SET_TYPE_TO_MODULE_MAPPING[this.props.setType];
                if (!mapping) {
                    this.setState({
                        status: 'error',
                        error: new Error(`Unsupported set type: ${this.state.setType}`)
                    });
                    return;
                }

                this.setState({
                    status: 'loaded',
                    module: mapping.module,
                    object, objectInfo
                });
            } catch (error) {
                console.error('Error getting object info', error);
                this.setState({
                    status: 'error',
                    error
                });
            }
        }

        async fetchSetElement(ref) {
            const workspace = new ServiceClient({
                url: Config.url('workspace'),
                module: 'Workspace',
                token: Jupyter.narrative.getAuthToken()
            });
            const [result] = await workspace.callFunc('get_objects2', [{
                objects: [{
                    ref
                }]
            }]);

            const object = result.data[0];
            return {
                object,
                objectInfo: ServiceUtils.objectInfoToObject(object.info)
            };
        }

        renderLoading(size) {
            const sizeClass = (() => {
                if (size) {
                    return `fa-${size}x`;
                }
                return '';
            })();
            return e('div', {
                className: 'LoadingOverlay'
            }, e('div', {
                style: {
                    backgroundColor: 'rgba(200, 200, 200, 0.2)',
                    border: '1px solid rgba(200, 200, 200, 1)',
                    borderRadius: '8px',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                }
            }, "Loading...", e('i', {
                className: `fa fa-spinner fa-pulse fa-fw ${sizeClass}`
            })));
        }

        renderError() {
            return e(ErrorMessage, {
                error: this.state.error
            });
        }

        renderLoaded() {
            // console.log('ELEMENT', JSON.stringify({
            //     object: this.state.object.data,
            //     objectInfo: this.state.objectInfo
            // }, null, 4));
            return e(this.state.module, {
                object: this.state.object.data,
                objectInfo: this.state.objectInfo
            });
        }

        renderState() {
            switch (this.state.status) {
                case null:
                    return this.renderLoading();
                case 'loading':
                    if (this.state.object) {
                        return e(React.Fragment, null, this.renderLoaded(), this.renderLoading(2));
                    } else {
                        return this.renderLoading();
                    }
                case 'error':
                    return this.renderError();
                case 'loaded':
                    return this.renderLoaded();
            }
        }

        render() {
            return e('div', {
                className: 'KBaseSets-SetElement'
            }, ...[
                this.renderState()
            ]);
        }
    }

    SetElementLoader.propTypes = {
        setType: PropTypes.string,
        items: PropTypes.shape({
            label: PropTypes.string,
            ref: PropTypes.string,
            info: PropTypes.array,
            objectInfo: PropTypes.object
        })
    };

    return SetElementLoader;
});
