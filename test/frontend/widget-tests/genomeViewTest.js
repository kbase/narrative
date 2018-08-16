/* this is just a quick example of what a custom test file should look like. You can include as much
   stuff in here as you'd like. Just have it return true/false at the end.
*/

const widgetTest = async ( { page, widget_config, token } ) => {
  console.info(`  Performing extended tests`);

  try {
    await page.waitForSelector('.tabbable');
    return true;
  }
  catch(e) {
    console.info(`Genome test failed with : `, e);
    return false;
  }

}

module.exports = widgetTest;
