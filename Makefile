PACKAGE  = ui-common
MOCHA    = ./node_modules/.bin/mocha

UGLIFY   = ./node_modules/.bin/uglifyjs
JSDUCK   := $(shell which jsduck)

DISTDIR      ?= ./dist
DISTLIB      ?= $(DISTDIR)/kbase.js
DOCSDIR      ?= $(DISTDIR)/docs
MINDISTLIB   ?= $(DISTDIR)/kbase.min.js

FILEORDER     = ./src/file-order.txt

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
	@ $(UGLIFY) `cat $(FILEORDER) | sed -e "s/\#.*//g" -e "s|^\.|./src|g"` \
		--beautify --output $(DISTLIB)
	@ $(UGLIFY) $(DISTLIB) --comments --compress --mangle --output $(MINDISTLIB)

test: init
	@ $(MOCHA)

clean:
	rm -rf $(DISTLIB) $(BUILDDIR)

dist-clean: clean
	rm -rf node_modules/ $(DISTLIB)

.PHONY: test all dist