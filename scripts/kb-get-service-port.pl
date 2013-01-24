use strict;
use Config::Simple;
use Data::Dumper;

=head1 NAME

kb-get-service-port

=head1 DESCRIPTION

Read the deployment configuration file to determine the service port
that the given service should be using.

As a side effect we scan all the services in the deployment and fail hard if there 
are multiple services defined with the same port.

=cut

@ARGV == 1 or die "Usage: $0 service-name\n";

my $service_name = shift;

my $cfg_file = $ENV{KB_DEPLOYMENT_CONFIG};
if ($cfg_file eq '')
{
    die "No KB_DEPLOYMENT_CONFIG environment variable is defined\n";
}

if (! -e $cfg_file)
{
    die "Deployment config file $cfg_file does not exist\n";
}
my $cfg = Config::Simple->new();
$cfg->read($cfg_file);

my %cfg = $cfg->vars;

my %port_seen;
my @dups;
for my $var (keys %cfg)
{
    if ($var =~ /^(.*)\.service-port$/)
    {
	my $service = $1;
	my $port = $cfg{$var};
	if ($port_seen{$port})
	{
	    push(@dups,"Services $port_seen{$port} and $service both use port $port\n");
	}
	$port_seen{$port} = $service;
    }
}

if (@dups)
{
    die "Duplicate port assignments found:\n" . join("", @dups);
}
my $port = $cfg{"$service_name.service-port"};
if (!defined($port))
{
    die "Configuration file $cfg_file does not define a port for servcie $service_name\n";
}
print "$port\n";
