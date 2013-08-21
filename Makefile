PACKAGE  = ui-common
MOCHA    = ./node_modules/.bin/mocha

UGLIFY   = ./node_modules/.bin/uglifyjs
GENDOC   = ./external/jsduck/bin/jsduck

DISTLIB      ?= ./dist/kbase.js
DISTSRCFILES  = ./src/*.js ./src/widgets/*.js
MINDISTLIB   ?= ./dist/kbase.min.js

all: test

init:
	@ npm install
	@ git submodule update --init

dist: init
	@ $(UGLIFY) $(DISTSRCFILES) --beautify --output $(DISTLIB)
	@ $(UGLIFY) $(DISTLIB) --comments --compress --mangle --output $(MINDISTLIB)

test: init
	@ $(MOCHA)

clean:
	rm -rf $(DISTLIB) $(BUILDDIR)

dist-clean: clean
	rm -rf node_modules/ $(DISTLIB)

.PHONY: test all dist