# Upload Configuration Guide
### Bill Riehl <wjriehl@lbl.gov>
### Last Update May 10, 2016

This guide will show you how to update the uploader configuration JSON file located in  
`kbase-extension/static/kbase/config/upload_config.json`.

### 1. What's this file do?
This config file tells the uploader panel:

  * What data types can be uploaded.
  * What methods can be used to define the uploading for each data type (see the [GenBank Uploader](https://github.com/kbase/narrative_method_specs/blob/master/methods/import_genome_gbk_file/spec.json) for an example.
  * How to use the results of the import method spec to start the Transform service.

The guts of the KBase Transform service operation are beyond the scope of this guide. But here's the short version of how things get set up in the Narrative UI.

  1. User opens the data panel and selects Import and a Data type to import.
  2. User selects the file to upload and hits the "Import" button.
  3. The transform parameters get constructed (using the config file in question here), data is uploaded to Shock, and the Transform job is started.

### 2. Configuration Spec
This is layed out as a JSON file where the keys are the registered data types (of the format `Module.Type`, e.g. `KBaseGenomes.Genome`), and the values are objects that each one or more methods for uploading that type.

In the general spec below, placeholder names are given in ALL_CAPS_WITH_UNDERSCORES and expected keys are given in small_caps_with_underscores. The {{ARGUMENT_INFO}} block is a special area that will be explained in detail below.

```
"OBJECT_TYPE" : {
    "METHOD_SPEC_ID" : {
        "external_type" : "EXTERNAL_OBJECT_TYPE",
        "kbase_type" : "OBJECT_TYPE",
        "optional_arguments" : {
            "validate" : {
              "ARGUMENT_1" : { {{ARGUMENT_INFO}} },
              "ARGUMENT_2" : { {{ARGUMENT_INFO}} },
              ...
            }
            "transform" : {
              "ARGUMENT_1" : { {{ARGUMENT_INFO}} },
              "ARGUMENT_2" : { {{ARGUMENT_INFO}} },
              ...
            },
        },
        "url_mapping" : {
            "EXTERNAL_OBJECT_TYPE" : { {{ARGUMENT_INFO}} }
        }
    }
}
```

`OBJECT_TYPE` = the registered workspace name of a typed object that will be created by the uploader.  
`METHOD_SPEC_ID` = the id of the method spec that is used to define and map input parameters.
`optional_arguments.validate` = are sent to the validation step
`optional_arguments.transform` = are sent to the Transform service
`url_mapping.EXTERNAL_OBJECT_TYPE` = is used to map the location of the uploaded argument type. Most cases will be in Shock if the user uploaded their data there, but sometimes may be in a given URL string (e.g., if uploading directly from an FTP site).

`{{ARGUMENT_INFO}}`  
This is a special block that is a reasonably flexible way to add arbitrary arguments to either the uploader, the validator, or the url mapping. It is a set of key-value pairs that tell the importer where to find those parameters. Options are as follows:

  * `type` - string, required - one of "string", "int", "boolean", "shock" ("shock" only makes sense under url_mapping). This describes what type the argument is and how it should be treated. In the case of a url_mapping argument, using "shock" here automatically builds the proper Shock URL prefix and appends the value of this argument to the end.
  * `optional` - boolean, required - one of false, true. Whether or not this argument is required.
  * `param` - string, optional, mutually exclusive with `value` - the id of the parameter given in the importer method spec. This gets the value given to that parameter and fills it in here.
  * `value` - string, optional, overrides `param` - the literal value to give to the importer
  * `prefix` - string, optional - prepended to any other default value generated
  * `suffix` - string, optional - appended to any other default value generated
  * `default` - object, optional, used if the value given to `param` and `value` is an empty string. This object is just another `{{ARGUMENT_INFO}}` object with the same optional and required keys above

As mentioned above, the `param` and `value` keys are mutually-exclusive - if both are present, `value` will take precendence.

Here's an example from the GenBank file uploader:
```json
"contigset_object_name" : {
    "type" : "string",
    "param" : "contigObject",
    "optional" : false,
    "default" : {
        "param" : "outputObject",
        "suffix" : ".contigset"
    }
}
```
This is sent to the Transform service. It creates a parameter called `contigset_object_name`, that's a non-optional string. It is taken from the value of the parameter with id `contigObject`. If that's not present, then it uses the default parameter of `outputObject`, and appends ".contigset" to the end of that value. If that value isn't present either, then it throws an error, since it is required.


### 3. Annotated Example Config
