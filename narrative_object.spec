/*
   KBase Narrative Object definition.

   A narrative document is just an IPython Notebook version 3 JSON doc with
   some extra metadata fields to support KBase specific requirements.

   Here is an trivial example narrative doc that contains a single empty code cell
{
    nbformat: 3
    nbformat_minor: 0,
    metadata: {
	format: "ipynb",
	creator: "kbasetest",
	ws_name: "kbasetest_home",
	name: "Untitled",
	type: "Narrative",
	description: "",
	data_dependencies: [ ]
    },
    worksheets: [
	{
	    cells: [
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
    ],
}
@author wjriehl
*/

module KBaseNarrative {

    /*
     Reference to any Workspace object that the Narrative is dependent on. These can be of any type.
     @id ws
     */
    typedef string dependency;

    typedef structure {
        string description;
    } Metadata;

    typedef structure {
        UnspecifiedObject metadata;
        string cell_type;
    } Cell;

    typedef structure {
        list<Cell> cells;
        UnspecifiedObject metadata;
    } Worksheet;

    typedef structure {
        int nbformat;
        int nbformat_minor;
        list<Worksheet> worksheets;
        UnspecifiedObject metadata;
        list<dependency> dependencies;
    } Narrative;

};

