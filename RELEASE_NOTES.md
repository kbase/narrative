# OVERVIEW

The Narrative Interface allows users to craft KBase Narratives using a combination of GUI-based commands, Python and R scripts, and graphical output elements.

This is built on the Jupyter Notebook v6.5.7 and IPython 8.28.x (more notes will follow).

## Version 5.4.3
URO-363 - add note to the sharing panel to contact KBase about DOIs

- Python `requirements-general.txt` and `requirements.txt` merged into a single file so that all runtime deps are installed in one place.

- Python dependencies updated to the following versions:
  - coverage: 7.6.12
  - pytest: 8.3.4
  - pytest-cov: 6.0.0
  - ruff: 0.9.9
  - vcrpy: 7.0.0
  - beautifulsoup4: 4.13.3
  - biopython: 1.85
  - bokeh: 3.6.2
  - certifi: 2025.1.31
  - cryptography: 44.0.1
  - decorator: 5.2.1
  - idna: 3.10
  - markupsafe: 3.0.2
  - networkx: 3.4.2
  - numpy: 2.2.3
  - pillow: 11.1.0
  - plotly: 5.24.1
  - pyasn1: 0.6.1
  - pycurl: 7.45.4
  - pygments: 2.19.1
  - pyopenssl: 25.0.0
  - python-daemon: 3.1.2
  - scipy: 1.15.2
  - setuptools: 75.8.2
  - six: 1.17.0
  - sympy: 1.13.3
  - wordcloud: 1.9.4
  - ipython: 8.33.0
  - jinja2: 3.1.5
  - pandas: 2.2.3
  - pymongo: 4.11.1
  - scikit-learn: 1.6.1
  - statsmodels: 0.14.4
  - tornado: 6.4.2

- Javascript dependency updates
  - dompurify 3.1.6 -> 3.2.4
  - plotly.js-dist-min 2.35.0 -> 2.35.3  (note: next is 3.0.1, with breaking changes)
  - @babel/traverse 7.25.6 -> 7.26.9
  - @eslint/eslintrc 3.1.0 -> 3.3.0
  - @eslint/js 9.11.1 -> 9.21.0
  - @wdio/browserstack-service 9.0.9 -> 9.10.1
  - @wdio/cli 9.0.9 -> 9.10.1
  - @wdio/local-runner 9.0.9 -> 9.10.1
  - @wdio/mocha-framework 9.0.8 -> 9.10.1
  - @wdio/spec-reporter 9.0.8 -> 9.10.1
  - axios 1.7.7 -> 1.8.1
  - chromedriver 128.0.3 -> 133.0.3
  - commander 12.1.0 -> 13.1.0
  - eslint 9.11.1 -> 9.21.0
  - eslint-config-prettier 9.1.0 -> 10.0.2
  - expect-webdriverio 5.0.2 -> 5.0.5
  - glob 11.0.0 -> 11.0.1
  - globals 15.9.0 -> 16.0.0
  - husky 9.1.6 -> 9.1.7
  - jasmine-core 5.3.0 -> 5.6.0
  - jquery-ui 1.14.0 -> 1.14.1
  - lint-staged 15.2.10 -> 15.4.3
  - postcss 8.4.47 -> 8.5.3
  - prettier 3.3.3 -> 3.5.2
  - puppeteer 23.4.0 -> 24.3.0
  - sass 1.79.3 -> 1.85.1
  - selenium-standalone 10.0.0 -> 10.0.1
  - selenium-webdriver 4.25.0 -> 4.29.0
  - string.prototype.startswith 1.0.0 -> 1.0.1
  - stylelint 16.9.0 -> 16.15.0
  - stylelint-config-recommended 14.0.1 -> 15.0.0
  - stylelint-config-standard 36.0.1 -> 37.0.0
  - terser 5.33.0 -> 5.39.0

## Version 5.4.2
- UIP-52 - repair integration tests, get WebDriverIO up to date
- PTV-1913 - fix potential authentication issues affecting report viewing and downloads in narratives

### Dependency Changes
- Python dependency updates
  - coverage 7.5.3 -> 7.6.1
  - pytest 8.2.2 -> 8.3.2
  - pytest-recording 0.13.1 -> 0.13.2
  - ruff 0.5.5 -> 0.6.3

  - certifi 2027.7.4 -> 2024.8.30
  - cryptography 42.0.8 -> 43.0.0
  - idna 3.7 -> 3.8
  - jsonschema 4.16.0 -> 4.23.0
  - markdown 3.4.1 -> 3.7
  - markupsafe 2.1.4 -> 2.1.5
  - pycurl 7.45.1 -> 7.45.3
  - pyopenssl 24.1.0 -> 24.2.1
  - setuptools 71.1.0 -> 74.0.0
  - terminado 0.18.0 -> 0.18.1
  - bokeh 3.5.1 -> 3.5.2
  - ete3 3.1.2 -> 3.1.3
  - numpy 2.0.1 -> 2.1.0
  - plotly 5.23.0 -> 5.24.0
  - scipy 1.14.0 -> 1.14.1
  - sympy 1.13.1 -> 1.13.2

  - ipython 8.26.0 -> 8.27.0
  - ipywidgets 7.7.1 -> 8.1.5
  - notebook 6.5.6 -> 6.5.7
  - pymongo 4.7.3 -> 4.8.0
  - pyyaml 6.0.1 -> 6.0.2
  - scikit-learn 1.5.0 -> 1.5.1

- Javascript Dependency Changes
  - wdio-chromedriver-service -- Deprecated and removed, functionality is now built-in to WebdriverIO

  - @babel/traverse 7.24.7 -> 7.25.6
  - @eslint/js 9.6.0 -> 9.9.1
  - @wdio/browserstack-service 8.38.2 -> 9.0.9
  - @wdio/cli 8.38.2 -> 9.0.9
  - @wdio/local-runner 8.38.2 -> 9.0.9
  - @wdio/mocha-framwork 8.39.0 -> 9.0.8
  - @wdio/spec-reporter 8.38.2 -> 9.0.8
  - autoprefixer 10.4.19 -> 10.4.20
  - axios 1.7.2 -> 1.7.7
  - chromedriver 128.0.0 -> 128.0.1
  - cssnano 7.0.2 -> 7.0.6
  - eslint 9.4.0 -> 9.9.1
  - expect-webdriverio 3.6.0 -> 5.0.2
  - glob 10.4.1 -> 11.0.0
  - globals 15.6.0 -> 15.9.0
  - grunt-cli 1.4.3 -> 1.5.0
  - grunt-stylelint 0.20.0 -> 0.20.1
  - husky 9.0.11 -> 9.1.5
  - jasmine-core 5.1.2 -> 5.2.0
  - jquery-migrate 1.4.1 -> 3.5.2
  - karma 6.4.3 -> 6.4.4
  - lint-staged 15.2.6 -> 15.2.10
  - postcss 8.4.39 -> 8.4.45
  - prettier 3.3.2 -> 3.3.3
  - puppeteer 23.2.1 -> 23.3.0
  - requirejs 2.3.6 -> 2.3.7
  - sass 1.77.5 -> 1.78.0
  - selenium-standalone 9.5.0 -> 10.0.0
  - selenium-webdriver 4.22.0 -> 4.24.0
  - stylelint 16.6.1 -> 16.9.0
  - stylelint-config-recommended 14.0.0 -> 14.0.1
  - stylelint-config-sass-guidelines 11.1.0 -> 12.0.0
  - stylelint-config-standard 36.0.0 -> 36.0.1
  - terser 5.31.1 -> 5.31.6
  - webdriverio 8.38.2 -> 9.0.9

  - dompurify 2.5.5 -> 3.1.6
  - follow-redirects 1.15.6 -> 1.15.9
  - jquery-ui 1.13.2 -> 1.14.0
  - plotly.js-dist-min 2.33.0 -> 2.35.0
  - underscore 1.13.6 -> 1.13.7

## Version 5.4.1
- UIP-51 fix issue where JSON and STAGING download apps aren't getting properly instantiated with object inputs.

### Dependency Changes
- Python dependency updates
  - biopython 1.79 -> 1.84
  - bokeh 3.0.3 -> 3.5.1
  - certifi 2024.6.2 -> 2024.7.4
  - chardet 5.0.0 -> 5.2.0
  - ipython 8.25.0 -> 8.26.0
  - networkx 3.0 -> 3.3
  - numpy 1.24.1 -> 2.0.1
  - pexpect 4.8.0 -> 4.9.0
  - pillow 10.3.0 -> 10.4.0
  - plotly 5.13.0 -> 5.23.0
  - pyasn1 0.4.8 -> 0.6.0
  - pygments 2.17.2 -> 2.18.0
  - python-daemon 2.3.2 -> 3.0.1
  - python-dateutil 2.8.2 -> 2.9.0.post0
  - scipy 1.10.0 -> 1.14.0
  - seaborn 0.12.0 -> 0.13.2
  - setuptools 69.5.1 -> 71.1.0
  - sympy 1.10.1 -> 1.13.1
  - ruff 0.4.7 -> 0.5.5

- JavaScript dependency updates
  - @wdio/mocha-framework  8.38.2 -> 8.39.0
  - chrome-launcher  1.1.1 -> 1.1.2
  - chromedriver  126.0.0 -> 126.0.4
  - postcss  8.4.38 -> 8.4.39
  - selenium-webdriver  4.21.0 -> 4.22.0

## Version 5.4.0
-   UIP-43
    -   Change Narrative JSON downloads to use a download-to-staging app.
    -   Add an optional "wildcard" field to app cells that can be used to allow any data object as an app input.
    -   Add a text-only output field for app cells to optionally use.
-   UIP-44 - Convert data object transform-and-download URLs to use the Blobstore endpoint instead of the Data Import Export service
-   UIP-45 - Convert the report object viewer to use the Blobstore endpoint instead of the Data Import Export service
-   Remove last references to the Data Import Export service so we can lay it to rest in KBase.

## Version 5.3.0

-   PTV-1845 - kbaseTabs now shows another tab after a closable tab is closed;
    previously it showed an empty space.
-   PTV-1909 - Narrative sign out does sign out
-   UIP-41 - Update Jupyter Notebook to version 6.5.6
-   UIP-41 - Fix Dropzone dependency issues, address problems with unit tests
-   UIP-41 - Removed unused Python dependencies

### Notebook widget updates

- The clustergrammer widget was updated to clustergrammer2; see the python dependency changes below for version information.

### Dependency Changes

- Updated to include all Python dependencies in the image built in this repo, and removed those that are not directly referenced in KBase code.
- Retained scientific computing dependencies that may be useful to the community (SciPy, numpy, pandas, etc.)
- Removed directly required dependencies that are really just used by the Jupyter Notebook.
- Separated requirements into image dependencies (i.e. packages that are generally useful to have on the Narrative Docker image, ported from the narrative-base-image repo), application requirements and dev requirements.
- Generally useful python packages are combined in the `src/requirements-general.txt` file.
- the requirements in `src/requirements.txt` are needed for the Narrative to run.
- the requirements in `src/requirements-dev.txt` are needed for Narrative development and testing.
- flake8, isort, and black have been replaced by the multifunctional formatter and linter Ruff.


- Python dependency updates
  - beautifulsoup4: 4.12.2 -> 4.12.3
  - black: 24.4.2 -> replaced by Ruff
  - certifi: 2022.12.7 -> 2024.6.2
  - coverage: 7.3.1 -> 7.5.3
  - clustergrammer_widget: removed
  - clustergrammer2: 0.18.0 (new)
  - cryptography: 41.0.4 -> 42.0.8
  - flake8: 7.0.0 -> replaced by Ruff
  - idna: 3.4 -> 3.7
  - isort: 5.13.2 -> replaced by Ruff
  - ipython: 8.10.0 -> 8.25.0
  - jinja2: 3.1.2 -> 3.1.4
  - markupsafe: 2.1.3 -> 2.1.4
  - pillow: 9.4.0 -> 10.3.0
  - pygments: 2.16.1 -> 2.17.2
  - pymongo: 4.5.0 -> 4.7.3
  - pyopenssl: 23.2.0 -> 24.0.0
  - pytest: 7.4.0 -> 8.2.2
  - pytest-cov: 4.1.0 -> 5.0.0
  - pytest-recording: 0.13.1 (new)
  - requests-mock: 1.11.0 -> 1.12.1
  - requests: 2.31.0 -> 2.32.3
  - ruff: 0.4.7 (new)
  - scikit-learn: 1.2.1 -> 1.5.0
  - statsmodels: 0.14.2 (new)
  - terminado: 0.17.1 -> 0.18.0
  - tornado: 6.2 -> 6.4.1
  - vcrpy: 5.1.0 -> 6.0.1


- Javascript dependency updates
  - @babel/traverse: 7.22.8 -> 7.23.3
  - @wdio/browserstack-service: 8.12.2 -> 8.29.3
  - @wdio/cli: 8.12.2 -> 8.29.3
  - axios: 1.4.0 -> 1.6.1
  - chromedriver: 114.0.2 -> 123.0.0
  - commander: 10.0.0 -> 11.1.0
  - dropzone: 5.7.0 -> 5.9.3
  - eslint-config-prettier: 8.8.0 -> 9.1.0
  - follow-redirects: 1.15.2 -> 1.15.4
  - handlebars: 4.7.7 -> 4.7.8
  - karma: 6.4.1 -> 6.4.2
  - nunjucks: 2.4.3 -> 3.2.4 in /src/nodejs/NarrativeServer
  - plotly.js-dist-min: 2.18.2 -> 2.28.0
  - postcss: 8.4.27 -> 8.4.33
  - prettier: 3.0.0 -> 3.2.4
  - puppeteer: 20.8.2 -> 21.10.0
  - pure-uuid: 1.6.4 -> 1.8.1
  - selenium-webdriver: 4.10.0 -> 4.17.0
  - word-wrap: 1.2.3 -> 1.2.4
  - ws: 7.2.0 -> 7.4.6 in /src/nodejs/NarrativeServer


## Version 5.2.1
-   PTV-1900 - a previous bugfix exposed an issue in the SpeciesTreeBuilder apps. This provides a workaround to keep those apps running.
-   PTV-1687 - update favicon

### Dependency Changes

- Python dependency updates
  - coverage: 7.2.7 -> 7.3.1
  - cryptography: 41.0.2 -> 41.0.4
  - pygments: 2.15.1 -> 2.16.1
  - pymongo: 4.4.1 -> 4.5.0

## Version 5.2.0
A new feature here is that app cells now store object information internally as UPAs, instead of object names. This will lead to more reproducible results, and is on the path to fixing the long-standing copy-of-a-copy problem.

-   PTV-1810 - address object name display issues in the View Configure tab of app cells. This now saves all app inputs as UPAs in the cell. It also includes an update to input transforms to properly convert from UPAs <-> names or references as appropriate before starting the app.
-   PTV-1875 - fix public data paging issue by removing paging from workspace data sources
-   PTV-1877 - fix app descriptions to replace the documentation link for the upload / download guide
-   PTV-1878 - fix some failing front end unit tests
-   UIP-28 - update Google Analytics tags to GA4 properties
-   UIP-36 - add support for anonymous user ids sent to Google Analytics

### Dependency Changes

- Javascript dependency updates
  - @wdio/browserstack-service: 8.10.2 -> 8.12.2,
  - @wdio/cli: 8.10.2 -> 8.12.2
  - @wdio/local-runner: 8.10.2 -> 8.12.1,
  - @wdio/mocha-framework: 8.10.2 -> 8.12.1,
  - @wdio/selenium-standalone-service: 8.10.2 -> 8.14.0,
  - @wdio/spec-reporter: 8.10.2 -> 8.12.2,
  - chromedriver: ^112.0.0 -> ^114.0.0
  - commander: 10.0.0 -> 11.0.0
  - cssnano: 6.0.0 -> 6.0.1
  - datatables.net-buttons-bs: 2.2.3 -> 2.4.1
  - dompurify: none -> 2.3.8
  - eslint: 8.34.0 -> 8.46.0
  - grunt-stylelint: ^0.16.0 -> ^0.19.0
  - karma: ^6.3.16 -> 6.4.2
  - karma-jasmine-html-reporter: 2.0.0 -> 2.1.0
  - numeral: 1.5.0 -> 2.0.6
  - postcss: ^8.3.2 -> 8.4.27
  - postcss-discard-comments: ^5.1.2 -> 6.0.0
  - prettier: 2.7.1 -> 3.0.0
  - puppeteer: 19.8.2 -> 20.8.2
  - pure-uuid: 1.6.2 -> 1.6.4
  - sass: 1.60.0 -> 1.63.6
  - selenium-webdriver: 4.8.0 -> 4.10.0
  - stylelint: ^13.13.1 -> 15.10.2
  - stylelint-config-recommended: ^5.0.0 -> ^13.0.0
  - stylelint-config-sass-guidelines: ^8.0.0 -> ^10.0.0
  - stylelint-config-standard: ^22.0.0 -> ^34.0.0
  - webdriverio: 8.10.2 -> 8.12.3

- Python dependency updates
  - beautifulsoup4: 4.12.1 -> 4.12.2
  - black: 23.3.0 -> 23.7.0
  - coverage: 7.2.2 -> 7.2.7
  - cryptography: 40.0.1 -> 41.0.2
  - flake8: 6.0.0 -> 6.1.0
  - isort: none -> 5.18.0
  - markupsafe: 2.1.2 -> 2.1.3
  - pygments: 2.14.0 -> 2.15.1
  - pymongo: 4.3.3 -> 4.4.1
  - pyopenssl: 23.1.1 -> 23.2.0
  - pytest-cov: 4.0.0 -> 4.1.0
  - pytest: 7.2.2 -> 7.4.0
  - pyyaml: 6.0.0 -> 6.0.1
  - requests: 2.28.2 -> 2.31.0
  - requests-mock: none -> 1.11.0

## Version 5.1.4
-    PTV-1234 - add padding to the bottom of the data list so that the bottom-most row can slide up above the add data button and show its ellipsis icon.
-    PTV-1793 - fix problem where users could sometimes not enter spaces in bulk import cells.

Dependency Changes

-   Github Actions

    -   actions/checkout v2 -> v3
    -   actions/setup-node v2 -> v3
    -   codecov/codecov-action v2 -> v3
    -   docker/setup-qemu-action v1 -> v2
    -   docker/setup-buildx-action v1 -> v2
    -   docker/login-action v1 -> v2
    -   docker/build-push-action v2 -> v3

-   Python dependency updates

    -   beautifulsoup4 4.11.1 -> 4.12.0
    -   black 22.8.0 -> 23.3.0
    -   coverage 6.4.4 -> 7.2.2
    -   cryptography 38.0.1 -> 40.0.1
    -   flake8 3.8.4 -> 6.0.0
    -   idna 3.3 -> 3.4
    -   jupyter-console 6.4.3 -> 6.6.3
    -   markupsafe 2.0.1 -> 2.1.2
    -   pygments 2.13.0 -> 2.14.0
    -   pymongo 4.1.0 -> 4.3.3
    -   pyopenssl 22.0.0 -> 23.1.1
    -   pytest 7.0.1 -> 7.2.2
    -   pytest-cov 3.0.0 -> 4.0.0
    -   requests 2.28.1 -> 2.28.2
    -   terminado 0.12.1 -> 0.17.1

-   Javascript dependency updates
    -   @wdio/browserstack-service 7.20.1 -> 8.3.9
    -   @wdio/cli 7.25.0 -> 8.3.9
    -   @wdio/local-runner 7.25.0 -> 8.3.9
    -   @wdio/mocha-framework 7.20.0 -> 8.3.0
    -   @wdio/selenium-standalone-service 7.19.5 -> 8.3.2
    -   @wdio/spec-reporter 7.25.0 -> 8.6.8
    -   chromedriver 105.0.0 -> 110.0.0
    -   commander 9.3.0 -> 10.0.0
    -   cssnano 5.1.13 -> 6.0.0
    -   eslint 8.16.0 -> 8.34.0
    -   grunt-shell 3.0.1 -> 4.0.0
    -   husky 7.0.4 -> 8.0.3
    -   jasmine-core 4.4.0 -> 4.6.0
    -   karma-jasmine 5.0.1 -> 5.1.0
    -   plotly.js-dist-min 1.50.0 -> 2.18.0
    -   postcss-scss 4.0.4 -> 4.0.6
    -   puppeteer 18.0.5 -> 19.8.2
    -   requirejs-domready 2.0.1 -> 2.0.3
    -   sass 1.55.0 -> 1.60.0
    -   selenium-standalone 8.2.0 -> 8.3.0
    -   selenium-webdriver 4.4.0 -> 4.8.0
    -   wdio-chromedriver-service 7.3.2 -> 8.1.1
    -   webdriverio 7.20.1 -> 8.3.9

## Version 5.1.3

-   PTV-1620 - fix problem with Expression Pairwise Correlation creating or displaying large heatmaps and freezing or crashing browser
-   PTV-1514 - sanitized HTML being used for app input tooltips

Dependency Changes

-   Python dependency updates
    -   black >=20.8b1 -> 22.8.0
    -   coverage 6.2 -> 6.4.4
    -   cryptography 37.0.4 -> 38.0.1
    -   flake8 3.8.4 -> 5.0.4
    -   jinja2 3.0.3 -> 3.1.2
    -   jupyter-console 6.4.3 -> 6.4.4
    -   pygments 2.12.0 -> 2.13.0
    -   requests 2.27.1 -> 2.28.1
-   Javascript dependency updates
    -   @wdio/cli 7.19.6 -> 7.25.0
    -   @wdio/local-runner 7.19.5 -> 7.25.0
    -   @wdio/spec-reporter 7.19.5 -> 7.25.0
    -   bootstrap 3.3.7 -> 3.4.1
    -   bootstrap-slider 10.6.2 -> 11.0.2
    -   chrome-launcher 0.14.2 -> 0.15.1
    -   chromedriver ^101.0.0 -> ^105.0.0
    -   cssnano 5.1.7 -> 5.1.13
    -   jasmine-core 4.1.0 -> 4.3.0
    -   jquery-ui 1.13.1 -> 1.13.2
    -   karma-jasmine-html-reporter 1.7.0 -> 2.0.0
    -   postcss-cli 9.1.0 -> 10.0.0
    -   prettier 2.4.1 -> 2.7.1
    -   puppeteer 13.7.0 -> 18.0.5
    -   require-css 0.1.8 -> 0.1.10
    -   sass 1.51.0 -> 1.55.0
    -   selenium-standalone 8.1.1 -> 8.2.0
    -   selenium-webdriver 4.1.2 -> 4.4.0
    -   terser 5.13.1 -> 5.15.0
    -   underscore 1.13.3 -> 1.13.6

Removed dependencies
**note** a number of these were removed from the narrative, but left in the narrative base image. The `requirements.txt` in this repo is intended for those packages required for the narrative to run. Any other packages, including scientific programming ones, useful for either KBase Apps or other manual use in Narrative code cells are included in the narrative base image (see [narrative-base-image](https://github.com/kbase/narrative-base-image) for more details). Also note that most of these are duplicated and included in that image - these are still necessary for narrative functionality when installed locally (i.e. not in a Docker image), so they're left in.

-   plotly - not necessary for core narrative functionality, moved to narrative base image
-   semantic_version -- removed, wasn't used effectively, and removed the need for it
-   sklearn - still included, installed manually alongside clustergrammer in the install script, so the requirements.txt was removed
-   sympy - not necessary for core narrative functionality, moved to narrative base image

### Version 5.1.2

-   PTV-1823 - fixed problem where text input fields for apps were displaying incorrect data on reload
-   DATAUP-778 - fixed bug where xsvGenerator would not run if the paramDisplay value was not present
-   updated data icon coloring scheme
-   refactored narrative Docker image management (see new [narrative-base-image](https://github.com/kbase/narrative-base-image) repo)

### Version 5.1.1

-   PTV-1798 - fixed issue where invalid component ID was causing data list not to load properly
-   DATAUP-762 - fixed bug where previously run cells were showing errors in the View Configure tab
-   DATAUP-763 - fixed an issue where data type icons in the bulk import cell during a run would always show an error, saying that the cell is not ready to run, when it is clearly running.

Dependency Changes

-   Python dependency updates
    -   cryptography: 36.0.2 -> 37.0.4
    -   markupsafe: 2.1.1 -> 2.0.1
    -   plotly: 5.7.0 -> 5.9.0
    -   rsa: 4.8 -> 4.9
    -   semantic_version: 2.9.0 -> 2.10.0

### Version 5.1.0

-   PTV-1783 - fixed issue where the previous object revert option was unavailable
-   DATAUP-639 - fix problems with dynamic dropdown app cell input
    -   selected value wasn't being displayed properly after a page reload or cell refresh
    -   selected value wasn't being displayed in view-only version
    -   "Loading..." message wasn't displayed while fetching data from a service.
    -   Update the dynamic dropdown to support the `exact_match_on` field in app specs.
    -   Add a copy button to the dynamic dropdown - this will copy the most relevant text from the dropdown to the clipboard.
        -   For dropdowns with an `exact_match_on` field, this will copy the contents of that field (e.g. for those that present taxonomy ids for a species, this copies just the scientific name)
        -   For dropdowns that go against the FTP staging area, this copies the file name and path.
        -   For other dropdowns, this copies the formatted text
-   DATAUP-751 - add link to staging area docs in the upload tour
-   DATAUP-753 - alter the error text for Select input boxes in app cells to be a bit more generalized.
-   DATAUP-756 - add a copy button for other, non-dynamic dropdowns. This copies the displayed text to the clipboard.

Dependency Changes

-   Javascript dependency updates

    -   @wdio/browserstack-service: 7.16.16 -> 7.19.7
    -   @wdio/cli: 7.16.16 -> 7.19.6
    -   @wdio/local-runner: 7.16.6 -> 7.19.3
    -   @wdio/mocha-framework: 7.16.15 -> 7.20.0
    -   @wdio/selenium-standalone-service: 7.16.16 -> 7.19.1
    -   @wdio/spec-reporter: 7.16.14 -> 7.19.1
    -   autoprefixer: 10.2.6 -> 10.4.5
    -   commander: 9.0.0 -> 9.3.0
    -   chromedriver: 100.0.0 -> 101.0.0
    -   corejs-typeahead: 1.6.1 -> 1.3.1
    -   datatables.net: 1.11.3 -> 1.12.1
    -   datatables.net-bs 1.11.5 -> 1.12.1
    -   datatables.net-buttons-bs: 1.4.2 -> 2.2.3
    -   ejs: 3.1.6 -> 3.1.7
    -   eslint: 8.14.0 -> 8.16.0
    -   grunt: 1.4.1 -> 1.5.3
    -   grunt-contrib-concat: 1.0.1 -> 2.1.0
    -   handlebars: 4.0.5 -> 4.7.7
    -   jasmine-core: 4.0.0 -> 4.1.0
    -   jquery-nearest: 1.3.1 -> 1.4.0
    -   jquery-ui: 1.12.1 -> 1.13.1
    -   js-yaml: 3.3.1 -> 3.14.1
    -   karma-jasmine: 4.0.1 -> 5.0.1
    -   karma-jasmine-matchers: 4.0.2 -> 5.0.0
    -   postcss-remove-comments: 5.0.1 -> 5.1.2
    -   postcss-cli: 8.3.1 -> 9.1.0
    -   postcss-scss: 3.0.5 -> 4.0.4
    -   pure-uuid: 1.4.2 -> 1.6.2
    -   sass: 1.34.1 -> 1.51.0
    -   selenium-standalone: 8.0.9 -> 8.0.10
    -   selenium-webdriver: 4.1.1 -> 4.1.2
    -   spark-md5: 3.0.0 -> 3.0.2
    -   underscore: 1.8.3 -> 1.13.3
    -   webdriverio: 7.16.16 -> 7.19.7

-   Python dependency updates
    -   beautifulsoup4: 4.8.1 -> 4.11.1
    -   cryptography: 3.3.2 -> 36.0.2
    -   html5lib: 1.0.1 -> 1.1
    -   idna: 2.8 -> 3.3
    -   jinja2: 3.1.1 -> 3.0.3
    -   plotly: 5.6.0 -> 5.7.0
    -   pygments: 2.11.2 -> 2.12.0
    -   jupyter-console: 6.0.0 -> 6.4.3
    -   jsonschema: 4.4.0 -> 3.2.0
    -   pymongo: 4.1.0 -> 4.1.1
    -   pyopenssl: 19.0.0 -> 22.0.0
    -   setuptools: 62.0.0 -> 62.1.0

### Version 5.0.3

-   DATAUP-641
    -   Adds custom error messages when app cell dropdown menu inputs are incorrect in various different ways.
    -   Adds custom error messages when app cell checkboxes are initialized with non binary data (should only happen with a bulk import cell from a spreadsheet file)
    -   Adds custom error messages when app cell numeric inputs are initialized with non-numeric data.
-   PTV-1765 - Fix Pangenome viewer; wasn't able to get an object ref
-   DATAUP-643 - Adds a warning to the top of a bulk import cell when attempting to use multiple distinct non-file and non-output parameter values. E.g. different assembly types for multiple rows of an assembly uploader spreadsheet.
-   SCT-3162 - Fix download buttons in Data panel widget so that full UPA (with object version) is sent to the downloader app.
-   DATAUP-525 - Fix the "show advanced" button in bulk import cells to properly toggle its label when clicked.
-   DATAUP-642 - Adds an error message to the bulk import advanced parameters header when closed.
-   DATAUP-737 - Overhaul of GitHub Actions to move to using official Docker actions for building, tagging, and uploading images. Move python module installation out of Dockerfile and into the requirements.txt.

Dependency Changes

-   Python dependency updates
    -   coverage: 5.5 -> 6.2
    -   cryptography: 2.7 -> 3.3.2
    -   decorator: 5.0.9 -> 5.1.1
    -   jinja2: 3.0.1 -> 3.1.1
    -   jsonschema: 3.2.0 -> 4.4.0
    -   markupsafe: 2.0.1 -> 2.1.1
    -   pillow: 8.3.2 -> 8.4.0
    -   plotly: 5.3.1 -> 5.6.0
    -   pygments: 2.10.0 -> 2.11.2
    -   pymongo: 3.12.0 -> 4.1.0
    -   pytest-cov: 2.12.1 -> 3.0.0
    -   pyyaml: 5.4.1 -> 6.0
    -   requests: 2.26.0 -> 2.27.1
    -   rsa: 4.7.2 -> 4.8
    -   semantic_version: 2.8.5 -> 2.9.0
    -   setuptools: 57.4.0 -> 62.0.0
    -   sympy: 1.8 -> 1.10.1
    -   terminado: 0.11.1 -> 0.13.3

### Version 5.0.2

-   SAM-73 - Extends the ability to use app params as arguments for dynamic dropdown calls to inputs that are part of a struct or sequence.
-   DATAUP-696 - Prevent import specifications from being imported with either unknown data types, or data types not currently registered as using the bulk import cell.
-   DATAUP-715 - Adds scrollbars to the configure and results tab of the bulk import cell.
-   Fixed an error where Narrative names didn't always render properly in the Narratives panel.
-   Fixed an error where Narrative names didn't always render properly in the data slideout.

### Version 5.0.1

-   SAM-73 - Updated DynamicDropdownInput to have access to full list of other app parameters when user selects dropdown. If an app developer specified to use a certain value from a different field, the field as it currently exists will be used as a parameter.
-   Updated AppParamsWidget to return all current values from `get-parameters` if no specific value was specified, allowing to see all current parameter values without having to know their names.
-   DATAUP-570 - Only use the Narrative configuration to set available import types in the Import area dropdowns
-   DATAUP-577 - Sanitize suggested output object names for bulk import jobs so they follow the rules
-   PTV-1717 - fix landing page links for modeling widgets
-   PTV-1726 - address issue where the "Narrative updated in another session" would appear with no other session open

### Version 5.0.0

This new major version of the KBase Narrative Interface introduces a way to import data from your data staging area in large batches using a single Bulk Import cell. See more details about the new workflows here: [Bulk Import Guide](https://docs.kbase.us/data/upload-download-guide/bulk-import-guide)

There are also a ton of other updates and changes to both the Narrative interface (in various small and not-so-small ways) and to how the Narrative software will be developed going forward.

The following is a high level list of changes, with matching JIRA tickets where appropriate. As always, all Narrative work is done on Github and is available for view and discussion there.

Code Changes

-   Built an entirely new Bulk Import cell type that runs a batch of Import jobs all at once.
-   Objects that can be imported in bulk are:
    -   SRA reads
    -   Interleaved FASTQ reads
    -   Non-interleaved FASTQ reads
    -   Read Assemblies
    -   GFF metagenomes
    -   Genbank genomes
-   Redesigned the Data Import Tab
    -   It now suggests object upload type based on file suffix.
    -   Files are now selected for import by clicking a checkbox (or selecting a type), then clicking “Import Selected”
    -   The Import Tab file browser has been improved and remembers selections more consistently
    -   The Import Tab styling has been made more internally consistent.
-   DATAUP-225 - Styles and color usage have been normalized in many places in the app cell and bulk import cell
-   DATAUP-329 - Standardized the use of select boxes in various inputs for the app cell and bulk import cell
-   Remove app info dialog option - superseded by the “Info” tab on all app cells
-   DATAUP-263 - Fix bug where app cells can get stuck in the “Sending…” phase
-   SAM-40 - Add Name/ID column to SampleSet viewer
-   DATAUP-651 - Update Data Import tab help tour to include new features.

Development Changes

-   UIP-3 - Made the migration away from Bower to using only NPM for Javascript package management. Mostly, the same versions were kept, though some were unavoidably changed
    -   seiyria-bootstrap-slider 10.6.2 -> bootstrap-slider 10.6.2 (renamed on npm)
    -   plotly.js v1.5.1 -> plotly.js-dist-min v1.50.0 (1.5.1 unavailable)
    -   requirejs-plugins 1.0.3 -> 1.0.2 (which is on npm)
    -   requirejs-text 2.0.14 -> requirejs/text 2.0.16 (renamed on npm)
    -   kbase-ui-plugin-catalog 1.2.14 -> kbase-ui-plugin-catalog 2.2.5 (requires a package.json)
    -   Datatables got modified as it was out of date, and there were multiple versions being assembled at once. Now, there's: - `datatables` as a package is obsolete, and supplanted by `datatables.net` (i.e., we shouldn't have both). Updated from 1.10.9 -> 1.11.3 - supporting modules (`datatables.net-bs`, `datatables.net-buttons-bs`) are the same
        DATAUP-246 - migrate from CSS to using SASS throughout the Narrative, making use of [BEM notation](http://getbem.com/introduction/) for element styling
        DATAUP-62 - designed and implemented simple coding standards and git workflow for the Narrative repo
        DATAUP-71 - added automated linting and code quality tools to the Narrative repo

### Version 4.6.0

Code changes

-   DATAUP-599 - Adjusted the kernel code and tests to account for a Workspace service update.
-   PTV-1703 - Fix DifferentialExpressionSet and DifferentialExpressionMatrixSet viewers
-   SCT-3088 - Add Narrative Outline View. Allows scrolling through a minimal view of Narrative cells more quickly.

Dependency Changes

-   Python dependency updates
    -   pillow 8.3.1 -> 8.3.2
    -   plotly 5.1.0 -> 5.3.1
    -   pygments 2.9.0 -> 2.10.0
    -   pytest 6.2.4 -> 6.2.5
    -   terminado 0.10.1 -> 0.11.1
-   Javascript dependency updates
    -   @wdio/browserstack-service 7.9.1 -> 7.11.1
    -   @wdio/cli 7.9.1 -> 7.11.1
    -   @wdio/local-runner 7.9.1 -> 7.11.1
    -   @wdio/mocha-framework 7.9.1 -> 7.11.1
    -   @wdio/selenium-standalone-service 7.7.7 -> 7.10.1
    -   @wdio/spec-reporter 7.9.0 -> 7.10.1
    -   chromedriver 92.0.1 -> 93.0.1
    -   husky 7.0.1 -> 7.0.2
    -   jasmine-core 3.8.0 -> 3.9.0
    -   msw 0.34.0 -> 0.35.0
    -   puppeteer 10.1.0 -> 10.4.0
    -   terser 5.7.1 -> 5.7.2
    -   webdriverio 7.9.1 -> 7.11.1
-   Javascript dependency additions
    -   expect-webdriverio 3.1.4

### Version 4.5.0

-   PTV-1561 - SampleSet viewer fixes to allow AMA features; not complete support for AMA features as GenomeSearchUtil does not yet support AMA.
-   SCT-3100 - Improve SampleSet viewer; add improved JSON-RPC 1.1 client and associatedKBase service client; add msw (Mock Service Worker) support;
-   SCT-3084 - Fixed broken (non-functional) search in the data panel
-   SCT-3602 - refseq public data tool now searches by lineage as well; for all public data tools: automatically focus the search input; fix paging bug.
-   No ticket - migrate from `nosetests` to `pytest` for testing the Python stack.
-   Python dependency updates
    -   bokeh 2.3.2 -> 2.3.3
    -   pillow 8.2.0 -> 8.3.1
    -   plotly 4.14.3 -> 5.1.0
    -   pymongo 3.11.4 -> 3.12.0
    -   pytest 6.2.3. -> 6.2.4
    -   pytest-cov 2.11.1 -> 2.12.1
    -   requests 2.25.1 -> 2.26.0
    -   setuptools 57.0.0 -> 57.4.0
-   Javascript dependency updates
    -   @types/puppeteer 5.0.0 -> 5.4.4
    -   @wdio/browserstack-service 7.7.3 -> 7.9.0
    -   @wdio/cli 7.7.3 -> 7.9.0
    -   @wdio/local-runner 7.7.3 -> 7.9.0
    -   @wdio/mocha-framework 7.7.3 -> 7.9.0
    -   @wdio/selenium-standalone-service 7.7.3 -> 7.7.4
    -   @wdio/spec-reporter 7.7.7 -> 7.9.0
    -   chromedriver 91.0.0 -> 91.0.1
    -   eslint 7.28.0 -> 7.32.0
    -   husky 6.0.0 -> 7.0.1
    -   karma 6.3.3. -> 6.3.4
    -   puppeteer 10.0.0 -> 10.1.0
    -   selenium-standalone 6.23.0 -> 7.1.0
    -   terser 5.7.0 -> 5.7.1
    -   wdio-chromedriver-service 7.1.0 -> 7.1.1
    -   webdriverio 7.7.3 -> 7.9.1

### Version 4.4.0

-   No ticket: boatloads of code cleanup and fixes to the unit and internal testing
-   PTV-1635: fix bug in data slideout tab selection
-   PTV-1635: fix data and app slideout button and opening behavior
-   DEVOPS-475: Change dockerfile so that container runs as nobody, without need to setuid for initialization. Enables removing CAP_SETUID from container initialization
-   SCT-2935 - fix refseq public data search behavior to properly restrict the search with multiple terms
-   SCT-3038 - refseq public data search now includes genome_id and source_id

### Version 4.3.2

-   SCT-2778 - convert data slideout, public tab, refseq data source to use searchapi2/rpc api rather than searchapi2/legacy.
-   Enhanced integration testing support to add service, host, browser, screen size support.
-   Changed the "Dashboard" link in hamburger menu to "Narratives" and use the new /narratives path.

### Version 4.3.1

-   Fixed problem where code cells could forget their toggled state after saving.
-   Fixed setting up local authentication for developers.
-   DATAUP-69 - added a pull request template to the narrative repo.
-   DATAUP-120 - improve testing documentation
-   DATAUP-164, DATAUP-165 - add automatic linting configuration with flake8 and black for the Python layer.
-   DATAUP-176 - refactored the startup process to be more robust with respect to kernel activity.
-   DATAUP-178 - changed "Add Data" and "+" icon color in the data panel.
-   DATAUP-187 - repositioned Globus link in the staging area.
-   DATAUP-188, DATAUP-228 - adds text and refresh button to the staging area, and stabilized the trash can icon.
-   DATAUP-197 - fixed problem where canceling an app cell could cause it to freeze.
-   DATAUP-204 - made folder names clickable in the staging area.
-   DATAUP-210 - adds a "file too large" error to the staging area when a file is too large to upload.
-   DATAUP-213 - added a "clear all" button that removes all staging area errors.
-   DATAUP-246 - dramatic cleanup and refactor done globally throughout the Narrative stylesheets.
-   DATAUP-266 - fixed a problem where the staging area didn't automatically refresh when a file finishes uploading.
-   DATAUP-301 - fixed a problem where the staging area rendered twice in a row on page load.

### Version 4.3.0

-   SCT-2664 - Show the app cell status when in a collapsed state.
-   Added an "Info" tab to all app cells with app information.
-   Updated links to new KBase home page and docs site.
-   Fixed an uploader issue where uploads taking longer than 30 seconds would fail.
-   (Trigger release via labels)

### Version 4.2.1

-   Address problems with SampleSet / AMA Viewer widget.
-   SCT-1822 - fix problems with drag and drop data upload failing for more than 100 files (updated the Dropzone widget to version 5.7.0)
-   Updated Globus endpoint to point to the newer Globusconnect server.
-   Updated tons of dependencies. Thanks Jason Fillman!

### Version 4.2.0

-   Updated the Narrative interface to connect to the remade Execution Engine.
-   Updated the Narrative interface to streamline events and cookies connected to the Traefik update.
-   Fixed an issue where job log browser state (running, stopped, scrolling) could cross browser sessions.
-   Added a viewer for the SampleSet object.
-   PTV-1446 - fix bug preventing KBaseFeatureValues viewer apps from working and displaying data

### Version 4.1.2

-   Improve display of job logs.
-   Prevent App cell elements from overflowing the page.
-   Job status is now inaccessible before a job enters the queue.

### Version 4.1.1

-   Fix sort order in Narratives panel - should be by most recently saved.
-   Add better error support in data staging uploader - if an upload directory is not available, you should be able to return to the root directory without trouble.

### Version 4.1.0

-   Introduce Static Narratives, available under the Share menu. First release!

### Version 4.0.0

-   Update various software packages
    -   Python to 3.6.9
    -   Jupyter Notebook to 6.0.2
    -   IPython to 7.9.0

### Version 3.11.4

-   Add Annotated Metagenome Assembly viewer widget
-   PTV-1214 - Fix Binned Contig Viewer labels
-   PTV-1341 - Fix column and row labeling in GenomeComparison viewer
-   Improve functionality and options for dynamic dropdowns in apps.

### Version 3.11.3

-   PTV-1308 - Fix problem where users with a Globus account that's not linked to KBase will see an error when trying to access the Globus interface through the upload area.
-   Add GFF Metagenome object upload type.

### Version 3.11.2

-   Improve load times for the Data Panel and the browser in the data slideout (the "My Data" and "Shared with Me" tabs).
-   Set the Narratives tab to lazy load.
-   #1487 - fixed typo in genome feature viewer.
-   Updated data import tutorial for some clarity.
-   Changed Pangenome viewer field names for clarity and consistency.

### Version 3.11.1

-   Add internal information for users who came to the site from a Google ad click.
-   Improve load time of the App Panel.
-   Fix a bug where jobs canceled in the non-Narrative job browser would cause issues with the corresponding App Cell.

### Version 3.11.0

-   Add an option to share a Narrative with an organization as well as people.
-   SCT-1783 - Reduce the number of network calls to the auth service on startup.
-   SCT-1785 - Reduce the number of network calls to the Catalog/NMS services on startup.
-   SCT-1793 - Lazy-load reports (i.e. if they're not in the brower viewport, don't load them).
-   Fix an issue with nested subdata inputs into apps not being accessible as expected.
-   Removed a bunch of dead code, including the older "service" modules, that haven't been in use for a few years.

### Version 3.10.1

-   Fixed a critical bug where users with write access to a Narrative (but not share access) were unable to save changes to a Narrative or run Apps.

### Version 3.10.0

-   Fix tooltip for long object names in the data panel.
-   Add ability to prefix a part of path_to_subdata with WSREF to list options from other objects.
-   SCT-1602 - Add new URL options - /narrative/12345 will find the narrative in workspace 12345 (older URLs like /narrative/ws.12345.obj.1 still work).
-   Fix problem where jobs were not being properly started with an agent token (i.e. weren't guaranteed to have a week-long authentication token).
-   Improved error handling and display when a Narrative doesn't exist or a user doesn't have permission to see it.
-   Add functionality to request access to a Narrative instead of throwing a "not allowed" error.

### Version 3.9.1

-   SCT-1509 - Ensure access permissions to Globus before redirecting a user there from the Import area.

### Version 3.9.0

-   Fix security vulnerability with rendering some user info.
-   SCT-1547 - Add a download endpoint to the staging service, so a user can now download files directly from the FTP stagin area.
-   SCT-1496 - Add functionality for downloading data from the data panel to the FTP Staging area.
-   SCT-1526 - Create a code cell generator as an app output.

### Version 3.8.3

-   SCT-1253 - Replace old RNA-Seq data viewers.
-   SCT-1393 - Fix "Objects Created" links in app outputs.
-   SCT-1370 - Give instructions to users on how to link their account to Globus for uploading data.
-   SCT-1395 - Convert object ref and ids to common names for downloading.
-   Add viewers and support for generic data types.
-   Fix RNA-Seq data viewers, including Feature Clusters.

### Version 3.8.2

-   Add the clustergrammer_widget
-   SCT-1219 - Fix the app cell so it shows an error if an app has multiple outputs, and they're given the same name.
-   Add numpy, scipy, scikit-learn to the base Docker image

### Version 3.8.1

-   SCT-1261 - Changed the 'outdated app' warning to a small icon with a popover text.
-   SCT-886 - Added a default viewer for typed objects that don't have an actual viewer associated with them.
-   Added a test-mode viewer for a new matrix type.
-   SCT-1253 - fixed bugs in how assembly and reads typed objects get viewed - their numbers of reads weren't being presented properly.
-   SCT-1210 - Module-level (not just type) spec files are available for determining object viewers.
-   SCT-1234 - Introduces the clustergrammer Jupyter Notebook widget.
-   SCT-1206 - fixes a cell error that can occur if an app doesn't produce any output objects (including reports).
-   Introduces a new build and deployment strategy.
-   Updates the versions of numpy and pandas so they should work again.

### Version 3.8.0

-   Generalized updates to support viewing the new version of the genome data type.
-   SCT-500 - Fix DomainAnnotation viewer widget.
-   SCT-380 - Updates to the RNA-Seq Volcano plot viewer.
-   KBASE-1916 - Fix data type descriptions in the Example tab of the data slideout.
-   SCT-923 - Improve Mycocosm public data search.
-   SCT-930 - Add a "show report" button to objects in the data panel.
-   Reformat and generalize the job logs for both the App Cell and standalone job log viewer widget.
-   Migrate unit tests to use HeadlessChrome and (optionally) Firefox.
-   Refactor Public Data in the Data Slideout to make use of the new KBase Search API.
-   Display a warning if a typed object has no viewer associated with it.
-   SCT-901 - enhance expression matrix viewer.
-   Add ConditionSet viewer.
-   SCT-1082 - fix regressions in Public Data tab.
-   Fix regression in feature set viewer caused by SCT-762.

### Version 3.7.2

-   SCT-908 - Fix formatting issues with heatmaps.
-   SCT-875 - Accept poorly formatted input data into the RNA-Seq data heatmap viewers.
-   SCT-878 - Deal with very large heatmaps so that they get downloaded instead of displayed inline, otherwise allow it to grow to some proper size and embed it in a scroll panel.
-   SCT-875 - Fix labels on heatmaps under certain data conditions.
-   SCT-809 - Fix configuration view mode when there are deeply nested parameters, especially lists of grouped parameters containing a subdata param.
-   SCT-866 - Improve side panel behavior in view-only mode; stretch data panel to full height.
-   SCT-821 - Add "info" item to view cell menu, also some other cleanup for viewer cells.
-   SCT-762 - Convert the Feature set viewer to use a dynamic service to fetch feature data.
-   SCT-657 - Narrative Public Data search now uses new Search API to find KBase data.
    -   Due to the nature of the Search API, this also changes the interface to require the user to press "enter" to do a search, instead of as-you-type.
    -   Changes the layout of the retrieved items from searching.
-   SCT-804 - General updates to fix a compilation problem with FeatureValues data widgets.
-   SCT-698 - Redo the narrative build so that it uses Conda for installs of R, Python and Jupyter. This updates
    the versions to current levels, fixing numpy and pandas incompatibilities

### Version 3.7.1

-   SCT-793, SCT-496 - Fix version of upstream dependency "file-saver" to 1.3.4; an upstream update had broken and taken down the Pangenome viewer and others.
-   SCT-104 Convert the narrative container to new CI/CD model based on dockerize+environment variables for startup config

### Version 3.7.0

-   Update Jupyter Notebook to 5.4.1 with a few KBase adjustments
    -   Prevent Jupyter favicon from overriding ours at various points.
    -   Use local version of Font Awesome.
    -   Use local version of Glyphicons font pack (for Datatables-based widgets).
    -   Use Bootstrap version 3.3.7
-   Update ipywidgets to 7.2.1
-   SCT-559 - Fix ugly race condition that could prevent app cells from being properly rendered when loading an existing Narrative.
-   Re-enable security measure that prevents Markdown cells from rendering JavaScript. We're about a year past the point when that was necessary.
-   SCT-628 - adds a viewer for the CompoundSet object.
-       - Tornado dependency to 5.0.0
-   SCT-637 - adds a warning to the loading section if there's an extreme delay (20 seconds) in between loading individual steps.
-   SCT-690 - truncate long Narrative names, show the whole thing on mouseover.
-   SCT-590 - add cache busting to the public data mapping lookup. No more force-refreshing!
-   SCT-706 - fix problem where space characters were sometimes ignored in the app panel search.
-   Remove old Import tab, remove (New) tag and warning from new Import tab.

### Version 3.6.3

-   SCT-585 add folder drag and drop upload to the Import area.
-   Remove old link to Search from the Narrative hamburger menu.
-   Relabel public data referencing fungal genomes.

### Version 3.6.2

-   Fix problem preventing read-only Narratives from loading.
-   SCT-581 fix failure when reloading tabs in the data staging panel.
-   SCT-582 reconcile labels and order of App Panel with Catalog.

### Version 3.6.1

-   SCT-533 - Remove the accidental test uploader that crept into production.
-   SCT-516 - Set staging panel to auto-refresh after various updates.
-   SCT-531 - Updated App Panel to have the same category names as the external App Catalog.
-   Added fungal genomes as a Public Data option.
-   Added Phytozome plant genomes as a Public Data option.
-   Repaired somewhat broken Doman Annotation viewer.
-   Text fixes to Import Tab tour.

### Version 3.6.0

-   SCT-400 - Deprecates the old Import panel, change text from "Staging (beta)" -> "Import (new)"
-   SCT-417
    -   All older Import functionality should now be available in the new Import panel.
    -   Adds a link to create an app for uploading from a public URL into the staging area.
    -   Cleans up unclear text in the new Import panel.
    -   Adds new (hopefully informative) steps to the Import panel tour.
    -   Move the 'decompress file' button so it should always be visible for archives.
-   PTV-225 - Add more icon clarity to the data sorting options.
-   PTV-886 - Restore missing scrollbar in the Narratives panel.
-   KBASE-5410 - Improve job log viewer, add different.
-   SCT-291 - Initial addition of tools for programmatically accessing the FTP file staging area.
-   SCT-405 - Custom compounds will now display properly in the media viewer.
-   KBASE-5417 - Fix long strings not wrapping correctly when showing object metadata in the Data panel.

### Version 3.5.2

-   PTV-682 - Fix problem with rendering a Pangenome widget in a copied Narrative.
-   KBASE-5405 (in progress) - new version of app log viewer.
-   PTV-225 - Fix and clarify data sorting by name, type, and date.
-   PTV-833 - Restore missing genome icons to the data panel.
-   KBASE-5410 - Put the user id onto the link to Globus in the staging upload area.
-   Adds new functionality to the data staging area, including showing file metadata and whether a file has been uploaded before.

### Version 3.5.1

-   TASK-1113/PUBLIC-148 - Import Panel scrolls if panel size is larger than screen size
-   TASK-1114 - Add lock when editing name, that prevents data panel from refreshing with new data. Relinquishes lock after 15 min if no activity.
-   TASK-1116 - Add PhenotypeSet importer to staging area
-   TASK-1117 - Add importer for FBAModels to staging area
-   TASK-1088 - Data Pane maintains filters after refresh due to changes in narrative
-   TASK-1089 - Import data slide out panel tracks what object is added to narrative. "Add" button turns into "copy" if object already exists. Add pop up when user copies and overrides existing object.
-   TASK-1094 - Fix overlapping cells and buttons issue in Firefox
-   Style Fixes
    -   Fix bold font display inconsistencies between different browsers
    -   Move tooltip in data panel from covering buttons to the top
-   KBASE-4756 - Fix data type filtering in data panel slideout.
-   PTV-225 - Fixes sorting by type in data panel
-   PTV-535 - Fix RNA-seq viewer to properly handle multiple input types.
-   PUBLIC-123 - Fix incorrect reaction counts in FBA Model viewer
-   TASK-1158 - Standardize app and object cards in narrative and data panel

### Version 3.5.0

-   TASK-1054 - Create a new loading window with a set of tasks to load and connect to (treats the problem of slowly loading websockets, still probably needs some adjusting).
-   TASK-588 - Change status of importers from "suspend" to "error" if the import job fails.
-   KBASE-3778/TASK-1017 - hide "next steps" area of app results tab if there are no next steps available.
-   KBASE-1041 - fix error that shows a version number instead of username for who saved the most recent narrative.
-   TASK-1069 - fix problems with searching and filtering the App panel
    -   Searching by output object type works again.
    -   Added "input:" and "output:" as filters for input object types and output object types (same as "in_type:" and "out_type:", respectively)
    -   Made type search more stringent.
        -   If no "." separator is present, will only match by the type name. E.g. "in_type:Genome" will not match "GenomeSet" or "PanGenome" or "KBaseGenomes.ContigSet", just "ANYMODULE.Genome"
        -   If a "." is present, will only match a full type name, like "KBaseGenomes.Genome"
    -   Non-type search will also search i/o fields now and do fuzzy matching. E.g. "Genome" will match "Annotate Domains in a GenomeSet" (by the name), and "Assemble Reads with MEGAHIT" (by the output object KBaseGenomeAnnotations.Assembly)
-   TASK-1079 - fix problems with code cell rendering and controls.
-   KBASE-5275 - fix title for code cells used to track import jobs.

### Version 3.4.4

-   TASK-932 - fix problem where authentication tokens appear to get lost when a Narrative has been asleep for a while.
-   TASK-956 - fix error handling for the PanGenome viewer (and for other viewers that use the dynamicTable widget).
-   TASK-938 - fix problems and usability in read only mode
    -   Can now double-click on a cell title area to collapse/expand it
    -   Collapse/expand button is now in the top-right of a cell.
    -   Read-only narratives cannot have app inputs modified.
    -   In read-only mode, no data view cells can be added.
    -   In read-only mode, code cells are not editable.
    -   In read-only mode, narrative titles can no longer be edited.
    -   Removed the "config" cog button in the top menu.
    -   Double-clicking markdown content switches to edit mode.
    -   App cells should no longer flash their code area before converting to the widget view on narrative startup.
-   TASK-1041 - when a Narrative is open in multiple locations (whether windows in the same browser with the same user, or different computers all together with different users), and is saved in one location, the other location should now get a notification that it is out of date.
-   PTV-295/TASK-1035 - Fix subdata controls in the App cell's object input area.
-   TASK-816 - Fix problems with a differential expression viewer.
-   TASK-933 - Fixes problems with the volcano plot viewer for expression data.
-   Adds a generic data viewer for all Set data.
-   TASK-1036 - Address problems with FBA Modeling object viewers (FBAModel, Media, etc.)

### Version 3.4.3

-   TASK-877 - fix issue where mismatched App names between different versions caused the App Cell to fail to render.
-   Update Expression Sample widget to better handle failures and only show a single widget tab.
-   TASK-816 - update Volcano Plot viewer to improve functionality and performance with different data types.
-   TASK-141 - update available types for sorting in Data Panel slideout.
-   TASK-922 - fix visual problem where red bars indicating a required app input were not visible in certain browsers.
-   Fixed favorites star in App Panel.
-   TASK-959 - sharing panel wasn't updating properly when sharing privileges were changed in a different window
-   TASK-960 - fix problem where a user with sharing privileges who didn't own the Narrative could try and fail to remove privileges from the owner of that Narrative.

### Version 3.4.2

-   Update base Narrative image to include an Ubuntu kernel security update.
-   Add ETE3 to the environment.
-   PTV-409 - fix problem where copying a Narrative using the "Narratives" panel would only make a copy of the currently viewed Narrative.

### Version 3.4.1

-   Fixed job status widget spamming the kernel with constant update requests.
-   Fixed job status widget not starting its logs as expected.
-   Hide the "outdated job" warning in view only mode so tutorials don't look goofy.

### Version 3.4.0

**Changes**

-   Modified the Sharing dialog to make the actions more clear.
-   Modified the configuration for publicly available data sources.
-   Made global changes to support the new KBase authentication/authorization system.
-   KBASE-5243 - fix problem where Narratives (and probably data objects) were showing a change date one month into the future.

### Version 3.3.0

**Changes**

-   Modified how to select an App from the App Panel, now you can sort and group by category, inputs, outputs, and alphabetically.
-   Update a widget for viewing Pan-Genomes, and the underlying table to show data.
-   Fix a bug that added unnecessary data to logs.
-   Fixed several installation problems and technical dependency issues.
-   Updated front end tests.

### Version 3.2.5

**Changes**

-   Fix problems preventing job logs from being scrolled in apps that are in an error state.
-   Update widgets for viewing Binned Contigs, and the underlying table.
-   Add tests for the above.

### Version 3.2.4

**Changes**

-   Added a viewer widget for Binned Contig objects.
-   Updated the Assembly viewer to improve performance for large Assemblies.

### Version 3.2.3

**Changes**

-   Fixed problems that can occur on initial load (the page with the flashing KBase icons)
-   Further improvements to the sharing interface.

### Version 3.2.2

**Changes**

-   Adjusted flow of job log viewing for data import jobs.
-   Changed Narrative sharing interface, fixed cross-browser incompatibilities.
-   Added new importer apps to the data staging panel.

### Version 3.2.1

**Changes**

-   Added JGI Data policy requirement to the JGI Public Data browser/stager.
-   Fixed a text problem with an FBA viewer tab.

### Version 3.2.0

**Changes**

-   Added a prototype Public Data option to fetch files from JGI and load them into a user's staging area.
-   Fixed problems with the Sharing popover having a very narrow text box.
-   Updated the Search area to retrieve data from the updated service.
-   Introduced a new Selenium-based browser testing harness.
-   Bumped version of Jupyter Notebook to 4.4.1, IPython to 5.3.0, and IPywidgets to 6.0.0.

### Version 3.1.12

**Changes**

-   Adjusted look and feel of group parameters in app cells.
-   Fixed problems with RNA-seq viewer widgets.
-   Added new categories to the Public data dropdown.
-   Data should now be downloadable in read-only mode.
-   Added a taxonomy viewer widget.

### Version 3.1.11

**Changes**

-   Fixed a problem where the job log in app cells would continue to poll after the job had finished, or after a user had clicked onto a different tab.
-   Fixed a problem with the Hisat viewer widget not working properly.
-   Grouped parameters in apps should now group in the proper order.
-   Minor adjustments to the ordering of buttons in dialog boxes (cancel buttons go on the left, active actions go on the right).
-   Change text of copy button in view only mode.
-   Adjust workflow of Narrative copying in view only mode to make more sense and prevent multi-clicking the copy button.

### Version 3.1.10

**Changes**

-   Fixed broken Import tab in the data slideout.
-   Adjusted text in staging area tour.
-   Fixed issue in App cells where the tab buttons could crowd each other out.
-   Adjusted behavior of slider buttons in volcano plot widget to be more performant.

### Version 3.1.9

**Changes**

-   Expanded the reach of the front end code compiler.
-   Adjusted the logic of job polling to only poll jobs that are currently attached to Narrative cells and running.
-   Changed what publicly available data is visible.
-   Fixed data panel timestamps in Safari.
-   Fixed sharing user lookup input field in Safari.
-   Made many visual improvements to the app cell.

### Version 3.1.8

**Changes**

-   JIRA TASK-434 Made improvements to speed up loading and (hopefully) improve stability.
-   JIRA TASK-439 Fixed a problem with adding inputs to subselected parameters in apps.
-   JIRA TASK-440 Advanced dropdowns should now have the right horizontal size when un-hidden.
-   Made a change to publically available data - Phytozome genomes are now just part of the genomes list.
-   Fixed issue with viewer cells not rendering properly.
-   Enable a tab that displays which output objects were created in a report viewer.

### Version 3.1.7

**Changes**

-   Fixed an issue where if looking up any job status fails, all job statuses fail to update.
-   Fixed problems with viewing RNA seq object viewers.
-   Fixed a problem with displaying output widgets for many apps.

### Version 3.1.6

**Changes**

-   Created a help menu with some options migrated from the hamburger menu.
-   Fixed staging area uploader configuration to keep up with uploader app changes.
-   JIRA TASK-378 Fixed issue with app parameters not always enforcing "required" constraint.
-   Fix label display in app report viewer.
-   Fix import job panel not updating job status.
-   Minor tweaks to labels in volcano plot viewer.

### Version 3.1.5

**Changes**

-   Added staging area uploaders for Genbank files, and SRA reads.
-   Fixed (other) problems with backend job lookup.
-   Changed group parameters toggle look and feel.
-   Fixed minor UI problems with volcano plot.
-   Fixed potential problem with Cummerbund output viewer.

### Version 3.1.4

**Changes**

-   Linked the new reads uploaders to the staging panel.
-   Wired the staging panel to include the subpath (not the username, just any subdirectories) in the input to uploaders.
-   Linked the staging panel to get its uploader specs from a source that includes the currently selected version tag.
-   Added configuration for several data panel properties (max number of items to fetch, etc.).
-   Added a semaphore lock that prevents any backend job lookup calls from being made before the channel is ready.

### Version 3.1.3

**Changes**

-   Fixed bug where read-only Narratives were still interactive (apps had run and reset buttons)
-   Fixed bug where copying a read-only Narrative created a bad forwarding URL.

### Version 3.1.2

**Changes**

-   Do an autosave after starting an import job.
-   Hide the code area for the 'Job Status' widget, whenever that widget gets instantiated.
-   Remove 'Object Details...' button from data viewers (it's just hidden for now).
-   In the App Cell Report tab, remove 'Summary' or 'Report' areas if either of those are missing.

### Version 3.1.1

**Changes**

-   Optimized how job status polling works.

### Version 3.1.0

**Changes**

-   Release of ReadsSet viewer and Reads viewer.
-   Release of support for data palettes (currently disabled in the service)
-   Data now gets fetched from a Narrative Service to support data palettes.
-   Support for an FTP-based data file staging area (currently disabled until import apps catch up).
-   Fixed issue where an undefined app_type field would cause a crash while instantiating an app cell.

### Version 3.1.0-alpha-4

**Changes**

-   Adjust visuals in Reads viewer.
-   Adjust tooltip for objects from other Narratives.
-   Changed functionality of object copying in data slideout.

### Version 3.1.0-alpha-3

**Changes**

-   Updated ReadsSet viewer and Reads viewer.
-   Modified icons for elements from an external Narrative.
-   Improved usability for set editors.
-   Fixed missing upload functions bug.
-   Fixed issues with Narrative copying (from the Narratives panel)

### Version 3.1.0-alpha-2

**Changes**

-   Fixes problem with data hierarchy when sub-elements are from a different Narrative.
-   Puts a visual label on things from another Narrative.

### Version 3.1.0-alpha-1

**Changes**

-   Introduces the concept of data sets with hierarchical manipulation.
-   Sets objects should be able to expand and contract, showing sub objects.
-   Adds Apps that can manipulate data sets (currently only Reads Sets).
-   Rewires all data manipulation code to use a different service.

### Version 3.0.2

**Changes**

-   Fixed bug preventing the "Annotate Microbial Genome" app (and others that make use of randomized input strings) from launching.
-   Fixed another bug with CSS files.

### Version 3.0.1

**Changes**

-   Fixed bug with path to some CSS files.
-   Fixed error where an update to old viewer cells would just produce code that would crash.
-   Fixed error where updated app cells containing Apps made with the KBase SDK weren't updated properly.

### Version 3.0.0

**Changes**

-   Final 3.0.0 release!
-   Adjust data import user experience.

### Version 3.0.0-alpha-23

**Changes**

-   Major updates to the App Cell UI
    -   Restructured so each view is a separate tab.
    -   Added a status icon for each App state.
    -   Adjusted failure modes to be more descriptive.
    -   Integrated Report view under Results tab.
    -   Moved many of the sprawling toolbar buttons into a dropdown menu.
    -   Added a modal Info dialog for each app (in toolbar menu).
    -   Remove Jupyter's prompt area... which might cause more problems.
-   Fixed various problems with Jupyter's command-mode shortcuts (again).
-   Import panel should disappear and scroll to running import Job on Import.
-   Changes to improve performance and visibility of Genome Viewer widget.
-   Added an interactive tour for the Narrative (in the hamburger menu).
-   Cells should now all be deleteable in all cases.
-   Updated Ontology view widgets to use tabs.
-   Fixed automated front end test apparatus.

### Version 3.0.0-alpha-22

**Changes**

-   First pass at an inline clickable interface tour.
-   Fixed problems with Jupyter's command-mode shortcuts overriding whatever they wanted to.
-   Updated front end tests so they should function more seamlessly.
-   Add GenomeAnnotation support to genome, pangenome, and proteome comparison viewers.
-   Add warning for out of date apps.

### Version 3.0.0-alpha-21

**Changes**

-   Applied module release version to that module's method specs.
-   Fixed regression preventing cell deletion in some conditions.
-   Added module commit hash to App dropdowns in App Panel for beta and dev Apps.
-   Added 401 error when the Narrative handler is unauthenticated.
-   Addressed issues with job cancellation.

### Version 3.0.0-alpha-20

**Changes**

-   Fixed custom parameter widgets.
-   Improved error catching within App Cell.
-   Updated Docker container invocation methods on Narrative Server.
-   Updated Dockerfiles to use new versions of a few dependencies.
-   Fixed DomainAnnotation viewer widget.
-   Updated Data API-based widgets to use latest clients.
-   Added prompt with report option (not working yet) when the JobManager fails to initialize.

### Version 3.0.0-alpha-19

**Changes**

-   add latest workspace python client
-   update narrative usage of ws client since ServerError has moved

### Version 3.0.0-alpha-18

**Changes**

-   revert python workspace client for now (breaks narrative launch)
-   fix error widget for output cell

### Version 3.0.0-alpha-17

**Changes**

-   fix checkbox validation bug
-   fix viewer widget not getting the cell id and therefore not rendering
-   update python workspace client to latest

### Version 3.0.0-alpha-16

**Changes**

-   fix multiple object input widget
-   remove execution summary widget
-   updated kbase client api lib to bring in updated workspace client

### Version 3.0.0-alpha-15

**Changes**

-   fix output param marked as parameter triggering error and blocking app cell insertion
-   improve error message when checkbox is misconfigured
-   improve checkbox rules display

### Version 3.0.0-alpha-14

**Changes**

-   fix job cell (as produced by JobManager()->job_info())
-   relax enforcement of object output name input widget being categorized as an "output" control
-   fix tab label and job count badge in job panel
-   more progress on custom subdata, binary, and select controls

### Version 3.0.0-alpha-13

**Changes**

-   Fix display of data objects drag-and-dropped or clicked from the data panel
-   Job status lookup and error handling improvements
-   Fixed bug in handling app results
-   Initial implementation of viewers for new objects
-   Fixed ontology dictionary

### Version 3.0.0-alpha-12

**Changes**

-   Fixed JobManager.list_jobs (again)
-   Reconnected the 'scroll to app' button in the Jobs panel to existing App Cell widgets
-   Removed the Scroll to App button from Jobs that don't have an accompanying cell to scroll to (might be confusing, still).
-   Fixed a constant spam of Job info from the kernel on page refresh.
-   Restored multiselection in subdata inputs.

### Version 3.0.0-alpha-11

**Changes**

-   Fixed Narrative metadata to contain a proper list of Apps for showing on the Dashboard.
-   Updated read only mode
    -   Codemirror elements (markdown cell and code cell input areas) are visible, but not editable
    -   App Cells get their button bars hidden
    -   Output areas get their delete areas hidden
    -   Cell toolbars get their buttons hidden (maybe all but the collapse and code toggles should be hidden?)
-   Tweaked placeholder text of Markdown cells.

### Version 3.0.0-alpha-10

**Changes**

-   Pressing the Enter key should trigger a positive reponse on most dialogs (e.g. if there are Yes or No options, it should select Yes)
-   Only the user who started a job can delete it (except for owners of a narrative... that's all confusing, though, so it's only users who started a job now).
-   The Jobs Panel should now show the owner of a job as registered with UJS.
-   Canceling a job from an App cell will attempt to delete it, and at least, cancel it.
-   Canceled jobs are treated as Deleted by the App cell.
-   Added configuration for the service_wizard client - mild refactor to how configs get loaded.

### Version 3.0.0-alpha-9

**Changes**

-   Restore app and viewer cell icons to their rightful place
-   Minor string tweaks
-   Minor CSS tweaks
-   First pass at setup for optionally using Dynamic services for getting widget subdata

### Version 3.0.0-alpha-8

**Changes**

-   Fix various problems with subdata input widget - selecting multiple when only one should be allowed, pathway issues into data object, etc.
-   Convert execution area back to tabbed items.
-   Add catalog link back to toolbar.
-   Fix launch start time bug.
-   Remove millisecond counts from times.
-   Add icon to tab in tabset.
-   Make use of updated cancel job function in UJS (gonna need some iteration on this once the UJS change goes up)

### Version 3.0.0-alpha-7

**Changes**

-   Updated invocation signatures for AppManage.run_app, .run_local_app, WidgetManager.show_output_widget -- inputs to apps (and widgets) must now be a map where the keys are the input ids and the values are the inputs themselves. See this PR for details: https://github.com/kbase/narrative/pull/679
-   Newly generated output cells auto-hide their input areas (still not ideal, since it's the generated widget, but... it's a start).
-   Fixed a couple UI typos

### Version 3.0.0-alpha-6

**Changes**

-   App parameter validation updates:
    -   Empty strings in either text fields or dropdowns get transformed to null before starting the app
    -   Empty strings in checkboxes get transformed to false
-   Log view in App cells has blocky whitespace removed
-   Multiple textarea inputs (currently unused?) has improved support
-   App cell layout has been updated to remove most excess whitespace
-   Improved error and warning handling for Apps. (e.g. pre-existing output object names can be overwritten again, but now there's a warning)
-   '-' characters are not allowed in App parameter ids. They must be representable as variable names (still up for debate, but that's how it is now)

### Version 3.0.0-alpha-5

**Changes**

-   Fixed issue when starting SDK jobs from the upload panel with numeric parameters.
-   Fixed crash bug when trying to unpack a finished job that has incomplete inputs.
-   Shut off Jupyter command-mode quick keys when a text parameter input is focused.

### Version 3.0.0-alpha-4

**Changes**

-   Improve error reporting when failing to load a viewer.

### Version 3.0.0-alpha-3

**Changes**

-   Replace RNA-Seq viewers that had wandered off
-   Display SDK methods for various uploaders

### Version 3.0.0-alpha-2

**Changes**

-   Fix updater so that it updates the Markdown cell version of viewer cells into pre-executed code cells that generate viewers. (So, updated viewers should work again)
-   Fix Docker image so that it doesn't spam the annoying SSL errors in all cells.
-   Put code area toggle on all code cells at all times. (Just to give Erik and I something to argue about)

### Version 3.0.0-alpha-1

**Major Updates**

-   Apps and Methods not made as part of KBase SDK modules are now obsolete and will no longer run. Those apps have been replaced with Markdown cells that note their obsolescence, but still give the name and set of parameters used in the apps for reference. This also gives suggestions for updated apps (that will be available in production eventually...)
-   The distinction between "App" and "Method" has been removed. All cells that execute KBase jobs are now referred to as Apps.
-   All app cells are now based on Jupyter code cells (previously they were based on heavily modified Markdown cells). This means that they generate code that gets executed in the same way that any other code does. This also introduces a KBase Jobs API that gives programmatic access to running Apps. See docs/developer/job_api.md for details.
-   All output and viewer cells are now code cells as well. Existing viewers are still based on Markdown cells, and should work as previously.
-   All visualization widgets had their initialization code slightly modified. See docs/developer/narrative_widgets.md for details.

**Other Changes**

-   Update Jupyter to version 4.2.1.
-   Update IPython kernel to version 5.0.0.
-   Adds a settings menu for editing user options (prototype).
-   App cells tightly validate each input before generating runnable code - until all required inputs are valid, no code can be run.
-   The Jobs panel gets its information pushed from the kernel, and that from communicating with back end servies. Job information is no longer stored in Narrative objects.
-   Running Jobs are associated directly with a Narrative, and inherit its view permissions accordingly; if you can view a Narrative, you can view its running jobs.
-   Copying a shared Narrative no longer copies its Jobs - copying a Narrative with running Jobs will not copy the results.
-   Updated the job log widget to no longer fetch all lines of a running log. It has a limit of 100 lines at a time, with buttons to navigate around the log.

### Version 2.0.9

**Changes**

-   Small changes to viewer widgets - esp. genome viewer and expression data viewer.
-   Fixed overlapping sort icons in tables - JIRA ticket KBASE-4220.

### Version 2.0.8

**Changes**

-   Numerous small fixes to text and layout of various widgets.
-   Genome view deals with plants and eukaryota better.
-   Proteome comparison widget uses SVG now.
-   Tree browser widget is properly clickable again.
-   Ontologies, Assemblies, and GenomeAnnotations are uploadable.
-   Fixed several issues with Narrative copying (see JIRA tickets KBASE-2034, KBASE-4140, KBASE-4154, KBASE-4159, NAR-849, and NAR-850).

### Version 2.0.7

**Changes**

-   Fixed data subsetting parameter input.

### Version 2.0.6

**Changes**

-   Fixed local configuration issue with Public and Example data tabs.
-   Updated genome viewer widget to better support eukaryotic genomes.
-   Added sequence category to app catalog.
-   Added Release/Beta method button toggle that should show up in production mode.
-   JIRA NAR-846 - fix problem with Run Time in jobs panel reported as "how long ago"

### Version 2.0.5

**Changes**

-   Fixed problems with missing data from Public data tab.
-   Added separate configuration file for Public and Example data tabs.
-   Fixed a few missing vis widget paths.
-   Fixed jitter on data object mouseover.
-   Added 'Shutdown and Restart' option to hamburger menu.

### Version 2.0.4

**Changes**

-   Fixed problems with sharing jobs based on SDK-built methods.
-   JIRA KBASE-3725 - renaming narratives should now trigger a save.
-   Updated widgets for some feature-value methods and data types.
-   Fixed problem where pressing 'enter' while filtering the method catalog would refresh the page.
-   Added categories and new icons to various methods.
-   Removed unused data objects from example data tab.
-   Methods can now specify that no output widget should be created.

### Version 2.0.3

**Changes**

-   JIRA KBASE-3388 - fixed problem that caused a crash on save when too many unique methods or apps were in a narrative. The narrative metadata has been reformatted to support this.
-   Fixed problems with funky unicode characters in narrative titles.
-   Updates to various FBA widgets.

### Version 2.0.2

**Changes**

-   JIRA KBASE-3556 - fixed links from genome widget to gene landing page, made contigs in genome tab clickable.
-   Added tools for editing FBA models.
-   JIRA NAR-838 - delete cell dialog should no longer break when hitting return to trigger it.
-   JIRA NAR-839 - delete cell dialogs should not pollute the DOM (there's only one dialog now, not a new one for each cell).
-   JIRA NAR-589 - change "Copy Narrative" to "Copy This Narrative" for clarity.
-   JIRA NAR-788 - remove light colors from random picker when coloring user names for sharing.

### Version 2.0.1

**Changes**

-   JIRA KBASE-3623 - fixed problem where updating an old version of the Narrative typed object could cause the Narrative title to be lost
-   JIRA KBASE-3624 - fixed links in method input cell subtitles to manual pages
-   JIRA KBASE-3630 - fixed problem with hierarchical clustering widget missing a button
-   Added widget for sequence comparison
-   Added tools for editing FBA model media sets.

### Version 2.0.0

**Changes**

-   Update IPython Notebook backend to Jupyter 4.1.0.
-   Data Panel slideout should now perform better for users with lots and lots of objects.
-   Fixed problem with copied narratives sometimes referring back to their original workspace.
-   Data Panel slideout dimmer should be in the correct z-position now.
-   Added separate job console for each running method, attached to that cell.
-   Changed style of cells to better show what cell is selected and active.
-   Adjusted Narrative Management tab to be somewhat more performant.
-   Updated Narrative object definition to match the Jupyter notebook object definition more closely.
-   Data panel should no longer hang forever on Narrative startup.

### Version 1.1.0

**Changes**

-   Added "Edit and Re-Run" button to method cells that have already been run.
-   Updated 'filtered' in method panel to 'filtered out'.
-   Added uploaders for Feature-Value pair data.
-   Added viewers for BLAST output.
-   Added bokeh (Python) and Plot.ly (JS) dependencies.
-   Added KBase data_api methods.
-   Added a refresh button to the method panel.
-   Added support for method specs based on namespacing.
-   Added preliminary third party SDK support.

### Version 1.0.5

**Changes**

-   Fix for bugs in saving/loading App state and displaying App step output widgets.
-   Fix for a bug that prevented users with edit privileges from saving a shared narrative.
-   Fixed issue where FBA model comparison widget wasn't showing up properly.

### Version 1.0.4

**Changes**

-   Added widgets and methods to support feature-value analyses
-   JIRA KBASE-2626 - Narrative should no longer crash when the Workspace Service is unavailable, but it will produce a 404 error when trying to fetch a Narrative from that Workspace.
-   JIRA NAR-528 - Narrative method panel now allows filtering by input/output type along with additional
    search terms.

### Version 1.0.3

**Changes**

-   JIRA KBASE-1672 - updated text in upload dialogs
-   JIRA KBASE-1288 - show prompt when copying a public genome to a Narrative if that genome already exists in the Narrative
-   JIRA NAR-702 - show warning on My Data panel for untitled Narratives
-   JIRA KBASE-1245 - block the Data Uploader's "Import" button while a file is being uploaded.
-   JIRA KBASE-1350 - change reference to "Workspace" to a reference to "Narrative".
-   Refactored all widget code to be loaded asynchronously through Require.js
-   Added initial Selenium test scripts
-   Updated root README, added Travis-CI and Coveralls badges
-   Linked the Narrative Github repo to Travis-CI and Coveralls

**Bugfixes**

-   JIRA KBASE-1671 - fix typo in genome annotation widget
-   JIRA KBASE-2042 - fix errors in the error page that shows up when a Narrative is unavailable.
-   JIRA KBASE-1843/KBASE-1849 - fixed issue where a large narrative object (e.g. a large IPython notebook object) fails to save without a decent error message. The maximum size was bumped to 4MB, and a sensible error message was introduced.
-   Fixed issue where duplicated results can appear in the Public Data tab
-   JIRA NAR-758 - added a horizontal scrollbar to widgets who get too wide (this currenly only affects the OTU Abundance data table widget, but others might get affected in the future).
-   JIRA NAR-814 - added a trailing slash to the service status url.

### Version 1.0.2 - 2/19/2015

**Bugfixes**

-   JIRA NAR-491 - modified public data panel to get metagenomes of the correct type from the updated search interface
-   Fixed problem where Plant transcriptomes weren't properly rendered in the genome browser
-   Fixed problems in domain annotation widget so it displays properly in different error cases

### Version 1.0.1 - 2/16/2015

**Changes**

-   JIRA NAR-716 - If a app/method finishes with a non-error status, then the results in the step_errors field of the job status aren't shown.
-   Added Lazy Loading to genome widget. Large genomes shouldn't take a long time to load now.
-   JIRA KBASE-1607 - Sort data types in the data slide out panel

**Bugfixes**

-   Fixed an issue where widgets would occasionally not load.
-   JIRA NAR-699, NAR-700 - Made changes to widgets that were producing confusing or incorrect output based on different context.
-   Fixed issue where data panel list sometimes doesn't load.

### Version 1.0.0 - 2/13/2015

## Production release!

### Version 0.6.4 - 2/12/2015

**Changes**

-   Removed most 'View' methods from the Methods panel, except for those required by the Communities tutorials
-   Set the default page title back to "KBase Narrative"

**Bugfixes**

-   In the rename dialog:
    -   Text field wasn't autofocused
    -   Enter button didn't automatically work
-   In other dropdowns, the escape key didn't work properly
-   https://atlassian.kbase.us/browse/KBASE-1586 - fixed parameter checking for min/max ints
-   https://atlassian.kbase.us/browse/NAR-687 - fixed issue with non-loading reactions and compounds for certain gapfilled FBA models
-   https://atlassian.kbase.us/browse/NAR-633 - Rerouted urls to the production site in prep for production release tomorrow. Eep!

### Version 0.6.3 - 2/12/2015

**Bugfixes**

-   https://atlassian.kbase.us/browse/NAR-690 - Missing data types in data panel filter
-   https://atlassian.kbase.us/browse/NAR-692 - Fixed issue that led to drag and drop not working

### Version 0.6.2 - 2/11/2015

**Changes**

-   Adjustments to readonly mode
    -   Added reduced-functionality side panel
    -   Improved copy dialog
-   Added support for uploading Microsoft Excel files with Media and FBAModels

**Bugfixes**

-   https://atlassian.kbase.us/browse/NAR-681 - loading screen blocks out valid HTTP error pages
-   https://atlassian.kbase.us/browse/NAR-682 - loading screen persists when it shouldn't
-   https://atlassian.kbase.us/browse/NAR-688 - 401 errors when unauthenticated don't redirect to kbase.us

### Version 0.6.1 - 2/10/2015

**Changes**

-   Made adjustments to Gapfill viewer widget
-   Added downloaders for PhenotypeSimulationSet and Pangenome

### Version 0.6.0 - 2/10/2015

**Changes**

-   Added a read-only mode for narratives. Users with read-only privileges can only view a narrative, but not change anything, including running functions, since they do not have write privileges anyway. This does come with a copy function that will allow a fork to be made and owned by the user.
-   Header style update, some consistency issues
-   Include old narrative objects under "My Data" and "Shared with me"
-   Show loading icon in communities widgets
-   Renamed CSV Transform API arguments to TSV

**Bugfixes**

-   JIRA KBASE-1411 fix - render issue for protein comparison widget
-   Fixed case where genome object doesn't have any contig info.

### Version 0.5.7 - 2/9/2015

**Changes**

-   Updates to provisioning service to deal with JIRA NAR-660 and overall stability and control
-   Updated urls for FBA service
-   Added new FBAModelSet output viewer
-   Fixed Search API url
-   Adjusted Abundance data table so it can be used as a drag-and-drop widget
-   Updated intro cell text and links from the Narrative side (for this to be actually visible a deploy of ui-common is necessary)
-   Improved genome viewer widget to show all contigs

### Version 0.5.6 - 2/7/2015

**Changes**

-   Updates to FBA model viewer widgets

**Bugfixes**

-   JIRA KBASE-1461 - The config file that contains the Narrative version should no longer be cached in the browser

### Version 0.5.5 - 2/7/2015

**Changes**

-   Minor changes to icons

**Bugfixes**

-   JIRA NAR-657, KBASE-1527 - Fixed problem where a new narrative that hasn't had any jobs in it would fail to save.
-   JIRA NAR-651 - Fixed problem where a user with no narratives would see a constant spinner under the Narrative panel
-   Fixed issue where the Narrative panel would refresh twice on startup

### Version 0.5.4 - 2/6/2015

**Changes**

-   JIRA NAR-639, KBASE-1384 - Added completion time, run time, and queue time tracking for jobs
    -   a new 'job_info' property was added to object metadata, containing the following keys:
        -   'completed', 'error', 'running' = the number of jobs in each state, >= 0
        -   'queue_time' = total time jobs in this narrative have spent in the 'queued' state
        -   'run_time' = total runtime reported by jobs in this narrative
    -   these changes become visible in the jobs panel for finished jobs
-   Optimized genome viewer widget
-   Updated Metagenome viewers
-   JIRA NAR-640 - Added autosaving whenever an output or error cells is created by job status change
-   JIRA NAR-650 - Block view of any queue position unless a job is in the 'queued' state.

### Version 0.5.3 - 2/5/2015

**Changes**

-   More minor icon changes.
-   Changed hard-coded urls to be relative to the config file in many widgets.

### Version 0.5.2 - 2/5/2015

**Changes**

-   Rerouted landing pages to new endpoint
-   Updated Docker container cleanup script to kill unused containers then images
-   Added new gapfill output widget
-   Added new icons, some code cleanup for setting icons
-   Made "corrupt" narrative labels slightly more obvious

**Bugfixes**

-   Fixed problem where data list filter gets confused when searching and changing type filters

### Version 0.5.1 - 2/4/2015

**Changes**

-   Updated data and app icons, and docs about them
-   Added stats tab to metagenome collection view
-   Fixed minor issue with tab highlighting still being bezeled
-   Hid button for method gallery :(
-   Fixed more inconsistent font issues on buttons
-   Modified text on 3-bar menu, added link to dashboard

### Version 0.5.0 - 2/3/2015

**Changes**

-   Refactor to parts of Narrative init module
    -   JIRA NAR-561 Added a version check mechanism - when a new version is deployed, a green button should appear in the header with a prompt to reload
    -   Wired deployment script to emit a version text file that sits in /kb/deployment/ui-common's root
-   Made several style changes - see https://github.com/kbase/narrative/issues/161
    -   Removed edged corners from remaining KBase cells and IPython cells
    -   JIRA NAR-421 - removed header styling from markdown and code cells
    -   KBASE-1196 - changed red ring around running methods to blue ring
    -   Red ring around a cell now only means it's in an error state
    -   Made all separator lines slightly bolder - #CECECE
    -   Added some spacing between login icon and buttons
    -   Updated tab color to a slightly different blue
    -   Added green highlight color as the general use (selected tabs, buttons, etc)
    -   Icons should now be shared between the different data panels and slideout
    -   Added blue color to markdown and code cell buttons, embiggened their icon
    -   Removed superfluous separator line from the top of side panels
    -   Javascript files are now compiled, minified, and tagged with a hash versioning during deployment - the browser should download only one substantial file instead of nearly 100 (!) smallish ones
    -   Cleaned out (commented out) old Javascript widgets that are not necessary for the February release
    -   Added test script for the backend shutdown command to verify it's only possible for an authenticated user to only shut down their own narrative
    -   Added improvements to suggested next steps functionality - now it should pull from the method store instead of being hard-coded
    -   Added custom icons for several datatypes

**Bugfixes**

-   JIRA NAR-586 - fixed error with quotation marks not being used correctly in App info boxes, and links not being rendered properly
-   Fixed several font mismatch issues - in kernel menu, new/copy narrative buttons, error buttons
-   Fixed logic error that led to log proxy causing the CPU to spin
-   Only show job queue position if > 0
-   JIRA KBASE-1304 - fixed race condition that would prevent certain output cells from appearing in apps properly when restarted without saving the output
-   Re-added ability to run the narrative_shutdown command from external hosts

### Version 0.4.9 - 1/30/2015

**Changes**

-   Added some missing metagenome viewer widgets.
-   Updated all JS client code to their most recent compiled versions.
-   Updated Python Narrative Method Store client.
-   Improved layout and structure of job error modal.
-   Improved styling for data view/selector buttons
-   Added downloaders for FBA models, paired-end reads, and single-end reads.
-   Added a 'Copy Narrative' button to narrative panel
-   Added a friendly and potentially helpful message for narrative fatal errors.

**Bugfixes**

-   JIRA NAR-530 - fixed issue with long object names not wrapping in dropdown selectors.
-   JIRA NAR-579 - fixed problem where short-jobs (e.g. viewers) were improperly treated as long-running.
-   JIRA NAR-582, NAR-514 - added better error status checking for job lookups. Now it covers network errors, unauthorized user errors, missing job errors, and generic AWE errors

### Version 0.4.8 - 1/29/2015

**Changes**

-   Fixed issue with input object type for reads ref-lib uploader.
-   Fixed bug with absent red box around long running UJS method
-   Single file download mode was switched off
-   Zip file mode including provenance info was supported for JSON format download
-   Added lots of new icons for data and apps
-   Updated some of the button styles in the data panels

**Bugfixes**

-   Fixed issue with synchronous methods being treated as asynchronous, and not showing any output.

### Version 0.4.7 - 1/28/2015

**Changes**

-   Changed Narrative tutorial link to the new one on staging.kbase.us
-   JIRA NAR-444 - Changed websocket error dialog to something much more user-readable and KBase-appropriate.

### Version 0.4.6 - 1/28/2015

**Changes**

-   Added another separate page when a narrative is not found (not just unauthorized)
-   Added support for single file extraction during download
-   Changed "dna" parameter of plant transcriptome uploader to integer value

**Bugfixes**

-   Fixed issue with deployment script not auto-shutting-down all non-attached instances
-   NAR-500 - completed UJS jobs should stay completed
-   NAR-562 - job deletion should work right, and if a deletion fails, it shouldn't break the jobs panel
-   When a user tries to delete a job, it should always remove that job
-   NAR-484 - long job names should wrap now
-   Fixed more issues with FBA model widgets
-   Fixed boolean properties issues in uploaders

### Version 0.4.5 - 1/28/2015

**Changes**

-   Changed endpoint URLs for transform service and job service
-   Added better error page when a narrative is either not found or unauthorized
-   Made several adjustments to communities visualization widgets

**Bugfixes**

-   Fixed state checking for long-running job registered with the UJS
-   Fixed issue where FBA service can return unparseable results
-   Fixed various problems with FBA model visualization widgets

### Version 0.4.4 - 1/27/2015

**Changes**

-   Updated deployment script to auto-init/update submodules and clear out old versions of provisioned (but unattached) containers,
-   Updates to metagenome widgets to prevent crashes.

**Bugfixes**

-   JIRA NAR-541 - fixed problem with missing datatables header images
-   Removed (again?) a dead pointer to a deprecated/moved javascript file.

### Version 0.4.3 - 1/27/2015

**Changes**

-   Updated Transform endpoint to the production version
-   Updated Gene Domains endpoint to the production version
-   Added kbaseDomainAnnotation widget
-   Added Media, PhenotypeSet, and PhenotypeSimulationSet widgets
-   Moved downloader panel to a separate widget
-   Updated log testing proxy

**Bugfixes**

-   Fixed issue where some workspace/narrative mappings were lost

### Version 0.4.2 - 1/23/2015

**Changes**

-   JIRA NAR-432 - added little red badge in the Jobs header with the number of running jobs
-   Added support for CSV to PhenotypeSet importer
-   Added support for Media importer
-   Added support for importing FBA Models from CSV or SBML
-   Optional dropdown inputs can now pass no inputs if its spec defaults to an empty string
-   Parameter info mouseover icon only appears if the longer info is different from the short hint

### Version 0.4.1 - 1/23/2015

**Changes**

-   Added link to app man page from app cell
-   Importer for FASTA/FASTQ files was switched to a new version

**Bugfixes**

-   Error modal that appears while trying to import data should be visible now, and not below the page dimmer
-   JIRA NAR-477 - Propagating parameters to multiple steps should work correctly now
-   JIRA NAR-516 - special characters should be properly escaped while searching for data now

### Version 0.4.0 - 1/23/2015

These are significant enough changes - mainly the improved data upload support and (mostly) feature complete data visualization widgets - to add a minor version number.

**Changes**

-   Updated URL of tutorial page
-   Updated user-icon link to go to user profile page instead of globus
-   Added features to Gene Domains visualization widget
-   Updated FBA model widgets
-   The 'Search Data' menu item should make a new browser window
-   Added refresh button to data slideout
-   Added example transcriptome data
-   Updated import UI for all supported types
-   Improved error messages in data panel and data slideout

**Bugfixes**

-   Fixed some problems in create_metagenome_set widget
-   JIRA NAR-465 Fixed problem where workspace id wasn't internally available when it should be
-   JIRA KBASE-1610 Fixed issue with selecting multiple genomes for an input to an app

### Version 0.3.18 - 1/22/2015

**Changes**

-   Added a different FBA model viewer widget
-   Changed communities widgets to properly fetch an auth token

**Bugfixes**

-   JIRA NAR-478 - fixed problem where contig count in genome viewer was incorrect
-   JIRA NAR-487 - plant genomes should be copyable now in data slide out
-   JIRA NAR-441 - corrupted Narratives should be properly handled; deleting a Narrative from a workspace via the API shouldn't break the Narrative loading process

### Version 0.3.17 - 1/22/2015

**Bugfixes**

-   Repaired link to FBA model visualization widgets

### Version 0.3.16 - 1/21/2015

**Changes**

-   Added link to KBase internal status page.
-   Added programmatic access to workspace id.
-   KBase cells can now be collapsed and restored.
-   App and Method cells now have a spinning icon while running.
-   A traceback should now appear (where applicable) in the Jobs panel.
-   Added "next steps" at bottom of app/method

### Version 0.3.15 - 1/21/2015

**Changes**

-   Updated type name for Assembly File transform method
-   Added reset button to App cells (method cells still need fixing)
-   Added widgets for metagenome sets

**Bugfixes**

-   JIRA NAR-418 - fixed issue where job error was cleared on panel refresh.
-   Fixed issue where method panel error state wasn't being activated properly.

### Version 0.3.14 - 1/21/2015

**Changes**

-   Updated server-side Narrative management code to always keep a queue of unattached Narrative containers present. When a user logs on, they already have one ready to connect to.
-   Added visualization widget for microbial community abundance and boxplots.
-   Method details and documentation are visible in a new window now.
-   Added app and method icons for the method panel.
-   Added minimize to app & method panels

### Version 0.3.13 - 1/20/2015

**Changes**

-   Added Transform service client code
-   Exposed transform service as a method
-   Added assembly view widget
-   Added icons for Apps and Methods in panel

**Bugfixes**

-   Now inserts a cell instead of freezing when DnD of data onto empty narrative
-   JIRA NAR-388 - fixed a problem where errors on service invocation weren't being stringified properly before logging
-   Github issue #162 fixed - drag and drop data onto an empty Narrative now doesn't lock up
-   JIRA NAR-402 - saving a Narrative updates the Manage panel
-   JIRA KBASE-1199 - newly registered jobs should show a timestamp
-   KBASE-1210 - (not totally fixed) - debug info for launched methods should show up on the console now.
-   NAR-400, KBASE-1202, KBASE-1192, KBASE-1191 - these were all related to the apps not properly catching errors when an output widget fails to render
-   fixed a case where a typespec references a non-existent viewer

### Version 0.3.12 - 1/20/2015

**Changes**

-   Fixes issue where the Method Gallery overlay panel wouldn't be populated if there were any problematic method/app specs.
-   Added a link to directly submit a JIRA ticket from the pulldown menu.

### Version 0.3.11 - 1/16/2015

**Changes**

-   Running Apps and Methods have a "Cancel" button associated with them. Clicking that will restore the cell to its input state, and cancel (and delete) the running job
-   Deleting App/Method cells now prompts to delete, warning the user that it'll kill any running job (if they've been run before)
-   Deleting jobs now triggers the call to the right back end services to delete the running job itself.
-   Deleting a job from a running cell now unlocks that cell so its inputs can be used again.
-   A dangling job with no associated cell should properly error.
-   A dangling job on the front end that's been deleted on the back should properly error.
-   A job in an error state (not the above, but a runtime error) should now reflect an error on its associated cell (if present)
-   Fixed an error where running a method automatically made an output cell connected to incomplete data.
-   Refactored Jobs panel to only look up jobs that are incomplete (e.g. not 'error', 'completed', 'done', or 'deleted')
-   Toolbars should only appear over IPython cells now (KBase cells have their own menus)
-   Styled app/method control buttons to be closer to the style guide / mockup.
-   Logging of apps and methods is substantially less ugly and made from fewer backslashes.

### Version 0.3.10 - 1/16/2015

**Changes**

-   Narrative panel supports copy/delete/history/revert of narratives.
-   Narrative panel shows apps/methods/description (if exists) for each narrative.
-   Links to LP for genomes and genes were added in Proteome Comparison widget.
-   'Download as JSON' button was added for objects in narrative data list.
-   Links to LP were added for genes in genome viewer.
-   ContigSet viewer was added.
-   Plant genomes were added into public data tab (and GWAS types were removed).
-   Fixed problem where error cells were not being shown properly.
-   Added several widgets to support communities apps and methods.

### Version 0.3.9 - 1/14/2015

**Changes**

-   Restyled menu bar buttons - 'about' button is now under the dropdown menu on the upper left of the screen, removed the global 'delete cell' button (for now!)
-   Restyled code and markdown cell buttons in the lower right corner of the page
-   Added a debug message that appears in the browser's Javascript console whenever an app/method object is sent to the NJS
-   App and Method specs should be globally available to all elements on the page from the method panel
-   Various styling adjustments on the data panel overlay
-   The 'more' button under each app and method in the methods panel should now link to an external manual page

### Version 0.3.8 - 1/13/2015

**Changes**

-   Drag and drop data and data viewer bug fixes.
-   Position of a queued job should now be tracked in the job panel.
-   The Narrative object metadata now tracks the number of each type of cell in that Narrative. Method and App cells are further tracked by their id.

### Version 0.3.7 - 1/12/2015

**Changes**

-   Fix for int, float and array types of input sending to NJS
-   Fix for empty parameter values in import tab
-   Support was added into public data for meta-genomes and 6 types of GWAS
-   Fixed 'Add Data' button in a new Narrative - should properly open the data overlay now
-   Updated layout and styling of Method Gallery overlay to be closer to the mockup

### Version 0.3.6 - 1/9/2015

**Changes**

-   Changed install.sh - now it requires an existing Python virtual environment for installation
-   Removed text/code cell buttons from method panel - they've now migrated to the lower right side of the page.
-   Started restyling various elements to match the new style guide (colors, shadows, etc.)
-   Inserted (better) icons than just letters for data objects
-   Public data tab on side panel was redesigned. Genome mode using search API is now the only supported mode there.
-   Method cell changes
    -   Fixed problem where starting a long-running method would immediately show an output cell with broken results
    -   Fixed problem when submitting a method with numerical value inputs
    -   Fixed problem when submitting a method with multiple possible output types for a single parameter
    -   Fixed problem where method cell parameters were not being properly validated before sending the job
-   Added document that details app failure points
-   Data list supports deleting, renaming, reverting objects

### Version 0.3.5 - 1/7/2015

**Changes**

-   Added link to release notes in 'About' dialog.
-   Removed old links from the Navbar menu.
-   Added separate 'Jobs' tab to side panel.
-   Fixed problem with Job errors overflowing the error modal.
-   Method panel changes
    -   The magnifying glass button should now toggle the search input.
    -   Added a 'type:_objecttype_' filter on methods and apps. This filters by their parameters. E.g. putting 'type:genome' or 'type:KBaseGenomes.Genome' in there will only show methods/apps that have a genome as a parameter.
    -   Added an event that can be fired to auto-filter the methods and apps.
    -   Updated the style to a more 'material' look.
    -   All specs are now fetched at Narrative startup. This will speed up some of the in-page population, but any apps with errors in their specs are no longer displayed in the list.
    -   Removed the '+/-' buttons for expanding the tooltip, replaced with '...'
-   Data list changes
    -   Added a big red '+' button to add more data.
    -   Updated the style to a more 'material' look.
    -   Removed the '+/-' buttons for showing metadata info, replaced with '...'
-   Import tab on GetData side panel allows now to upload genome from GBK file, transcriptomes from Fasta and short reads from Fasta and Fastq
-   Viewers can be open for main data types by drag-n-drop objects from Data panel to narrative
-   States of long running methods calling services are now shown on Job panel and Job panel waits for 'Done' state before show output widget
-   Added a 'debug' viewer to the apps. After starting an app's run, click on the gear menu in the app cell and select 'View Job Submission'. This will both emit the returned kernel messages from that app run into your browser's Javascript console, and it will create and run a code cell that will show you the object that gets set to the Job Service.

### Version 0.3.4

**Changes**

-   Redesign of the Method Gallery panel
-   Adjusted Data Panel slideout to maintain its size across each internal tab
-   Added buttons to the footer in the Data Panel slideout
-   Adjustment to data upload panel behavior.

### Version 0.3.3

**Changes**

-   Long running method calls that produce job ids should now be tracked properly
-   Method cells behave closer to App cells now - once they start running, they're 'locked' if they're a long running job
    -   Long running method cells get a red ring, similar to steps inside an app
    -   The next step is to merge their code bases
-   When a long running method cell finishes (the job gets output and is marked 'done' or something similar), an output cell is generated beneath it
-   Method and app jobs should be properly deleteable again.
-   Added global 'delete cell' button back to the menu bar.
-   Made major styling and functionality changes to the 'import' panel attached to 'data'

### Version 0.3.2

**Changes**

-   Steps toward getting long-running methods (not just apps) working.
-   Modified job panel to consume method jobs
-   Method jobs still do not correctly populate their end results.

### Version 0.3.1

**Changes**

-   Changed some text in the data panel, and what appears in the introductory markdown cell in a new Narrative
-   Fixed an issue with infinite scrolling under the "My Data" and "Public" data tabs

### Version 0.3.0

**Changes**

-   Added Method Gallery for browing methods and apps and viewing information
-   Added a manual Narrative Shutdown button (under the 'about' button)
-   Integrated code cells and IPython kernel management
-   Added prototype Narrative Management panel

### Version 0.2.2

**Changes**

-   Restyled Jobs panel, added better management controls, added ability to see Job error statuses
-   Added first pass at data importer

### Version 0.2.1

**Changes**

-   More improvements to logging - includes more details like user's IP address, Narrative machine, etc.
-   Changed data panel to be able to draw data from all other Narratives and Workspaces
-   Stubs in place for importing data into your Narrative
-   Changed paradigm to one narrative/one workspace for simplicity

### Version 0.2.0

**Changes**

-   Switched to semantic versioning - www.semver.org
-   Began massive changes to the UI
-   Improved logging of events and method/app running
-   Introduced App interface
-   Added a Job management panel for tracking App status
-   Switched to fetching lists of Methods and Apps from a centralized method store

### Release 9/25/2014

**Changes**

-   Fixed a bug that prevented a few Narrative functions from working if the
    user's workspace was empty.

### Release 9/24/2014

**Changes**

-   Updated workspace URL from the Narrative Interface

### Release 8/14/2014

**Changes**

-   Added functionality to Communities services

### Release 8/8/2014

**Changes**

-   Fixed problems with loading page in Safari
-   Added genome comparison widget

**Known Issues**

-   R support is problematic
-   Sharing a Narrative with a running job might break
-   Loading a Narrative with a large amount of data in it might be slow
-   Mathjax support is currently out of sync due to version drift

### Release 8/7/2014

**Changes**

-   Fixed links to landing pages linked to from the Narrative
-   Fixed problem with KBCacheClient not loading properly
-   Adjusted names of some functions (existing widgets might break!)
-   Fixed 502 Bad Gateway error on Narrative provisioning

**Known Issues**

-   Loading page on Narrative provisioning sometimes loops too much in Safari
-   R support is problematic
-   Sharing a Narrative with a running job might break
-   Loading a Narrative with a large amount of data in it might be slow
-   Mathjax support is currently out of sync due to version drift

### Release 8/6/2014

**Changes**

-   Services panel is sorted by service name now
-   Removed old Microbes Service panel
-   Updated Microbes service methods
-   Updates to picrust
-   Added ability to make deprecated services invisible
-   Updates to RNASeq and Jnomics services
-   Updates to plants widget code
-   Visual fixes to how long function names are handed in the Services panel

**Known Issues**

-   R support is problematic
-   Many links to landing pages within the Narrative are broken
-   Sharing a Narrative with a running job might break
-   Loading a Narrative with a large amount of data in it might be slow
-   Mathjax support is currently out of sync due to version drift

### Release 8/5/2014

**Changes**

-   Added a better fix to the "NoneType object has no attribute get_method" error
-   Updated Microbes services code, split services into 4 separate groups
-   Updates to Jnomics
-   Split picrust widget into qiime and picrust
-   Fixes to plant gene table size and heatmap rendering

**Known Issues**

-   Changing Narrative name in the workspace doesn't propagate inside of the Narrative itself (likely won't fix)
-   R support is problematic
-   Many links to landing pages within the Narrative are broken
-   Sharing a Narrative with a running job might break
-   Loading a Narrative with a large amount of data in it might be slow
-   Services panel should be sorted/sortable
-   Narrative creator and current workspace should be visible in the top panel
-   Mathjax support is currently out of sync due to version drift

### Release 8/4/2014

**Changes**

-   Added MathJax.js directly into the repo to combat problems on the back end (this is a temporary fix - we need to install the backend MathJax locally somehow, or update the version)
-   Added a fix where if a call to globusonline fails, the Narrative doesn't initialize properly, leading to broken service panels.
-   Fixed a bug that caused some graphical widgets to time out while loading their script files.
-   Various updates to plants_gwas.py and jnomics.py

### Release 8/1/2014

**Changes**

-   Addressed issue with auth information getting overridden (leading to the 400 HTTP error)
-   Addressed problems that cause the 502 Bad Gateway error
-   Revised names and descriptions on some widgets
-   Added widget to build a genome set from a tree
-   Revised gapfilling and phenotype view widgets
-   Numerous widgets to GWAS and Plant-specific widgets and functionality

**Known Issues**

-   Current version of jquery.datatables is finicky and can create popup errors. These can be safely ignored.
-   Changing Narrative name doesn't properly update Narrative object name in Workspace Browser and vice-versa.
-   R support is occasionally problematic.

### Release 7/30/2014

**Changes**

-   Updated config to make landing page links relative to deployment site
-   Modified provisioning code to address a potential timeout issue (the 502 Bad Gateway error)
-   Adjusted RAST genome loading widget to ignore browser's credentials
-   Updated NCBI genome importer
-   Updated GWAS services endpoints

**Known Issues**

-   Cookie with auth information occasionally gets overwritten with a useless one - logging out and back in will fix this
-   Changing Narrative name doesn't properly update Narrative object name in Workspace Browser and vice-versa.
-   R support is occasionally problematic.

### Release 7/29/2014

**Changes**

-   Updated nav bar to match changes to functional site
-   Updated many KBase functions from all domains (Microbes, Communities, and Plants)
-   Added widgets and functions for viewing SEED functional categories
-   Added a version date-stamp
-   Updated look and feel of many elements
-   Updated authentication and token management to behave better
-   Changed Narrative containers to all be named kbase/narrative:datestamp
-   Updated config.json to reference more deployed services
-   Added an input widget type that includes a hidden, untracked, password field
-   Updated references to registered typed objects from the Workspace
-   Fixed a problem where Services panel might get stuck and hang while loading a large Narrative
-   Updated more HTTP errors to have a sensible error page

**Known Issues**

-   Cookie with auth information occasionally gets overwritten with a useless one - logging out and back in will fix this
-   Unaddressed issues from previous release

### Release 7/22/2014

**Changes**

-   Added widgets and functions for viewing phylogenies

### Release 7/21/2014

**Changes**

-   Updates to Jnomics functions and widgets
-   Updates to Microbes functions and widgets
-   Most errors that were dumped to the browser as ugly stacktraces are now KBase-styled stacktraces that should be slightly more legible.
-   Errors that occur when Narrative saving fails now creates an error modal that communicates the error, instead of just "Autosave Failed!"
-   Deployment of Narrative Docker containers has changed. A base container is built containing most static dependencies (all the apt-get directives, Python and R packages). This container is then updated with the Narrative itself. After building the base container, deployment of subsequent releases should take ~2 minutes.
-   Updated workspace type registry (the kbtypes class) to be up-to-date with the current state of the Workspace.
-   The Narrative should now report unsupported browsers

**Known Issues**

-   Unaddressed issues from previous release

### Release 7/15/2014

**Changes**

-   Created a service endpoint config file to toggle between dev and prod versions of various services
-   Added Jnomics functions and widgets
-   Added more communities functions and widgets
-   Added KBase-command functions and widgets
-   Authentication should work more logically with the rest of the functional site
-   Updated Narrative typespec to support workspace version 0.2.1
-   Updated Narrative to properly access search
-   Addressed a race condition where saving a Narrative before it completely loads might wipe exiting parameter info out of input fields
-   Added directions on how to deploy the entire Narrative/Nginx provisioning stack.
-   We now have a verified SSL Certificate - Safari should work over HTTPS now.
-   Did some CSS adjustment to GUI cells.

**Known Issues**

-   Unaddressed issues remain from previous release
-   R support is occasionally problematic.
-   Changing Narrative name doesn't properly update Narrative object name in Workspace Browser and vice-versa.

### Release 6/20/2014

**Changes**

-   %%inv_run cell magic should now work properly
-   %inv_run magic (line and cell) now translate some convenience commands
    -   %inv_run ls == %inv_ls
    -   %inv_run cwd (or pwd) == %inv_cwd
    -   %inv_run mkdir == %inv_make_directory
    -   %inv_run rmdir == %inv_remove_directory
    -   %inv_run cd == %inv_cd
    -   %inv_run rm == %inv_remove_files
    -   %inv_run mv == %inv_rename_files
-   The menu bar should remain at the top of the page now, instead of being positioned inline with the rest of the narrative document.

**Known Issues**

-   %inv_ls to a directory that doesn't exist will create a generic, not-very-informative error.
-   [NAR-153], [NAR-177] A generic "Autosave failed!" message appears when the narrative fails to save for any reason.
-   [NAR-169] Using Safari through HTTPS will not work with an uncertified SSL credential (which we currently have)
-   [NAR-173] If problems external to the Narrative prevent loading (authentication, Shock or WS downtime), an ugly stacktrace is dumped into the browser instead of a nicely rendered error page.
-   [NAR-180] Copying narratives in the newsfeed can cause errors.
-   [NAR-179] There's a problem that occurs when logged into a narrative for a long time.
