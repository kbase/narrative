# Test data uploader

This is a data uploader intended for use with any script that combs the Workspace service for workspaces using the Administrator interface. Before doing that for real, it's a good idea to have a local Workspace set up with some real Workspaces that contain Narratives to test against.

That's what this does. 

## Pre-requisites
1. Python. It's a Python script.
2. Local Workspace and Auth instances. Either run them yourself and wire them up so they can talk to each other, or use mini-KBase - https://github.com/kbase/mini_kb
3. Auth in test mode. This is critical, since we set up a dummy login account user to test with. You could probably also dummy up a local account, but using Auth in test mode is easier. It's also how the script is set up.

## Mini-KBase notes
By default, Mini-KBase uses a setup that is pretty darn close to the live environments. I generally set it to start as follows:
1. In the `ws` block of `docker-compose.yml`, set the `-env` line to this file: `https://raw.githubusercontent.com/briehl/mini_kb/master/deployment/conf/workspace-minikb.ini` (or copy that into your local version). This sets up the Workspace to use the testmode auth endpoints. Auth testmode should be active in minikb by default.
2. Start up `mini_kb` as usual. Here's some options (mostly notes to myself):
    * Just run `./start_minikb.sh` from the prompt. That'll fetch all images and make them go.
    * I had trouble getting it to run on my laptop - a mid 2015 Macbook Pro with 16GB memory, running Mac OS Mojave 10.14.5, but had better luck in an Ubuntu 18.04 VM.
    * Track the logs with `docker-compose logs -f ws` (or whatever image is troublesome).
    * There's an order that's supposed to be followed - the `db-init` container should be up along with `ci-mongo`, `shock`, `handle-service`, `ci-mysql`, and `handle-manager` in order for Workspace to be happy. You might need to fiddle with starting/restarting some of those to get Workspace up.
3. On the first start up, the Workspace container will complain then fail. Auth is in testmode now, and there's no test user/token set up for the Shock configuration. We're just filling up the Workspace with test Narratives that aren't very big, so using GridFS is fine. Do the following to switch over to that:
    1. Enter the mongo container (or just run `mongo` if you have it installed)  
    ```docker-compose exec ci-mongo bash```
    2. Run mongo (just `mongo` at the prompt)
    3. The following commands will change the Workspace settings to use gridFS:  
    ```
    use workspace 
    db.settings.findAndModify({ query: {backend: "shock"}, update: { $set: {"backend": "gridFS" }}})
    ```
    4. Exit mongo, and the ci-mongo container, and restart the Workspace container: 
    ```docker-compose restart ws```

## Running the script
```
populate_mini_ws.py
```
Right now, since this isn't really meant to be a general purpose thing, stuff is kinda hard-coded. So just edit the variables at the top of the file.

* `kb_port` - what port is mini-KBase (or your local service) running on
* `mini_ws_url` - the service endpoint URL for your Workspace
* `mini_auth_url` - the service endpoint URL for your Auth (include testmode!)
* `mini_ws_admin` - the admin user for your Workspace
* `narrative_spec_file` - relative path to the current Narrative typespec.
* `old_narrative_spec_file` - relative path to an old Narrative typespec (includes Worksheets object wrapper)
* `test_narrative_data` - JSON file containing Narrative data to upload.
* `test_user` - the test username who should own all tha data (user gets created by testmode Auth)

That's it, really. This goes through and injects the typespec for an old and new Narrative type, then fills up the Workspace service with ~10 workspaces, each of which having one (or none) Narratives.
