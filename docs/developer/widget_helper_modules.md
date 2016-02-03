# Narrative widget helper modules
### Bill Riehl <wjriehl@lbl.gov>
### Last update - February 3, 2015

### Narrative Config
Usage:
```Javascript
define(['narrativeConfig'],
function(Config) {
  var workspaceUrl = Config.url('workspace');
  var loadingGif = Config.get('loading_gif');
}
```

This gives access to the configuration environment set up for your narrative, and exposes two functions:
```
Config.url(serviceName)
```
This replies with the currently configured service (or other) url endpoints. Supported values are as follows:
```
awe
catalog
data_import_export
fba
feature_values
gene_families
genomeCmp
job_service
landing_pages
login
narrative_method_store
profile_page
reset_password
search
shock
status_page
submit_jira_ticket
transform
trees
ui_common_root
update_profile
user_and_job_state
version_check
workspace
```

Using an unknown value returns `undefined`

```
Config.get(key)
```
This is a more general call to the configuration. This returns any value in the config file (which can be found [here](../../src/config.json)). Some of the more useful ones are `Config.get('loading_gif')` and `Config.get('tooltip')` (which has configured values for how long to wait on mouseover before showing the Bootstrap tooltip).
