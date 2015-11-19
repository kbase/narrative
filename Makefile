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
INSTALLER = ./scripts/install-kbjupyter.sh
INSTALL_VENV = narrative-venv
INSTALL_DIR = ./${INSTALL_VENV}
TEST_INSTALL_LOC = .
BACKEND_TEST_SCRIPT = scripts/narrative_backend_tests.sh
FRONTEND_TEST_DIR = test

default: build-narrative

# runs the installer to locally build the Narrative in a
# local venv.
build-narrative:
	bower install && \
	npm install && \
	$(INSTALLER) -v $(INSTALL_VENV)

test: test-backend test-frontend-unit test-frontend-e2e
	@echo "done running backend and frontend test scripts"

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
	grunt test
	@echo "done"

# test-frontend-e2e should use Selenium to perform an end-
# to-end test of the front end components, with a running
# Narrative system.
test-frontend-e2e:
	@echo "running frontend end-to-end tests"
	cd $(FRONTEND_TEST_DIR)
	@echo "done"

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

docker-base:
	docker build -t kbase/narrbase:3.0 base/

docker-narrative:
	docker build -t kbase/narrative:1.0.3 .

clean:
	git clean -f
