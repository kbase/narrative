(function () {
    var widget = Retina.Widget.extend({
        // most information in the about function is intended for conveying information
    	// to the programmer using the widget
    	// the requires array is a comma separated list of required javascript libraries
    	// they will be loaded when the widget is loaded
        about: {
                title: "Template for IPython Builder Input Widget",
                name: "BuilderTemplate",
                author: "Travis Harrison",
                requires: [ ]
        }
    });

    // notebook type - rename this for the type this builder works with
    widget.nb_type = 'generic';

    // this will be called by Retina automatically to initialize the widget
    // note that the display function will not be called until this is finished
    // you can add functions that return promises to the return list, i.e.:
    // this.loadRenderer('table')
    // which would make the table renderer available to use before the display function is called
    // you can add multiple comma separated promises
    widget.setup = function () {
	    return [ ];
    };

    // this will be called whenever the widget is displayed
    // the params should at least contain a space in the DOM for the widget to render to if the widget is visual
    widget.display = function (params) {
	    params.target.innerHTML = "<h2>My Builder Goes Here</h2>";
    };
    
    // action to be preformed when a notebook tab is created
    widget.nb_created = function (nbid) {
    };

    // action to be preformed when a notebook tab is removed
    widget.nb_deleted = function (nbid) {
    };

    // action to be preformed when a user logs in
    // possibly retrieve additional private data to show in builder selectors
    widget.perform_login = function (params) {
    };
    
    // this will return the notebook ID of the currently selected notebook tab
    widget.current_nb = function () {
        var curr_iframe = jQuery('#tab_div').children('.active').children('iframe');
        if (curr_iframe && curr_iframe[0] && (curr_iframe[0].id != 'ipython_dash')) {
            return curr_iframe[0].id;
        } else {
            return undefined;
        }
    };
    
    // this will send a text string to be displayed in an ipythin cell
    // data = text string to be passed
    // nbid = id of the notebook to send data to
    // cell_handling = how to enter data into a cell:
    //    'create new cell' (below current cell)
    //    'append to current cell'
    //    'replace current cell'
    widget.transfer = function (data, cell_handling, nbid) {
	    var command = data.replace(/'/g, "##").replace(/"/g, "!!").replace(/\n/g, "\\n");
	    var msgstring = '';
	    if (cell_handling == 'create new cell') {
	        msgstring += 'if (ipy.read_cell() == \'\') { ipy.write_cell(null, \''+command+'\'); } else { ';
	        msgstring += 'ipy.write_cell(ipy.add_cell(), \''+command+'\'); }';
	    } else if (cell_handling == 'replace current cell') {
	        msgstring += 'ipy.write_cell(null, \''+command+'\');';
	    } else if (cell_handling == 'append to current cell') {
	        msgstring += 'ipy.append_to_cell(null, \''+command+'\');';
	    } else {
	        msgstring += 'if (ipy.read_cell() == \'\') { ipy.write_cell(null, \''+command+'\'); } else { ';
	        msgstring += 'ipy.write_cell(ipy.add_cell(), \''+command+'\'); }';
	    }
	    msgstring += "IPython.notebook.execute_selected_cell();";
	    if (! nbid) {
	        nbid = widget.current_nb();
	    }
	    if (nbid) {
	        stm.send_message(nbid, msgstring, 'action');
        }
    };
    
})();
