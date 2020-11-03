## Build Tasks

The narrative repo has a number of npm and grunt tasks configured for developer use and convenience. They can be found in the `scripts` section of the `package.json` file and `Gruntfile.js`.

### Updating your npm packages

If you haven't already done so, run

```sh
npm install
```

to install and update the npm packages required by the narrative. If there are errors, you may need to remove the `package-lock.json` file and/or the `node_modules` directory.

### Building style files

KBase serves concatenated, minified css files (generally named `*_concat.css`) to minimise download size and HTTP hits. These are produced from the source files in `kbase-extension/static/kbase/css` using a grunt task.

To update the css files, run the grunt task:

```sh
grunt build_css
```

If this is not run, edits to the css source files will not be reflected in the css served by the browser.

Individual concatenated files can be produced by running

```sh
grunt concat:<filesetName>
```

where `filesetName` is one of the lists of files specified at the top of the `Gruntfile.js`.

There is also a `watch` task that will automatically generate the concatenated, minified css files when there is a change to the source files. If you plan to make changes to frontend styling, run

```sh
grunt watch
```

in a terminal window to launch a watcher process that regenerates the css files when changes are made. It is recommended that you have this running in a terminal window when running the `kbase-narrative` script in another window.


### Style file styling

The narrative repo uses the [PostCSS](https://github.com/postcss/postcss) system for post-processing css; this includes minification and [Autoprefixer](https://github.com/postcss/autoprefixer) for adding browser prefixes. Additions to the source files should be written without vendor prefixes as these will be added automatically.
