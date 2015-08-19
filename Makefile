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
INSTALLER = ./old-install.sh
TEST_INSTALL_LOC = .
TEST_VENV = narrative-venv
BACKEND_TEST_SCRIPT = narrative_backend_tests.sh
FRONTEND_TEST_DIR = src/notebook/ipython_profiles/profile_narrative/kbase_templates

default: build-narrative

# runs the installer to locally build the Narrative in a
# local venv.
build-narrative:
	$(INSTALLER) -p . -v $(TEST_VENV)


test: test-backend test-frontend-unit test-frontend-e2e
	@echo "running backend and frontend test scripts"

# test-backend should use nose, or the like, to test our
# Python extensions to the IPython notebook.
#
# Testing the IPython notebook itself is out of the scope
# of our testing here, we just want to test our interface
# with it.
test-backend:
	@echo "running backend tests"
	sh $(BACKEND_TEST_SCRIPT)
	@echo "done"

# test-frontend-unit should use karma and jasmine to test
# each of the Javascript components of the Narrative.
# This is achieved through the grunt test invocation
test-frontend-unit:
	@echo "running frontend unit tests"
	cd $(FRONTEND_TEST_DIR) && \
	npm install && \
	grunt test
	@echo "done"

# test-frontend-e2e should use Selenium to perform an end-
# to-end test of the front end components, with a running
# Narrative system.
test-frontend-e2e:
	@echo "running frontend end-to-end tests"
	cd $(FRONTEND_TEST_DIR)
	@echo "done"

# # test-all is deprecated. 
# # test-all: test-client test-scripts test-service
# #
# # test-client: This is a test of a client library. If it is a
# # client-server module, then it should be run against a running
# # server. You can say that this also tests the server, and I
# # agree. You can add a test-service dependancy to the test-client
# # target if it makes sense to you. This test example assumes there is
# # already a tested running server.
# test-client:
# 	# run each test
# 	for t in $(CLIENT_TESTS) ; do \
# 		if [ -f $$t ] ; then \
# 			/usr/bin/env python $$t ; \
# 			if [ $$? -ne 0 ] ; then \
# 				exit 1 ; \
# 			fi \
# 		fi \
# 	done

# # test-scripts: A script test should test the command line scripts. If
# # the script is a client in a client-server architecture, then there
# # should be tests against a running server. You can add a test-service
# # dependency to the test-client target. You could also add a
# # deploy-service and start-server dependancy to the test-scripts
# # target if it makes sense to you. Future versions of the makefiles
# # for services will move in this direction.
# test-scripts:
# 	# run each test
# 	for t in $(SCRIPT_TESTS) ; do \
# 		if [ -f $$t ] ; then \
# 			/usr/bin/env python $$t ; \
# 			if [ $$? -ne 0 ] ; then \
# 				exit 1 ; \
# 			fi \
# 		fi \
# 	done

# # test-service: A server test should not rely on the client libraries
# # or scripts--you should not have a test-service target that depends
# # on the test-client or test-scripts targets. Otherwise, a circular
# # dependency graph could result.
# test-service:
# 	# run each test
# 	for t in $(SERVER_TESTS) ; do \
# 		if [ -f $$t ] ; then \
# 			/usr/bin/env python $$t ; \
# 			if [ $$? -ne 0 ] ; then \
# 				exit 1 ; \
# 			fi \
# 		fi \
# 	done

# builds the Docker container for deployment.
# assumes the presence of a running docker service and an Ubuntu 14.04
# base container to build on
deploy:


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
	git clean -f