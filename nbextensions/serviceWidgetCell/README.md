# Service Widget Cell

This cell provides an environment allowing a specified remote web app to be run inside an iframe, yet be treated as a local widget.

It earns the moniker "Service Widget" because the web app must be served from a KBase service - either a core service or dynamic service.

The implementation enforces this, although the general design is agnostic.

## Cell Lifecycle

### Jupyter notebook server startup

All KBase cells are created as Jupyter notebook extensions, and are installed in the `nbextensions` directory. Each cell type has it's own directory, with a `main.js` serving as the entrypoint.

The `nbextensions/install.sh` script is responsible for integrating the cell extensions into Jupyter. Each cell is set up with the following lines:

```shell
jupyter nbextension install "${dir}/serviceWidgetCell" --symlink --sys-prefix
jupyter nbextension enable serviceWidgetCell/main --sys-prefix
```

where `dir` is the `nbextensions` full directory path.

### API

A cell is invoked within a Narrative notebook by calling a single function exported from the `main.js` script specified in the second installation line shown above: `load_ipython_extension`.

### Adding Cell

> TODO: write this section

### Loading Cell

> TODO: write this section
