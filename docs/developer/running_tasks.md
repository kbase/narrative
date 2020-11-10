## Build Tasks

The narrative repo has a number of npm and grunt tasks configured for developer use and convenience. They can be found in the `scripts` section of the `package.json` file and `Gruntfile.js`.

### Updating your npm packages

If you haven't already done so, run

```sh
npm install
```

to install and update the npm packages required by the narrative. If there are errors, you may need to remove the `package-lock.json` file and/or the `node_modules` directory.

### Building style files

KBase serves concatenated, minified css files (generally named `*_concat.css`) to minimise download size and HTTP hits. These are produced from the scss source files in `kbase-extension/scss` by an npm script which triggers the sass compiler and then runs Autoprefixer on the output.

To update the css files, run the task:

```sh
npm run compile_css
```

If this is not run, edits to the scss source files will not be reflected in the css file served by the browser.

There is also a `watch` task that will automatically generate the concatenated, minified css files when there is a change to the source files. If you plan to make changes to frontend styling, run

```sh
grunt watch
```

in a terminal window to launch a watcher process that regenerates the css files when changes are made. It is recommended that you have this running in a terminal window when running the `kbase-narrative` script in another window.

### Style file styling

The narrative repo uses the [PostCSS](https://github.com/postcss/postcss) system for post-processing css; this includes minification and [Autoprefixer](https://github.com/postcss/autoprefixer) for adding browser prefixes. SCSS linting is provided by [Stylelint](https://stylelint.io).

**Additions to the source files should be written without vendor prefixes as these will be added automatically.**

### Autoprefixer

The narrative repo uses [Autoprefixer](https://github.com/postcss/autoprefixer) to add browser prefixes to css, with the browser support list set to Autoprefixer's `default` setting. The `update_browserslist` npm script is used by Autoprefixer to pull in the latest browser configurations, and is run as a git hook. If running the script returns a message that the list of browsers has been updated, please commit the updated `package-lock.json` file.

For more information, see the [browserslist best practices and updating sections](https://github.com/browserslist/browserslist#best-practices).

### Stylelint

To lint the scss files, run the command

```
npm run stylelint
```

The linter config (in `.stylelint.yaml`) includes a number of rules to ensure that the scss content is error-free and (relatively) uniform. Running it will automatically fix some stylistic issues (e.g. ordering of lines within stanzas), but others may need to be fixed manually. Please note there are some issues in the SCSS files that are more difficult to fix, due to the styling set in the Jupyter notebook css.
