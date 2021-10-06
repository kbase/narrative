# Viewers for sets implemented in the KBaseSets type module

THe KBaseSets [data module](https://narrative.kbase.us/#spec/module/KBaseSets) provides a generic interface for sets of various types. A partner to KBaseSets, the [Set API](https://github.com/kbaseapps/SetAPI) provides an api for accessing such sets.

Inspecting [KBaseSets](https://narrative.kbase.us/#spec/module/KBaseSets) can give you a guide to which sets are implemented, and the general data design, but does not give you an accurate picture of the data you will actually deal with through the SetAPI.

It is also notable, on the subject of caveats, that KBase types do not support inheritance, so the implementation of commonality for types in KBaseSets is purely by convention (copy and paste, if you will). That is, there is no actual "Generic Set" object, if you will, but rather a collection of types which, by convention, implement the same interface.

The basic design of a set that a set implements a wrapper around an array of objects of the same type.

The wrapper consists of a string description and an array of objects, each object being of the same type.

In TypeScript terms, this could be defined like:

```typescript
interface KBaseSet<T> {
    description: string;
    items: Array<T>;
}
```

Pretty basic, huh?

So clearly the meat is in the `T`, I dare say.

## Dispatcher

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
