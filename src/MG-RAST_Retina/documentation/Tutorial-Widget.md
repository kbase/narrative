<h1>Widget Tutorial</h1>

<p>This tutorial will give you a quick introduction to what a widget is and how you can create custom ones. Before you start this tutorial you should probably read the Basic tutorial (Tutorial-Basic.md)</p>

<h2>Widget Definition</h2>

<p>A widget is a javascript module that operates a part of an interface. It uses renderers to visualize data that is retrieves from the DataStore. A widget can be give options and a place to render to, but it layouts its contents on its own. It knows which type of data it needs and where to get it. It is also aware of the data format requirements of the renderers it uses. Renderers in turn are dumb to that extent. They can only work with data of a specified format.</p>

<p>A widget will also listen to the feedback that renderers give about their state or user interaction with them and controls the flow of data and settings between its renderers. Widgets are not required to use a renderer to render everything, they can just output HTML themselves if they like. Trivial things like texts or action buttons do not need to be wrapped into a special renderer. More complex things, like interactive tables or charts, should be encapsulated within a renderer though.</p>

<h2>A Simple Widget</h2>

<p>In the basic tutorial, we used the example widget. Make a copy of widget.Example.js and name it what you would like (while remaining in the naming conventios). For this tutorial, lets assume you named your widget HelloWorld, so the file name would be widget.HelloWorld.js. You can use the tutorial.html file to view the widget in your browser. Simply replace all occurances of 'Example' in the HTML file with 'HelloWorld'. Now open the page in your browser. You should see the same result as in the basic tutorial.</p>

<h2>Structure</h2>

<p>Let us take a look at the different parts of widget.HelloWorld.js. In the beginning it creates a local variable that extends the Retina Widget object.</p>

```javascript
   widget = Retina.Widget.extend({
      about: {
         title: "Example Widget",
         name: "Example",
         version: 1,
         author: "Tobias Paczian",
         requires: [ ]
      }
   });
```

<p>It overwrites the about object, setting the title, name, version and author of the widget. You can go ahead and adjust these now. The title is a free string that may be used to display your widget in some list (or rather its readable name). The name must be exactly what is between 'widget.' and '.js' in your widgets file name. It is used as a unique identifier for your widget. The version attribute is just an integer, indicating the version of your widget. Since you are just starting out, 1 is an appropriate choice. The author is the first and last name of the creator of the widget. Since you are creating your own now, feel free to put in your name.</p>

<p>There is one last attribute of the about object, which defines a list of other javascript libraries your widget requires. You can put in a list of filenames here (including the .js extension). The files must located in the directory defined by the library attribute you defined in the initialization of Retina. These files will be loaded when your widget is loaded (unless they are already in memory) and the loading of your widget will not be marked as complete until they are fully loaded.</p>

<p>Next in the script you will find the setup function.</p>

```javascript
   widget.setup = function () {
      return [ ];
   }
```

<p>When the create function is called to run your widget, this function will be called first. It must return a list of promises. Once all promises in the return are fulfilled, the display function of your widget will be called. This is a good spot to load data into the DataStore or renderers that you want to use within your widget. The function will ensure that all resources you need are ready to go when it is time to use them in the display function.</p>

<p>As an example, let's add and load the table renderer:</p>

```javascript
   widget.setup = function () {
      return [ Retina.add_renderer({"name": "table", "resource": "./renderers/", "filename": "renderer.table.js" }),
               this.loadRenderer('table') ];
   }
```

<p>The next function in the module is the display function. It will be called when you call create on your widget, right after the setup function is finished. This function can also be called to rerender your widget at a later time (e.g. when its settings have changed). The display function should take in a parameter hash.</p>

```javascript
   widget.display = function (params) {
      params.target.innerHTML = "<p>Hello World</p>";
   };
```

<p>The remaining two parts in the widget show how you add custom variables and functions to your widget, that can be accessed within your widget.</p>

```javascript
   widget.someVariable = 'someValue';
   widget.someFunction = function (params) {
   
   };
```

<h2>Retrieving Data and Using Renderers in Widgets</h2>

<p>Right now your widget will only display a paragraph with the text Hello World, but it could do so much more! Let us use the table renderer we loaded in the setup function. First we need to create the data we want to display in the table. Lets assume we want stm to get the meta data for a hundred metagenomes. That will not happen instantly, so we need to issue a callback. First we look if the data we need is already there, if not, we request it.</p>

```javascript
   widget.display = function (params) {
      
      if (! stm.DataStore[metagenome]) {
         stm.get_objects( { type: "metagenome", "options": { "verbosity": "full", "limit": 100 } }).then(function () {
            widget.display();
         });
         return;
      }
      
      params.target.innerHTML = "<p>Hello World</p>";
   };
```

<p>The stm.get_objects function returns a promise, so once the data is ready, we just call the display function again. All parameters are automatically preserved. Through the closure, the function knows about the widget object. Since we have no data at this point, we simply return. The next time we get to this point, we know the data is in the DataStore.</p>

<p>The metagenome objects returned by the API contain the data we want to show in our table, but we still need to format it correctly, since the table renderer is incapable of doing that. We might need to do this multiple times, so let us use a function.</p>

```javascript
   widget.display = function (params) {
      
      if (! stm.DataStore[metagenome]) {
         stm.get_objects( { type: "metagenome", "options": { "verbosity": "full", "limit": 100 } }).then(function () {
            widget.display();
         });
         return;
      }

      var data = widget.formatData(stm.DataStore.metagenome);
      
      params.target.innerHTML = "<p>Hello World</p>";
   };
   
   widget.formatData = function (data) {
      var columns = ['id', 'name', 'sequence type', 'creation date'];
      var formatted_data = [];
      for (i in data) {
         if (data.hasOwnProperty(i)) {
            formatted_data.push( [ data[i].id, data[i].name, data[i].sequence_type, data[i].created ] );
         }
      }
      return { 'data': formatted_data, 'header': columns };
   }
```

<p>Now we have the data we want to display in the table. First we need to create a div element that the table renderer can render itself to, then we can call the render function of the table.</p>

```javascript
   widget.display = function (params) {
      
      if (! stm.DataStore[metagenome]) {
         stm.get_objects( { type: "metagenome", "options": { "verbosity": "full", "limit": 100 } }).then(function () {
            widget.display();
         });
         return;
      }

      var data = widget.formatData(stm.DataStore.metagenome);
      
      params.target.innerHTML = "<p>Hello World</p>";
      
      var table_div = document.createElement('div');
      params.target.appendChild(table_div);
      Retina.Renderer.create("table", { target: table_div, data: data }).render();
   };
```

<h2>User Interaction</h2>

<p>The table renderer will offer the user ways to manipulate its display. It will not tell your widget about it, it will simply update its settings and render again to the same div you passed to it. This will allow the user to sort, browse and filter the table. However, the table renderer also supports a callback function. It can tell you when a user has clicked a cell. To capture this event, you need to pass a function to the renderer you want invoked when the event occurs.</p>

```javascript
   Retina.Renderer.create("table", { target: table_div, data: data, onclick: widget.tableClicked }).render();
```

<p>Then you need to implement that function to do something about the event. This particular function will return an ordered list of the clicked row data, the clicked cell data, the row index and cell index.</p>

```javascript
   widget.tableClicked = function (clicked_row, clicked_cell, clicked_row_index, clicked_cell_index) {
      alert("You just clicked row "+clicked_row_index+" cell "+clicked_cell_index+", which contains the text '"+clicked_cell+"'");
   }
```

<p>You can then use this feedback information to trigger other actions, for example retrieve data specified by the user interaction, manipulate it and feed it to another renderer.</p>

<h2>Further Reading</h2>

<p>This concludes the widget tutorial. If you would like to know more, you should probably take a look at the renderer tutorial (Tutorial-Renderer.md).</p>