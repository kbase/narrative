/*
  Paragraph Renderer

  Displays a text structure in an HTML formatted way

  Options

  width (STRING)
      Width of the output.
      Can be either a bootstrap class name specifying a width (span1 .. span12) or a width in pixel.
      Default is span12.

  data (LIST of Objects to render)
      Title string written at the top of the graph
  
  title_color (CSS Color Value)
      Color of title text. Default is black.

  header_color (CSS Color Value)
      Color of header text. Default is black.

  text_color (CSS Color Value)
      Color of text paragraphs. Default is black.

  raw (BOOLEAN)
      If set to true, expects data to be a string of HTML which will be rendered directly.
      Default is false.

  toc (BOOLEAN)
      If set to true will display a table of contents. Default is false.
*/
(function () {
    var renderer = Retina.Renderer.extend({
	about: {
	    name: "paragraph",
	    title: "Paragraph",
            author: "Tobias Paczian",
            version: "1.0",
            requires: [],
            defaults: {
		'width': '940',
		'data': '',
		'title_color': 'black',
		'header_color': 'black',
		'text_color': 'black',
		'raw': false,
		'toc': false
	    },
	},
	exampleData: function () {
	    return [ { title: "Hello World" },
		     { header: "About" },
		     { p: "Say hello to the world, it likes being greeted this way. Do not be afraid, everything will be ok. I will end this paragraph now and start another." },
		     { p: "This is the next paragraph, feel free to read it. I hope it is not too long. Next up is a table." },
		     { header: "A simple table" },
		     { table: [ 
			 [ { header: "header cell 1" }, "data cell 1" ],
			 [ { header: "header cell 2" }, "data cell 2" ],
			 [ { header: "header cell 3" }, "data cell 3" ],
			 [ { header: "header cell 4" }, "data cell 4" ] ] } ];
        },
	render: function () {
	    renderer = this;

	    var toc = "";
	    if (renderer.settings.raw) {
		renderer.settings.target.innerHTML = renderer.settings.data;
	    } else {
		renderer.settings.target.innerHTML = "";
		var div_styles  = "";
		var html_string = "<style>\
#para"+renderer.index+" > h2 { color: "+renderer.settings.title_color+"; }\
#para"+renderer.index+" > h3 { color: "+renderer.settings.header_color+"; margin-top: 20px; margin-bottom: 10px; }\
#para"+renderer.index+" > p { color: "+renderer.settings.text_color+"; }\
</style><div id='para"+renderer.index+"'";
		if (renderer.settings.width.match(/^\d+$/)) {
		    div_styles = "width: "+renderer.settings.width+"px;";
		} else {
		    html_string += " class='"+renderer.settings.width+"'";
		}
		if (renderer.settings.style) {
		    div_styles += renderer.settings.style
		}
		if (div_styles) {
		    html_string += " style='"+div_styles+"'";
		}
		html_string += ">"
		for (i=0; i<renderer.settings.data.length; i++) {
		    if (renderer.settings.data[i].hasOwnProperty('title')) {
			html_string += "<h2>"+renderer.settings.data[i].title+"</h2>";
		    } else if (renderer.settings.data[i].hasOwnProperty('header')) {
			html_string += "<h3>"+renderer.settings.data[i].header+"</h3>";
		    } else if (renderer.settings.data[i].hasOwnProperty('p')) {
			html_string += "<p>"+renderer.settings.data[i].p+"</p>";
		    } else if (renderer.settings.data[i].hasOwnProperty('footnote')) {
			html_string += "<p><small style='color: black;'><b>"+renderer.settings.data[i].footnote.title+"</b> "+renderer.settings.data[i].footnote.text+"</small></p>";
		    } else if (renderer.settings.data[i].hasOwnProperty('table')) {
			html_string += "<table style='width: 100%;'>";
			for (h=0;h<renderer.settings.data[i].table.length;h++) {
			    html_string += "<tr>";
			    for (j=0;j<renderer.settings.data[i].table[h].length;j++) {
				if (typeof(renderer.settings.data[i].table[h][j]) == 'object') {
				    if (renderer.settings.data[i].table[h][j].hasOwnProperty('header')) {
					html_string += "<th style='text-align: left;'>"+renderer.settings.data[i].table[h][j].header.replace(/\s/g, "&nbsp;")+"</th>";
				    }
				} else {
				    html_string += "<td>"+renderer.settings.data[i].table[h][j]+"</td>";
				}
			    }
			    html_string += "</tr>";
			}
			html_string += "</table>";
		    }  else if (renderer.settings.data[i].hasOwnProperty('fancy_table')) {
			html_string += "<table style='width: 100%;' class='table table-striped table-hover'>";
			for (h=0;h<renderer.settings.data[i].fancy_table.data.length;h++) {
			    html_string += "<tr>";
			    for (j=0;j<renderer.settings.data[i].fancy_table.data[h].length;j++) {
				if (typeof(renderer.settings.data[i].fancy_table.data[h][j]) == 'object') {
				    if (renderer.settings.data[i].fancy_table.data[h][j].hasOwnProperty('header')) {
					html_string += "<th style='text-align: left;'>"+renderer.settings.data[i].fancy_table.data[h][j].header.replace(/\s/g, "&nbsp;")+"</th>";
				    }
				} else {
				    html_string += "<td>"+renderer.settings.data[i].fancy_table.data[h][j]+"</td>";
				}
			    }
			    html_string += "</tr>";
			}
			html_string += "</table>";
		    }
		}
		html_string += "</div>";

		renderer.settings.target.innerHTML = html_string;
	    }
	    return renderer;
	}
    });
 }).call(this);
