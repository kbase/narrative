/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'jquery',
    'kbase/js/widgets/narrative_core/upload/fileUploadWidget',
    'base/js/namespace',
    'kbaseNarrative'
], (
    $,
    FileUploadWidget,
    Jupyter,
    Narrative
) => {
    let fuWidget,
        $targetNode = $('<div>'),
        fakeUser = 'notAUser';

    beforeEach(() => {
        Jupyter.narrative = {
            userId: fakeUser,
            getAuthToken: () => { return 'fakeToken'; },
            sidePanel: {
                '$dataWidget': {
                    '$overlayPanel': {}
                }
            },
            showDataOverlay: () => {}
        };
        fuWidget = new FileUploadWidget($targetNode, {
            path: '/',
            userInfo: {
                user: fakeUser,
                globusLinked: false
            }
        });
    });

    describe('Test the kbaseNarrativeSidePublicTab widget', () => {
        it('Should render properly when linked to globus', () => {
            let $node = $('<div>'),
                fuw = new FileUploadWidget($node, {
                    path: '/',
                    userInfo: {
                        user: fakeUser,
                        globusLinked: true
                    }
                }),
                renderedMsg = $node.find('.dz-message').html();
            expect(renderedMsg).toContain('<p>Three ways to add data to the staging area:</p>');
            expect(renderedMsg).toContain('<li>Click in this box.</li>');
            expect(renderedMsg).toContain('<li>Drag and drop data files.</li>');
            expect(renderedMsg).toContain('For large files (over 20GB) or a large number of files use');
            expect(renderedMsg).toContain("https://app.globus.org/file-manager?destination_id=c3c0a65f-5827-4834-b6c9-388b0b19953a&amp;destination_path=" + fakeUser);
            expect(renderedMsg).not.toContain('For large files (over 20GB), use Globus. Click');
            expect(renderedMsg).not.toContain('https://docs.kbase.us/data/globus');
        });

        it('Should render properly when not linked to globus', () => {
            let renderedMsg = $targetNode.find('.dz-message').html();
            expect(renderedMsg).toContain('<p>Three ways to add data to the staging area:</p>');
            expect(renderedMsg).toContain('<li>Click in this box.</li>');
            expect(renderedMsg).toContain('<li>Drag and drop data files.</li>');
            expect(renderedMsg).toContain('For large files (over 20GB), use Globus. Click');
            expect(renderedMsg).toContain('https://docs.kbase.us/data/globus');
            expect(renderedMsg).not.toContain('For large files (over 20GB) or a large number of files use');
            expect(renderedMsg).not.toContain("https://app.globus.org/file-manager?destination_id=c3c0a65f-5827-4834-b6c9-388b0b19953a&amp;destination_path=" + fakeUser);
        });

        it('Should be able to set and retrieve the path', () => {
            let newPath = 'newPath';
            fuWidget.setPath(newPath);
            expect(fuWidget.getPath()).toEqual(newPath);
        });
    });
});
