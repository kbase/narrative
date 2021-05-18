## Build Tasks

The narrative repo has a number of npm and grunt tasks configured for developer use and convenience. They can be found in the `scripts` section of the `package.json` file and `Gruntfile.js`.

### Updating your npm packages

If you haven't already done so, run

```sh
npm install
```

to install and update the npm packages required by the narrative. If there are errors, you may need to remove the `package-lock.json` file and/or the `node_modules` directory.

### JavaScript formatting and linting

The narrative repo uses [Prettier][https://github.com/prettier/prettier] for code formatting and [ESLint][https://eslint.org] for code linting. Developers can use the aliases in the `package.json` file to run these tools:

```sh
npm run eslint   # runs eslint over the JS codebase
```

```sh
npm run prettier # formats JS files
```

### Python formatting and linting

The narrative repo installation includes the modules [black](https://github.com/psf/black), for code formatting, and [flake8](https://flake8.pycqa.org/) for code QA. You can run these manually using the aliases set up in the `package.json` file:

```sh
$ npm run black  # autoformats python code
```

```sh
$ npm run flake8  # runs flake8 code linter
```

or trigger them directly from the command line, e.g.

```sh
$ flake8 .
```
