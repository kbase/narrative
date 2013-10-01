PACKAGE  = ui-common
TOPDIR   = $(PWD)
MOCHA    = $(TOPDIR)/node_modules/.bin/mocha

UGLIFY   = $(TOPDIR)/node_modules/.bin/uglifyjs
JSDUCK   := $(shell which jsduck)
GRUNT    := $(TOPDIR)/node_modules/.bin/grunt

DISTDIR      ?= ./dist
DISTLIB      ?= $(DISTDIR)/kbase.js
DOCSDIR      ?= $(DISTDIR)/docs
MINDISTLIB   ?= $(DISTDIR)/kbase.min.js

FILEORDER     = ./src/file-order.txt
SOURCES       = $(shell find ./src -name "*.js")

all: test dist docs

init:
	@ npm install
	@ git submodule update --init
	@ mkdir -p $(DISTDIR)

build-angular: init
	@ cd ./ext/angularjs && $(GRUNT) package

ext/kbase-datavis/dist/datavis.js:
	@ cd ./ext/kbase-datavis && make build

$(DOCSDIR)/index.html: $(SOURCES)
ifndef JSDUCK
	$(error JSDuck not found (install with `gem install jsduck`).)
endif
	@ $(JSDUCK) --builtin-classes --output $(DOCSDIR) -- ./src

docs: init $(DOCSDIR)/index.html

$(DISTLIB): ext/kbase-datavis/dist/datavis.js
	@ $(UGLIFY) `cat $(FILEORDER) | sed -e "s/\#.*//g" -e "s|^\.|./src|g"` \
		--beautify --output $(DISTLIB)

$(MINDISTLIB): $(DISTLIB)
	@ $(UGLIFY) $(DISTLIB) --comments --compress --mangle --output $(MINDISTLIB)

dist: $(DISTLIB) $(MINDISTLIB)

test: init
	@ $(MOCHA)

clean:
	@ rm -rf $(DISTLIB) $(MINDISTLIB)

dist-clean: clean
	@ rm -rf node_modules/
	@ rm -rf $(DOCSDIR)

.PHONY: all