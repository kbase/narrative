#!/usr/local/bin/node

"use strict";

/*

  BE CAREFUL WITH THIS THING.

  This is a utility script that you can use to delete test narratives that didn't propertly get cleaned up.
  Give it a token and criteria for deletion on the command line.

  i.e.,

  ./delete_narratives.js --token=MYTOKEN --criteria='n.nar[10].name.match(/automated test/)'
  ./delete_narratives.js --token=MYTOKEN --criteria='n.nar[10].name.match(/This is a test on/)'
  ./delete_narratives.js --token=MYTOKEN --criteria='n.ws[0] > 35000'

*/


const axios         = require('axios');
const minimist      = require('minimist');

const argv = minimist(process.argv.slice(2));

const token = argv.token;
const criteria = argv.criteria;

if (! criteria) { throw("Cannot delete w/o criteria. Too dangerous.") };

const BASE_URL = "https://ci.kbase.us/services/"
const URLS = {
  "workspace"       : BASE_URL + "ws",
  "service_wizard"  : BASE_URL + "service_wizard",
  "auth"            : BASE_URL + "auth"
}

const genID = () => String(Math.random()).slice(2);

const list_narratives = async (url, token) => {

  console.info(`Listing narratives`);

  const res = await axios.post(
    url,
    {
      params : [{}],
      method  : "NarrativeService.list_narratives",
      version : "1.1",
      id      : genID(),
    },
    { headers : {'Authorization' : token} }
  )
  .then( r => r.data.result[0].narratives.filter(n => eval(criteria) ).map( n => n.ws[0] ))

  return res;
}

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


const DOIT = async () => {

  const narrative_service_url = await get_narrative_service_url( token );

  const wses = await list_narratives(narrative_service_url, token);

  console.log(wses);

  wses.forEach( async wsid => await delete_narrative(wsid, token) );

};

DOIT();
