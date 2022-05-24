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

# install NodeJS 16.x (latest LTS until ~October 2022, https://nodejs.org/en/about/releases/)
# N.b. this version of node is not available in the conda `base` environment as kbase/narrbase:6.2
# installs ancient versions of node (6.x) and npm (3.x).
RUN \
    curl -fsSL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get install -y nodejs && \
    source activate base && \
    conda update -n base -c defaults conda && \
    python -m pip install --upgrade pip setuptools wheel

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
    npm install && npm run install-npm && \
    # Compile Javascript down into an itty-bitty ball unless SKIP_MINIFY is non-empty
    echo Skip=$SKIP_MINIFY && \
    [ -n "$SKIP_MINIFY" ] || npm run minify && \
    # install the narrative and jupyter console
    /bin/bash scripts/install_narrative_docker.sh && \
    cd /tmp && \
    mkdir /tmp/narrative && \
    chown -R nobody:www-data /tmp/narrative /kb/dev_container/narrative ; find / -xdev \( -perm -4000 \) -type f -print -exec rm {} \;

# Set a default value for the environment variable VERSION_CHECK that gets expanded in the config.json.templ
# into the location to check for a new narrative version. Normally we would put this in the template itself
# but since the raw template is consumed at build time as a JSON file, a template with a default string would
# cause JSON parsing to fail - GRRRRR!!!
ENV VERSION_CHECK /narrative_version

# Set the default environment to be CI, can be overridden by passing new CONFIG_ENV setting at container start
ENV CONFIG_ENV ci
ENV DOCKER_CONTAINER true

USER nobody

LABEL org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.vcs-url="https://github.com/kbase/narrative.git" \
      org.label-schema.vcs-ref=$VCS_REF \
      org.label-schema.schema-version="1.0.0-rc1" \
      us.kbase.vcs-branch=$BRANCH \
      us.kbase.narrative-version=$NARRATIVE_VERSION \
      maintainer="William Riehl wjriehl@lbl.gov"

# populate the config files on start up
ENTRYPOINT ["/kb/deployment/bin/dockerize"]
CMD [ "--template", \
      "/kb/dev_container/narrative/src/config.json.templ:/kb/dev_container/narrative/src/config.json", \
      "--template", \
      "/kb/dev_container/narrative/src/config.json.templ:/kb/dev_container/narrative/kbase-extension/static/kbase/config/config.json", \
      "kbase-narrative"]
