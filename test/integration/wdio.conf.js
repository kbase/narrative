/* eslint-env node */
/* eslint no-console: 0 */
/* eslint {strict: ['error', 'global']} */
'use strict';

const testConfig = require('../testConfig');
const fs = require('fs');

const authToken = (() => {
    if (process.env.KBASE_TEST_TOKEN) {
        console.log('loading auth token from environment variable KBASE_TEST_TOKEN');
        return process.env.KBASE_TEST_TOKEN;
    } else if (testConfig && testConfig.token && testConfig.token.file && fs.existsSync(testConfig.token.file)) {
        console.log('loading auth token from file ' + testConfig.token.file);
        return fs.readFileSync(testConfig.token.file, 'utf-8').trim();
        
    } else {
        console.warn('continuing without valid test token');
        return 'fakeToken';
    }
})();

// Driver config for selenium standalone.
// Commented out so that it can pick the most recent 
// drivers (or at least invoking the behavior of the 
// selenium standalone service installed.)
// Uncomment if need explicit driver versions.
// This can be necessary if the installed Chrome or Firefox differs significantly from
// those supported by the drivers.
// const drivers = {
//     chrome: { 
//         version: '87.0.4280.20' 
//     }, // https://chromedriver.chromium.org/
//     firefox: { 
//         version: '0.28.0'
//     }, // https://github.com/mozilla/geckodriver/releases
// }

// Each wdio service supported requires an entry here, even
// if it doesn't have any specific configuration.
const serviceConfigs = {
    'selenium-standalone': {
        logPath: 'logs',
        // Uncomment if driver configuration uncommented above.
        // installArgs: { 
        //     drivers,
        //     arch: process.arch
        // },
        // args: { 
        //     drivers,
        //     arch: process.arch
        // }
    },
    chromedriver: {},
    browserstack: {
        browserstackLocal: true,
        opts: {

        }
    }
}

// Import environment variables used to control the tests.
// Note that most have defaults, and many are only applicable 
// to testing services

// For testing services

/**
 * Imports presetable config keys, using sensible defaults.
 * The defaults correspond to the originally implied settings used by chromedriver, other than Windows.
 * @returns {Object} A config object with the following keys: OS, OS_VERSION, BROWSER, BROWSER_VERSION, SERVICE, WIDTH, HEIGHT
 */
function importEnv() {
    const isRemoteService = (process.env.SERVICE === 'browserstack');
    const OS = process.env.OS || (isRemoteService ? 'Windows' : null);
    const OS_VERSION = process.env.OS_VERSION || (isRemoteService ? '10' : null);
    const BROWSER = process.env.BROWSER || 'chrome';
    const BROWSER_VERSION = process.env.BROWSER_VERSION || (isRemoteService ? 'latest' : null);
    const SERVICE = process.env.SERVICE || 'selenium-standalone';
    const HEADLESS = process.env.HEADLESS || (isRemoteService ? 'f' : 't');

    const WIDTH= process.env.WIDTH || 1366;
    const HEIGHT= process.env.HEIGHT || 768;
    return {
        OS, OS_VERSION, BROWSER, BROWSER_VERSION, HEADLESS, SERVICE, WIDTH, HEIGHT
    }
}

/**
 * Given a preset key, return set set of common configuration keys for a given service, os, and browser
 * This is useful because testing services support a limited number of browser dimensions, which differs
 * between operating systems.
 * Note that config keys other than those implied by the preset (service, os, browser) are overriden by the
 * corresponding environment variables.
 * @param {string} preset A preset config key; see the switch statement for available presets.
 * @returns {Object} A config object with the following keys: OS, OS_VERSION, BROWSER, BROWSER_VERSION, SERVICE, WIDTH, HEIGHT
 */
function processPreset(preset) {
    if (preset === null) {
        return importEnv();
    }

    const e = process.env;

    const [width, height] = (() => {
        if (!process.env.PRESET_DIMENSIONS) {
            return [1024, 768];
        }
        switch (process.env.PRESET_DIMENSIONS) {
            case 'xga': return [1024, 768];
            case 'hd': return [1920, 1080];
            default: throw new Error(`Not a valid PRESET_DIMENSIONS: "${process.env.PRESET_DIMENSIONS}"`)
        }
    })();

    switch (preset) {
        case 'bs-win-chrome':
            return {
                OS: 'Windows',
                OS_VERSION: e.OS_VERSION || '10',
                BROWSER: 'chrome',
                BROWSER_VERSION: e.BROWSER_VERSION || 'latest',
                HEADLESS: e.HEADLESS || 'f',
                SERVICE: 'browserstack',
                WIDTH: e.WIDTH || width,
                HEIGHT: e.HEIGHT || height
            };
        case 'bs-win-firefox':
            return {
                OS: 'Windows',
                OS_VERSION: e.OS_VERSION || '10',
                BROWSER: 'firefox',
                BROWSER_VERSION: e.BROWSER_VERSION || 'latest',
                HEADLESS: e.HEADLESS || 'f',
                SERVICE: 'browserstack',
                WIDTH: e.WIDTH || width,
                HEIGHT: e.HEIGHT || height
            };
        case 'bs-mac-chrome':
            return {
                OS: 'OS X',
                OS_VERSION: e.OS_VERSION || 'Catalina',
                BROWSER: 'chrome',
                BROWSER_VERSION: e.BROWSER_VERSION || 'latest',
                HEADLESS: e.HEADLESS || 'f',
                SERVICE: 'browserstack',
                WIDTH: e.WIDTH || width,
                HEIGHT: e.HEIGHT || height
            };
        case 'bs-mac-firefox':
            return {
                OS: 'OS X',
                OS_VERSION: e.OS_VERSION || 'Catalina',
                BROWSER: 'firefox',
                BROWSER_VERSION: e.BROWSER_VERSION || 'latest',
                HEADLESS: e.HEADLESS || 'f',
                SERVICE: 'browserstack',
                WIDTH: e.WIDTH || width,
                HEIGHT: e.HEIGHT || height
            };
        case 'ss-firefox':
            // TODO: detect platform
            return {
                OS: null, // not used by selenium standalone -- it runs on the current host
                OS_VERSION: null, 
                BROWSER: 'firefox',
                BROWSER_VERSION: null, // will use the installed browser on this host
                HEADLESS: e.HEADLESS || 't',
                SERVICE: 'selenium-standalone',
                WIDTH: e.WIDTH || width,
                HEIGHT: e.HEIGHT || height
            };
        case 'ss-chrome':
            // TODO: detect platform
            return {
                OS: null, // not used by selenium standalone -- it runs on the current host
                OS_VERSION: null, 
                BROWSER: 'chrome',
                BROWSER_VERSION: null, // will use the installed browser on this host
                HEADLESS: e.HEADLESS || 't',
                SERVICE: 'selenium-standalone',
                WIDTH: e.WIDTH || width,
                HEIGHT: e.HEIGHT || height
            };
        case 'cd':
            // TODO: detect platform
            return {
                OS: null, // not used by chromedriver; it is run on the host, whatever it is
                OS_VERSION: null, // TODO: detect os version.
                BROWSER: 'chrome',
                BROWSER_VERSION: null, // will use the installed chrome on this host
                HEADLESS: e.HEADLESS || 't',
                SERVICE: 'chromedriver',
                WIDTH: e.WIDTH || width,
                HEIGHT: e.HEIGHT || height
            };
        default: 
            throw new Error(`Sorry, "${preset}" is not a preset`)
    }
}

const preset = process.env.PRESET || null;

const {OS, OS_VERSION, BROWSER, BROWSER_VERSION, SERVICE, WIDTH, HEIGHT} = processPreset(preset);

// Note that these are only used for browserstack, but we import them here for consistency.
const SERVICE_USER = process.env.SERVICE_USER || null;
const SERVICE_KEY = process.env.SERVICE_KEY || null;

// These are not preset-able.
const BASE_URL = process.env.BASE_URL || 'http://localhost:8888';
const ENV = process.env.ENV || 'ci';
const HEADLESS = process.env.HEADLESS || 't';

/**
 * Constructs a capabilities object for the current test configuration.
 * @param {Object} config - test configuration as provided in the environment
 * variables and defaults as set above.
 * @returns {Object} a capabilities object suitable for the wdio configuration.
 */
function makeCapabilities(config) {
    switch (config.SERVICE) {
        case 'chromedriver': 
            return (() => {
                const args = ['--disable-gpu', '--no-sandbox', `window-size=${config.WIDTH},${HEIGHT}`];
                if (config.HEADLESS === 't') {
                    args.push('--headless');
                }
                return  {
                    browserName: 'chrome',
                    acceptInsecureCerts: true,
                    maxInstances: 1,
                    'goog:chromeOptions': {
                        args
                    }
                };
            })();
        case 'selenium-standalone': 
            switch (config.BROWSER) {
                case 'chrome':
                    return (() => {
                        const args = ['--disable-gpu', '--no-sandbox', `window-size=${config.WIDTH},${config.HEIGHT}`];
                        if (config.HEADLESS === 't') {
                            args.push('--headless');
                        }
                        return  {
                            browserName: 'chrome',
                            acceptInsecureCerts: true,
                            maxInstances: 1,
                            'goog:chromeOptions': {
                                args
                            }
                        };
                    })();
                case 'firefox':
                    return (() => {
                        const args = [`--width=${config.WIDTH}`, `--height=${config.HEIGHT}`];
                        if (config.HEADLESS === 't') {
                            args.push('--headless');
                        }
                        return {
                            browserName: 'firefox',
                            acceptInsecureCerts: true,
                            maxInstances: 1,
                            'moz:firefoxOptions': {
                                args
                            }
                        };
                    })();
            }
        case 'browserstack':
            // see https://www.browserstack.com/docs/automate/selenium/select-browsers-and-devices
            return {
                os: `${config.OS}`,
                os_version: `${config.OS_VERSION}`,
                browser: `${config.BROWSER}`,
                browser_version: `${config.BROWSER_VERSION}`,
                resolution: `${config.WIDTH}x${config.HEIGHT}`
            }
    }
}

const CAPABILITIES = makeCapabilities({
    SERVICE, BROWSER, OS, OS_VERSION, BROWSER_VERSION, WIDTH, HEIGHT, HEADLESS
});

console.log('Test Settings');
console.log('-----------------');
console.log('ENV             : ' + ENV);
console.log('BASE_URL        : ' + BASE_URL);
console.log('BROWSER         : ' + BROWSER);
console.log('BROWSER VERSION : ' + BROWSER_VERSION);
console.log('WIDTH           : ' + WIDTH);
console.log('HEIGHT          : ' + HEIGHT);
console.log('OS              : ' + OS);
console.log('OS VERSION      : ' + OS_VERSION);
console.log('HEADLESS        : ' + HEADLESS);
console.log('TEST SERVICE    : ' + SERVICE);
console.log('SERVICE USER    : ' + SERVICE_USER);
console.log('SERVICE KEY     : ' + SERVICE_KEY);
console.log('-----------------');

const wdioConfig = {
    kbaseToken: authToken,
    //
    // ====================
    // Runner Configuration
    // ====================
    //
    // WebdriverIO allows it to run your tests in arbitrary locations (e.g. locally or
    // on a remote machine).
    runner: 'local',
    //
    // ==================
    // Specify Test Files
    // ==================
    // Define which test specs should run. The pattern is relative to the directory
    // from which `wdio` was called. Notice that, if you are calling `wdio` from an
    // NPM script (see https://docs.npmjs.com/cli/run-script) then the current working
    // directory is where your package.json resides, so `wdio` will be called from there.
    //
    specs: [
        './test/integration/specs/**/*.js'
    ],
    // Patterns to exclude.
    exclude: [
        // 'path/to/excluded/files'
    ],
    //
    // ============
    // Capabilities
    // ============
    // Define your capabilities here. WebdriverIO can run multiple capabilities at the same
    // time. Depending on the number of capabilities, WebdriverIO launches several test
    // sessions. Within your capabilities you can overwrite the spec and exclude options in
    // order to group specific specs to a specific capability.
    //
    // First, you can define how many instances should be started at the same time. Let's
    // say you have 3 different capabilities (Chrome, Firefox, and Safari) and you have
    // set maxInstances to 1; wdio will spawn 3 processes. Therefore, if you have 10 spec
    // files and you set maxInstances to 10, all spec files will get tested at the same time
    // and 30 processes will get spawned. The property handles how many capabilities
    // from the same test should run tests.
    //
    maxInstances: 10,
    //
    // If you have trouble getting all important capabilities together, check out the
    // Sauce Labs platform configurator - a great tool to configure your capabilities:
    // https://docs.saucelabs.com/reference/platforms-configurator
    //
    // capabilities: [{
    //     // maxInstances can get overwritten per capability. So if you have an in-house Selenium
    //     // grid with only 5 firefox instances available you can make sure that not more than
    //     // 5 instances get started at a time.
    //     maxInstances: 1,
    //     // 'goog:chromeOptions': {
    //     //     args: ['--disable-gpu', '--no-sandbox', 'headless']
    //     // },
    //     //
    //     browserName: 'chrome',
    //     acceptInsecureCerts: true
    //     // If outputDir is provided WebdriverIO can capture driver session logs
    //     // it is possible to configure which logTypes to include/exclude.
    //     // excludeDriverLogs: ['*'], // pass '*' to exclude all driver session logs
    //     // excludeDriverLogs: ['bugreport', 'server'],
    // }],
    capabilities: [
        CAPABILITIES
    ],
    //
    // ===================
    // Test Configurations
    // ===================
    // Define all options that are relevant for the WebdriverIO instance here
    //
    // Level of logging verbosity: trace | debug | info | warn | error | silent
    logLevel: 'warn',
    //
    // Set specific log levels per logger
    // loggers:
    // - webdriver, webdriverio
    // - @wdio/applitools-service, @wdio/browserstack-service, @wdio/devtools-service, @wdio/sauce-service
    // - @wdio/mocha-framework, @wdio/jasmine-framework
    // - @wdio/local-runner, @wdio/lambda-runner
    // - @wdio/sumologic-reporter
    // - @wdio/cli, @wdio/config, @wdio/sync, @wdio/utils
    // Level of logging verbosity: trace | debug | info | warn | error | silent
    // logLevels: {
    //     webdriver: 'info',
    //     '@wdio/applitools-service': 'info'
    // },
    //
    // If you only want to run your tests until a specific amount of tests have failed use
    // bail (default is 0 - don't bail, run all tests).
    bail: 0,
    //
    // Set a base URL in order to shorten url command calls. If your `url` parameter starts
    // with `/`, the base url gets prepended, not including the path portion of your baseUrl.
    // If your `url` parameter starts without a scheme or `/` (like `some/path`), the base url
    // gets prepended directly.
    baseUrl: BASE_URL,
    //
    // Default timeout for all waitFor* commands.
    waitforTimeout: 30000,
    //
    // Default timeout in milliseconds for request
    // if browser driver or grid doesn't send response
    connectionRetryTimeout: 120000,
    //
    // Default request retries count
    connectionRetryCount: 3,
    //
    // Test runner services
    // Services take over a specific job you don't want to take care of. They enhance
    // your test setup with almost no effort. Unlike plugins, they don't add new
    // commands. Instead, they hook themselves up into the test process.
    services: [[SERVICE, serviceConfigs[SERVICE]]],

    // Framework you want to run your specs with.
    // The following are supported: Mocha, Jasmine, and Cucumber
    // see also: https://webdriver.io/docs/frameworks.html
    //
    // Make sure you have the wdio adapter package for the specific framework installed
    // before running any tests.
    framework: 'mocha',
    jasmineNodeOpts: {
        //
        // Jasmine default timeout
        defaultTimeoutInterval: 60000,
        //
        // The Jasmine framework allows interception of each assertion in order to log the state of the application
        // or website depending on the result. For example, it is pretty handy to take a screenshot every time
        // an assertion fails.
        expectationResultHandler: function (/*passed, assertion*/) {
            // do something
        }
    },
    //
    // The number of times to retry the entire specfile when it fails as a whole
    // specFileRetries: 1,
    //
    // Delay in seconds between the spec file retry attempts
    // specFileRetriesDelay: 0,
    //
    // Whether or not retried specfiles should be retried immediately or deferred to the end of the queue
    // specFileRetriesDeferred: false,
    //
    // Test reporter for stdout.
    // The only one supported by default is 'dot'
    // see also: https://webdriver.io/docs/dot-reporter.html
    reporters: ['spec'],

    //
    // Options to be passed to Mocha.
    // See the full list at http://mochajs.org/
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },
    //
    // =====
    // Hooks
    // =====
    // WebdriverIO provides several hooks you can use to interfere with the test process in order to enhance
    // it and to build services around it. You can either apply a single function or an array of
    // methods to it. If one of them returns with a promise, WebdriverIO will wait until that promise got
    // resolved to continue.
    /**
     * Gets executed once before all workers get launched.
     * @param {Object} config wdio configuration object
     * @param {Array.<Object>} capabilities list of capabilities details
     */
    // onPrepare: function (config, capabilities) {
    // },
    /**
     * Gets executed before a worker process is spawned and can be used to initialise specific service
     * for that worker as well as modify runtime environments in an async fashion.
     * @param  {String} cid      capability id (e.g 0-0)
     * @param  {[type]} caps     object containing capabilities for session that will be spawn in the worker
     * @param  {[type]} specs    specs to be run in the worker process
     * @param  {[type]} args     object that will be merged with the main configuration once worker is initialised
     * @param  {[type]} execArgv list of string arguments passed to the worker process
     */
    // onWorkerStart: function (cid, caps, specs, args, execArgv) {
    // },
    /**
     * Gets executed just before initialising the webdriver session and test framework. It allows you
     * to manipulate configurations depending on the capability or spec.
     * @param {Object} config wdio configuration object
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {Array.<String>} specs List of spec file paths that are to be run
     */
    // beforeSession: function (config, capabilities, specs) {
    // },
    /**
     * Gets executed before test execution begins. At this point you can access to all global
     * variables like `browser`. It is the perfect place to define custom commands.
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {Array.<String>} specs List of spec file paths that are to be run
     */
    // before: function (capabilities, specs) {
    // },
    /**
     * Runs before a WebdriverIO command gets executed.
     * @param {String} commandName hook command name
     * @param {Array} args arguments that command would receive
     */
    // beforeCommand: function (commandName, args) {
    // },
    /**
     * Hook that gets executed before the suite starts
     * @param {Object} suite suite details
     */
    // beforeSuite: function (suite) {
    // },
    /**
     * Function to be executed before a test (in Mocha/Jasmine) starts.
     */
    // beforeTest: function (test, context) {
    // },
    /**
     * Hook that gets executed _before_ a hook within the suite starts (e.g. runs before calling
     * beforeEach in Mocha)
     */
    // beforeHook: function (test, context) {
    // },
    /**
     * Hook that gets executed _after_ a hook within the suite starts (e.g. runs after calling
     * afterEach in Mocha)
     */
    // afterHook: function (test, context, { error, result, duration, passed, retries }) {
    // },
    /**
     * Function to be executed after a test (in Mocha/Jasmine).
     */
    // afterTest: function(test, context, { error, result, duration, passed, retries }) {
    // },


    /**
     * Hook that gets executed after the suite has ended
     * @param {Object} suite suite details
     */
    // afterSuite: function (suite) {
    // },
    /**
     * Runs after a WebdriverIO command gets executed
     * @param {String} commandName hook command name
     * @param {Array} args arguments that command would receive
     * @param {Number} result 0 - command success, 1 - command error
     * @param {Object} error error object if any
     */
    // afterCommand: function (commandName, args, result, error) {
    // },
    /**
     * Gets executed after all tests are done. You still have access to all global variables from
     * the test.
     * @param {Number} result 0 - test pass, 1 - test fail
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {Array.<String>} specs List of spec file paths that ran
     */
    // after: function (result, capabilities, specs) {
    // },
    /**
     * Gets executed right after terminating the webdriver session.
     * @param {Object} config wdio configuration object
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {Array.<String>} specs List of spec file paths that ran
     */
    // afterSession: function (config, capabilities, specs) {
    // },
    /**
     * Gets executed after all workers got shut down and the process is about to exit. An error
     * thrown in the onComplete hook will result in the test run failing.
     * @param {Object} exitCode 0 - success, 1 - fail
     * @param {Object} config wdio configuration object
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {<Object>} results object containing test results
     */
    // onComplete: function(exitCode, config, capabilities, results) {
    // },
    /**
    * Gets executed when a refresh happens.
    * @param {String} oldSessionId session ID of the old session
    * @param {String} newSessionId session ID of the new session
    */
    //onReload: function(oldSessionId, newSessionId) {
    //}
};

wdioConfig.env = {
    ENV, BASE_URL, SERVICE, BROWSER, BROWSER_VERSION, OS, OS_VERSION, WIDTH, HEIGHT, HEADLESS
}

// Only set the service if it is an online service; setting the
// user and key otherwise will trigger a warning or error.
if (SERVICE === 'browserstack') {
    wdioConfig.user = SERVICE_USER;
    wdioConfig.key = SERVICE_KEY;
}

exports.config = wdioConfig;
