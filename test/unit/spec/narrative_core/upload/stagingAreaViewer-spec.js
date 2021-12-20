define([
    'jquery',
    'kbase/js/widgets/narrative_core/upload/stagingAreaViewer',
    'base/js/namespace',
    'narrativeConfig',
    'testUtil',
], ($, StagingAreaViewer, Jupyter, Config, TestUtil) => {
    'use strict';

    describe('The staging area viewer widget', () => {
        let stagingViewer, container, $container, $parentNode;
        const startingPath = '/',
            updatePathFn = null,
            fakeUser = 'notAUser',
            stagingServiceUrl = Config.url('staging_api_url');

        beforeEach(() => {
            jasmine.Ajax.install();
            jasmine.Ajax.stubRequest(new RegExp(`${stagingServiceUrl}/list/`)).andReturn({
                status: 200,
                statusText: 'success',
                contentType: 'text/plain',
                responseHeaders: '',
                responseText: JSON.stringify([
                    {
                        name: 'test_folder',
                        path: fakeUser + '/test_folder',
                        mtime: 1532738637499,
                        size: 34,
                        isFolder: true,
                    },
                    {
                        name: 'some_reads.fq',
                        path: fakeUser + '/test_folder/some_reads.fq',
                        mtime: 1532738637555,
                        size: 49233,
                        source: 'KBase upload',
                        isFolder: false,
                    },
                    {
                        name: 'fake_sra_reads.sra',
                        path: fakeUser + '/fake_sra_reads.sra',
                        mtime: 1532738637555,
                        size: 49233,
                        source: 'KBase upload',
                        isFolder: false,
                    },
                    {
                        name: 'unknown_file.txt',
                        path: fakeUser + '/unknown_file.txt',
                        mtime: 1532738637555,
                        size: 100,
                        source: 'KBase upload',
                        isFolder: false,
                    },
                ]),
            });

            const mappings = {
                mappings: [
                    null,
                    null,
                    [{ id: 'sra_reads', app_weight: 1, title: 'SRA Reads' }],
                    null,
                ],
            };
            jasmine.Ajax.stubRequest(
                new RegExp(`${stagingServiceUrl}/importer_mappings/`)
            ).andReturn({
                status: 200,
                statusText: 'success',
                contentType: 'text/plain',
                responseHeaders: '',
                responseText: JSON.stringify(mappings),
            });

            Jupyter.narrative = {
                userId: fakeUser,
                getAuthToken: () => 'fakeToken',
                sidePanel: {
                    $dataWidget: {
                        $overlayPanel: {},
                    },
                    $methodsWidget: {
                        currentTag: 'release',
                    },
                },
                showDataOverlay: () => {},
                addAndPopulateApp: () => {},
                hideOverlay: () => {},
                insertBulkImportCell: () => {},
            };
            $parentNode = $('<div id="stagingAreaDivParent">');
            container = document.createElement('div');
            $container = $(container);
            $parentNode.append($container);
            stagingViewer = new StagingAreaViewer($container, {
                path: startingPath,
                updatePathFn: updatePathFn,
                userInfo: {
                    user: fakeUser,
                    globusLinked: false,
                },
                refreshIntervalDuration: 2,
            });
        });

        afterEach(() => {
            $parentNode.remove();
            stagingViewer.deactivate();
            // just in case.
            $.fn.DataTable.ext.search.pop();
            stagingViewer = null;
            jasmine.Ajax.uninstall();
            Jupyter.narrative = null;
            TestUtil.clearRuntime();
        });

        it('Should initialize properly', () => {
            expect(stagingViewer).not.toBeNull();
        });

        it('Should render properly', async () => {
            await stagingViewer.render();
            expect(stagingViewer).not.toBeNull();
        });

        it('Should render properly with a Globus linked account', async () => {
            const $node = $('<div>'),
                linkedStagingViewer = new StagingAreaViewer($node, {
                    path: startingPath,
                    updatePathFn: updatePathFn,
                    userInfo: {
                        user: fakeUser,
                        globusLinked: true,
                    },
                });
            await linkedStagingViewer.render();
            const $globusButton = $node.find('#globusLinked');
            expect($globusButton).toBeDefined();
            expect($globusButton.html()).toContain('Upload with Globus');
            expect($globusButton.attr('href')).toEqual(
                'https://app.globus.org/file-manager?destination_id=c3c0a65f-5827-4834-b6c9-388b0b19953a&destination_path=' +
                    fakeUser
            );
        });

        it('Should render properly without a Globus linked account', async () => {
            await stagingViewer.render();
            const $globusButton = $container.find('#globusNotLinked');
            expect($globusButton).toBeDefined();
            expect($globusButton.html()).toContain('Upload with Globus');
            expect($globusButton.attr('href')).toEqual('https://docs.kbase.us/data/globus');
        });

        it('Should render a url button', async () => {
            await stagingViewer.render();
            const $urlButton = $container.find('.web_upload_div');
            expect($urlButton).toBeDefined();
            expect($urlButton.html()).toContain('Upload with URL');
        });

        it('Should start a help tour on function call', async () => {
            await stagingViewer.render();
            stagingViewer.startTour();
            expect(stagingViewer.tour).not.toBeNull();
            // clean up the DOM afterwards
            stagingViewer.tour.tour.end();
        });

        it('Should start a tour on click', async () => {
            await stagingViewer.render();
            spyOn(stagingViewer, 'startTour');
            container.querySelector('button#help').click();
            expect(stagingViewer.startTour).toHaveBeenCalled();
        });

        it('Should update its view with a proper subpath', async () => {
            expect(stagingViewer.$elem[0].textContent).toBe('');
            await stagingViewer.updateView();
            expect(
                stagingViewer.$elem[0].querySelector('.kb-data-staging__breadcrumbs').textContent
            ).toContain(fakeUser);
        });

        it('Should show an error when file listing fails', async () => {
            const errorText = 'An error occurred while fetching your files';
            jasmine.Ajax.stubRequest(new RegExp(`${stagingServiceUrl}/list`)).andReturn({
                status: 404,
                statusText: 'success',
                contentType: 'text/plain',
                responseHeaders: '',
                responseText: errorText,
            });

            stagingViewer.setPath('/foo');
            await stagingViewer.updateView();
            expect($container.find('.alert.alert-danger').html()).toContain(errorText);
        });

        it('Should show a "no files" text when a directory has no files', async () => {
            await stagingViewer.updateView();
            stagingViewer.setPath('/empty');
            expect($container.find('tbody.kb-staging-table-body').html()).toContain(
                'No files found.'
            );
        });

        it('Should respond to activate and deactivate commands', async () => {
            expect(stagingViewer.refreshInterval).toBeFalsy();
            await stagingViewer.activate();
            expect(stagingViewer.refreshInterval).toBeDefined();
            stagingViewer.deactivate();
            expect(stagingViewer.refreshInterval).toBeUndefined();
        });

        it('Should have clickable folder icons', async () => {
            spyOn(stagingViewer, 'updatePathFn');
            await stagingViewer.render();
            stagingViewer.$elem
                .find('button.kb-staging-table-body__button--folder[data-name="test_folder"]')
                .click();
            expect(stagingViewer.updatePathFn).toHaveBeenCalledWith('/test_folder');
        });

        it('Should have clickable folder names', async () => {
            spyOn(stagingViewer, 'updatePathFn');
            await stagingViewer.render();
            stagingViewer.$elem
                .find('span.kb-staging-table-body__folder[data-name="test_folder"]')
                .click();
            expect(stagingViewer.updatePathFn).toHaveBeenCalledWith('/test_folder');
        });

        it('Should have multi-clicked folder buttons only fire once', async () => {
            spyOn(stagingViewer, 'updatePathFn');
            await stagingViewer.render();
            stagingViewer.$elem.find('button[data-name="test_folder"]').click().click().click();
            expect(stagingViewer.updatePathFn).toHaveBeenCalledTimes(1);
        });

        it('Should have multi-clicked folder names only fire once', async () => {
            spyOn(stagingViewer, 'updatePathFn');
            await stagingViewer.render();
            stagingViewer.$elem.find('span.kb-staging-table-body__folder').click().click().click();
            expect(stagingViewer.updatePathFn).toHaveBeenCalledTimes(1);
        });

        it('Creates a downloader iframe when requested', () => {
            stagingViewer.downloadFile('some_url');
            const dlNode = document.getElementById('hiddenDownloader');
            expect(dlNode).toBeDefined();
            expect(dlNode.getAttribute('src')).toEqual('some_url');
            // clean up the DOM
            $(dlNode).remove();
        });

        it('should properly render the import as dropdown', async () => {
            await stagingViewer.render();
            const placeholder = $container.find('span.select2-selection__placeholder').html();
            expect(placeholder).toContain('Select a type');

            // The options that should be in the import as dropdown
            const menuOptions = [
                'SRA Reads',
                'GenBank Genome',
                'GFF Genome',
                'GFF Metagenome',
                'Expression Matrix',
                'Media',
                'FBA Model',
                'Assembly',
                'Phenotype Set',
                'Sample Set',
            ];
            const foundOptions = $container.find('.select2-hidden-accessible').html();

            menuOptions.forEach((option) => {
                expect(foundOptions).toContain(option);
            });
        });

        it('renders the dropdown correctly when a type is selected', async () => {
            await stagingViewer.render();

            // find the fake sra reads row specifically (via the download button, then chaining back up to the select dropdown above - since we don't have a unique ID for these select drodpowns it's the best mehtod for now)
            const selectDropdown = $container
                .find('[data-download="fake_sra_reads.sra"]')
                .siblings('select');

            //set the value of the dropdown
            selectDropdown.val('sra_reads').trigger('change').trigger('select2:select');

            //check that the dropdown renders correctly
            const select2 = $container.find('[title="SRA Reads"]');
            expect(select2).toBeDefined();
            expect(select2.attr('title')).toContain('SRA Reads');
            expect(select2.html()).toContain('SRA Reads');
        });

        it('should render checkboxes for the file table', async () => {
            await stagingViewer.render();

            //initially the checkboxes are rendered disabled until a user selects a type
            const tableCheckboxes = $container.find(
                'input.kb-staging-table-body__checkbox-input:disabled'
            );

            expect(tableCheckboxes.length).toBeGreaterThan(0);
            expect(tableCheckboxes.attr('aria-label')).toContain(
                'Select to import file checkbox: disabled until at least one data type is selected'
            );

            const headerCheckbox = $container.find('#staging_table_select_all');

            expect(headerCheckbox.length).toEqual(1);
            expect(headerCheckbox.attr('aria-label')).toContain(
                'Select to import all files checkbox: disabled until at least one data type is selected'
            );
        });

        it('checkboxes will be enabled when a type is selected', async () => {
            await stagingViewer.render();

            //find the fake sra reads one specifically
            const selectDropdown = $container
                .find('[data-download="fake_sra_reads.sra"]')
                .siblings('select');

            selectDropdown.val('sra_reads').trigger('change').trigger('select2:select');

            //check that the table checkbox is enabled
            const tableCheckbox = $container.find(
                'input.kb-staging-table-body__checkbox-input:enabled'
            );

            expect(tableCheckbox.length).toEqual(1);
            expect(tableCheckbox.attr('aria-label')).toContain('Select to import file checkbox');

            const headerCheckbox = $container.find('#staging_table_select_all');

            //TODO: for some weird reason the header checkbox isn't showing as enabled, even though the click event fires. not sure what is going on here
            expect(headerCheckbox.length).toEqual(1);
            expect(headerCheckbox.attr('aria-label')).toContain(
                'Select to import all files checkbox'
            );

            expect(tableCheckbox.prop('checked')).toBeTruthy();
        });

        it('checkboxes should remain checked after a refresh', async () => {
            await stagingViewer.render();
            const file = 'fake_sra_reads.sra';
            const selectDropdown = $container.find(`[data-download="${file}"]`).siblings('select');

            selectDropdown.val('sra_reads').trigger('change').trigger('select2:select');

            const checkboxSelector = `input.kb-staging-table-body__checkbox-input[data-file-name="${file}"]`;
            let checkbox = container.querySelector(checkboxSelector);
            expect(checkbox.disabled).toBeFalse();
            expect(checkbox.checked).toBeTrue();

            await stagingViewer.updateView();
            checkbox = container.querySelector(checkboxSelector);
            expect(checkbox.checked).toBeTrue();
        });

        it('checkboxes in subdirectories should remain checked while navigating', async () => {
            await stagingViewer.render();
            stagingViewer.setPath('/test_folder');
            const filePath = 'test_folder/some_reads.fq';
            const selectDropdown = $container
                .find(`[data-download="${filePath}"]`)
                .siblings('select');

            selectDropdown
                .val('fastq_reads_interleaved')
                .trigger('change')
                .trigger('select2:select');
            const checkboxSelector = `input.kb-staging-table-body__checkbox-input[data-file-name="${filePath}"]`;
            let checkbox = container.querySelector(checkboxSelector);
            expect(checkbox.disabled).toBeFalse();
            expect(checkbox.checked).toBeTrue();

            stagingViewer.setPath('/');
            checkbox = container.querySelector(checkboxSelector);
            expect(checkbox).toBeNull();

            stagingViewer.setPath('/test_folder');
            checkbox = container.querySelector(checkboxSelector);
            expect(checkbox.checked).toBeTrue();
        });

        it('should render the import selected button', async () => {
            await stagingViewer.render();

            //initial state should be disabled until the user selects a data type for at least one file
            const button = container.querySelector('.kb-staging-table-import__button');
            expect(button.textContent).toContain('Import Selected');
            expect(button.disabled).toBeTrue();
        });

        it('should enable the import button when a type is selected', async () => {
            await stagingViewer.render();

            const importButton = container.querySelector('.kb-staging-table-import__button');
            expect(importButton.disabled).toBeTrue();

            // find the fake sra reads one specifically
            const selectDropdown = $container
                .find('[data-download="fake_sra_reads.sra"]')
                .siblings('select');

            selectDropdown.val('sra_reads').trigger('change').trigger('select2:select');
            expect(importButton.disabled).toBeFalse();

            // expect there's an enabled, checked checkbox
            const checkbox = container.querySelector(
                'input.kb-staging-table-body__checkbox-input[data-file-name="fake_sra_reads.sra"]'
            );
            expect(checkbox.disabled).toBeFalse();
            expect(checkbox.checked).toBeTrue();
            // the click function doesn't trigger the change event, gotta do that manually.
            checkbox.click();
            expect(importButton.disabled).toBeTrue();
        });

        describe('Should initialize uploader cells', () => {
            const bulkAppId = 'kb_uploadmethods/import_sra_as_reads_from_staging',
                bulkImportType = 'sra_reads',
                bulkOutputSuffix = '_reads',
                nonBulkAppId = 'kb_uploadmethods/import_tsv_as_expression_matrix_from_staging',
                nonBulkType = 'expression_matrix',
                nonBulkSuffix = '_matrix';

            let tag;

            beforeEach(() => {
                tag = Jupyter.narrative.sidePanel.$methodsWidget.currentTag;
            });

            it('Should run the import app init function when the import button is clicked', async () => {
                await stagingViewer.render();
                const fileName = 'fake_sra_reads.sra';

                // find the fake sra reads dropdown
                const selectDropdown = $container
                    .find(`[data-download='${fileName}']`)
                    .siblings('select');

                // this auto-checks the checkbox
                selectDropdown.val('sra_reads').trigger('change').trigger('select2:select');
                const button = container.querySelector('.kb-staging-table-import__button');
                expect(button.disabled).toBeFalse();

                spyOn(stagingViewer, 'initImport');
                $(button).click();
                expect(stagingViewer.initImport).toHaveBeenCalled();
            });

            it('Should initialize an import app with unselected files', async () => {
                spyOn(Jupyter.narrative, 'addAndPopulateApp');
                spyOn(Jupyter.narrative, 'insertBulkImportCell');
                spyOn(Jupyter.narrative, 'hideOverlay');
                await stagingViewer.initImport();
                expect(Jupyter.narrative.addAndPopulateApp).not.toHaveBeenCalled();
                expect(Jupyter.narrative.insertBulkImportCell).not.toHaveBeenCalled();
                expect(Jupyter.narrative.hideOverlay).not.toHaveBeenCalled();
            });

            [
                {
                    subdir: null,
                    filename: 'fake_sra_reads.sra',
                    isBulk: true,
                },
                {
                    subdir: 'test_folder',
                    filename: 'some_reads.fq',
                    isBulk: true,
                },
                {
                    subdir: null,
                    filename: 'unknown_file.txt',
                    isBulk: false,
                },
                {
                    subdir: 'test_folder',
                    filename: 'some_reads.fq',
                    isBulk: false,
                },
            ].forEach((testCase) => {
                const filePath = (testCase.subdir ? testCase.subdir + '/' : '') + testCase.filename;
                const isBulk = testCase.isBulk;
                const dataType = isBulk ? bulkImportType : nonBulkType;
                it(`Should initialize a${
                    testCase.isBulk ? ' bulk' : 'n'
                } import cell with the expected single input file ${filePath} and type ${dataType}`, async () => {
                    await stagingViewer.render();
                    if (testCase.subdir) {
                        stagingViewer.$elem.find(`button[data-name="${testCase.subdir}"]`).click();
                    }

                    // find the given file specifically
                    const selectDropdown = $container
                        .find(`[data-download='${filePath}']`)
                        .siblings('select');

                    // this auto-checks the checkbox
                    selectDropdown.val(dataType).trigger('change').trigger('select2:select');

                    const button = container.querySelector('.kb-staging-table-import__button');
                    expect(button.disabled).toBeFalse();

                    spyOn(Jupyter.narrative, 'insertBulkImportCell');
                    spyOn(Jupyter.narrative, 'addAndPopulateApp');
                    spyOn(Jupyter.narrative, 'hideOverlay');

                    await stagingViewer.initImport();

                    if (isBulk) {
                        const expectedInputs = {};
                        expectedInputs[dataType] = {
                            appId: bulkAppId,
                            files: [filePath],
                            outputSuffix: isBulk ? bulkOutputSuffix : nonBulkSuffix,
                        };
                        expect(Jupyter.narrative.insertBulkImportCell).toHaveBeenCalledWith(
                            expectedInputs
                        );
                        expect(Jupyter.narrative.addAndPopulateApp).not.toHaveBeenCalled();
                    } else {
                        const fileInputs = {
                            staging_file_subdir_path: filePath,
                            matrix_name: testCase.filename + '_matrix',
                        };
                        expect(Jupyter.narrative.addAndPopulateApp).toHaveBeenCalledWith(
                            nonBulkAppId,
                            tag,
                            fileInputs
                        );
                        expect(Jupyter.narrative.insertBulkImportCell).not.toHaveBeenCalled();
                    }
                    expect(Jupyter.narrative.hideOverlay).toHaveBeenCalled();
                });
            });
        });

        describe('autodetect mapping tests', () => {
            const filename = 'fake_sra_reads.sra',
                typeId = 'sra_reads';
            let $selectInput;

            beforeEach(async () => {
                await stagingViewer.render();
                $selectInput = $container.find(`[data-download="${filename}"]`).siblings('select');
            });

            it('should render autodetected mappings in the type select dropdown', () => {
                const $suggestedOptGroup = $selectInput.find('optgroup[label="Suggested Types"]');
                const $otherOptGroup = $selectInput.find('optgroup[label="Other Types"]');
                expect($suggestedOptGroup.length).toBe(1);
                expect($otherOptGroup.length).toBe(1);

                expect($suggestedOptGroup.children().length).toBe(1);
                expect($suggestedOptGroup.find(`option[value="${typeId}"]`).length).toBe(1);
            });

            it('should automatically select the mapping if there is only one suggested file type', () => {
                // only one suggested file type for the sra reads file, so just make sure it's selected!
                expect($selectInput.val()).toBe(typeId);
            });
        });

        // TODO file metadata viewer tests
        xdescribe('file metadata view tests', () => {
            it('should render the file metadata view when the caret is clicked', async () => {});

            it('should render the same metadata, without a second network call, when the view is toggled twice', async () => {});

            it('should restore the metadata view after a table data refresh', async () => {});
        });
    });
});
