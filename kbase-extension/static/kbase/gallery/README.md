# Gallery

The gallery presents static html pages which demonstrate isolatable aspects of the Narrative. This simple demo system is particularly suitable for ui components.

Gallery pages are available from an index page, e.g. `https://ci.kbase.us/narrative/static/kbase/gallery/index.html`. The files are located in `kbase-extension/static/kbase/gallery`.

## Creating a Demo Page

- Start from an existing gallery page, assuming `template.html`
- Edit the head title appropriate, replacing `TEMPLATE` with the name of the component or file being demoed
- edit the `H1` title, similarly
- add a section per demo (see below)
- add matching rendering code in the `script`
- add a link to the demo in the main `index.html` page

## Gallery Page Layout

- header which includes required components:
  - javascript
    - `require.js` for AMD
    - `common.js` for bootstrap AMD configuration

  - stylesheets
    - `style.min.css` for the Jupyter notebook styles (e.g. bootstrap)
    - `common.css` for some styles used in demo pages
    - `all_concat.css` to include the bulk of the KBase Narrative styles title
    - In the title, replace `TEMPLATE` with the class or filename being demoed

- body
  - H1 title describing what is being demoed, replace `TEMPLATE` with the class or filename being demoed

  - A section for each demo
    - `H2` title for each demo
    - a sentence or short paragraph to describe the demo
    - `div` with class `"Example"` to wrap the demo
    - within this, a `div` with a unique id (will match code below) in which to render the demo

  - script section to invoke the demo
    - code must be wrapped in a `require` of `narrative_paths`

    - code must also be wrapped in a `require` of your component and, optionally, a local data file (or data may be simply included in the script)

    - each demo will render the component into the div already in the page, by id.
      - more complex components which require setup will not be as "simple", of course.
