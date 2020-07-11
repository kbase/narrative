/*
kbaseGenericSetViewer
A widget which can display a data object visualization for several types of objects 
in the "KBaseSets" type module.
At present just ReadsAlignmentSet and AssemblySet are supported; others should display
an error message.

Note that this widget is really just a wrapper, most of the implementation is in the preact
components referred two in the AMD dependencies.
*/
define([
    'kbwidget',
    'kbaseAuthenticatedWidget',
    'narrativeConfig',
    'kb_common/jsonRpc/genericClient',
    'kb_service/utils',
    'preact_components/genericSets/ReadsAlignmentSet',
    'preact_components/genericSets/AssemblySet',
    'preact_components/ShowError',
    'bootstrap'
], function (
    KBWidget,
    kbaseAuthenticatedWidget,
    Config,
    ServiceClient,
    ServiceUtils,
    ReadsAlignmentSet,
    AssemblySet,
    ShowError
) {
    'use strict';

    // Ugly but true - preact is loaded globally by Jupyter and not as an AMD module.
    const { h, Component, render } = window.preact;

    /*
    Main - a preact component which primarily dispatches to the component which
    matches the type of object provided by the prop 'objectRef'.
    */
    class Main extends Component {
        constructor(props) {
            super(props);
            this.state = {
                setType: null,
                error: null
            }
            this.setTypes = {
                'KBaseSets.ReadsAlignmentSet': {
                    module: ReadsAlignmentSet
                },
                'KBaseSets.AssemblySet': {
                    module: AssemblySet
                }
            }
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

                    const mapping = this.setTypes[objectType]
                    console.warn('about to map...', infos, this.props, this.state);
                    if (mapping) {
                        // return h(mapping.module, {
                        //     token: this.props.token,
                        //     workspaceURL: this.props.workspaceURL,
                        //     serviceWizardURL: this.props.serviceWizardURL,
                        //     objectRef: this.props.objectRef
                        // });
                        console.log('mapping', mapping);
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
                return h(ShowError, {
                    error: this.state.error
                });
            } else {
                if (!this.state.module) {
                    return h('div', null, 'Loading! I guess...');
                }
                return h(this.state.module, {
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
        // methodMap: {
        //     "KBaseSets.DifferentialExpressionMatrixSet": 'get_differential_expression_matrix_set_v1',
        //     "KBaseSets.FeatureSetSet": 'get_feature_set_set_v1',
        //     "KBaseSets.ExpressionSet": 'get_expression_set_v1',
        //     "KBaseSets.ReadsAlignmentSet": 'get_reads_alignment_set_v1',
        //     "KBaseSets.ReadsSet": 'get_reads_set_v1',
        //     "KBaseSets.AssemblySet": 'get_assembly_set_v1',
        //     "KBaseSets.GenomeSet": 'get_genome_set_v1',
        // },
        version: "1.0.0",

        init: function (options) {
            try {
                this._super(options);

                render(h(Main, {
                    workspaceURL: Config.url('workspace'),
                    serviceWizardURL: Config.url('service_wizard'),
                    token: this.authToken(),
                    objectRef: this.options.upas.obj_ref
                }), this.$elem[0]);
            } catch (ex) {
                return render(h(ShowError({
                    error: ex
                })), this.$elem[0]);
            }
        },
    });
});
