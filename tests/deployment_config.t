use Test::More;
use strict;

require_ok('Bio::KBase::DeploymentConfig');

my $impl;

my $obj = new_ok('Bio::KBase::DeploymentConfig', [$impl, 'kb_seed', { 'service-port' => 3333 }]);

is($obj->service_name, 'kb_seed');
is($obj->setting('service-port'), 3333);

$ENV{KB_SERVICE_NAME} = "foo";

$obj = new_ok('Bio::KBase::DeploymentConfig', [$impl, 'kb_seed', { 'service-port' => 3333 }]);

is($obj->service_name, 'foo');
is($obj->setting('service-port'), 3333);

delete $ENV{KB_SERVICE_NAME};
$ENV{KB_DEPLOYMENT_CONFIG} = "test1.cfg";

$obj = new_ok('Bio::KBase::DeploymentConfig', [$impl, 'kb_seed', { 'service-port' => 3333 }]);

is($obj->service_name, 'kb_seed');
is($obj->setting('service-port'), 7034);

done_testing;