module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    // Project configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                banner: '/*! <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
            },
            my_target: {
                src : ['static/kbase/js/widgets/function_input/kbaseNarrativeInput.js',
                       'static/kbase/js/widgets/function_input/kbaseNarrativeMethodInput.js',
                       'static/kbase/js/widgets/function_input/parameter_input/kbaseNarrativeParameterInput.js',
                       'static/kbase/js/widgets/function_input/parameter_input/kbaseNarrativeParameterTextInput.js',
                       'static/kbase/js/widgets/function_input/parameter_input/kbaseNarrativeParameterDropdownInput.js',
                       'static/kbase/js/widgets/function_input/parameter_input/kbaseNarrativeParameterCheckboxInput.js',
                       'static/kbase/js/widgets/function_input/parameter_input/kbaseNarrativeParameterTextareaInput.js',
                       'static/kbase/js/widgets/function_input/parameter_input/kbaseNarrativeParameterFileInput.js',
                       'static/kbase/js/widgets/narrative_core/kbaseNarrativeSidePanel.js',
                       'static/kbase/js/widgets/narrative_core/kbaseNarrativeSideImportTab.js',
                       'static/kbase/js/widgets/narrative_core/kbaseNarrativeSidePublicTab.js',
                       'static/kbase/js/widgets/narrative_core/kbaseNarrativeExampleDataTab.js',
                       'static/kbase/js/widgets/narrative_core/kbaseNarrativeCellMenu.js',
                       'static/kbase/js/widgets/narrative_core/kbaseNarrativeMethodCell.js',
                       'static/kbase/js/widgets/narrative_core/kbaseNarrativeAppCell.js',
                       'static/kbase/js/widgets/narrative_core/kbaseNarrativeOutputCell.js',
                       'static/kbase/js/widgets/narrative_core/kbaseNarrativeControlPanel.js',
                       'static/kbase/js/widgets/narrative_core/kbaseNarrativeMethodPanel.js',
                       'static/kbase/js/widgets/narrative_core/kbaseNarrativeDataPanel.js',
                       'static/kbase/js/widgets/narrative_core/kbaseNarrativeManagePanel.js',
                       'static/kbase/js/widgets/narrative_core/kbaseNarrativeDownloadPanel.js',
                       'static/kbase/js/widgets/narrative_core/kbaseNarrativeDataList.js',
                       'static/kbase/js/widgets/narrative_core/kbaseNarrativeAppPanel.js',
                       'static/kbase/js/widgets/narrative_core/kbaseNarrativeJobsPanel.js',
                       'static/kbase/js/widgets/narrative_core/kbaseNarrativeSharePanel.js',
                       'static/kbase/js/widgets/narrative_core/kbaseNarrativeWorkspace.js',
                       'static/kbase/js/widgets/narrative_core/kbaseNarrativeCell.js',
                       'static/kbase/js/widgets/narrative_core/kbaseNarrativeDataCell.js',
                       'static/kbase/js/kbaseNarrative.js',
                       'static/kbase/js/widgets/function_output/kbaseNarrativeError.js',
                       'static/kbase/js/widgets/function_output/kbaseDefaultNarrativeOutput.js',],
                dest : '<%= pkg.name %>-<%= pkg.version %>.js',
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
            },
            my_target: {
                src : '<%= pkg.name %>-<%= pkg.version %>.js',
                dest : '<%= pkg.name %>-<%= pkg.version %>.min.js'
            }
        }
    });
/*


*/
    grunt.registerTask('default', ['concat', 'uglify']);
};
