/* eslint-env node */
/* eslint no-console: 0 */
'use strict';

const testConfig = require('../testConfig');
const fs = require('fs');

const CHROME_BINARY = require('puppeteer').executablePath();

// const CHROME_BINARY = require('puppeteer').executablePath();
// process.env.

// Import environment variables used to control the tests.
// Note that most have defaults, and many are only applicable
// to testing services

// For testing services

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
    const e = process.env;

    switch (preset) {
        case 'bs-win-chrome':
            return {
                OS: 'Windows',
                OS_VERSION: e.OS_VERSION || '10',
                BROWSER: 'chrome',
                BROWSER_VERSION: e.BROWSER_VERSION || 'latest',
                HEADLESS: e.HEADLESS || 'f',
                SERVICE: 'browserstack',
            };
        case 'bs-win-firefox':
            return {
                OS: 'Windows',
                OS_VERSION: e.OS_VERSION || '10',
                BROWSER: 'firefox',
                BROWSER_VERSION: e.BROWSER_VERSION || 'latest',
                HEADLESS: e.HEADLESS || 'f',
                SERVICE: 'browserstack',
            };
        case 'bs-mac-chrome':
            return {
                OS: 'OS X',
                OS_VERSION: e.OS_VERSION || 'Catalina',
                BROWSER: 'chrome',
                BROWSER_VERSION: e.BROWSER_VERSION || 'latest',
                HEADLESS: e.HEADLESS || 'f',
                SERVICE: 'browserstack',
            };
        case 'bs-mac-firefox':
            return {
                OS: 'OS X',
                OS_VERSION: e.OS_VERSION || 'Catalina',
                BROWSER: 'firefox',
                BROWSER_VERSION: e.BROWSER_VERSION || 'latest',
                HEADLESS: e.HEADLESS || 'f',
                SERVICE: 'browserstack',
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
            };
        default:
            throw new Error(`Sorry, "${preset}" is not a preset`);
    }
}

function makeConfig() {
    const e = process.env;
    const preset = e.PRESET || 'cd';
    const presetConfig = processPreset(preset);

    const [width, height] = (() => {
        switch (e.PRESET_DIMENSIONS || 'sxga') {
            case 'xga':
                return [1024, 768];
            case 'sxga':
                return [1280, 1024];
            case 'hd':
                return [1920, 1080];
            default:
                throw new Error(`Not a valid PRESET_DIMENSIONS: "${e.PRESET_DIMENSIONS}"`);
        }
    })();

    return {
        ...presetConfig,
        WIDTH: e.WIDTH || width,
        HEIGHT: e.HEIGHT || height,
        // Note that these service configs are only used for browserstack.
        SERVICE_USER: e.SERVICE_USER || null,
        SERVICE_KEY: e.SERVICE_KEY || null,

        BASE_URL: e.BASE_URL || 'http://localhost:8888',
        ENV: e.ENV || 'ci',
        HEADLESS: e.HEADLESS || 't',
    };
}

const authToken = (() => {
    if (process.env.KBASE_TEST_TOKEN) {
        console.log('loading auth token from environment variable KBASE_TEST_TOKEN');
        return process.env.KBASE_TEST_TOKEN;
    } else if (
        testConfig &&
        testConfig.token &&
        testConfig.token.file &&
        fs.existsSync(testConfig.token.file)
    ) {
        console.log('loading auth token from file ' + testConfig.token.file);
        return fs.readFileSync(testConfig.token.file, 'utf-8').trim();
    } else {
        console.warn('continuing without valid test token');
        return 'fakeToken';
    }
})();

// Each wdio service supported requires an entry here, even
// if it doesn't have any specific configuration.
// TODO: The relation between selenium-standalone test drivers, as shown
// in the example below, and the installed browser is tricky.
//
// For testing services, we can supply the browser version for supported
// browsers. But for local or github based tests, the tests use whichever
// browser version is installed.
//
// It seems to be fine to have a newer driver for an older browser
// (although warnings may be printed when running tests), but it can be
// an error for a newer browse and older driver. This can happen if
// the selenium-standalone drivers are out of date, but the host is not.
//
// One way to keep this deterministic is to pin the drivers, as show in the
// example below (and the commented out "drivers" setting in the service configs),
// and at the same time pin the browser version in the host.
//
// The host browser can be pinned across testing environments by installing
// the required browsers via npm. E.g. puppeteer installs a local chrome binary, which
// can be specified as the Chrome binary. I could not find a similar method
// for installing Firefox, so gave up on that effort.
//
// The default behavior is to use the latest available, which should
// normally be what we want. However, this ability in selenium-standalone is
// relatively recent, and not yet implemented for Firefox (12/12/2020).
//
// Thus, we should keep the selenium-standalone dependency up to date to ensure
// the most recent version of Firefox is supported.
//
// const drivers = {
//     chrome: {
//         version: '87.0.4280.20',
//     },
//     firefox: {
//         version: '0.28.0'
//     }
// };

const serviceConfigs = {
    'selenium-standalone': {
        logPath: 'selenium-standalone-logs',
        // drivers
    },
    chromedriver: {},
    browserstack: {
        browserstackLocal: true,
        opts: {},
    },
};

const testParams = makeConfig();

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
                const args = [
                    '--disable-gpu',
                    '--no-sandbox',
                    `window-size=${config.WIDTH},${config.HEIGHT}`,
                ];
                if (config.HEADLESS === 't') {
                    args.push('--headless');
                }
                return {
                    browserName: 'chrome',
                    acceptInsecureCerts: true,
                    maxInstances: 1,
                    'goog:chromeOptions': {
                        args,
                        binary: CHROME_BINARY,
                    },
                };
            })();
        case 'selenium-standalone':
            switch (config.BROWSER) {
                case 'chrome':
                    return (() => {
                        const args = [
                            '--disable-gpu',
                            '--no-sandbox',
                            `window-size=${config.WIDTH},${config.HEIGHT}`,
                        ];
                        if (config.HEADLESS === 't') {
                            args.push('--headless');
                        }
                        return {
                            browserName: 'chrome',
                            acceptInsecureCerts: true,
                            maxInstances: 1,
                            'goog:chromeOptions': {
                                args,
                            },
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
                                args,
                            },
                        };
                    })();
                default:
                    throw new Error(`Browser not supported "${config.BROWSER}"`);
            }
        case 'browserstack':
            // see https://www.browserstack.com/docs/automate/selenium/select-browsers-and-devices
            return {
                os: `${config.OS}`,
                os_version: `${config.OS_VERSION}`,
                browser: `${config.BROWSER}`,
                browser_version: `${config.BROWSER_VERSION}`,
                resolution: `${config.WIDTH}x${config.HEIGHT}`,
            };
    }
}

const CAPABILITIES = makeCapabilities(testParams);

console.log('Test Settings');
console.log('-----------------');
console.log('ENV             : ' + testParams.ENV);
console.log('BASE_URL        : ' + testParams.BASE_URL);
console.log('BROWSER         : ' + testParams.BROWSER);
console.log('BROWSER VERSION : ' + testParams.BROWSER_VERSION);
console.log('WIDTH           : ' + testParams.WIDTH);
console.log('HEIGHT          : ' + testParams.HEIGHT);
console.log('OS              : ' + testParams.OS);
console.log('OS VERSION      : ' + testParams.OS_VERSION);
console.log('HEADLESS        : ' + testParams.HEADLESS);
console.log('TEST SERVICE    : ' + testParams.SERVICE);
console.log('SERVICE USER    : ' + testParams.SERVICE_USER);
console.log('SERVICE KEY     : ' + (testParams.SERVICE_KEY ? 'set but hidden' : null));
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
    specs: ['./test/integration/specs/**/*.js'],
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
    capabilities: [CAPABILITIES],
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
    baseUrl: testParams.BASE_URL,
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
    services: [[testParams.SERVICE, serviceConfigs[testParams.SERVICE]]],

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
        },
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
        timeout: 60000,
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

wdioConfig.testParams = testParams;

// Only set the service if it is an online service; setting the
// user and key otherwise will trigger a warning or error.
if (testParams.SERVICE === 'browserstack') {
    wdioConfig.user = testParams.SERVICE_USER;
    wdioConfig.key = testParams.SERVICE_KEY;
}

exports.config = wdioConfig;
