define([
    'widgets/function_output/KBaseSets/SetElements/ReadsAlignmentSetViewer',
    'widgets/function_output/KBaseSets/SetElements/AssemblySetViewer',
], (
    ReadsAlignmentSetViewer,
    AssemblySetViewer,
) => {
    'use strict';

    // Note that any modules referenced must be imported above, and that such modules
    // must be components implemented as defined in `react_components/genericSets`.
    const SET_TYPE_MAPPING = {
        'KBaseSets.ReadsAlignmentSet': {
            module: ReadsAlignmentSetViewer,
            method: 'get_reads_alignment_set_v1'
        },
        'KBaseSets.AssemblySet': {
            module: AssemblySetViewer,
            method: 'get_assembly_set_v1'
        }
    };

    function resolve(workspaceType) {
        if (typeof workspaceType !== 'string') {
            throw new Error(`type "${typeof workspaceType}" not supported as a workspace type value for KBaseSets`);
        }
        if (workspaceType in SET_TYPE_MAPPING) {
            return SET_TYPE_MAPPING[workspaceType];
        }
        throw new Error(`workspace type "${workspaceType}" not supported for KBaseSets`);
    }

    return { resolve };
});