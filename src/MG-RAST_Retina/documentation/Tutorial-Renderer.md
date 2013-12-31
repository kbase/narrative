<h1>Renderer Tutorial</h1>

<p>This tutorial will give you a quick introduction to what a renderer is and how you can create one. It is recommended to first complete the basic tutorial (Tutorial-Basic.md) and the widget tutorial (Tutorial-Widget.md) before reading this one.</p>

<h2>Renderer Definition</h2>

<p>A renderer is a javascript component that performs some kind of visualization of specific data into a given HTML container element. It knows nothing about its surroundings. It cannot retrieve or format its data, it expects the data to be passed to it in a specified format. It interacts with other components by offering update functions or simply by being rerendered with modified parameters. It may interact with the user and offer callback functions to its caller (usually a widget) to inform it about user interaction or state change. Conceptually a renderer should be as dumb as possible, leaving the control over data-flow and interaction between components to the widget.</p>

<h2>A Simple Renderer</h2>

<p>To start off, you should make a copy of the renderer.example.js so you can modify it. You can name it what you like (while staying within the naming conventions), but for this tutorial we will assume you called it helloWorld, hence the file name would be renderer.helloWorld.js. So you can actually see the output of the renderer, you can modify your widget from the widget tutorial to load your custom renderer.</p>

```javascript
   widget.setup = function () {
      return [ Retina.add_renderer({"name": "helloWorld", "resource": "./renderers/", "filename": "renderer.helloWorld.js" }),
               this.loadRenderer('helloWorld') ];
   }
```

<p>You also need to modify the the render call</p>

```javascript
   Retina.Renderer.helloWorld.render({ target: table_div, data: Retina.Renderer.helloWorld.exampleData() });
```

<p>When you take a look at your page now, it should see the 'Hello World' paragraph from the renderer in red (in addition to anything you output in your widget).</p>

<h2>Structure</h2>

<p>If you open the renderer file, you find something familiar at the top. The retina renderer object is being extended, overwriting the about function. This works equivalent to the beginning of the widget file.</p>

```javascript
   var renderer = Retina.Renderer.extend({
      about: {
         name: "example",
         title: "Example",
         author: "Tobias Paczian",
         version: "1.0",
         requires: [],
         defaults: {
            'width' : 200,
            'height': 200
         },
      }
```

<p>The name, title, author, version and requires attributes of the about function work analogous to the widget versions. The name must match the filename part between 'renderer.' and '.js', the strings withing the requires array will be interpreted as required javascript library names within the library directory defined in the Retina init function. You can go ahead and modify these values in your copy of the module.</p>

<p>The last attribute 'defaults' is new. It is a hash of default parameters that will be passed to the render function of your renderer. These default values will be extended with anything manually passed to the function. Keep in mind that choosing good default parameters is a key to making a renderer useful.</p>

<p>The first function in the example renderer is the exampleData function. Though it is not mandatory that this function returns anything, it is often very useful. A programmer using your module can first call it with its example data to see what your renderer looks like. You should capture this data by always using the keyword "data" in your parameters for the data to be rendered. Make sure that when your render function is called with a target and a data param it is able to render. That means you need to supply default values for all mandatory parameters to your renderer, except target and data.</p>

```javascript
   exampleData: function () {
      return "<p style='color: red;'>Hello World</p>";
   }
```

<p>Next is the render function, the heart of your renderer. This is where you put the code that actually performs the rendering. Right now it expects the data argument to be a string containg valid HTML which it prints as the content of its target parameter. You should always capture the HTML container element you render in as the target parameter and the data you render as the data parameter. You can have an arbitrary amount of additional parameters, which will extend the defaults set in the about object. The render function always needs to return a reference to the renderer instance.</p>

```javascript
   render: function () {
      renderer = this;
      renderer.settings.target.innerHTML = renderer.settings.data;
      return renderer;
   }
```

<p>The last part of the module shows you how you can provide additional functions and variables that can be accessed within the module.</p>

```javascript
   somefunc: function () {
      // put any additional functions your renderer might need in like this
   },
   somevar: "Hello World"
```

<h2>Tips and Tricks</h2>

<p>The render function has access to the renderer.settings which are the default settings, extended by user set options. In all functions in your module you can do</p>

```javascript
   var width = renderer.settings.width;
   renderer.settings.height = 150;
```

<p>When a renderer is instanciated, it automatically receives an index attribute. The value of index is the position in an array that stores references to all instanciated renderers.</p>

```javascript
   var renderer = Retina.Renderer.create("table", { /* params here */ }).render();
   var index = renderer.index;
   var same_renderer = Retina.RendererInstances.table[index];
```

<p>Since you already have a reference to the renderer instance returned by the render function, you might think you do not need this additional storage. Consider though that you can use the index in arbitrary other elements in the DOM that have no way to access the reference you get returned.</p>

```html
   <input type="button" value="make table big" onclick="Retina.RendererInstances.table[0].settings.width=1000;Retina.RendererInstances.table[0].render();">
```

<h2>Further Reading</h2>

<p>This concludes this tutorial. If you want to dive a bit deeper into creating renderers, take a look at some of the existing renderers in the renderer directory of Retina.</p>