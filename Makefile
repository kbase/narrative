TOP_DIR = ../..
DEPLOY_RUNTIME ?= /kb/runtime
TARGET ?= /kb/deployment
SERVICE_SPEC =
SERVICE_NAME = narrative
REPO_NAME = narrative
SERVICE_PORT = 8090

ROOT_DEV_MODULE_DIR := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
KB_DEPLOYMENT_CONFIG ?= $(ROOT_DEV_MODULE_DIR)/deploy.cfg

#include $(TOP_DIR)/tools/Makefile.common
#include $(TOP_DIR)/tools/Makefile.common.rules
SERVICE_DIR ?= $(TARGET)/services/$(SERVICE_NAME)
PID_FILE = $(SERVICE_DIR)/service.pid
LOG_FILE = $(SERVICE_DIR)/log/uwsgi.log
ERR_LOG_FILE = $(SERVICE_DIR)/log/error.log

# to wrap scripts and deploy them to $(TARGET)/bin using tools in
# the dev_container. right now, these vars are defined in
# Makefile.common, so it's redundant here.
TOOLS_DIR = $(TOP_DIR)/tools
WRAP_PERL_TOOL = wrap_perl
WRAP_PERL_SCRIPT = bash $(TOOLS_DIR)/$(WRAP_PERL_TOOL).sh
SRC_PERL = $(wildcard scripts/*.pl)

# You can change these if you are putting your tests somewhere
# else or if you are not using the standard .t suffix
CLIENT_TESTS = $(wildcard test/client-tests/*.t)
SCRIPT_TESTS = $(wildcard test/script-tests/*.t)
SERVER_TESTS = $(wildcard test/server-tests/*.t)

# Installer script
INSTALLER = ./install.sh

# This is a very client-centric view of release engineering.
# We assume our primary product for the community is the client
# libraries, command line interfaces, and the related documentation
# from which specific science applications can be built.
#
# A service is composed of a client and a server, each of which
# should be independently deployable. Clients are composed of
# an application programming interface (API) and a command line
# interface (CLI). In our make targets, deploy-service deploys
# the server, deploy-client deploys the application
# programming interface libraries, and deploy-scripts deploys
# the command line interface (usually scripts written in a
# scripting language but java executables also qualify), and the
# deploy target would be equivelant to deploying a service (client
# libs, scripts, and server).
#
# Because the deployment of the server side code depends on the
# specific software module being deployed, the strategy needs
# to be one that leaves this decision to the module developer.
# This is done by having the deploy target depend on the
# deploy-service target. The module developer who chooses for
# good reason not to deploy the server with the client simply
# manages this dependancy accordingly. One option is to have
# a deploy-service target that does nothing, the other is to
# remove the dependancy from the deploy target.
#
# A similar naming convention is used for tests. 


default:

# Distribution Section
#
# This section deals with the packaging of source code into a 
# distributable form. This is different from a deployable form
# as our deployments tend to be kbase specific. To create a
# distribution, we have to consider the distribution mechanisms.
# For starters, we will consider cpan style packages for perl
# code, we will consider egg for python, npm for javascript,
# and it is not clear at this time what is right for java.

dist: dist-cpan dist-egg dist-npm dist-java

dist-cpan: dist-cpan-client dist-cpan-service

dist-egg: dist-egg-client dist-egg-service

dist-npm: dist-nmp-client dist-npm-service

dist-java: dist-java-client dist-java-service

dist-cpan-client:
	echo "cpan client distribution not supported"

dist-cpan-service:
	echo "cpan service distribution not supported"

dist-egg-client:
	echo "egg client distribution not supported"

dist-egg-service:
	echo "egg service distribution not supported"

dist-npm-client:
	echo "npm client distribution not supported"

dist-npm-service:
	echo "npm service distribution not supported"

dist-java-client:
	echo "java client distribution not supported"

dist-java-service:
	echo "java service distribuiton not supported"

# Test Section

test: test-client test-scripts test-service
	@echo "running client and script tests"

# test-all is deprecated. 
# test-all: test-client test-scripts test-service
#
# test-client: This is a test of a client library. If it is a
# client-server module, then it should be run against a running
# server. You can say that this also tests the server, and I
# agree. You can add a test-service dependancy to the test-client
# target if it makes sense to you. This test example assumes there is
# already a tested running server.
test-client:
	# run each test
	for t in $(CLIENT_TESTS) ; do \
		if [ -f $$t ] ; then \
			/usr/bin/env python $$t ; \
			if [ $$? -ne 0 ] ; then \
				exit 1 ; \
			fi \
		fi \
	done

# test-scripts: A script test should test the command line scripts. If
# the script is a client in a client-server architecture, then there
# should be tests against a running server. You can add a test-service
# dependency to the test-client target. You could also add a
# deploy-service and start-server dependancy to the test-scripts
# target if it makes sense to you. Future versions of the makefiles
# for services will move in this direction.
test-scripts:
	# run each test
	for t in $(SCRIPT_TESTS) ; do \
		if [ -f $$t ] ; then \
			/usr/bin/env python $$t ; \
			if [ $$? -ne 0 ] ; then \
				exit 1 ; \
			fi \
		fi \
	done

# test-service: A server test should not rely on the client libraries
# or scripts--you should not have a test-service target that depends
# on the test-client or test-scripts targets. Otherwise, a circular
# dependency graph could result.
test-service:
	# run each test
	for t in $(SERVER_TESTS) ; do \
		if [ -f $$t ] ; then \
			/usr/bin/env python $$t ; \
			if [ $$? -ne 0 ] ; then \
				exit 1 ; \
			fi \
		fi \
	done

# Deployment:
# 
# We are assuming our primary products to the community are
# client side application programming interface libraries and a
# command line interface (scripts). The deployment of client
# artifacts should not be dependent on deployment of a server,
# although we recommend deploying the server code with the
# client code when the deploy target is executed. If you have
# good reason not to deploy the server at the same time as the
# client, just delete the dependancy on deploy-service. It is
# important to note that you must have a deploy-service target
# even if there is no server side code to deploy.

deploy: deploy-client deploy-service

# deploy-all deploys client *and* server. This target is deprecated
# and should be replaced by the deploy target.

deploy-all: deploy-client deploy-service

# deploy-client should deploy the client artifacts, mainly
# the application programming interface libraries, command
# line scripts, and associated reference documentation.

deploy-client: deploy-libs deploy-scripts deploy-docs

# The deploy-libs and deploy-scripts targets are used to recognize
# and delineate the client types, mainly a set of libraries that
# implement an application programming interface and a set of 
# command line scripts that provide command-based execution of
# individual API functions and aggregated sets of API functions.

deploy-libs: build-libs

# Deploying scripts needs some special care. They need to run
# in a certain runtime environment. Users should not have
# to modify their user environments to run kbase scripts, other
# than just sourcing a single user-env script. The creation
# of this user-env script is the responsibility of the code
# that builds all the kbase modules. In the code below, we
# run a script in the dev_container tools directory that 
# wraps perl scripts. The name of the perl wrapper script is
# kept in the WRAP_PERL_SCRIPT make variable. This script
# requires some information that is passed to it by way
# of exported environment variables in the bash script below.
#
# What does it mean to wrap a perl script? To wrap a perl
# script means that a bash script is created that sets
# all required environment variables and then calls the perl
# script using the perl interperter in the kbase runtime.
# For this to work, both the actual script and the newly 
# created shell script have to be deployed. When a perl
# script is wrapped, it is first copied to TARGET/plbin.
# The shell script can now be created because the necessary
# environment variables are known and the location of the
# script is known. 

deploy-scripts:

# Deploying a service refers to to deploying the capability
# to run a service. Becuase service code is often deployed 
# as part of the libs, meaning service code gets deployed
# when deploy-libs is called, the deploy-service target is
# generally concerned with the service start and stop scripts.

deploy-service: deploy-service-libs deploy-service-scripts

deploy-service-libs:

deploy-service-scripts:	
	echo `pwd`
	$(INSTALLER) -p $(SERVICE_DIR) -v narrative

# Deploying docs here refers to the deployment of documentation
# of the API. We'll include a description of deploying documentation
# of command line interface scripts when we have a better understanding of
# how to standardize and automate CLI documentation.

deploy-docs: build-docs
	-mkdir -p $(TARGET)/services/$(SERVICE_NAME)/webroot/.
	cp docs/*.html $(TARGET)/services/$(SERVICE_NAME)/webroot/.

# The location of the Client.pm file depends on the --client param
# that is provided to the compile_typespec command. The
# compile_typespec command is called in the build-libs target.

build-docs:
	cd src && export PYTHONPATH=`pwd` && python2.7 setup.py doc
	-mkdir docs
	cp -R src/biokbase-doc/_build/html/* docs/

# Use the compile-docs target if you want to unlink the generation of
# the docs from the generation of the libs. Not recommended, but there
# could be a reason for it that I'm not seeing.
# The compile-docs target should depend on build-libs so that we are
# assured of having a set of documentation that is based on the latest
# type spec.

compile-docs: build-libs

# build-libs should be dependent on the type specification and the
# type compiler. Building the libs in this way means that you don't
# need to put automatically generated code in a source code version
# control repository (e.g., cvs, git). It also ensures that you always
# have the most up-to-date libs and documentation if your compile-docs
# target depends on the compiled libs.

build-libs:

clean:
	#nothing yet
