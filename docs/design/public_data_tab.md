# PubliC Data Tab

The Narrative "Data Slideout" supports a a "Public" tab for browsing, searching, and ultimately copying data objects contained within special "reference data" workspace.

Although all public data sources (at present) are hosted within specific workspaces, the public data browse and search tool may use the KBase Search Engine to access the data. At present only the NCBI RefSeq genomes are accessed through the search service; all others are accessed through direct workspace calls.

## Configuration

All public data sources are defined in a single configuration file located within the Narrative codebase:

```
kbase-extension/static/kbase/config/data_source_config.json
```

Now don't go looking for this file directoy in the public data tab codebase. It is actually loaded early in the Narrative loading process, in narrativeConfig.js

> TODO: it may be better to just load this locally in kbaseNarrativeSidePublicTab.js.

Actually the configuration is now located in:

```
kbase-extension/static/kbase/config/publicDataSources.yaml
```

This config file is documented internally, so we won't belabor it here.

The config file contains a section "sources" which contains one entry per data source.

This config file is used for the following purposes:
    - the order, id, and label are used to create the dropdown control to select the public data source to view
    - The type of source is defined, as well as methods to obtain the data from the data source
    - sorting and filtering configuration
    - display templates

## Assets

A data source may specify an logo to display in association with the data source. For instance, when a datasource is selected, the associated logo will be displayed to the right of the data source selector.

The logos are stored in:

```
narrative/static/kbase/images/logos
```

and are specified on the "logoUrl" property.


## Data source api

[ to be done ]

## Display Template

[ to be done ]

## Searching

[ to be done ]

## Sorting

[ to be done ]

## Appendix

### Related Files

- kbase-extension/static/kbase/config/data_source_config.json
- kbase-extension/static/kbase/images/logos/jgi-mycocosom-logo.png
- kbase-extension/static/kbase/js/widgets/narrative_core/publicDataSource/common.js
- kbase-extension/static/kbase/js/widgets/narrative_core/publicDataSource/searchDataSource.js
- kbase-extension/static/kbase/js/widgets/narrative_core/publicDataSource/workspaceDataSource.js
- kbase-extension/static/kbase/js/widgets/narrative_core/kbaseNarrativeSidePublicTab.js
- kbase-extension/static/kbase/custom/custom.js


#### kbase-extension/static/kbase/config/data_source_config.json
#### kbase-extension/static/kbase/images/logos/jgi-mycocosom-logo.png
#### kbase-extension/static/kbase/js/widgets/narrative_core/publicDataSource/common.js
#### kbase-extension/static/kbase/js/widgets/narrative_core/publicDataSource/searchDataSource.js
#### kbase-extension/static/kbase/js/widgets/narrative_core/publicDataSource/workspaceDataSource.js
#### kbase-extension/static/kbase/js/widgets/narrative_core/kbaseNarrativeSidePublicTab.js