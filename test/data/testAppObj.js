define(['./jobsData'], (JobsData) => {
    'use strict';

    const jobData = JobsData.validJobs;
    return {
        app: {
            gitCommitHash: '25e7a896377f5ec50bd15a27ade9f279cb16cd0b',
            id: 'kb_uploadmethods/import_fastq_sra_as_reads_from_staging',
            spec: {
                behavior: {
                    kb_service_input_mapping: [
                        {
                            narrative_system_variable: 'workspace',
                            target_property: 'workspace_name',
                        },
                        {
                            input_parameter: 'import_type',
                            target_property: 'import_type',
                        },
                        {
                            input_parameter: 'fastq_fwd_staging_file_name',
                            target_property: 'fastq_fwd_staging_file_name',
                        },
                        {
                            input_parameter: 'fastq_rev_staging_file_name',
                            target_property: 'fastq_rev_staging_file_name',
                        },
                        {
                            input_parameter: 'sequencing_tech',
                            target_property: 'sequencing_tech',
                        },
                        {
                            input_parameter: 'name',
                            target_property: 'name',
                        },
                        {
                            input_parameter: 'single_genome',
                            target_property: 'single_genome',
                        },
                        {
                            input_parameter: 'interleaved',
                            target_property: 'interleaved',
                        },
                        {
                            input_parameter: 'insert_size_mean',
                            target_property: 'insert_size_mean',
                        },
                        {
                            input_parameter: 'insert_size_std_dev',
                            target_property: 'insert_size_std_dev',
                        },
                        {
                            input_parameter: 'read_orientation_outward',
                            target_property: 'read_orientation_outward',
                        },
                    ],
                    kb_service_method: 'import_reads_from_staging',
                    kb_service_name: 'kb_uploadmethods',
                    kb_service_output_mapping: [
                        {
                            narrative_system_variable: 'workspace',
                            target_property: 'wsName',
                        },
                        {
                            service_method_output_path: ['0', 'obj_ref'],
                            target_property: 'obj_ref',
                            target_type_transform: 'resolved-ref',
                        },
                        {
                            service_method_output_path: ['0', 'report_name'],
                            target_property: 'report_name',
                        },
                        {
                            service_method_output_path: ['0', 'report_ref'],
                            target_property: 'report_ref',
                        },
                        {
                            constant_value: '16',
                            target_property: 'report_window_line_height',
                        },
                    ],
                    kb_service_url: '',
                    kb_service_version: '25e7a896377f5ec50bd15a27ade9f279cb16cd0b',
                },
                fixed_parameters: [],
                full_info: {
                    id: 'kb_uploadmethods/import_fastq_sra_as_reads_from_staging',
                    module_name: 'kb_uploadmethods',
                    git_commit_hash: '25e7a896377f5ec50bd15a27ade9f279cb16cd0b',
                    name: 'Import FASTQ/SRA File as Reads from Staging Area',
                    ver: '1.0.43',
                    authors: ['tgu2'],
                    contact: 'https://kbase.us/contact-us/',
                    subtitle: 'Import a FASTQ/SRA file into your Narrative as a Reads data object',
                    tooltip: 'Import a FASTQ/SRA file into your Narrative as a Reads data object',
                    description:
                        '<p> Import a FASTQ/SRA file into your Narrative as a Reads data object\nPlease see the <a href="https://kbase.us/data-upload-download-guide/">Data Upload/Download Guide</a> for more information. </p>',
                    technical_description: 'none',
                    app_type: 'app',
                    suggestions: {
                        related_methods: [],
                        next_methods: [],
                        related_apps: [],
                        next_apps: [],
                    },
                    icon: {
                        url:
                            'img?method_id=kb_uploadmethods/import_fastq_sra_as_reads_from_staging&image_name=data-pink.png&tag=release',
                    },
                    categories: ['inactive', 'reads', 'upload'],
                    screenshots: [],
                    publications: [],
                    namespace: 'kb_uploadmethods',
                },
                info: {
                    app_type: 'app',
                    authors: ['tgu2'],
                    categories: ['inactive', 'reads', 'upload'],
                    git_commit_hash: '25e7a896377f5ec50bd15a27ade9f279cb16cd0b',
                    icon: {
                        url:
                            'img?method_id=kb_uploadmethods/import_fastq_sra_as_reads_from_staging&image_name=data-pink.png&tag=release',
                    },
                    id: 'kb_uploadmethods/import_fastq_sra_as_reads_from_staging',
                    input_types: [],
                    module_name: 'kb_uploadmethods',
                    name: 'Import FASTQ/SRA File as Reads from Staging Area',
                    namespace: 'kb_uploadmethods',
                    output_types: ['KBaseFile.PairedEndLibrary', 'KBaseFile.SingleEndLibrary'],
                    subtitle: 'Import a FASTQ/SRA file into your Narrative as a Reads data object',
                    tooltip: 'Import a FASTQ/SRA file into your Narrative as a Reads data object',
                    ver: '1.0.43',
                },
                job_id_output_field: 'docker',
                parameters: [
                    {
                        advanced: 0,
                        allow_multiple: 0,
                        default_values: ['FASTQ/FASTA'],
                        description: "Import file type ['FASTQ/FASTA' or 'SRA']",
                        disabled: 0,
                        dropdown_options: {
                            multiselection: 0,
                            options: [
                                {
                                    display: 'FASTQ/FASTA',
                                    index: 0,
                                    value: 'FASTQ/FASTA',
                                },
                                {
                                    display: 'SRA',
                                    index: 1,
                                    value: 'SRA',
                                },
                            ],
                        },
                        field_type: 'dropdown',
                        id: 'import_type',
                        optional: 0,
                        short_hint: "Import file type ['FASTQ/FASTA' or 'SRA']",
                        ui_class: 'parameter',
                        ui_name: 'Import File Type',
                    },
                    {
                        advanced: 0,
                        allow_multiple: 0,
                        default_values: [''],
                        description:
                            'Valid file extensions for FASTA: .fasta, .fna, .fa   Valid file extensions for FASTQ: .fastq, .fnq, .fq; Compressed files (containing files with vaild extentions): .zip, .gz, .bz2, .tar.gz, .tar.bz2',
                        disabled: 0,
                        dynamic_dropdown_options: {
                            data_source: 'ftp_staging',
                            multiselection: 0,
                            query_on_empty_input: 1,
                            result_array_index: 0,
                            service_params: null,
                        },
                        field_type: 'dynamic_dropdown',
                        id: 'fastq_fwd_staging_file_name',
                        optional: 1,
                        short_hint:
                            'Short read file containing a paired end library in FASTA/FASTQ format',
                        ui_class: 'parameter',
                        ui_name: 'Forward/Left FASTA/FASTQ File Path',
                    },
                    {
                        advanced: 0,
                        allow_multiple: 0,
                        default_values: [''],
                        description:
                            'Valid file extensions for FASTA: .fasta, .fna, .fa   Valid file extensions for FASTQ: .fastq, .fnq, .fq; Compressed files (containing files with vaild extentions): .zip, .gz, .bz2, .tar.gz, .tar.bz2',
                        disabled: 0,
                        dynamic_dropdown_options: {
                            data_source: 'ftp_staging',
                            multiselection: 0,
                            query_on_empty_input: 1,
                            result_array_index: 0,
                            service_params: null,
                        },
                        field_type: 'dynamic_dropdown',
                        id: 'fastq_rev_staging_file_name',
                        optional: 1,
                        short_hint:
                            'Second short read file containing a paired end library in FASTA/FASTQ format.',
                        ui_class: 'parameter',
                        ui_name: 'Reverse/Right FASTA/FASTQ File Path',
                    },
                    {
                        advanced: 0,
                        allow_multiple: 0,
                        default_values: ['Illumina'],
                        description:
                            'The name of the sequencing technology used to create the reads file',
                        disabled: 0,
                        dropdown_options: {
                            multiselection: 0,
                            options: [
                                {
                                    display: 'Illumina',
                                    index: 0,
                                    value: 'Illumina',
                                },
                                {
                                    display: 'PacBio CLR',
                                    index: 1,
                                    value: 'PacBio CLR',
                                },
                                {
                                    display: 'PacBio CCS',
                                    index: 2,
                                    value: 'PacBio CCS',
                                },
                                {
                                    display: 'IonTorrent',
                                    index: 3,
                                    value: 'IonTorrent',
                                },
                                {
                                    display: 'NanoPore',
                                    index: 4,
                                    value: 'NanoPore',
                                },
                                {
                                    display: 'Unknown',
                                    index: 5,
                                    value: 'Unknown',
                                },
                            ],
                        },
                        field_type: 'dropdown',
                        id: 'sequencing_tech',
                        optional: 0,
                        short_hint:
                            'The name of the sequencing technology used to create the reads file',
                        ui_class: 'parameter',
                        ui_name: 'Sequencing Technology',
                    },
                    {
                        advanced: 0,
                        allow_multiple: 0,
                        default_values: [''],
                        description:
                            'Provide a name for the Reads object that will be created by this importer',
                        disabled: 0,
                        field_type: 'text',
                        id: 'name',
                        optional: 0,
                        short_hint:
                            'Provide a name for the Reads object that will be created by this importer',
                        text_options: {
                            is_output_name: 1,
                            placeholder: '',
                            regex_constraint: [],
                            valid_ws_types: [
                                'KBaseFile.SingleEndLibrary',
                                'KBaseFile.PairedEndLibrary',
                            ],
                        },
                        ui_class: 'output',
                        ui_name: 'Reads Object Name',
                    },
                    {
                        advanced: 0,
                        allow_multiple: 0,
                        checkbox_options: {
                            checked_value: 1,
                            unchecked_value: 0,
                        },
                        default_values: ['1'],
                        description:
                            'Select if the reads are from a single genome, leave blank if from a metagenome',
                        disabled: 0,
                        field_type: 'checkbox',
                        id: 'single_genome',
                        optional: 0,
                        short_hint:
                            'Select if the reads are from a single genome, leave blank if from a metagenome',
                        ui_class: 'parameter',
                        ui_name: 'Single Genome',
                    },
                    {
                        advanced: 0,
                        allow_multiple: 0,
                        checkbox_options: {
                            checked_value: 1,
                            unchecked_value: 0,
                        },
                        default_values: ['0'],
                        description: 'Select if reads file is interleaved',
                        disabled: 0,
                        field_type: 'checkbox',
                        id: 'interleaved',
                        optional: 0,
                        short_hint: 'Select if reads file is interleaved',
                        ui_class: 'parameter',
                        ui_name: 'Interleaved',
                    },
                    {
                        advanced: 1,
                        allow_multiple: 0,
                        checkbox_options: {
                            checked_value: 1,
                            unchecked_value: 0,
                        },
                        default_values: ['0'],
                        description: 'Select if reads in a pair point outward',
                        disabled: 0,
                        field_type: 'checkbox',
                        id: 'read_orientation_outward',
                        optional: 1,
                        short_hint: 'Select if reads in a pair point outward',
                        ui_class: 'parameter',
                        ui_name: 'Reads Orientation Outward',
                    },
                    {
                        advanced: 1,
                        allow_multiple: 0,
                        default_values: [''],
                        description: 'The standard deviation of insert lengths',
                        disabled: 0,
                        field_type: 'text',
                        id: 'insert_size_std_dev',
                        optional: 1,
                        short_hint: 'The standard deviation of insert lengths',
                        text_options: {
                            is_output_name: 0,
                            placeholder: '',
                            regex_constraint: [],
                            validate_as: 'float',
                        },
                        ui_class: 'parameter',
                        ui_name: 'St. Dev. of Insert Size',
                    },
                    {
                        advanced: 1,
                        allow_multiple: 0,
                        default_values: [''],
                        description: 'The mean (average) insert length',
                        disabled: 0,
                        field_type: 'text',
                        id: 'insert_size_mean',
                        optional: 1,
                        short_hint: 'The mean (average) insert length',
                        text_options: {
                            is_output_name: 0,
                            placeholder: '',
                            regex_constraint: [],
                            validate_as: 'float',
                        },
                        ui_class: 'parameter',
                        ui_name: 'Mean Insert Size',
                    },
                ],
                widgets: {
                    input: 'null',
                    output: 'no-display',
                },
            },
            tag: 'release',
            version: '1.0.43',
        },
        exec: {
            jobState: {
                authstrat: 'kbaseworkspace',
                batch_size: jobData.length,
                cell_id: '13395335-1f3d-4e0c-80f7-44b634968da0',
                child_jobs: jobData,
                created: 1607109147000,
                finished: 1607109627617,
                job_id: '5fca8a1bd257f9f38c9862a0',
                job_output: {
                    id: '5fca8a1bd257f9f38c9862a0',
                    result: [
                        {
                            // object with jobIds as keys and
                            // { final_job_state: jobState } as values
                            batch_results: jobData.reduce(
                                (acc, curr) => ({
                                    ...acc,
                                    [curr.job_id]: { final_job_state: curr },
                                }),
                                {}
                            ),
                            report_name: 'batch_report_1607109609490',
                            report_ref: '57373/19/1',
                        },
                    ],
                    version: '1.1',
                },
                queued: 1607109147274,
                run_id: '13395335-1f3d-4e0c-80f7-44b634968da0',
                running: 1607109162603,
                scheduler_id: '23203',
                scheduler_type: 'condor',
                status: 'completed',
                updated: 1607109627760,
                user: 'ialarmedalien',
                wsid: 57373,
            },
            jobStateUpdated: 1607109635241,
            launchState: {
                cell_id: '13395335-1f3d-4e0c-80f7-44b634968da0',
                event: 'launched_job',
                event_at: '2020-12-04T19:12:27.690847Z',
                job_id: '5fca8a1bd257f9f38c9862a0',
                run_id: '8c202a66-e868-4cf4-a990-bab2393985ae',
            },
            outputWidgetInfo: {
                name: 'no-display',
                params: {
                    report_name: 'batch_report_1607109609490',
                    report_ref: '57373/19/1',
                },
                tag: 'dev',
            },
        },
        executionStats: {
            full_app_id: 'kb_uploadmethods/import_fastq_sra_as_reads_from_staging',
            time_range: '*',
            type: 'a',
            number_of_calls: 170,
            number_of_errors: 63,
            total_exec_time: 70242.75900101662,
            total_queue_time: 40118.08499789238,
            module_name: 'kb_uploadmethods',
        },
        fsm: {
            currentState: {
                code: 'built',
                mode: 'editing',
                params: 'complete',
            },
        },
        output: {
            byJob: {},
        },
        params: {
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
            sra_staging_file_name: 'KBase_object_details_22020-10-14T232042188.json',
        },
        'user-settings': {
            showCodeInputArea: false,
        },
    };
});
