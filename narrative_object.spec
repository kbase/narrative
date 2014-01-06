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

*/

module NarrativeObject {

    typedef structure {
	string input;
	list<string> outputs;
	string language;
	mapping<string, UnspecifiedObject> metadata;
	string cell_type;
    } NarrativeCell;

    typedef structure {
	list<NarrativeCell> cells;
	mapping<string,UnspecifiedObject> metadata;
    } NarrativeWorksheet;

    typedef structure {
	int nbformat;
	int nbformat_minor;
	list<NarrativeWorksheet> worksheets;
	mapping<string,UnspecifiedObject> metadata;
    } NarrativeObject;

};

