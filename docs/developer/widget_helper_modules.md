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
);
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


### util/string
Usage:
```Javascript
define(['util/string'],
  function(StringUtil) {
    var uuid = StringUtil.uuid();
    var safeJson = StringUtil.safeJSONStringify(object);
  }
);
```

This helper module just has two simple methods.
```
StringUtil.uuid();
```
This returns a random UUID using [version 4 of the UUID spec](https://en.wikipedia.org/wiki/Universally_unique_identifier#Version_4_.28random.29)

```
StringUtil.safeJSONStringify(object)
```
This will make an HTML-safe stringified object. It escapes single and double quotes that exist in string values somewhere in the object for safer transmission. Mainly used for interacting with the Narrative's kernel... though it might be obsolete at this point.


### util/display
Usage:
```Javascript
define(['util/display'],
  function(DisplayUtil) {
    DisplayUtil.displayRealName(username, $target);

    var profilePromise = DisplayUtil.lookupUserProfile(username);
    var fullName = profilePromise.then(function(profile) {
      return profile[0].user.realname;
    }

    var loader = loadingDiv(caption);
    $('<div>').append(loader.div);
    loader.setText(newCaption);
  }
);
```

This has a few helper functions, one of which is a little abstract, and mainly used as a helper internal to the module.

```Javascript
DisplayUtil.displayRealName(username, $target);
```
Given a username and a target jQuery node (e.g. `$('<div>')`), this asynchronously fetches the user's profile and populates the div with that user's real name.

```Javascript
DisplayUtil.lookupUserProfile(username);
```
This is a helper for `displayRealName` that creates a [Bluebird](www.bluebirdjs.com) Promise to fetch a user profile. This Promise gets cached for the session to speed lookups. As it is a Promise, you can use `.then(function(profile))` and `.catch(error)` to get to the profile and handle errors. See the usage above.

```Javascript
DisplayUtil.loadingDiv(captionString)
```
This returns a tiny object with a `div` key and `setText` method. `div` returns a jQuery node with a centered loading gif inside it (the rotating tick marks that we use most everywhere) and `captionString` centered below it.

the `setText` method changes the caption text to the given string - note this is NOT HTML.


### Boostrap Dialog
