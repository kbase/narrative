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
    Metadata currently consists of just a simple description string.
    */
    typedef structure {
        string description;
    } Metadata;

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
    This represents the IPython Notebook as a KBase typed object.
    Any additional fields are embedded into the Narrative object that encapsulates
    this Notebook.
    */
    typedef structure {
        int nbformat;
        int nbformat_minor;
        list<Worksheet> worksheets;
        UnspecifiedObject metadata;
    } Notebook;

    /*
    The Narrative typed object effectively wraps the IPython Notebook with other
    KBase requirements. Currently, this is only a list of data references, but 
    may grow over time.
    */
    typedef structure {
        Notebook notebook;
        list<dependency> dependencies;
    } Narrative;

};

