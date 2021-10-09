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

The original intention of this viewer was to support all of the types implemented in KBaseSets,
but that work has not yet been completed:

Also, see: https://github.com/kbase/NarrativeViewers/blob/dd1eeeba0ba1faacd6c3596a9413109aeb82e32e/ui/narrative/methods/view_generic_set/spec.json#L21

Below is the status of each KBaseSet type:

Implemented in this viewer:

KBaseSets.ReadsAlignmentSet
SetAPI.get_reads_alignment_set_v1

KBaseSets.AssemblySet
SetAPI.get_assembly_set_v1

Implemented in other viewers:

KBaseSets.DifferentialExpressionMatrixSet
SetAPI.get_differential_expression_matrix_set_v1
Implemented by:
https://github.com/kbase/NarrativeViewers/blob/dd1eeeba0ba1faacd6c3596a9413109aeb82e32e/ui/narrative/methods/view_differential_expression_matrix_set/spec.json
and this viewer does not work

KBaseSets.ExpressionSet
SetAPI.get_expression_set_v1
Implemented by:
https://github.com/kbase/NarrativeViewers/blob/dd1eeeba0ba1faacd6c3596a9413109aeb82e32e/ui/narrative/methods/view_rnaseq_sample_expression/spec.json
and that viewer doesn't work

KBaseSets.ReadsSet
SetAPI.get_reads_set_v1
Implemented by:
https://github.com/kbase/NarrativeViewers/blob/dd1eeeba0ba1faacd6c3596a9413109aeb82e32e/ui/narrative/methods/view_reads_set/spec.json
and the current viewer works

KBaseSets.SampleSet
SetAPI.sample_set_to_samples_info (I think)
Implemented by:
https://github.com/kbase/NarrativeViewers/tree/master/ui/narrative/methods/view_sample_set
but not that this viewer does not utilize the SetAPI, which was implemented against the search, which
has never been fully implemented for search. Also Samples and RNASeqSamples seem to be conflated
a bit in SetAPI.

Not implemented anywhere:

KBaseSets.FeatureSetSet
SetAPI.get_feature_set_set_v1
can't find any data, or any app which outputs this type, or accepts as input (according to the app browser)

KBaseSets.GenomeSet
SetAPI.get_genome_set_v1

*/
define([
    'react',
    'kb_common/jsonRpc/genericClient',
    'kb_service/utils',
    'widgets/function_output/KBaseSets/types/ReadsAlignmentSetViewer',
    'widgets/function_output/KBaseSets/types/AssemblySetViewer',
    'react_components/ErrorMessage',
    'widgets/function_output/KBaseSets/Loader',

    // For effect
    'bootstrap'
], (
    React,
    ServiceClient,
    ServiceUtils,
    ReadsAlignmentSetViewer,
    AssemblySetViewer,
    ErrorMessage,
    Loader
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
    class Dispatcher extends Component {
        constructor(props) {
            super(props);
            this.state = {
                status: null,
            };
        }

        async componentDidMount() {
            this.setState({
                status: 'loading'
            });

            try {
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
                const objectType = [objectInfo.typeModule, objectInfo.typeName].join('.');

                const mapping = SET_TYPE_TO_MODULE_MAPPING[objectType];
                if (!mapping) {
                    this.setState({
                        status: 'error',
                        error: new Error(`Unsupported set type: ${this.state.setType}`)
                    });
                    return;
                }

                this.setState({
                    status: 'loaded',
                    setType: objectType,
                    module: mapping.module,
                    method: mapping.method
                });
            } catch (error) {
                console.error('Error getting object info', error);
                this.setState({
                    status: 'error',
                    error
                });
            }
        }

        renderError() {
            return e(ErrorMessage, {
                error: this.state.error
            });
        }

        renderLoaded() {
            return e(Loader, {
                token: this.props.token,
                workspaceURL: this.props.workspaceURL,
                serviceWizardURL: this.props.serviceWizardURL,
                objectRef: this.props.objectRef,
                method: this.state.method,
                module: this.state.module
            });
        }

        render() {
            switch (this.state.status) {
                case null:
                case 'loading':
                    // TODO: Loading comonent
                    return e('div', null, 'Loading...');
                case 'error':
                    return this.renderError();
                case 'loaded':
                    return this.renderLoaded();
            }
        }
    }

    return Dispatcher;
});
