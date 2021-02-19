/*global define*/
/*global jasmine, describe, it, expect, spyOn, beforeEach, afterEach */
define([
    'jquery',
    'base/js/namespace',
    'kbaseNarrative',
    'narrativeConfig',
    'widgets/narrative_core/staticNarrativesManager'
], (
    $,
    Jupyter,
    Narrative,
    Config,
    StaticNarrativesManager
) => {
    'use strict';
    const staticNarrativeServiceUrl = 'https://ci.kbase.us/dynserv/blah.StaticNarrative';

    let node,
        wsId = 43667,
        staticVer = 32,
        objId = 1,
        narrDocInfo = [
            objId,
            'Narrative.1564523505497',
            'KBaseNarrative.Narrative-4.0',
            '2019-11-05T23:44:37+0000',
            staticVer,
            'narrativetest',
            wsId,
            'wjriehl:narrative_1564523505497',
            'cdf315ef72b24adf26c1229e98909f3d',
            421216
        ],
        staticInfo = [{
            ws_id: wsId,
            version: staticVer,
            narrative_id: objId,
            url: '/' + wsId + '/' + staticVer,
            static_saved: 1574877642060,
            narr_saved: 1572997477000
        }],

        userId = 'narrativetest';

    function jsonRPCResponse(result, isError) {
        let res = {
            id: '12345',
            version: '1.1'
        };
        if (isError) {
            res.error = result;
        }
        else {
            res.result = result;
        }
        return JSON.stringify(res);
    }

    function mockOkResponse(result) {
        return {
            status: 200,
            statusText: 'HTTP/1.1 200 OK',
            contentType: 'application/json',
            responseText: jsonRPCResponse(result)
        };
    }

    function mockErrorResponse(result) {
        return {
            status: 500,
            statusText: 'HTTP/1.1 500 Internal service error',
            contentType: 'application/json',
            responseText: jsonRPCResponse(result, true)
        };
    }

    /**
     * Good response from service wizard,
     *
     */
    function mockGoodServiceWizard() {
        const goodServWizResponse = [{
            git_commit_hash: 'b5ccb7fbfa37a422a92158d108b8ad5245a79093',
            hash: 'b5ccb7fbfa37a422a92158d108b8ad5245a79093',
            status: 'active',
            version: '0.0.2',
            release_tags: ['dev'],
            module_name: 'StaticNarrative',
            health: 'healthy',
            up: '1',
            url: staticNarrativeServiceUrl
        }];
        jasmine.Ajax.stubRequest(Config.url('service_wizard'))
            .andReturn(mockOkResponse(goodServWizResponse));
    }

    function mockPermissions(isAdmin, isPublic) {
        let permsResponse = { '*': isPublic ? 'r' : 'n' };
        permsResponse[userId] = isAdmin ? 'a' : 'r';
        jasmine.Ajax.stubRequest(Config.url('workspace'), /get_permissions_mass/)
            .andReturn(mockOkResponse([{perms: [permsResponse]}]));
    }

    function mockGetStaticNarrativeInfo(withInfo, withError) {
        if (!withError) {
            const response = withInfo ? staticInfo : [{}];
            jasmine.Ajax.stubRequest(staticNarrativeServiceUrl,
                /get_static_narrative_info/
            ).andReturn(mockOkResponse(response));
        }
        else {
            const err = {
                code: -32000,
                name: 'Server error',
                message: 'Cannot get static narrative info',
                error: 'Traceback ...---...'
            };
            jasmine.Ajax.stubRequest(staticNarrativeServiceUrl,
                /get_static_narrative_info/
            ).andReturn(mockErrorResponse(err));
        }
    }

    // {
    //     "error": {
    //         "code": -32000,
    //         "name": "Server error",
    //         "message": "'User wjriehl does not have admin rights on workspace 500'",
    //         "error": "Traceback (most recent call last):\n  File \"/kb/module/scripts/../lib/StaticNarrative/StaticNarrativeServer.py\", line 101, in _call_method\n    result = method(ctx, *params)\n  File \"/kb/module/lib/StaticNarrative/StaticNarrativeImpl.py\", line 70, in create_static_narrative\n    verify_admin_privilege(ws_url, ctx[\"user_id\"], ctx[\"token\"], ref.wsid)\n  File \"/kb/module/lib/StaticNarrative/narrative/narrative_util.py\", line 167, in verify_admin_privilege\n    raise PermissionError(f\"User {user_id} does not have admin rights on workspace {ws_id}\")\nPermissionError: User wjriehl does not have admin rights on workspace 500\n"
    //     },
    //     "id": "6918479057874476",
    //     "version": "1.1"
    // }

    function mockCreateStaticNarrative(withError) {
        if (!withError) {
            jasmine.Ajax.stubRequest(staticNarrativeServiceUrl,
                /create_static_narrative/
            ).andReturn(mockOkResponse([{}]));
        }
        else {
            jasmine.Ajax.stubRequest(staticNarrativeServiceUrl,
                /create_static_narrative/
            ).andReturn(mockErrorResponse({
                code: -123,
                message: 'Cannot create new static narrative',
                name: 'JSONRPCError',
                error: 'Some traceback here'
            }));
        }
    }

    function validateHtmlNoStatic(node) {
        expect(node.html()).toContain('No static version exists for this Narrative yet!');
    }

    function validateHtmlStatic(node) {
        expect(node.html()).toContain('Existing static Narrative');
        expect(node.html()).toContain('Made from version ' + staticVer);
    }

    function validateHtmlError(node) {
        expect(node.html()).toContain('Static Narrative Error');
    }

    describe('The Static Narrative manager widget', () => {
        beforeEach(() => {
            Jupyter.narrative = new Narrative();
            Jupyter.narrative.userId = userId;
            Jupyter.narrative.documentVersionInfo = narrDocInfo;
            node = $(document.createElement('div'));

            jasmine.Ajax.install();
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
        });

        it('Should exist', () => {
            expect(StaticNarrativesManager).toBeDefined();
        });

        it('Should be instantiable', () => {
            let widget = new StaticNarrativesManager(node);
            expect(widget).toBeDefined();
            expect(widget.refresh).toBeDefined();
        });

        it('Should render normally when no info static info exists', () => {
            mockGoodServiceWizard();
            mockGetStaticNarrativeInfo(false);
            mockPermissions(true, true);
            let widget = new StaticNarrativesManager(node);
            return widget.render()
                .then(() => {
                    validateHtmlNoStatic(node);
                });
        });

        it('Should render when static info exists', () => {
            mockGoodServiceWizard();
            mockGetStaticNarrativeInfo(true);
            mockPermissions(true, true);
            let widget = new StaticNarrativesManager(node);
            return widget.render()
                .then(() => {
                    validateHtmlStatic(node);
                });
        });

        it('Should refresh before a render', () => {
            mockGoodServiceWizard();
            mockGetStaticNarrativeInfo(false);
            mockPermissions(true, true);
            let widget = new StaticNarrativesManager(node);
            return widget.refresh()
                .then(() => {
                    validateHtmlNoStatic(node);
                });
        });

        it('Should detach after rendering', () => {
            mockGoodServiceWizard();
            mockGetStaticNarrativeInfo(false);
            mockPermissions(true, true);
            expect(node.html()).toBe('');
            let widget = new StaticNarrativesManager(node);
            return widget.render()
                .then(() => {
                    return widget.detach();
                })
                .then(() => {
                    expect(node.html()).toBe('<div></div>');
                });
        });

        it('Should maintain base dom structure after several detaches', () => {
            mockGoodServiceWizard();
            mockGetStaticNarrativeInfo(false);
            mockPermissions(true, true);
            expect(node.html()).toBe('');
            let widget = new StaticNarrativesManager(node);
            return widget.render()
                .then(() => widget.detach())
                .then(() => widget.render())
                .then(() => widget.detach())
                .then(() => widget.render())
                .then(() => widget.detach())
                .then(() => {
                    expect(node.html()).toBe('<div></div>');
                });
        });

        it('Should call saveStaticNarrative on click', () => {
            mockGoodServiceWizard();
            mockGetStaticNarrativeInfo(true);
            mockPermissions(true, true);
            mockCreateStaticNarrative();
            let widget = new StaticNarrativesManager(node);
            spyOn(widget, 'saveStaticNarrative');
            return widget.render()
                .then(() => {
                    node.find('button').click();
                    expect(widget.saveStaticNarrative).toHaveBeenCalled();
                });
        });

        it('saveStaticNarrative should work in ok case and re-render', () => {
            mockGoodServiceWizard();
            mockGetStaticNarrativeInfo(true);
            mockPermissions(true, true);
            mockCreateStaticNarrative();
            let widget = new StaticNarrativesManager(node);
            return widget.render()
                .then(() => {
                    return widget.saveStaticNarrative();
                })
                .then(() => {
                    validateHtmlStatic(node);
                });
        });

        it('saveStaticNarrative should handle errors with rendering them', () => {
            mockGoodServiceWizard();
            mockGetStaticNarrativeInfo(true);
            mockPermissions(true, true);
            mockCreateStaticNarrative(true);
            let widget = new StaticNarrativesManager(node);
            return widget.render()
                .then(() => {
                    return widget.saveStaticNarrative();
                })
                .then(() => {
                    validateHtmlError(node);
                });
        });

        it('render should create an error when StaticNarrative dynserv fails', () => {
            mockPermissions(true, true);
            mockGoodServiceWizard();
            mockGetStaticNarrativeInfo(true, true);
            let widget = new StaticNarrativesManager(node);
            return widget.render()
                .then(() => {
                    validateHtmlError(node);
                });
        });

        it('render should create an error when narrative doc info is not available', () => {
            mockPermissions(true, true);
            mockGoodServiceWizard();
            mockGetStaticNarrativeInfo(true);
            Jupyter.narrative.documentVersionInfo = null;
            let widget = new StaticNarrativesManager(node);
            return widget.render()
                .then(() => {
                    validateHtmlError(node);
                });
        });

        it('should render a warning if user is not an admin', () => {
            mockPermissions(false, true);
            mockGoodServiceWizard();
            mockGetStaticNarrativeInfo(true);
            let widget = new StaticNarrativesManager(node);
            return widget.render()
                .then(() => {
                    expect(node.html()).toContain('Not an admin');
                    expect(node.html()).not.toContain('Not public');
                    expect(node.html()).not.toContain('Create static narrative');
                });
        });

        it('should render a warning if narrative is not public', () => {
            mockPermissions(true, false);
            mockGoodServiceWizard();
            mockGetStaticNarrativeInfo(true);
            let widget = new StaticNarrativesManager(node);
            return widget.render()
                .then(() => {
                    expect(node.html()).not.toContain('Not an admin');
                    expect(node.html()).toContain('Not public');
                    expect(node.html()).not.toContain('Create static narrative');
                });
        });

        it('should render two warnings if user is not an admin and narrative is not public', () => {
            mockPermissions(false, false);
            mockGoodServiceWizard();
            mockGetStaticNarrativeInfo(true);
            let widget = new StaticNarrativesManager(node);
            return widget.render()
                .then(() => {
                    expect(node.html()).toContain('Not an admin');
                    expect(node.html()).toContain('Not public');
                    expect(node.html()).not.toContain('Create static narrative');
                });
        });
    });
});
