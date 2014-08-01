#!/usr/bin/perl

use strict;
use warnings;

use JavaScript::Minifier qw(minify);
use JSON;

my $version = shift or die "Cannot minify w/o library version";

my $config      = 'mini-config.json';
my $lib_root    = "javascript/lib/min/$version";

if (-d $lib_root) {
    print "lib $version already exists. Overwrite? (y/n) : ";
    chomp (my $response = <STDIN>);
    if ($response =~ /^no?/i) {
        exit;
    }
}

mkdir $lib_root;

    local $/ = undef;

my $json_text = '';
open my $jsonfh, '<', $config or die "Cannot open config : $config";
$json_text = <$jsonfh>;
close $jsonfh;

my $json = JSON->new->allow_nonref->decode($json_text);

foreach my $min (keys %$json) {
    my $all_js = '';
    foreach my $file ( @{ $json->{$min} } ) {
        open my $fh, '<', $file or die "Cannot open file $file";
        $all_js .= <$fh>;
        close $fh;
    }
    $min =~ s/\$lib_root/$lib_root/g;

    open my $minfh, '>', $min or die "Canot write to $min";
    my $min_js = minify('input' => $all_js);
    print $minfh $min_js;
    close $minfh;
}
