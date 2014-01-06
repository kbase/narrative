<h1>Basic Retina Tutorial</h1>

<h2>Setup</h2>

<p>This tutorial assumes that you have cloned the repository and create your files withing the base directory of the checked out repo. You can step through this tutorial by simply opening the html pages in your browser. You may also deploy the files onto a webserver. If you use a different directory structure than the one in the repository on that webserver, note that you have to adjusts paths in all references accordingly. For the sake of simplicty, opening the page from your browser will work best.</p>

<p>To start out your application, make a copy of the blank html template <b>blank.html</b>. For this tutorial, let us name the file <b>tutorial.html</b> and place it in the same directory as blank.html. Now open tutorial.html in your browser, you should see the string 'hello world'.</p>

<h2>The HTML</h2>

<p>The html page contains the overall layout of the page, loads the initial javascript libraries and stylesheets and the parts of the page that are not layouted by widgets or renderers.</p>

<p>Take a look at the source code of tutorial.html. It is a normal html page with a header and a body section. The head section starts with the meta tag defining the character encoding of the page. You can add any meta tags you like here, controlling the behavior of webcrawlers, defining searchwords you will be associated with in search engines and the like.</p>

<p>Next is the page title. This is a good place to start editing - put the page title of your choice here. If you reload the page, the title in the browser bar should have changed from 'blank' to whatever you chose.</p>

<p>The script section loads the javascript files required for Retina to work. These are two external libraries, jquery and bootstrap, as well as the retina code itself and the stm library that handles data retrieval and storage. If you need additional javascript files loaded for your page, you can do so here. However, widgets and renderers are loaded dynamically by Retina. You do not need to worry about which of these you need at this point. Also, if you want to include other external libraries, it might make sense to wrap them as a renderer or widget. In some cases though, you might just want to load them here.</p>

<p>The link tag loads the basic stylesheet, which is a version of twitters bootstrap. Theoretically you could modify this to adjust for your page. To stay on top of what you have customized though, you should add your own stylesheet here. Let's try this out. Create a file called <b>mystyle.css</b> in the same directory as bootstrap.min.css and append a modified copy of the link to the header section:</p>

```html
    <!--bootstrap style-->
    <link rel="stylesheet" type="text/css" href="bootstrap.min.css">
    <link rel="stylesheet" type="text/css" href="mystyle.css">
```

<p>Now to see that this actually does something, edit mystyle.css:</p>

```css
	p {
		text-decoration: blink;
		font-size: 75px;
		color: red;
		font-weight: bold;
	}
```

<p>If you reload the page, you should see the result. For the styles already built in, visit <a href='http://twitter.github.com/bootstrap' target=_blank>the bootstrap homepage</a>. There is a lot of useful stuff to try out.</p>

<p>The final part of the header section is the script that invokes the initial state of the widgets and renderers on the page. It looks a bit complicated, so let us check out what it does.</p>

```javascript
    jQuery(function () {
	stm.init('http://api.metagenomics.anl.gov/api2.cgi').then(function() {
	    Retina.init( { library_resource: "./" } ).then( function () {
		Retina.add_widget({"name": "Example", "resource": "./widgets/",  "filename": "widget.Example.js" });
		Retina.load_widget("Example").then( function () {
		    Retina.Widget.create('Example', {target: document.getElementById("content")});
		});
	    });
	});
    });
```

<p>The first line wrapps this call into an anonymous jQuery function. This means that the code inside will be executed when the page is loads and the variables used within the function do not use up the global namespace (unless they are exported to it).</p>

<p>The second line initializes the stm library. This module takes care of loading data from an API and making it accesible to scripts on this page. It also allows scripts on this page to modify this client side cache, adding new data, modifying existing data, dumping it to a file or loading a previous data session back into the page. The only parameter to the function is the url of the api that is to provide the data. The function returns a promise, which means that when it is done with its initialization, it will execute whatever is passed to the <b>then</b> function.</p>

<p>When the stm is ready, it is time to initialize the Retina module. You can pass a bunch of parameters here, but for now we only pass the <b>library_resource</b>. This determines the directory that holds any additional libraries that Retina needs to load. This function also returns a promise.</p>

<p>When Retina is initialized, we can start loading widgets and renderers. Before we can load a widget, we need to tell Retina a litle bit about it. For now, leave the parameters here as they are. When you try out the widget-tutorial, you will be creating your own widgets. At that point we will explain what all these parameters do. The keen eyed might even guess just from their names. ;)</p>

<p>A widget is a javascript module that creates some form of component on your page. A widget uses renderers to render certain parts of its content. It contains the logic to retrieve and format the data it needs. It layouts all of its subcomponents and controls the data flow between them. A widget may exchange information with other widgets, with the stm.DataStore and handle user interactions. A renderer in turn, knows nothing about its surroundings. It uses data of a clearly specified structure to render something. It may offer callback functions to inform other functions of state-changes or user interactions. You can read more about widgets and renderers in the follow up tutorials.</p>

<p>When the widget is added, it can be loaded. While the adding tells Retina about the existence of the widget, the loading will actually load the javascript code into the page. These two steps are separated, because you can also supply Retina with a widget resource. Retina will then by itself query that resource for all available widgets and add them automatically.</p>

<p>When a widget is loaded, Retina will first check if it is already loaded into the page, so subsequent calls to load_widget with the same widget will just instantly return without reloading the code. Loading a widget will also load all dependent libraries the widget needs. This will also load every library just once, even if it is required by two separate widgets. As usual, the loading function returns a promise.</p>

<p>Now comes the time to actually execute the widget. Widgets can take an arbitrary amout of arguments (usually passed as a hash), but they will at least take a target parameter. This must be a reference to the element in the page that the widget may render to. In our case this is the element with the id property <b>content</b>. When you look at the body part of the html document, you will find a div element with the id defined in this call as the only content. The tutorial widget will render whatever it does into this div.</p>

<p>You can add any html elements into your page, but whatever you put into a div controlled by a widget is very likely to be erased when the widget renders. Modify the body section of your html to this:</p>

```html
  <body>

	<h2>What a wonderful world</h2>    
	<p>Say hello to it!</p>

	<!--the content div-->
	<div id="content">I like not world!</div>

  </body>
```

<p>The content you put inside the content div will be overwritten with what the widget renders, the rest of the page will remain untouched.</p>

<h2>Follow Up</h2>

<p>After you have completed this tutorial, you should check out the widget tutorial (Tutorial-Widget.md). It will show you how to control an existing widget and how to create your own. You can also take a look at the renderer tutorial (Tutorial-Renderer.md), but it is recommended to complete the widget one first.</p>