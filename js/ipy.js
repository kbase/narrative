(function () {
    var root = this;
    var ipy = root.ipy = {};

    ipy.selected_cell_index = function () {
        return IPython.notebook.get_selected_index();
    };

    ipy.select_cell = function (index) {
        IPython.notebook.select(index);
    };

    ipy.read_cell = function (index) {
        if (index == undefined) {
            index = IPython.notebook.get_selected_index();
        }
	    return IPython.notebook.get_cell(index).get_text();
    };

    ipy.write_cell = function (index, text) {
        if (index == undefined) {
            index = IPython.notebook.get_selected_index();
        }
	    if (IPython.notebook.get_cell(index) == null) {
	        index = ipy.add_cell(null, null, 'bottom');
	    }
	    IPython.notebook.get_cell(index).set_text(text);
    };

    ipy.append_to_cell = function (index, text) {
        if (index == undefined) {
            index = IPython.notebook.get_selected_index();
        }
	    IPython.notebook.get_cell(index).set_text(IPython.notebook.get_cell(index).get_text()+"\n"+text);
    };

    ipy.createHTML = function (type) {
	var cells;
	if (type && (type == 'full')) {
	    cells = [ document.getElementById('notebook') ];
	} else {
	    cells = document.getElementsByClassName('output_html');
	}
	var html = "";
	for (i=0;i<cells.length;i++) {
	    html += cells[i].innerHTML;
	}
	stm.send_message(window.parent, { data: html, target: 'result'}, 'html');
    };

    // if index undefined uses selected cells index (default of insert_cell_* functions)
    // default position is below given index or selected
    // return index of added cell
    ipy.add_cell = function (index, type, position) {
	    if (type == undefined) {
	        type = 'code';
	    }
	    var cell = undefined;
        if (position == 'above') {
            cell = IPython.notebook.insert_cell_above(type, index);
        } else if (position == 'bottom') {
            cell = IPython.notebook.insert_cell_at_bottom(type);
        } else if (position == 'top') {
            cell = IPython.notebook.insert_cell_above(type, 0);
        } else {
            cell = IPython.notebook.insert_cell_below(type, index);
        }
        return IPython.notebook.find_cell_index(cell);
    };
    
    // execute cell of given index, default to current selected
    ipy.execute_cell = function (index) {
        if ((index !== undefined) && (index >= 0)) {
            IPython.notebook.select(index);
        }
        IPython.notebook.execute_selected_cell();
    };
    
    ipy.notebook_save = function () {
        IPython.notebook.save_notebook();
    };
    
    ipy.notebook_terminate = function () {
        IPython.notebook.kernel.kill();
    };
    
}).call(this);