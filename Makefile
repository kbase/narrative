TOP_DIR = ../..
include $(TOP_DIR)/tools/Makefile.common

JARFILE = $(PWD)/lib/kbapi_common.jar

JAVA_SRC = $(shell find lib -name \*java)
JAVA_CLASS = $(patsubst %.java,%.class,$(JAVA_SRC))

all: jar

what:
	echo $(JAVA_SRC)
	echo $(JAVA_CLASS)
	echo $(JAVA_CLASS_ALL)

bin: 

deploy: deploy-client
deploy-service: deploy-client
deploy-client: deploy-libs  deploy-java

deploy-java: $(JARFILE)
	cp $(JARFILE) $(TARGET)/lib

jar: $(JAR)

$(JAR): $(JAVA_CLASS)
	(cd lib; find . -name \*class) > tmp.class_files
	cd lib; jar cf $(JARFILE) @../tmp.class_files

clean:
	rm -f $(JAR)
	rm -f tmp.class_files
	find lib -name \*class -print | xargs rm

include $(TOP_DIR)/tools/Makefile.common.rules
