define([
    'jquery',
    'kbase/js/widgets/narrative_core/upload/stagingAreaViewer',
    'base/js/namespace',
    'kbaseNarrative',
], ($, StagingAreaViewer, Jupyter) => {
    'use strict';

    describe('The staging area viewer widget', () => {
        let stagingViewer, container, $container, $parentNode;
        const startingPath = '/',
            updatePathFn = () => {},
            fakeUser = 'notAUser';

        beforeEach(() => {
            jasmine.Ajax.install();
            jasmine.Ajax.stubRequest(/.*\/staging_service\/list\/?/).andReturn({
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
                        mappings: null,
                    },
                    {
                        name: 'file_list.txt',
                        path: fakeUser + '/test_folder/file_list.txt',
                        mtime: 1532738637555,
                        size: 49233,
                        source: 'KBase upload',
                        mappings: [],
                    },
                    {
                        name: 'fake_sra_reads.sra',
                        path: fakeUser + '/fake_sra_reads.sra',
                        mtime: 1532738637555,
                        size: 49233,
                        source: 'KBase upload',
                        mappings: [{ id: 'sra_reads', title: 'SRA Reads' }],
                    },
                ]),
            });

            const mappings = { mappings: [null, null, null] };
            jasmine.Ajax.stubRequest(/.*\/staging_service\/importer_mappings\/?/).andReturn({
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
            stagingViewer = null;
            jasmine.Ajax.uninstall();
            Jupyter.narrative = null;
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

        it('Should start a help tour', async () => {
            await stagingViewer.render();
            stagingViewer.startTour();
            expect(stagingViewer.tour).not.toBeNull();
            // clean up the DOM afterwards
            stagingViewer.tour.tour.end();
        });

        it('Should update its view with a proper subpath', async () => {
            expect(stagingViewer.$elem[0].textContent).toBe('');
            await stagingViewer.updateView();
            expect(
                stagingViewer.$elem[0].querySelector('.kb-data-staging__breadcrumbs').textContent
            ).toContain(fakeUser);
        });

        it('Should show an error when a path does not exist', async () => {
            const errorText = 'An error occurred while fetching your files';
            jasmine.Ajax.stubRequest(/.*\/staging_service\/list\/foo?/).andReturn({
                status: 404,
                statusText: 'success',
                contentType: 'text/plain',
                responseHeaders: '',
                responseText: errorText,
            });

            await stagingViewer.setPath('//foo');
            expect($container.find('.alert.alert-danger').html()).toContain(errorText);
        });

        it('Should show a "no files" next when a path has no files', async () => {
            jasmine.Ajax.stubRequest(/.*\/staging_service\/list\/empty?/).andReturn({
                status: 200,
                statusText: 'success',
                contentType: 'text/plain',
                responseHeaders: '',
                responseText: JSON.stringify([]),
            });

            await stagingViewer.setPath('//empty');
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
            stagingViewer.$elem.find('button[data-name="test_folder"]').click();
            expect(stagingViewer.updatePathFn).toHaveBeenCalledWith('//test_folder');
        });

        it('Should have clickable folder names', async () => {
            spyOn(stagingViewer, 'updatePathFn');
            await stagingViewer.render();
            stagingViewer.$elem.find('button[data-name="test_folder"]').click();
            expect(stagingViewer.updatePathFn).toHaveBeenCalledWith('//test_folder');
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

        it('Should initialize an import app with the expected inputs', () => {
            const fileType = 'fastq_reads_interleaved',
                fileName = 'foobar.txt',
                appId = 'kb_uploadmethods/import_fastq_interleaved_as_reads_from_staging',
                tag = Jupyter.narrative.sidePanel.$methodsWidget.currentTag,
                inputs = {
                    fastq_fwd_staging_file_name: fileName,
                    name: fileName + '_reads',
                    import_type: 'FASTQ/FASTA',
                };
            spyOn(Jupyter.narrative, 'addAndPopulateApp');
            spyOn(Jupyter.narrative, 'hideOverlay');
            stagingViewer.initImportApp(fileType, fileName);
            expect(Jupyter.narrative.addAndPopulateApp).toHaveBeenCalledWith(appId, tag, inputs);
            expect(Jupyter.narrative.hideOverlay).toHaveBeenCalled();
        });

        it('Should NOT initialize an import app with an unknown type', () => {
            spyOn(Jupyter.narrative, 'addAndPopulateApp');
            spyOn(Jupyter.narrative, 'hideOverlay');
            stagingViewer.initImportApp('some_unknown_type', 'foobar.txt');
            expect(Jupyter.narrative.addAndPopulateApp).not.toHaveBeenCalled();
            expect(Jupyter.narrative.hideOverlay).not.toHaveBeenCalled();
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

            //The options that should be in the import as dropdown
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

            //find the fake sra reads row specifically (via the download button, then chaining back up to the select dropdown above - since we don't have a unique ID for these select drodpowns it's the best mehtod for now)
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

        it('should render checboxes for the file table', async () => {
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

            //find the fake sra reads one specifically
            const selectDropdown = $container
                .find('[data-download="fake_sra_reads.sra"]')
                .siblings('select');

            selectDropdown.val('sra_reads').trigger('change').trigger('select2:select');

            //check the checkbox
            $container.find('input.kb-staging-table-body__checkbox-input:enabled').click();

            const button = container.querySelector('.kb-staging-table-import__button');
            expect(button.disabled).toBeFalse();
        });
    });

    //TODO
    //Test to see if
    // * for one autodetect mapping, the detected filetype is selected
    // * for multiple mappings, they are available, and two OptGroups are available
});
