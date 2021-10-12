# Viewers for sets implemented in the KBaseSets type module

The [`KBaseSets` workspace type module](https://narrative.kbase.us/#spec/module/KBaseSets) provides a generic interface for sets of various types. A partner to KBaseSets, the [Set API](https://github.com/kbaseapps/SetAPI) provides an api for accessing such sets. The "generic set viewer", implied by the module name `kbaseGenericSetViewer`, is designed to display sets provided by the `KBaseSets` and supported by `SetAPI`.

Inspecting [KBaseSets](https://narrative.kbase.us/#spec/module/KBaseSets) can give you a guide to which sets are implemented, and the general data design, but does not give you an accurate picture of the data you will actually deal with through the SetAPI.

It is also notable, on the subject of caveats, that KBase types do not support inheritance, so the implementation of commonality for types in KBaseSets is purely by convention (copy and paste, if you will). That is, there is no actual "Generic Set" object definition, but rather a collection of types which, by convention, implement the same interface.

## KBaseSets Design

The basic design of a set defined in KBaseSets, is that a set is a container for array of objects of the same type. A set consists of a string description and an array of objects, each object being of the same type.

In TypeScript terms, this could be defined like:

```typescript
interface KBaseSet<T> {
    description: string;
    items: Array<T>;
}
```

### Type Confusion

It may be a bit confusing, but there are multiple definitions of `T` in the above, considering the type conceptually (not as a concrete TS type definition).

`KBaseSets` has one definition, `SetAPI` provides another, and the concrete type held by the set provides yet another.

The viewer uses the Workspace to resolve a reference (UPA) to a set object, the SetAPI to get the set definition and list of set elements, and the Workspace again to fetch each set element object when viewing it in detail.

## Viewer Design

The viewer is implemented by a one set of components providing generic support for all KBaseSet types, and a specific viewer for each type.

1.  The initial entrypoint from the Narrative point of view is `kbase-extension/static/kbase/js/widgets/function_output/kbaseGenericSetViewer.js`, a standard "kbwidget" style component which is registered as the viewer for several KBaseSets types (but not all, see comments below.)
2.  The kbaseGenericSetViewer is a wrapper around the main entrypoint for the viewer, `function_output/KBaseSets/SetLoader.js`, responsible for determining the object type and fetching the set
3.  the SetLoader then calls the `function_output/KBaseSets/SetViewer.js` with this information. The viewer is responsible for displaying the set overview and a list of elements for selection.
4.  When an element is selected (defaulting to the first element when the viewer is initially loaded) `function_output/KBaseSets/SetElementLoader.js` fetches the object for a given set element, and subsequently invokes the viewer for the object.
5.  The type-specific element viewer are provided in `function_output/KBaseSets/SetElements`, and will be named after the type with `Viewer` suffixed. E.g. `/types/AssemblySetViewer.js`.

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

Also, see: <https://github.com/kbase/NarrativeViewers/blob/dd1eeeba0ba1faacd6c3596a9413109aeb82e32e/ui/narrative/methods/view_generic_set/spec.json#L21>

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
<https://github.com/kbase/NarrativeViewers/tree/master/ui/narrative/methods/view_differential_expression_matrix_set>
and this viewer does not work

KBaseSets.ExpressionSet
SetAPI.get_expression_set_v1
Implemented by:
<https://github.com/kbase/NarrativeViewers/tree/master/ui/narrative/methods/view_rnaseq_sample_expression>
and that viewer doesn't work

KBaseSets.ReadsSet
SetAPI.get_reads_set_v1
Implemented by:
<https://github.com/kbase/NarrativeViewers/tree/master/ui/narrative/methods/view_reads_set>
and the current viewer works

KBaseSets.SampleSet
SetAPI.sample_set_to_samples_info (I think)
Implemented by:
<https://github.com/kbase/NarrativeViewers/tree/master/ui/narrative/methods/view_sample_set>
but not that this viewer does not utilize the SetAPI, which was implemented against the search, which
has never been fully implemented for search. Also Samples and RNASeqSamples seem to be conflated
a bit in SetAPI.

Not implemented anywhere:

KBaseSets.FeatureSetSet
SetAPI.get_feature_set_set_v1
can't find any data, or any app which outputs this type, or accepts as input (according to the app browser)

KBaseSets.GenomeSet
SetAPI.get_genome_set_v1
Can't find a way to get ahold of a KBaseSets.GenomeSet to play with.
