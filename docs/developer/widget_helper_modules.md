# Narrative widget helper modules
### Bill Riehl <wjriehl@lbl.gov>
### Last update - February 3, 2016

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
define(['jquery', 'util/display'],
  function($, DisplayUtil) {
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


### Bootstrap Dialog
Usage:
```Javascript
define(['jquery', 'bootstrap', 'util/bootstrapDialog'],
  function($, BootstrapDialog) {
    var $okButton = $('<button>')
      .addClass('btn btn-default')
      .attr('data-dismiss', 'modal')
      .append('OK');
      
    var dialog = new BootstrapDialog({
      title: 'My New Dialog',
      body: $('<div>').append('A simple body.'),
      buttons: [$okButton],
      closeButton: false
    });
    
    dialog.show();
  }
);
```

This is a really really simple Bootstrap modal dialog. The benefit here is that it doesn't require a jQuery node to hang onto - that is all handled by the module. It takes an object with four optional keys as inputs:
* `title` - string - This appears in the title area, or left blank if not defined
* `body` - jquery node - This gets appended to the body area of the dialog, if defined
* `buttons` - list of jquery nodes - These are expected to be `$('<button>')` nodes, any event handling they do is up to the user.
* `closeButton` - boolean (default `false`) - if true, add a little close button X to the right side of the title bar - this closes the modal dialog without triggering any buttons

Calling `new BootstrapDialog(options)` returns an object with two functions:
* `.show()` = show the dialog
* `.hide()` = hide the dialog

...and several getters and setters:
* `.getTitle()` = returns the title as a string. Empty string if none was given on instantiation
* `.getBody()` = returns the body as a jQuery node. Empty if none was given.
* `.getButtons()` = no-op right now (2/3/2016)
* `.getElement()` = get the jQuery node representing the whole modal dialog

* `.setTitle(string)` = set a new title
* `.setBody($newBody)` = set a new jQuery node as the body
* `.setButtons(listOfButtons)` = put a new list of buttons in the footer
