###UI-Common: The Starter Kit###
This is a starter kit for the KBase UI-Common repo.

###Updating
You should have a workspace with the master branch (`$master`) and a workspace with the starter-kit branch (`$kit`). Build the distribution files in `$master`, then drop into `$kit` and copy over `kbase.js`, `kbase.min.js`, `datavis.js`, and `datavis.css` into their appropriate directories.

    cd $master
    make dist
    cd $kit
    cp $master/dist/kbase*.js $kit/js/
    cp $master/ext/kbase-datavis/dist/datavis.js $kit/js/
    cp $master/ext/kbase-datavis/dist/datavis.css $kit/css/
