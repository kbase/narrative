SERVICE_NAME = narrative
REPO_NAME = narrative

# Installer script
INSTALLER = ./scripts/install_narrative.sh
BACKEND_TEST_SCRIPT = scripts/narrative_backend_tests.sh
FRONTEND_TEST_DIR = test

# Docker build script
DOCKER_INSTALLER = ./scripts/build_narrative_container.sh

default: build-narrative-container

build-narrative-container:
	sh $(DOCKER_INSTALLER)

docker_image: build-narrative-container

# Per PR #1328, adding an option to skip minification
dev-image:
	SKIP_MINIFY=1 DOCKER_TAG=dev sh $(DOCKER_INSTALLER)

run-dev-image:
	ENV=$(ENV) sh scripts/local-dev-run.sh

install:
	bash $(INSTALLER)

# runs the installer to locally build the Narrative in a
# local venv.
build-travis-narrative:
	bash $(INSTALLER) && \
	npm run minify && \
	sed <src/config.json.templ >src/config.json "s/{{ .Env.CONFIG_ENV }}/dev/" && \
	sed -i 's/{{ if ne .Env.CONFIG_ENV "prod" }} true {{- else }} false {{- end }}/true/' src/config.json && \
	jupyter notebook --version

test: test-backend test-frontend
	@echo "done running backend and frontend test scripts"

# test-backend uses pytest to test our
# Python extensions to the IPython notebook.
#
# Testing the IPython notebook itself is out of the scope
# of our testing here, we just want to test our interface
# with it.
test-backend:
	@echo "running backend tests"
	sh $(BACKEND_TEST_SCRIPT)
	@echo "done"

test-frontend:
	python test/unit/run_tests.py -u -i

# test-frontend-unit should use karma and jasmine to test
# each of the Javascript components of the Narrative.
# This is achieved through python test invocation
test-frontend-unit:
	@echo "running frontend unit tests"
	python test/unit/run_tests.py -u
	@echo "done"

test-integration:
	@echo "running integration tests"
	python test/unit/run_tests.py -i
	@echo "done"

build-docs:
	cd src && export PYTHONPATH=`pwd` && python2.7 setup.py doc
	-mkdir docs
	cp -R src/biokbase-doc/_build/html/* docs/

docker-base:
	docker build -t kbase/narrbase:3.0 base/

docker-narrative:
	docker build -t kbase/narrative:1.0.3 .

clean:
	git clean -f
