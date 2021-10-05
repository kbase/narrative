/*
kbaseGenericSetViewer
A widget which can display a data object visualization for several types of objects 
in the "KBaseSets" type module.
At present just ReadsAlignmentSet and AssemblySet are supported; others should display
an error message.

Note that this widget is really just a wrapper, most of the implementation is in the React
components referred two in the AMD dependencies.
*/
define([
    'React',
    'ReactDOM',
    'kbwidget',
    'kbaseAuthenticatedWidget',
    'narrativeConfig',
    'kb_common/jsonRpc/genericClient',
    'kb_service/utils',
    'react_components/genericSets/ReadsAlignmentSet',
    'react_components/genericSets/AssemblySet',
    'react_components/ShowError',
    'bootstrap'
], (
    React,
    ReactDOM,
    KBWidget,
    kbaseAuthenticatedWidget,
    Config,
    ServiceClient,
    ServiceUtils,
    ReadsAlignmentSet,
    AssemblySet,
    ShowError
) => {
    'use strict';

    const { createElement: e, Component } = React;

    /*
    Main - a React component which primarily dispatches to the component which
    matches the type of object provided by the prop 'objectRef'.
    */
    class Main extends Component {
        constructor(props) {
            super(props);
            this.state = {
                setType: null,
                error: null
            };
            this.setTypes = {
                'KBaseSets.ReadsAlignmentSet': {
                    module: ReadsAlignmentSet
                },
                'KBaseSets.AssemblySet': {
                    module: AssemblySet
                }
            };
        }

        componentDidMount() {
            const workspace = new ServiceClient({
                url: this.props.workspaceURL,
                module: 'Workspace',
                token: this.props.token
            });

            return workspace.callFunc('get_object_info_new', [{
                objects: [{
                    ref: this.props.objectRef
                }]
            }])
                .then(([infos]) => {
                    // Get a nice object info (an object rather than array)
                    const objectInfo = ServiceUtils.objectInfoToObject(infos[0]);

                    // Make a versionless object type id for lookup in the set of supported
                    // set types defined above.
                    const objectType = [objectInfo.typeModule, objectInfo.typeName].join('.');

                    const mapping = this.setTypes[objectType];
                    if (mapping) {
                        this.setState({
                            setType: objectType,
                            module: mapping.module
                        });
                    } else {
                        this.setState({
                            error: new Error('Unsupported set type: ' + this.state.setType)
                        });
                    }

                    this.setState({
                        setType: objectType
                    });
                })
                .catch((error) => {
                    console.error('Error getting object info', error);
                    this.setState({
                        error
                    });
                });
        }

        render() {
            if (this.state.error) {
                return e(ShowError, {
                    error: this.state.error
                });
            } else {
                if (!this.state.module) {
                    return e('div', null, 'Loading! I guess...');
                }
                return e(this.state.module, {
                    token: this.props.token,
                    workspaceURL: this.props.workspaceURL,
                    serviceWizardURL: this.props.serviceWizardURL,
                    objectRef: this.props.objectRef
                });
            }
        }
    }

    return KBWidget({
        name: "kbaseGenericSetViewer",
        parent: kbaseAuthenticatedWidget,
        // Leaving this here for now, as it documents the original intention of this widget, to support
        // all the following types within KBaseSets.
        // Also, see: https://github.com/kbase/NarrativeViewers/blob/dd1eeeba0ba1faacd6c3596a9413109aeb82e32e/ui/narrative/methods/view_generic_set/spec.json#L21
        // methodMap: {
        //     "KBaseSets.DifferentialExpressionMatrixSet": 'get_differential_expression_matrix_set_v1', DUP - https://github.com/kbase/NarrativeViewers/blob/dd1eeeba0ba1faacd6c3596a9413109aeb82e32e/ui/narrative/methods/view_differential_expression_matrix_set/spec.json
        //           and the current viewer does not work
        //     "KBaseSets.FeatureSetSet": 'get_feature_set_set_v1', OK - not implemented - can't find any data, or any app which outputs this type, or accepts as input (according to the app browser)
        //     "KBaseSets.ExpressionSet": 'get_expression_set_v1', DUP - https://github.com/kbase/NarrativeViewers/blob/dd1eeeba0ba1faacd6c3596a9413109aeb82e32e/ui/narrative/methods/view_rnaseq_sample_expression/spec.json
        //           and the current viewer doesn't work
        //     "KBaseSets.ReadsAlignmentSet": 'get_reads_alignment_set_v1', OK implemented
        //     "KBaseSets.ReadsSet": 'get_reads_set_v1', DUP - https://github.com/kbase/NarrativeViewers/blob/dd1eeeba0ba1faacd6c3596a9413109aeb82e32e/ui/narrative/methods/view_reads_set/spec.json
        //           current viewer works
        //     "KBaseSets.AssemblySet": 'get_assembly_set_v1', OK - implemented 
        //     "KBaseSets.GenomeSet": 'get_genome_set_v1', OK - not implemented
        // },
        version: "1.0.0",

        init: function (options) {
            try {
                this._super(options);

                ReactDOM.render(e(Main, {
                    workspaceURL: Config.url('workspace'),
                    serviceWizardURL: Config.url('service_wizard'),
                    token: this.authToken(),
                    objectRef: this.options.upas.obj_ref
                }), this.$elem[0]);
            } catch (ex) {
                return ReactDOM.render(e(ShowError({
                    error: ex
                })), this.$elem[0]);
            }
        },
    });
});
