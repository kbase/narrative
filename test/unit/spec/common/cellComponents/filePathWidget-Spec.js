/*global beforeEach */
/*global define*/ // eslint-disable-line no-redeclare
/*global describe, expect, it*/
/*jslint white: true*/

define([
    'common/cellComponents/filePathWidget'
], function(
    filePathWidget
) {
    'use strict';

    describe('The file path widget module', function() {
        it('loads', function() {
            expect(filePathWidget).not.toBe(null);
        });

        it('has expected functions', function() {
            expect(filePathWidget.make).toBeDefined();
        });

    });

    describe('The file path widget instance', function() {
        let bus;
        const workspaceInfo = {id: '123234'},
        cost initialParams = {

        };

        beforeEach(async function () {
            node = document.createElement('div');
            bus = runtime.bus().makeChannelBus({
                description: 'An app params widget'
            });
            infoTabPromise = mockInfoTab.start({node});
            infoTab = await infoTabPromise;
            return infoTab; // to use infoTab for linter
        });

        it('has a factory which can be invoked', function() {
            expect(mockInfoTab).not.toBe(null);
        });

        it('has the required methods', function() {
            expect(mockInfoTab.start).toBeDefined();
            expect(mockInfoTab.stop).toBeDefined();
        });

        it('has a method "start" which returns a Promise',
            function() {
                expect(infoTabPromise instanceof Promise).toBeTrue();
            }
        );

        it('has a method "stop" which returns a Promise',
            function() {
                const result = mockInfoTab.stop();
                expect(result instanceof Promise).toBeTrue();
            }
        );

        // it('returns the defined description', function() {
        //     expect(infoTab.firstChild.textContent).toBe(
        //         appSpec.full_info.description
        //     );
        // });

        // it('returns an item for each parameter', function() {
        //     const listItems = Array.from(infoTab.querySelectorAll('li li'));
        //     expect(listItems.length).toBe(appSpec.parameters.length);
        // });

        // it('renders parameter with formatting correctly', function() {
        //     const RNASeqFormat = infoTab.querySelectorAll(
        //         'li li:nth-child(1) font'
        //     );
        //     expect(RNASeqFormat.length).toBeGreaterThan(0);
        // });

        // it('renders parameter with no formatting correctly', function() {
        //     const AdaptersFormat = infoTab.querySelectorAll(
        //         'li li:nth-child(2)'
        //     )[0];
        //     expect(AdaptersFormat.innerText).toBe(
        //         appSpec.parameters[1].ui_name
        //     );
        // });
    });
});
