(function () {
    widget = Retina.Widget.extend({
	// most information in the about function is intended for conveying information
	// to the programmer using the widget
	// the requires array is a comma separated list of required javascript libraries
	// they will be loaded when the widget is loaded
        about: {
            title: "Example Widget",
            name: "Example",
	    version: 1,
            author: "Tobias Paczian",
            requires: [ ]
        }
    });

    // this will be called by Retina automatically to initialize the widget
    // note that the display function will not be called until this is finished
    // you can add functions that return promises to the return list, i.e.:
    // this.loadRenderer('table')
    // which would make the table renderer available to use before the display function is called
    // you can add multiple comma separated promises
    widget.setup = function () {
	return [ ];
    }
    
    // this will be called whenever the widget is displayed
    // the params should at least contain a space in the DOM for the widget to render to
    // if the widget is visual
    widget.display = function (params) {
	params.target.innerHTML = "<p>Hello World</p>";
    };

    // this can be accessed anywhere within this widget
    // or through a reference to this widget
    widget.someVariable = 'someValue';

    // add subfunctions your widget needs like this
    widget.someFunction = function (params) {

    };

})();
