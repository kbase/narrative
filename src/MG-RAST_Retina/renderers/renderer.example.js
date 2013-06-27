(function () {
    var renderer = Retina.Renderer.extend({
	about: {
	    name: "example",
	    title: "Example",
            author: "Tobias Paczian",
            version: "1.0",
	    // the requires is a list of javascript libraries that will be loaded when the
	    // widget is loaded
            requires: [],
	    // put default values for all parameters to the renderer in here
	    // they will be extended by the parameters actually passed to the renderer
            defaults: {
		'width' : 200,
		'height': 200
	    },
	},
	// this function must return sample data that allows the renderer to render
	// the data can be any arbitrary JSON data structure
	// it will be used by the testRenderer function
	exampleData: function () {
	    return "<p style='color: red;'>Hello World</p>";
        },
	render: function () {
	    renderer = this;
	    // this will be called to display the renderer
	    // renderer.settings will contain the contents of the defaults attribute
	    // of the about function extended by anything actually passed to the
	    // function when it is called
	    // the target parameter should always be the DOM element the renderer
	    // is to render to. It is usually a good idea to empty the the target
	    // just in case the renderer is called multiple times
	    renderer.settings.target.innerHTML = options.data;

	    return renderer;
	},
	somefunc: function () {
	    // put any additional functions your renderer might need in like this
	},
	somevar: "Hello World"
    });
 }).call(this);
