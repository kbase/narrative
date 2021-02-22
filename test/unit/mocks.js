/**
 * This module contains several mock objects that can be reused throughout unit tests.
 * General usage is as per other AMD modules, e.g.:
 * define(['narrativeMocks'], (Mocks) => {
 *      const mockCell = Mocks.buildMockCell('code');
 *      // now this mockCell can be used in various ways
 *      // it's incomplete for a real Jupyter cell, but should still be mostly
 *      // functional in many Narrative contexts
 * })
 */

define('narrativeMocks', ['jquery', 'uuid', 'narrativeConfig'], ($, UUID, Config) => {
    'use strict';
    /**
     * Creates a mock Jupyter notebook cell of some type.
     * @param {string} cellType the type of cell it should be
     * @param {string} kbaseCellType if present, mock up an extended cell by adding some
     *      base metadata.
     */
    function buildMockCell(cellType, kbaseCellType, data) {
        const $cellContainer = $(document.createElement('div'));
        const $icon = $('<div>').attr('data-element', 'icon');
        const $toolbar = $('<div>').addClass('celltoolbar');
        $toolbar.append($icon);
        const metadata = kbaseCellType ? buildMockExtensionCellMetadata(kbaseCellType, data) : {};
        const mockCell = {
            metadata: { kbase: metadata },
            cell_type: cellType,
            renderMinMax: () => {},
            element: $cellContainer,
            input: $('<div>').addClass('input').append('<div>').addClass('input_area'),
            output: $('<div>').addClass('output_wrapper').append('<div>').addClass('output'),
            celltoolbar: {
                rebuild: () => {},
            },
        };

        $cellContainer.append($toolbar).append(mockCell.input).append(mockCell.output);
        $('body').append($cellContainer);
        return mockCell;
    }

    /**
     * Builds some mock cell metadata based on the kbaseCellType being mocked.
     * This cell type should be one of:
     *  app-bulk-import
     *  app
     *  (others to be added as tests get filled out)
     * The metadata is expected to go under the `kbase` key in a real cell.
     * So it should go like this:
     * cell.metadata = {
     *  kbase: <result of this function>,
     *  ... other cell metadata from Jupyter ...
     * }
     * @param {string} kbaseCellType
     */
    function buildMockExtensionCellMetadata(kbaseCellType, data) {
        let meta = {
            type: kbaseCellType,
            attributes: {
                id: new UUID(4).format(),
                status: 'new',
                created: new Date().toUTCString(),
                title: '',
                subtitle: '',
            },
            data: data,
        };
        switch (kbaseCellType) {
            case 'app-bulk-import':
                meta.bulkImportCell = {
                    'user-settings': {
                        showCodeInputArea: false,
                    },
                    inputs: {},
                };
                meta.attributes.title = 'Import from Staging Area';
                meta.attributes.subtitle = 'Import files into your Narrative as data objects';
                break;
            case 'app':
                meta.appCell = {
                    'user-settings': {
                        showCodeInputArea: false,
                    },
                };
                break;
            case 'code':
                meta.codeCell = {
                    'user-settings': {
                        showCodeInputArea: false,
                    },
                };
                break;
            case 'codeWithUserSettings':
                meta.codeCell = {
                    userSettings: {
                        showCodeInputArea: true,
                    },
                };
                break;

            default:
                // if we don't know the cell type, return a blank metadata
                meta = {};
                break;
        }
        return meta;
    }

    /**
     * Builds a mock Jupyter notebook object with a few keys, but mostly
     * an empty object for modification for whatever testing purposes.
     * @param {object} options a set of options for the mock notebook, with the following:
     *  - deleteCallback: function to be called when `delete_cell` is called.
     *  - fullyLoaded: boolean, if true, then treat the notebook as fully loaded
     *  - cells: a list of mocked cells (see buildMockCell)
     *  - readOnly: boolean, true if the Narrative should be read-only
     */
    function buildMockNotebook(options) {
        options = options || {};
        const cells = options.cells || [];

        function insertCell(type, index, data) {
            const cell = buildMockCell(type, '', data);
            if (index <= 0) {
                index = 0;
            }
            cells.splice(index, 0, cell);
            return cell;
        }

        const mockNotebook = {
            delete_cell: () => (options.deleteCallback ? options.deleteCallback() : null),
            find_cell_index: () => 1,
            get_cells: () => cells,
            get_cell: (index) => {
                if (cells.length === 0) {
                    return null;
                }
                if (index <= 0) {
                    return cells[0];
                } else if (index >= cells.length) {
                    return null;
                }
                return cells[index];
            },
            _fully_loaded: options.fullyLoaded,
            cells: cells,
            writable: !options.readOnly,
            insert_cell_above: (type, index, data) => insertCell(type, index - 1, data),
            insert_cell_below: (type, index, data) => insertCell(type, index + 1, data),
        };

        return mockNotebook;
    }

    /**
     * Uses jasmine.Ajax to mock a request to the service wizard. It will return
     * the proper dynamic service URL that will be requested. If it's to be mocked,
     * be sure to have a mock for that endpoint as well.
     *
     * This should be used whenever a dynamic service call is to be mocked.
     * @param {object} args
     *  - module - the module to mock. This should be its registered name.
     *  - url - the fake url to return. Stub requests to this, too!
     *  - statusCode - optional, default 200 - the HTTP status to return. Set to something in the
     *      500 range to mock an error.
     *  - statusText - optional, default 'OK' - a status text to return, if you're changing the
     *      mocked status from 200, this should get changed, too.
     */
    function mockServiceWizardLookup(args) {
        const wizardResponse = {
            git_commit_hash: 'fake_commit_hash',
            hash: 'another_fake_hash',
            health: 'healthy',
            module_name: args.module,
            url: args.url,
        };

        mockJsonRpc1Call({
            url: Config.url('service_wizard'),
            body: new RegExp(args.module),
            statusCode: args.statusCode || 200,
            statusText: args.statusText || 'HTTP/1.1 200 OK',
            response: wizardResponse,
        });
    }

    /**
     * Mocks a KBase-style JSON-RPC 1.1 request. Can use like this for a simple happy response:
     * mockJsonRpc1Call({
     *  url: Config.url('workspace'),
     *  body: 'get_objects2',
     *  response: { data: [{data: {some block of expected workspace data}}]}
     * });
     * Or like this for a fail response:
     * mockJsonRpc1Call({
     *  url: Config.url('workspace'),
     *  body: 'get_objects2',
     *  statusCode: 500,
     *  statusText: 'http/1.1 500 Internal Service Error',
     *  response: {error: 'something bad happened'}
     * })
     * @param {object} args
     * - url - the url endpoint to mock
     * - body - optional, default = empty string
     *   something from the body to identify the request, either a string or regex. For a KBase
     *   service call, this can be a function method
     * -
     */
    function mockJsonRpc1Call(args) {
        const requestBody = args.body || '';
        const jsonRpcResponse = {
            version: '1.1',
            id: '12345',
            result: [args.response],
        };
        const serviceResponse = {
            status: args.statusCode || 200,
            statusText: args.statusText || 'HTTP/1.1 200 OK',
            contentType: 'application/json',
            responseText: JSON.stringify(jsonRpcResponse),
        };
        jasmine.Ajax.stubRequest(args.url, requestBody).andReturn(serviceResponse);
    }

    /**
     * A simple auth request mocker. This takes a path to the auth REST service,
     * a response to return, and the status code, and builds a mock that satisfies
     * all of that.
     * @param {string} request the path request
     * @param {object} responseObj the response to send
     * @param {int} status the status code to return
     */
    function mockAuthRequest(request, responseObj, status) {
        const reqUrl = `${Config.url('auth')}/api/V2/${request}`;
        jasmine.Ajax.stubRequest(reqUrl).andReturn({
            status: status,
            contentType: 'application/json',
            responseText: JSON.stringify(responseObj),
        });
    }

    const cookieKeys = ['kbase_session'];

    function setAuthToken(token) {
        cookieKeys.forEach((key) => {
            document.cookie = `${key}=${token}`;
        });
    }

    function clearAuthToken() {
        cookieKeys.forEach((key) => {
            document.cookie = `${key}=`;
        });
    }

    return {
        buildMockCell: buildMockCell,
        buildMockNotebook: buildMockNotebook,
        mockServiceWizardLookup: mockServiceWizardLookup,
        mockJsonRpc1Call: mockJsonRpc1Call,
        mockAuthRequest: mockAuthRequest,
        setAuthToken: setAuthToken,
        clearAuthToken: clearAuthToken,
    };
});
