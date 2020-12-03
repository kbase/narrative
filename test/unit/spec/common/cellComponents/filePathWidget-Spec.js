/*global beforeEach */
/*global define*/ // eslint-disable-line no-redeclare
/*global describe, expect, it*/
/*jslint white: true*/

define([
    'common/cellComponents/filePathWidget',
    'common/runtime',
], function(
    FilePathWidget,
    Runtime
) {
    'use strict';

    describe('The file path widget module', function() {
        it('loads', function() {
            expect(FilePathWidget).not.toBe(null);
        });

        it('has expected functions', function() {
            expect(FilePathWidget.make).toBeDefined();
        });

    });

    describe('The file path widget instance', function() {
        let paramsBus,
            filePathWidget,
            mockFilePathWidget,
            filePathWidgetPromise,
            runtime;

        const workspaceId = {id: '56263'},
            initialParams = {
                fastq_fwd_staging_file_name: '',
                fastq_rev_staging_file_name: '',
                import_type: 'SRA',
                insert_size_mean: null,
                insert_size_std_dev: null,
                interleaved: 0,
                name: 'KBase_object_details_22020-10-14T232042188.json_reads',
                read_orientation_outward: 0,
                sequencing_tech: 'Illumina',
                single_genome: 1,
                sra_staging_file_name: 'KBase_object_details_22020-10-14T232042188.json'
            };

        beforeEach(async function () {
            runtime = Runtime.make();
            paramsBus = runtime.bus().makeChannelBus({
                description: 'Test bus'
            });
            filePathWidgetPromise = mockFilePathWidget.start({
                paramsBus: paramsBus,
                workspaceId: workspaceId,
                initialParams: initialParams
            });
            filePathWidget = await filePathWidgetPromise;
            return filePathWidget; // to use filePathWidget for linter
        });

        it('has a factory which can be invoked', function() {
            expect(mockFilePathWidget).not.toBe(null);
        });

        it('has the required methods', function() {
            expect(mockFilePathWidget.start).toBeDefined();
            expect(mockFilePathWidget.stop).toBeDefined();
            expect(mockFilePathWidget.bus).toBeDefined();
        });

        it('has a method "start" which returns a Promise',
            function() {
                expect(filePathWidgetPromise instanceof Promise).toBeTrue();
            }
        );

        it('has a method "stop" which returns a Promise',
            function() {
                const result = mockFilePathWidget.stop();
                expect(result instanceof Promise).toBeTrue();
            }
        );

    });
});
