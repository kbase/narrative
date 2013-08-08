PACKAGE  = ui-common
MOCHA    = ./node_modules/.bin/mocha
NPM      = npm
GIT      = git

UGLIFY   = ./node_modules/.bin/uglifyjs

DISTLIB      ?= ./dist/kbase.js
DISTSRCFILES  = ./src/*.js ./src/widgets/*.js
MINDISTLIB   ?= ./dist/kbase.min.js

all: test

init:
	@ $(NPM) install
	@ $(GIT) submodule update --init

dist: init
	@ $(UGLIFY) $(DISTSRCFILES) --beautify --output $(DISTLIB)
	@ $(UGLIFY) $(DISTLIB) --comments --compress --mangle --output $(MINDISTLIB)

build: init
	@ $(RJS) -o $(BUILD) \
		appDir=./public dir=$(BUILDDIR) baseUrl=js namespace=

test: init
	@ $(MOCHA)

clean:
	rm -rf $(DISTLIB) $(BUILDDIR)

dist-clean: clean
	rm -rf node_modules/ $(DISTLIB)

.PHONY: test all dist