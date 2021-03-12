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

FROM kbase/narrbase:6.2

# These ARGs values are passed in via the docker build command
ARG BUILD_DATE
ARG VCS_REF
ARG BRANCH=develop
ARG NARRATIVE_VERSION
ARG SKIP_MINIFY

EXPOSE 8888

# install pyopenssl cryptography idna and requests is the same as installing
# requests[security]
RUN source activate base && \
    conda install -c conda-forge ndg-httpsclient==0.5.1 pyasn1==0.4.5 pyopenssl==19.0.0 cryptography==2.7 idna==2.8 requests==2.21.0 \
          beautifulsoup4==4.8.1 html5lib==1.0.1

# Copy in the narrative repo
ADD ./ /kb/dev_container/narrative
ADD ./kbase-logdb.conf /tmp/kbase-logdb.conf
ADD ./deployment/ /kb/deployment/
WORKDIR /kb/dev_container/narrative

RUN \
    # Generate a version file that we can scrape later
    mkdir -p /kb/deployment/ui-common/ && \
    ./src/scripts/kb-update-config -f src/config.json.templ -o /kb/deployment/ui-common/narrative_version && \
    # install JS deps
    npm install -g grunt-cli && \
    npm install && \
    ./node_modules/.bin/bower install --allow-root --config.interactive=false && \
    # Compile Javascript down into an itty-bitty ball unless SKIP_MINIFY is non-empty
    echo Skip=$SKIP_MINIFY && \
    [ -n "$SKIP_MINIFY" ] || npm run minify && \
    # install the narrative and jupyter console
    /bin/bash scripts/install_narrative_docker.sh && \
    pip install jupyter-console==6.0.0 && \
    cd /tmp && \
    mkdir /tmp/narrative && \
    chown -R nobody:www-data /tmp/narrative /kb/dev_container/narrative ; find / -xdev \( -perm -4000 \) -type f -print -exec rm {} \;

# Set a default value for the environment variable VERSION_CHECK that gets expanded in the config.json.templ
# into the location to check for a new narrative version. Normally we would put this in the template itself
# but since the raw template is consumed at build time as a JSON file, a template with a default string would
# cause JSON parsing to fail - GRRRRR!!!
ENV VERSION_CHECK /narrative_version

# Set the default environment to be CI, can be overriden by passing new CONFIG_ENV setting at container start
ENV CONFIG_ENV ci

USER nobody

LABEL org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.vcs-url="https://github.com/kbase/narrative.git" \
      org.label-schema.vcs-ref=$VCS_REF \
      org.label-schema.schema-version="1.0.0-rc1" \
      us.kbase.vcs-branch=$BRANCH \
      us.kbase.narrative-version=$NARRATIVE_VERSION \
      maintainer="William Riehl wjriehl@lbl.gov"

# ENTRYPOINT ["/usr/bin/tini", "--"]
# The entrypoint can be set to "headless-narrative" to run headlessly
ENTRYPOINT ["/kb/deployment/bin/dockerize"]
CMD [ "--template", \
      "/kb/dev_container/narrative/src/config.json.templ:/kb/dev_container/narrative/src/config.json", \
      "--template", \
      "/kb/dev_container/narrative/src/config.json.templ:/kb/dev_container/narrative/kbase-extension/static/kbase/config/config.json", \
      "kbase-narrative"]
#ONBUILD USER root
#ONBUILD ADD url.cfg /kb/dev_container/narrative/url.cfg
#ONBUILD RUN cd /kb/dev_container/narrative && ./fixupURL.sh
#ONBUILD USER nobody
