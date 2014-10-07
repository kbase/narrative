/*
KBase Narrative Object definition.

A Narrative document wraps an IPython notebook version 3 JSON doc so it also
contains one or more possible metadata fields.

These are a mix of required and non-required fields. Those that extend the 
IPython document just incorporate into its own unspecified metadata field. These
mainly include Narrative front-end components, such as widget state, that might
differ between different widgets or implementations.

Currently, the only required field in the Narrative object (that wraps the Notebook
object) is a list of data dependencies. This is a list of Workspace references 
to other Workspace objects on which the Narrative relies.


Here is an trivial example narrative doc that contains a single empty code cell
{
    # The Notebook component
    {
        nbformat: 3
        nbformat_minor: 0,
        metadata: 
        {
            format: "ipynb",
            creator: "kbasetest",
            ws_name: "kbasetest_home",
            name: "Untitled",
            type: "Narrative",
            description: "",
            data_dependencies: [ ]
        },
        worksheets: 
        [
            {
                cells: 
                [
                    {
                        collapsed: false,
                        input: "",
                        outputs: [ ],
                        language: "python",
                        metadata: { },
                        cell_type: "code"
                    }
                ],
                metadata: { }
            }
        ]
    },
    # The Narrative component
    dependencies: [ ]
}

The most minimal Narrative object available. This is useful, for example, as a template:

{
    {
        nbformat: 3
        nbformat_minor: 0,
        metadata: { },
        worksheets: [ ]
    },
    dependencies: [ ]
}
@author wjriehl
*/

module KBaseNarrative {

    /*
    Reference to any Workspace object that the Narrative is dependent on. 
    These can be of any type.
    @id ws
    */
    typedef string dependency;

    /*
    A Notebook Cell is specified by a string declaring its type, and an unspecified
    metadata field. That metadata object contains state and runtime information that
    might not always have the same format, but is required.
    */
    typedef structure {
        UnspecifiedObject metadata;
        string cell_type;
    } Cell;

    /*
    A Notebook Worksheet contains one or more Cells.
    */
    typedef structure {
        list<Cell> cells;
        UnspecifiedObject metadata;
    } Worksheet;

    /*
    A set of (mostly optional) metadata that needs to be included as part of the 
    Narrative object. The data_dependencies list is required, but can be empty.
    @optional creator
    @optional format
    @optional name
    @optional type
    @optional ws_name
    */
    typedef structure {
        string description;
        list<dependency> data_dependencies;
        string creator;
        string format;
        string name;
        string type;
        string ws_name;
    } Metadata;

    /*
    This represents the IPython Notebook translated into a KBase Narrative typed object.
    For the IPython-savvy, all of the KBase-specific additions are included as 
    modifications to the metadata fields of the Narrative (was Notebook), Worksheet,
    or Cell objects.
    */
    typedef structure {
        int nbformat;
        int nbformat_minor;
        list<Worksheet> worksheets;
        Metadata metadata;
    } Narrative;
};