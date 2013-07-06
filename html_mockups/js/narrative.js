var datasets = [ ]; // list of data sets
var currfunction = "";

$(window).load(function () {
	
	//event to open the dialog box to add a dataset
	$("#add_data").click(function() {
	  $( "#add_data_dialog" ).dialog({
		            height: 350,
		            width: 450,
		            modal: true
		});
	});
	
	
	//event to open the dialog box to add a dataset
	//when you are already looking at a function dialog
	$("#add_data_link_dialog").click(function() {
	  $( "#add_data_dialog" ).dialog({
		            height: 350,
		            width: 450,
		            modal: true
		});
	});
	
	//when you click on 'upload' from the 
	//add data dialog box
	$("#upload_link").click(function() {
	  $("#add_data_dialog").dialog("close");
	  $( "#upload_file_dialog" ).dialog({
		            height: 400,
		            width: 450,
		            modal: true
		});
	});
	
	//when you click upload from the upload file dialog
	$("#upload_button").click(function() {
		$( "#upload_file_dialog" ).dialog("close");
		
		//clear out the highlights
		$("#workspace").children().removeClass("ui-state-highlight");
		
		
		//add the dataset cell
		$dataset_cell_clone = $("#dataset_cell5").clone(true);
		$("#workspace").append($dataset_cell_clone);
		$dataset_cell_clone.attr("id", "dataset_cell5a");
		$("#dataset_cell5a").css("display", "block");
		$("#dataset_cell5a").addClass("ui-state-highlight");
		
		//add bottom text cell
		$text_cell_clone2 = $("#textcell").clone(true);
		$text_cell_clone2.attr("id", "textcell2");
		$("#workspace").append($text_cell_clone2);
		$text_cell_clone2.css("display", "block");
	
		//clear out the selected datasets in the data panel
		$('#data_list').children().removeClass("ui-state-highlight");
		
		//add the dataset to the data panel
		$("#data_list").append("<li class=\"ui-state-highlight dataset\"><a href=\"#\">Escherichia coli F11 Growth</a></li>");
	
	});
	
	//when you click search from the add dataset dialog
	$("#search").click(function() {
		$( "#add_data_dialog" ).dialog("close");
		
		//clear out the highlights
		$("#workspace").children().removeClass("ui-state-highlight");
		
		
		//add the dataset cell
		$dataset_cell_clone = $("#dataset_cell1").clone(true);
		$("#workspace").append($dataset_cell_clone);
		$dataset_cell_clone.attr("id", "dataset_cell1a");
		$("#dataset_cell1a").css("display", "block");
		$("#dataset_cell1a").addClass("ui-state-highlight");
		
		//add bottom text cell
		$text_cell_clone2 = $("#textcell").clone(true);
		$text_cell_clone2.attr("id", "textcell3");
		$("#workspace").append($text_cell_clone2);
		$text_cell_clone2.css("display", "block");
	
		//clear out the selected datasets in the data panel
		$('#data_list').children().removeClass("ui-state-highlight");
		
		//add the dataset to the data panel
		$("#data_list").append("<li class=\"ui-state-highlight dataset\"><a href=\"#\">Escherichia coli F11 Genome, annotated</a></li>");
	
	});

	//when you hover over a text cell, show prompt
	$('.textcell').hover(function(){
		var divid = $(this).attr('id');
		if(($('#' + divid + ' .tools').css('display') == 'none') && ($('#' + divid + ' div.textarea').html() == "")){
			$('#' + divid + ' p.textcuepara').show();
		}
	}, function(){
		var divid = $(this).attr('id');
		if(($('#' + divid + ' .tools').css('display') == 'none') && ($('#' + divid + ' div.textarea').html() == "")){
			$('#' + divid + ' p.textcuepara').hide();
		}
	});

	//when you click on any cell, switch which is active
	opencell = 0;//global var
	$('div.textcell, div.function_cell, div.dataset_cell').click(function(){
		var divid = $(this).attr('id');
		activate_cell(divid);
	});
	
	$(".clearselect").click(function(){
		$('#' + opencell + ' .tools').hide();
		$('#' + opencell + ' .texttools').hide();
		//if previous cell is an empty text cell, shrink it back down
		if($('#' + opencell).hasClass('textcell') && $('#' + opencell + ' div.textarea').html() == ""){
			$('#' + opencell).css('height', '1em');
		}
		//if previous cell is nonempty text cell, keep its height automatic
		if($('#' + opencell + ' div.textarea').html() != "" ){$('#' + opencell).css('height', 'auto')};
		opencell = 0;
	});

	function activate_cell(divid){
			//if tools aren't showing in this cell, show them. Do the reverse for previously active cell.
		if($('#' + divid + ' .tools').css('display') == 'none'){
			$('#' + divid + ' .tools').slideDown();
			$('#' + divid + ' div.textarea').slideDown();
			$('#' + divid + ' .texttools').slideDown();
			$('#' + divid + ' div.textarea').focus();
			//allow text cell to grow if needed
			if($('#' + divid).hasClass('textcell') ){$('#' + divid).css('height', 'auto')};
			//hide text cue for text cells
	 		$('#' + divid + ' p.textcuepara').hide();
	 		$('#' + opencell + ' .tools').hide();
			$('#' + opencell + ' .texttools').hide();
			//if previous cell is an empty text cell, shrink it back down
			if($('#' + opencell).hasClass('textcell') && $('#' + opencell + ' div.textarea').html() == ""){
				$('#' + opencell).css('height', '1em');
			}
			//if previous cell is nonempty text cell, keep its height automatic
			if($('#' + opencell + ' div.textarea').html() != "" ){$('#' + opencell).css('height', 'auto')};
		}
		opencell = divid;
	}

	//when click to run a function
	$(".run_function_button").click(function() {
		$( "#run_"+currfunction+"_dialog" ).dialog("close");
		//clear out the highlights
		$("#workspace").children().removeClass("ui-state-highlight");
		//add the function cell
		if(currfunction == "reconstruction") $function_cell_clone = $("#function_cell1").clone(true);
		else if(currfunction == "buildmodel") $function_cell_clone = $("#function_cell2").clone(true);
		else if(currfunction == "runfba") $function_cell_clone = $("#function_cell3").clone(true);
		else if(currfunction == "gapfill") $function_cell_clone = $("#function_cell4").clone(true);
		else if(currfunction == "annotate") $function_cell_clone = $("#function_cell6").clone(true);
		else if(currfunction == "glamm") $function_cell_clone = $("#function_cell7").clone(true);
			
		if(currfunction != "browse" && currfunction != "glamm"){
			$("#workspace").append($function_cell_clone);
			$function_cell_clone.css("display", "block");
		//add bottom text cell
		$text_cell_clone1 = $("#textcell").clone(true);
		$text_cell_clone1.attr("id", "textcell1a" + currfunction);
		$("#workspace").append($text_cell_clone1);
		$text_cell_clone1.css("display", "block");
		}
		//add the dataset cell
		if(currfunction == "reconstruction") $dataset_cell_clone = $("#dataset_cell2").clone(true);
		else if(currfunction == "buildmodel") $dataset_cell_clone = $("#dataset_cell3").clone(true);
		else if(currfunction == "runfba") $dataset_cell_clone = $("#dataset_cell4").clone(true); 
		else if(currfunction == "gapfill") $dataset_cell_clone = $("#dataset_cell7").clone(true);
		else if(currfunction == "browse") $dataset_cell_clone = $("#dataset_cell6").clone(true);
		else if(currfunction == "annotate") $dataset_cell_clone = $("#dataset_cell1").clone(true);
		else if(currfunction == "glamm") $dataset_cell_clone = $("#dataset_cell8").clone(true);

		$("#workspace").append($dataset_cell_clone);
		$dataset_cell_clone.css("display", "block");
		$dataset_cell_clone.addClass("ui-state-highlight");
		activate_cell($dataset_cell_clone.id);
		//add bottom text cell
		$text_cell_clone2 = $("#textcell").clone(true);
		$text_cell_clone2.attr("id", "textcell"+currfunction);
		$("#workspace").append($text_cell_clone2);
		$text_cell_clone2.css("display", "block");
		//clear out the selected datasets in the data panel
		$('#data_list').children().removeClass("ui-state-highlight");
		//add the dataset to the data panel
		if(currfunction == "reconstruction")$("#data_list").append("<li class=\"ui-state-highlight dataset\"><a href=\"#\">Escherichia coli F11 Metabolic Reconstruction</a></li>");
		else if(currfunction == "buildmodel")$("#data_list").append("<li class=\"ui-state-highlight dataset\"><a href=\"#\">Escherichia coli F11 FBA Model</a></li>");
		else if(currfunction == "runfba")$("#data_list").append("<li class=\"ui-state-highlight dataset\"><a href=\"#\">Escherichia coli F11 Flux Balance Analysis</a></li>");
		else if(currfunction == "gapfill")$("#data_list").append("<li class=\"ui-state-highlight dataset\"><a href=\"#\">Escherichia coli F11 Gapfilled FBA Model</a></li>");
		else if(currfunction == "annotate")$("#data_list").append("<li class=\"ui-state-highlight dataset\"><a href=\"#\">Escherichia coli F11 Genome, Annotated</a></li>");
		else if(currfunction == "browse")$("#data_list").append("");
		else if(currfunction == "glamm")$("#data_list").append("");
	});

	//add the very first text cell to the workspace
	$text_cell_clone = $("#textcell").clone(true);
	$text_cell_clone.attr("id", "textcell1");
	$("#workspace").append($text_cell_clone);
	$text_cell_clone.css("display", "block");
	$text_cell_clone.css("height", "1em");

	
	// add all functions to the function pane
	w_func_set(get_functions())
	
	// Prime with some fake datasets
	data_add({name: 'Escherichia coli TW10828', type:['genome'], path:'/my/genome/x'})
	data_add({name: 'Escherichia coli E482', type:['genome'], path:'/my/genome/y'})
	data_add({name: 'Escherichia coli 55989', type:['genome'], path:'/my/genome/z'})

	// XXX: Make function/data panes resizable
});

// ===============================================
// New stuff from Dan. 

// Get list of functions (aka "services") to display to user.
// Each function has these fields:
//   tags = list of categor(ies) to which function belongs
//   name = function name, to show in list
//   desc = longer function description, e.g. mouseover
//   inputs = list of input data types
//   outputs = list of output data types
function get_functions() {
    // MICROBES & COMMUNITIES
    microbes = [
        { name: "annotation",
          desc: "Annotate a genome",
          inputs: ["genome"],
          outputs: ["annotated_genome"],
          shortname: "annotate"
        },
        { name: "browse genome",
          desc: "View a genome dataset in the browser widget",
          inputs: ["annotated_genome"],
          outputs: ["genome_browser"],
          shortname: "browse"
        }, 
        { name: "metabolic reconstruction",
          desc: "Core model reconstruction",
          inputs: ["annotated_genome"],
          outputs: ["core_model"],
          shortname: "reconstruction"
        }, 
        { name: "build FBA model",
          desc: "Build a model to use in FBA",
          inputs: ["annotated_genome"],
          outputs: ["core_model"],
          shortname: "buildmodel"
        },
        { name: "FBA",
          desc: "Run a flux balance analysis",
          inputs: ["annotated_genome"],
          outputs: ["core_model"],
          shortname: "runfba"
        },
        { name: "gapfilling",
          desc: "Core model gapfilling",
          inputs: ["core_model", "growth_data"],
          outputs: ["core_model"],
          shortname: "gapfill"
        }, 
         { name: "visualize in GLAMM",
          desc: "View a model with GLAMM",
          inputs: ["core_model"],
          outputs: ["core_model"],
          shortname: "glamm"
        } 
       // .. etc.. 
        ]
    // tag all as "microbes" and "communities"
    $.each(microbes,
        function(index, value) {
            value["tags"] = ["microbes", "communities"]
        }
    )
    // PLANTS
    plants = [
        { name: "geno2pheno",
          desc: "Genotype to phenotype",
          inputs: ["variations", "traits", "GWAS"],
          outputs: ["model"]
        },
        { name: "variation",
          desc: "Visualize variation",
          inputs: ["genome"],
          outputs: ["variation_viz"]
         }
    ]
    // tag all as "plants"
    $.each(plants,
        function(index, value) {
            value["tags"] = ["plants"]
        }
    )
    // Return merged result
    all = [ ]
    $.merge(all, microbes)
    $.merge(all, plants)
    return(all)
}

// Get a list of all functions that take as input
// the given data type name.
// Return type is the same as get_functions(),
// since this is just a filter.
function get_functions_for_type(name)
{
    return $.grep(get_functions(),
            // pass filter if datatype name matches
            // one of the input types
            function(value, index) {
                $.inArray(name, value.inputs)
            }
    )
}

// Get list of all known datatypes.
// Each datatype has these fields:
//    name = data type short name
//    desc = data type description
function get_datatypes() {
    types = [
        {
            "name": "genome",
            "desc": "A genome"
        },
        {
            "name":"variations",
            "desc":"Like the Goldberg variations, but for base pairs"
        },
        {
            "name": "annotated_genome",
            "desc": "Genome and some guesses"
        },
        {
            "name": "core_model",
            "desc": "Whatever you would expect in a core model"
        }
    ]
    return(types)
}

// UI functions that operate on a given area start with w_ for "widget"

// Clear function widget and
// add a list of functions, which takes the form of an item
// in the list returned by get_functions() 
function w_func_set(func_list) {
    elem = $('#command_list')
    elem.empty()
    $.each(func_list,
        function(i, f) {
            //alert("add function=" + f.name + " for key="+i)
			link_id = "run_" + f.shortname
            link = "<a href='#' title='" + f.desc + "' id='" + link_id + "'>" + f.name + "</a>"
            elem.append("<li class='function'>" + link + "</li>")    
    		//add event to open dialog box when function is clicked on (prototype)
			$("#" + link_id).click(function() {
			  currfunction = f.shortname;
			  $( "#run_" + currfunction + "_dialog" ).dialog({
					height: 350,
					width: 450,
					modal: true,
					title: "Run " + f.name
				})
			})
        }
    )
}

//  Add some data to known data sets
// The dataset object must have the following fields:
//    name = short name of dataset
//    type = list of path in type hierarchy, from most specific to least
//    path = full path to data
function data_add(dataset) {
    datasets.push(dataset)
    datasets.sort(function(a, b) { return a.name > b.name })
    w_data_show()
}

// Show data in data pane
function w_data_show() {
    elem = $("#data_list")
    elem.empty()
    $.each(datasets, function(idx, val) {
        link = "<a href='#' title='" + val.path + "'>" + val.name + "</a>"
        elem.append("<li class='dataset'>" + link + "</li>")
    })
}

// TODO: Define events for clicking on data, e.g.
// TODO:  - filter the functions
// TODO:  - highlight the dataset




