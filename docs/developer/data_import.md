# Data Importing in the KBase Narrative

This document highlights some development details about importing data into the KBase Narrative. For user documentation on how to use it, see the [KBase Data Upload and Download Guide](https://docs.kbase.us/data/upload-download-guide).

## Introduction

The general flow of data goes from an external data source, to files uploaded to the Staging Area, to data objects imported to the Workspace service. The two main user actions here - uploading and importing - are separated by accessing the Staging Service, and running one or more Import apps. Both of these are started by opening the Import tab of the data slideout.

## Staging Service

This fetches the list of files from the Staging service every 
Each row represents one file - these get rendered by the [StagingAreaViewer](../../kbase-extension/static/kbase/js/widgets/narrative_core/upload/stagingAreaViewer.js) module. 

## Data Import

Data import is initiated by selecting one or more data files from the Import tab, then running the Importer app for that data type. When at least one file has a data type chosen and its checkbox selected, the `Import Selected` button will activate. Clicking that will close the slideout and open a Bulk Import cell and/or at least one App Cell with the relative file path entered. File paths are given as the relative path from the root of the Staging Area without the username - the username is assumed and will be added at app run time.

### Importer App Configuration

The data import app selection is configured in [`staging_upload.json`](../../kbase-extension/static/kbase/config/staging_upload.json). This JSON file has the following top-level keys:
* `dropdown_order`: this describes the order of the file selection dropdown. Each item here has an `id` field, which must be unique, and acts as the app descriptor (more in the `app_info` field below), and a `name` field. The `name` field is displayed to the user in the dropdown.
* `bulk_import_types`: This array contains data type `id`s that should trigger a Bulk Import cell. If a user imports at least one file with a data type in this list, it'll map that file and import app into a bulk import cell.
* `app_info`: This object has a set of app ids for keys that map onto info about each app. These keys are used as the app `id`s elsewhere in the configuration.

Each `app_info` object has the following accepted keys:
* `app_id`: the app to use for importing the file in the format `module_name/app_name` (e.g. `kb_uploadmethods/import_genbank_as_genome_from_staging`). This is the only required field.
* `app_input_param`: this is the parameter for setting the file name in the app
* `app_input_param_type`: describes what the `app_input_param` is expected to be. Accepts either `string` or `list` (list of strings)
* `app_static_params`: an object with key-value pairs of other app parameters that should be preset when creating the app cell.
* `app_output_param`: the app's parameter id for the created object
* `app_output_suffix`: an automatic suffix to add to the data file name for a created object. E.g. if the file name is "e_coli.gbk", and the `app_output_suffix` is "_genome", then the automatically set output name will be "e_coli.gbk_genome"
* `multiselect`: originally intended to denote files with multiple inputs, this is not currently implemented

### Configuring a new Bulk Import app
The steps for adding a bulk import app to the configuration are fairly simple.
1. Add the `app_info` object field as described above with a unique id.
2. Add the new data type's id to `bulk_import_types`.

Be aware that as of Narrative 5.0.0 (with the bulk import app MVP), there are several issues to be aware of before adding a new bulk import app:
* Apps that parallelize themselves (e.g. make use of the KBParallel module, or otherwise create extra jobs in the Execution Engine) may not work, or may cause user deadlocking. These are not recommended for use.
* Apps that make use of Grouped Parameters (the `"parameter-groups"` field in an app spec) will not work correctly in a Bulk Import cell.
* Apps that require subobject selection may not work, and have not been tested in the Bulk Import cell.
* Apps that require the use of a dynamic dropdown may not work as expected in a Bulk Import cell. This is especially apparent on page reload once a Bulk Import cell has been configured.
