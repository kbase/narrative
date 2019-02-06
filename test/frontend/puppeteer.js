#!/usr/local/bin/node

"use strict";

/* hand in a config file with any tokens/URLs/etc you want. It's required!
  You can also pass in --base_url=http://somesite.com (defaults to https://ci.kbase.us/services
  and --headed=true to run open up puppeteer's chromium windows.
*/

const puppeteer     = require('puppeteer');
const axios         = require('axios');
const minimist      = require('minimist');
const fs            = require('fs');
const { promisify } = require('util');
const readFile      = promisify(fs.readFile);
const assert        = require('assert');

var argv = minimist(process.argv.slice(2));

if ( !argv.config ) {
  console.error('please provide a config file');
  process.exit(1);
}

const config = require(argv.config);

const BASE_URL = argv.base_url || "https://ci.kbase.us/services/"
const URLS = {
  "workspace"       : BASE_URL + "ws",
  "service_wizard"  : BASE_URL + "service_wizard",
  "auth"            : BASE_URL + "auth"
}

const narrative_name = `automated test narrative @ ${Date.now()}`;

// just creates a unique ID for service purposes.
const genID = () => String(Math.random()).slice(2);

// sometimes you may want to sleep.
const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

/*
  set_permissions

  Give it the:
    narrative services url,
    workspace ID,
    a secondary user (the one who's getting the permissions)
    the permission to give them
    and a token for a user with permission on that work space.

  returns the results from Workspace.set_permissions
*/

const set_permissions = async(url, wsid, user, perm, token) => {

  console.info(`  Setting permissions on ${wsid} for ${user} to ${perm}`);

  const res = await axios.post(
    URLS.workspace,
    {
      params : [
        {
          id             : wsid,
          users          : [ user ],
          new_permission : perm
        }
      ],
      method  : "Workspace.set_permissions",
      version : "1.1",
      id      : genID(),
    },
    { headers : {'Authorization' : token} }
  )
    .then( r => r.data )

  return res;
};

/*
  copy_narrative

  Give it the:
    narrative services url,
    an object with workspace_id and narrative ID,
    the name to copy it to
    and a token for a user to own the copy

  returns the results from NarrativeService.copy_narrative
*/

const copy_narrative = async(url, nar_info, newName, token) => {

  console.info(`  Copying narrative ${nar_info.wsid}/${nar_info.id}`);

  const res = await axios.post(
    url,
    {
      params : [
        {
          workspaceRef : `${nar_info.wsid}/${nar_info.id}`,
          newName      : newName
        }
      ],
      method  : "NarrativeService.copy_narrative",
      version : "1.1",
      id      : genID(),
    },
    { headers : {'Authorization' : token} }
  )
    .then( r => r.data.result[0] );

  console.info(`    copied to ${res.newWsId}`);

  return res;
}


/*
  get_narrative_service_url

  Give it a token.

  returns the narrative services url for the given BASE_URL
*/


const get_narrative_service_url = async (token) => {

  console.info('Gettig narrative service URL');

  const res = await axios.post(
    URLS.service_wizard,
    {
      params : [
        {
          module_name : 'NarrativeService',
          version     : null,
        }
      ],
      method  : "ServiceWizard.get_service_status",
      version : "1.1",
      id      : genID(),
    },
    { headers : {'Authorization' : token} }
  )
  .then( r => r.data.result[0].url );

  return res;
}

/*
  delete_narrative

  Give it the:
    the workspace id to delete
    and a token for a user that can delete it

  returns the results from Workspace.delete_workspace
*/

const delete_narrative = async(wsid, token) => {

  console.info(`  Deleting narrative ${wsid}`);

  const res = await axios.post(
    URLS.workspace,
    {
      params : [
        {
          id : wsid
        }
      ],
      method  : "Workspace.delete_workspace",
      version : "1.1",
      id      : genID(),
    },
    { headers : {'Authorization' : token} }
  )
  .then( r => r.data )

  return res;
}

/*
  copy_object

  Give it the:
    url to the narrative service
    the UPA to copy in
    the workspace ID to copy it into
    a token for a user with appropriate read/write permission

  returns the new object's { ref, wsid, obj_id } as an object.
*/
const copy_object = async(url, ref, wsid, token) => {

  console.info(`  Copying ${ref} into ${wsid}`);

  const res = await axios.post(
    url,
    {
      params : [
        {
          ref,
          target_ws_id : wsid,
        }
      ],
      method  : "NarrativeService.copy_object",
      version : "1.1",
      id      : genID(),
    },
    { headers : {'Authorization' : token} }
  )
  .then( r => {
    const  { ref, wsid, obj_id } = r.data.result[0].info;
    return { ref, wsid, obj_id };
  });

  console.info(`    new ref is ${res.wsid}/${res.obj_id}`);

  return res;
}

/*
  create_test_narrative

  Give it the:
    url to the narrative service
    the name of the narrative to create
    a user to share it with (required!)
    and a token for a user to own the new narrative

  returns the new narrative's { ref, wsid, obj_id, id } as an object.
*/
const create_test_narrative = async (url, name, userB, token) => {

  console.info(`  Creating test narrative`);

  const res = await axios.post(
    url,
    {
      params : [
        {
          includeIntroCell : false,
          title            : name,
        }
      ],
      method  : "NarrativeService.create_new_narrative",
      version : "1.1",
      id      : genID(),
    },
    { headers : {'Authorization' : token} }
  )
    .then( r => {
      const  { ref, wsid, obj_id, id } = r.data.result[0].narrativeInfo;
      return { ref, wsid, obj_id, id };
    });

  console.info(`    Granting read access on ${res.wsid} to ${userB}`);

  await set_permissions(url, res.wsid, userB, 'r', token);

  return res;
}

/*
  check_widget_status

  This one does the bulk of the heavy lifting.

  Give it the:
    puppeteer page with the loaded narrative on it
    the host it's sitting on
    the url of the narrative
    the widget_config for tests (out of the config file)
    and a token for a user that can see that narrative.

  this'll verify that the widget exists on the page.
  It'll also verify the type of the widget matches.
  If custom tests are provided, they'll be called and given

  widgetTest({ page, widget_config, token });

  returns true/false.
*/

const check_widget_status = async(page, host, url, widget_config, token) => {

  console.info(`  Checking status of ${widget_config.dataSelector}`);

  await page.setViewport({width : 1500, height : 1000});
  await page.setCookie(
    {
      'name'  : 'kbase_session',
      'value' : token,
      'domain': host,
      'path'  : '/'
    }
  );

  console.info(`  Loading page ${url}`);
  await page.goto(url, { waitUntil : 'networkidle0' });

  const selector = '.narrative-side-panel-content > .kb-side-tab:first-child .kb-side-separator:first-child .narrative-card-row ' + widget_config.dataSelector;

  console.info(`   Attempting to click on ${widget_config.dataSelector}`);
  const clickedOnIcon = await page.evaluate( dataSelector => {
    var numCells = Jupyter.notebook.get_cells().length;
    Jupyter.notebook.select(numCells - 1);
    if ( $(dataSelector).size() ) {
      $(dataSelector).click();
      return true;
    }
    else {
      return false;
    }
  }, selector);

  if (clickedOnIcon === false) {
    console.warn('  dataSelector does not exist!');
    return clickedOnIcon;
  }

  console.info(`   Attempting to check type of widget. Should be ${widget_config.type}.`);
  const objType = await page.evaluate( (type) => {
    var cellIdx = Jupyter.notebook.get_cells().length-1;
    var cell = Jupyter.notebook.get_cell(cellIdx);
    var dataType = cell.metadata.kbase.dataCell.objectInfo.type.toLowerCase();
    return dataType.indexOf(type) !== -1;
  }, widget_config.type);

  if (objType === false) {
    console.warn(`  Widget is not of type ${widget_config.type}`);
    return objType;
  }

  const widgetDivSelector = '#notebook .cell:last-child .kb-cell-output-content > div:last-child';

  console.info('  Waiting for appearance of widget container div');

  await page.waitForSelector(widgetDivSelector, {visible : true } );

  try {
    console.info('  Waiting for appearance of specific widget selector');
    await page.waitForSelector(widgetDivSelector + ' ' + widget_config.widgetSelector, {visible : true } );
    console.info('  Widget is succesfully on screen!');
  }
  catch(e) {
    console.warn('  Could not find widget with selector: ', e);
    return false;
  }

  if ( widget_config.testFile ) {

    console.info('  Widget has test file');

    try {
      const widgetTest = require( widget_config.testFile );
      return widgetTest(
        { page, host, url, widget_config, token }
      );
    }

    catch(e) {
      console.warn(`    File should exist at ${widget_config.testFile} but does not.`, e);
      return false;
    }
  }
  else {
    console.info('  Widget has no test file');
    return true;
  }

};

/*
  get_token

  Returns a token out of a config file - either "token" if it exists or the
  contents of "tokenFile" if not.
*/

const get_token = async user_config => {
  if (user_config.token) {
    return user_config.token;
  }
  else if (user_config.tokenFile) {
    const t = await readFile(user_config.tokenFile, 'utf8');
    return t.trim();
  }
  else {
    throw("User does not have a token or tokenFile");
  }
}

/*
  This thing actually does all the work. Give it the config file you read in up above.

  It will:
    create a new narrative.
    Copy it to the secondary user.
    Test all widgets in the config file (for a selector, its type, and any other custom tests)
    delete the narratives when it's done.
*/

const run_narrative_test = async ( config ) => {

  //fire it up. Find our narrative_service_url.

  const tokenA = await get_token( config.users.userA ) ;
  const tokenB = await get_token( config.users.userB ) ;

  const narrative_service_url = await get_narrative_service_url( tokenA );

  assert(narrative_service_url, 'Has a narrative service url');

  Object.keys(config.widgets).forEach( async widget_name => {

  console.info(`Running tests for ${widget_name}`);

    const widget_config = config.widgets[widget_name];

    //then create a new narrative.
    const nar_info = await create_test_narrative(
      narrative_service_url,
      narrative_name,
      config.users.userB.id,
      tokenA
    );

    assert(nar_info.ref,    'New narrative has ref');
    assert(nar_info.wsid,   'New narrative has wsid');
    assert(nar_info.obj_id, 'New narrative has obj_id');
    assert(nar_info.id,     'New narrative has id');

    //copy in some data
    const copied_object = await copy_object(
      narrative_service_url,
      widget_config.publicData,
      nar_info.wsid,
      tokenA
    );

    assert(copied_object.ref,    'Copied object has ref');
    assert(copied_object.wsid,   'Copied object has wsid');
    assert(copied_object.obj_id, 'Copied object  has obj_id');

    //copy the narrative.
    const copy_info = await copy_narrative(
      narrative_service_url,
      nar_info,
      narrative_name + ' copy',
      tokenB
    );

    assert(copy_info, 'Narrative copied');

    const new_permissions = await set_permissions(
      narrative_service_url,
      copy_info.newWsId,
      config.users.userA.id,
      'n',
      tokenB
    );

    assert(new_permissions, 'New permissions set');

    //await sleep(5000);

    const narrative_url = `${config.protocol}${config.host}/narrative/${nar_info.obj_id}`;
    const copy_url      = `${config.protocol}${config.host}/narrative/ws.${copy_info.newWsId}.obj.${copy_info.newNarId}`;

    let overall_status = true;

    puppeteer.launch({headless : !argv.headed, ignoreHTTPSErrors : true }).then(async browser => {

      try {
        let pages = await browser.pages()
        const page = await browser.newPage();

        const narrative1_widget_status = await check_widget_status(
          page,
          config.host,
          narrative_url,
          widget_config,
          tokenA
        );

        assert(narrative1_widget_status, 'UserA narrative passes widget tests');

        console.info(`      Widget status for ${config.users.userA.id} is ${narrative1_widget_status ? 'good' : 'bad'}`);

        const copyPage = await browser.newPage();
        const narrative2_widget_status = await check_widget_status(
          copyPage,
          config.host,
          copy_url,
          widget_config,
          tokenB
        );

        assert(narrative2_widget_status, 'UserB narrative passes widget tests');

        console.info(`      Widget status for ${config.users.userB.id} is ${narrative2_widget_status ? 'good' : 'bad'}`);

        overall_status = overall_status && narrative1_widget_status && narrative2_widget_status ? 0 : 1;
      }
      finally {

        await delete_narrative(nar_info.wsid, tokenA);
        await delete_narrative(copy_info.newWsId, tokenB);

        if (!argv.headed) {await browser.close() };

        process.exitCode = overall_status;
      }
    });

  });



}

run_narrative_test( config );
