#!/usr/bin/perl

use strict;
use warnings;

my @files = qw(
    kbaseWidget.js
    kbaseAuthenticatedWidget.js
    kbaseAccordion.js
    kbaseBox.js
    kbasePrompt.js
    kbaseDeletePrompt.js
    kbaseErrorPrompt.js
    kbaseFormBuilder.js
    kbaseLogin.js
    kbaseTable.js
    kbaseTabs.js
    kbaseFileBrowser.js
    kbaseIrisCommands.js
    kbaseIrisFileBrowser.js
    kbaseIrisGrammar.js
    kbaseIrisProcessList.js
    kbaseIrisTerminal.js
    kbaseIrisTutorial.js
    kbaseWorkspaceBrowser.js
);

my $all_js = '';
local $/ = undef;

foreach my $file (@files) {
    open my $fh, "kbase/$file";
    $all_js .= <$fh>;
}

print $all_js;
