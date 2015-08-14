# Dockerfile that builds a minimal container for IPython + narrative
#
# Requires a narrative base images that contains runtime dependencies.
#
# Steve Chan sychan@lbl.gov
#
# Copyright 2013 The Regents of the University of California,
#                Lawrence Berkeley National Laboratory
#                United States Department of Energy
#          	 The DOE Systems Biology Knowledgebase (KBase)
# Made available under the KBase Open Source License
#

FROM kbase/narrbase:3.0
MAINTAINER Bill Riehl wjriehl@lbl.gov

EXPOSE 8888

# Copy in the narrative repo
ADD ./ /kb/dev_container/narrative
ADD ./kbase-logdb.conf /tmp/kbase-logdb.conf
WORKDIR /kb/dev_container/narrative

# Generate a version file that we can scrape later
RUN mkdir -p /kb/deployment/ui-common/ && ./src/scripts/kb-git-version -f src/config.json -o /kb/deployment/ui-common/narrative_version

RUN git submodule update --init --recursive && rm -rf .git/modules/modules

# Compile Javascript down into an itty-bitty ball.
RUN cd src/notebook/ipython_profiles/profile_narrative/kbase_templates && npm install && grunt build

RUN /bin/bash old-install.sh -p /kb/deployment/services narrative

RUN ./fixupURL.sh

WORKDIR /tmp
RUN chown -R nobody:www-data /kb/dev_container/narrative/src/notebook/ipython_profiles /tmp/narrative; find / -xdev \( -perm -4000 \) -type f -print -exec rm {} \;

# Setup the container to automatically run a script that uses the narrative_mongo profile
# and configures the notebook server to use /narrative/{CMD} as the prefix for a reverse
# proxy environment
USER nobody
CMD ["kbasetest"]
ENTRYPOINT ["/bin/bash", "/kb/deployment/services/narrative-venv/bin/run_magellan_narrative.sh"]

ONBUILD USER root
ONBUILD ADD url.cfg /kb/dev_container/narrative/url.cfg
ONBUILD RUN cd /kb/dev_container/narrative && ./fixupURL.sh
ONBUILD USER nobody
