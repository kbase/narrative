PACKAGE  = ui-common
MOCHA    = ./node_modules/.bin/mocha

UGLIFY   = ./node_modules/.bin/uglifyjs
JSDUCK   := $(shell which jsduck)

DISTDIR      ?= ./dist
DISTLIB      ?= $(DISTDIR)/kbase.js
DOCSDIR      ?= $(DISTDIR)/docs
DISTSRCFILES  = ./src/*.js ./src/widgets/*.js
MINDISTLIB   ?= $(DISTDIR)/kbase.min.js

all: test

init:
	@ npm install
	@ git submodule update --init

docs: init
ifndef JSDUCK
	$(error JSDuck not found (install with `gem install jsduck`).)
endif
	@ $(JSDUCK) --builtin-classes --output $(DOCSDIR) -- ./src

dist: init docs
	@ $(UGLIFY) $(DISTSRCFILES) --beautify --output $(DISTLIB)
	@ $(UGLIFY) $(DISTLIB) --comments --compress --mangle --output $(MINDISTLIB)

test: init
	@ $(MOCHA)

clean:
	rm -rf $(DISTLIB) $(BUILDDIR)

dist-clean: clean
	rm -rf node_modules/ $(DISTLIB)

.PHONY: test all dist