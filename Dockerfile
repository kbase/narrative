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

FROM kbase/narrbase:5.0dockerize

# These ARGs values are passed in via the docker build command
ARG BUILD_DATE
ARG VCS_REF
ARG BRANCH=develop
ARG NARRATIVE_VERSION
ARG SKIP_MINIFY

EXPOSE 8888

# Remove Debian's older Tornado package - updated/removed in the narrbase package
#RUN DEBIAN_FRONTEND=noninteractive apt-get remove -y python-tornado

RUN echo Skip=$SKIP_MINIFY

# install pyopenssl cryptography idna and requests is the same as installing
# requests[security]
RUN conda install -c conda-forge  ndg-httpsclient pyasn1 pyopenssl cryptography idna requests \
          beautifulsoup4 html5lib
# TEMPORARY!
# Update bs4 and pandas to resolve inability to run them
#RUN DEBIAN_FRONTEND=noninteractive apt-get install -y python-dev libffi-dev libssl-dev \
#    && pip install pyopenssl ndg-httpsclient pyasn1 \
#    && pip install requests --upgrade \
#    && pip install 'requests[security]' --upgrade \
#    && pip install 'beautifulsoup4' --upgrade \
#    && pip install 'html5lib' --upgrade

# Copy in the narrative repo
ADD ./ /kb/dev_container/narrative
ADD ./kbase-logdb.conf /tmp/kbase-logdb.conf
ADD ./deployment/ /kb/deployment/
WORKDIR /kb/dev_container/narrative

# Generate a version file that we can scrape later
RUN mkdir -p /kb/deployment/ui-common/ && ./src/scripts/kb-update-config -f src/config.json.templ -o /kb/deployment/ui-common/narrative_version

# Install Javascript dependencies
RUN npm install && bower install --allow-root --config.interactive=false

# Compile Javascript down into an itty-bitty ball unless SKIP_MINIFY is non-empty
# (commented out for now)
# RUN cd kbase-extension/
# src/notebook/ipython_profiles/profile_narrative/kbase_templates && npm install && grunt build
RUN [ -n "$SKIP_MINIFY" ] || grunt minify

# Add Tini. Tini operates as a process subreaper for jupyter. This prevents
# kernel crashes. See Jupyter Notebook known issues here:˜
# http://jupyter-notebook.readthedocs.org/en/latest/public_server.html#known-issues
# ENV TINI_VERSION v0.8.4
# ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /usr/bin/tini
# RUN chmod +x /usr/bin/tini

RUN /bin/bash scripts/install_narrative_docker.sh

# RUN ./fixupURL.sh && chmod 666 /kb/dev_container/narrative/src/config.json
RUN pip install jupyter-console

WORKDIR /tmp
RUN chown -R nobody:www-data /kb/dev_container/narrative/src/notebook/ipython_profiles /tmp/narrative /kb/dev_container/narrative/kbase-extension; find / -xdev \( -perm -4000 \) -type f -print -exec rm {} \;

# Set a default value for the environment variable VERSION_CHECK that gets expanded in the config.json.templ
# into the location to check for a new narrative version. Normally we would put this in the template itself
# but since the raw template is consumed at build time as a JSON file, a template with a default string would
# cause JSON parsing to fail - GRRRRR!!!
ENV VERSION_CHECK /narrative_version

USER root

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
      "-euid", \
      "65534", \
      "-egid", \
      "65534", \
      "kbase-narrative"]
#ONBUILD USER root
#ONBUILD ADD url.cfg /kb/dev_container/narrative/url.cfg
#ONBUILD RUN cd /kb/dev_container/narrative && ./fixupURL.sh
#ONBUILD USER nobody
