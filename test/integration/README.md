# Quick webdriverio overview and instructions.

1. `npm install` to get webdriverio (wdio) dependencies installed
2. Add your CI token to `test/integration/wdio.conf.js` under the `kbaseToken` key at the top of the file.
3. From the root of the repo, run `npx wdio test/integration/wdio.conf.js` (if this is accepted, we can move that to a make target, a la `make test-integration`)

## For more reading:
* https://webdriver.io/ - overview of the project
* https://webdriver.io/docs/browserobject.html - how to use the browser object
* https://github.com/kbase/kbase-ui/tree/develop/src/test/integration-tests/specs - for wdio usage in kbase-ui. specifically, `theSpec.js` is the entrypoint (and invoked by the Makefile, which in turn calls grunt). This is somewhat more complicated as all tests are defined in yaml files, mostly provided by kbase-ui plugins. But it's wdio underneath.
