# Data Importing in the KBase Narrative

This document highlights some development details about importing data into the KBase Narrative. For user documentation on how to use it, see the [KBase Data Upload and Download Guide](https://docs.kbase.us/data/upload-download-guide).

## Introduction

The general flow of data goes from an external data source, to files uploaded to the Staging Area, to data objects imported to the Workspace service and available in the Narrative. The two main user actions here - uploading and importing - are performed by accessing the Staging Service, and running one or more Import apps, respectively. Both of these are started by opening the Import tab of the data slideout.

## Staging Service

The Staging Service acts as a first stop for importing data. This service provides an API to a KBase-hosted file system, where each user has a separate file storage directory under their username. The Narrative front end uses a [REST client](../../kbase-extension/static/kbase/js/api/StagingServiceClient.js) to access that service and manipulate files.

## Staging Service Viewer

Users can interact with the Staging Service through the Import tab of the data slideout. The top portion of this tab is controlled by the [FileUploadWidget](../../kbase-extension/static/kbase/js/widgets/narrative_core/upload/fileUploadWidget.js). This uses [Dropzone](https://www.dropzone.dev/js/) to provide a drag-and-drop interface for uploading files. If the user's account is linked to Globus, a link is also provided. Another option is to upload via URL. This requires running an app that imports data to the Staging Service from an external, public URL.

The bottom portion of the Import tab acts as a file browser and selector for starting the Import process. The staged files get rendered by the [StagingAreaViewer](../../kbase-extension/static/kbase/js/widgets/narrative_core/upload/stagingAreaViewer.js) module. This viewer fetches the list of files from the Staging Service, updating every 30 seconds.

## Data Import

Data import is initiated by selecting one or more data files from the Import tab, then running the Importer app for that data type. When at least one file has a data type chosen and its checkbox selected, the `Import Selected` button will activate. Clicking that will close the slideout and open a Bulk Import cell and/or at least one App Cell with the relative file path entered. File paths are given as the relative path from the root of the Staging Area without the username - the username is assumed to be the root, and will be added at app run time.

### Importer App Configuration

The data import app selection is configured in [`staging_upload.json`](../../kbase-extension/static/kbase/config/staging_upload.json). This JSON file has the following top-level keys:
* `dropdown_order`: this describes the order of the file selection dropdown. Each item here has an `id` field, which must be unique, and acts as the app descriptor (more in the `app_info` field below), and a `name` field. The `name` field is displayed to the user in the dropdown.
* `bulk_import_types`: This array contains data type `id`s that should trigger a Bulk Import cell. If a user imports at least one file with a data type in this list, it'll map that file and import app into a bulk import cell.
* `app_info`: This object has a set of app ids for keys that map onto info about each app. These keys are used as the app `id`s elsewhere in the configuration.

Each `app_info` object has the following accepted keys:
* `app_id`: the app to use for importing the file in the format `module_name/app_name` (e.g. `kb_uploadmethods/import_genbank_as_genome_from_staging`). This is the only required field.
* `app_input_param`: this is the parameter for setting the file name in the app. App specs don't provide an unambiguous parameter for a file input, hence the need for this clarifying element.
* `app_input_param_type`: describes what the `app_input_param` is expected to be. Accepts either `string` or `list` (list of strings). If the given app spec has `allow_multiple` as an option for the input, then this should be of type `list`.
* `app_static_params`: an object with key-value pairs of other app parameters that should be preset when creating the app cell.
* `app_output_param`: this should be the app's parameter id for the created object. This gets automatically filled with a suggested name based on the file name and the `app_output_suffix` field below. Note that this does not take into account whether the parameter has the `is_output_name` option set.
* `app_output_suffix`: an automatic suffix to add to the data file name for a created object. E.g. if the file name is "e_coli.gbk", and the `app_output_suffix` is "_genome", then the automatically set output name will be "e_coli.gbk_genome".
* `multiselect`: (deprecated) originally intended to denote files with multiple inputs, this is not currently implemented and will be removed in the future.

### Configuring a new Bulk Import app
The steps for adding a bulk import app to the configuration are fairly simple.
1. Add the `app_info` object field as described above, with a unique id.
2. Add the new data uploader's id to `bulk_import_types`.

Be aware that as of Narrative 5.0.0, there are several issues to be aware of before adding a new bulk import app:
* Apps that parallelize themselves (e.g. make use of the KBParallel module, or otherwise create extra jobs in the Execution Engine) may not work, or may cause a deadlock where no further app runs may be submitted by that user. These are not recommended for use.
* Apps that make use of Grouped Parameters (the `"parameter-groups"` field in an app spec) will not work correctly in a Bulk Import cell.
* Apps that require subobject selection may not work, and have not been tested in the Bulk Import cell.
* Apps that require the use of a dynamic dropdown (a select box that gets its available selections from a service) may not work as expected in a Bulk Import cell.
