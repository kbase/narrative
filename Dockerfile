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

FROM kbase/narrbase:4.6
MAINTAINER Bill Riehl wjriehl@lbl.gov

EXPOSE 8888

# Remove Debian's older Tornado package
RUN DEBIAN_FRONTEND=noninteractive apt-get remove -y python-tornado

# TEMPORARY!
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y python-dev libffi-dev libssl-dev \
    && pip install pyopenssl ndg-httpsclient pyasn1 \
    && pip install requests --upgrade \
    && pip install 'requests[security]' --upgrade

# Copy in the narrative repo
ADD ./ /kb/dev_container/narrative
ADD ./kbase-logdb.conf /tmp/kbase-logdb.conf
WORKDIR /kb/dev_container/narrative

# Generate a version file that we can scrape later
RUN mkdir -p /kb/deployment/ui-common/ && ./src/scripts/kb-update-config -f src/config.json -o /kb/deployment/ui-common/narrative_version

# Install Javascript dependencies
RUN npm install && bower install --allow-root --config.interactive=false

# Compile Javascript down into an itty-bitty ball.
# (commented out for now)
# RUN cd kbase-extension/
# src/notebook/ipython_profiles/profile_narrative/kbase_templates && npm install && grunt build
RUN grunt minify


# Add Tini. Tini operates as a process subreaper for jupyter. This prevents
# kernel crashes. See Jupyter Notebook known issues here:
# http://jupyter-notebook.readthedocs.org/en/latest/public_server.html#known-issues
# ENV TINI_VERSION v0.8.4
# ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /usr/bin/tini
# RUN chmod +x /usr/bin/tini

RUN /bin/bash scripts/install_narrative_docker.sh

RUN ./fixupURL.sh && chmod 666 /kb/dev_container/narrative/src/config.json
RUN pip install jupyter-console

WORKDIR /tmp
RUN chown -R nobody:www-data /kb/dev_container/narrative/src/notebook/ipython_profiles /tmp/narrative /kb/dev_container/narrative/kbase-extension; find / -xdev \( -perm -4000 \) -type f -print -exec rm {} \;

# Setup the container to automatically run a script that uses the narrative_mongo profile
# and configures the notebook server to use /narrative/{CMD} as the prefix for a reverse
# proxy environment
USER nobody

# ENTRYPOINT ["/usr/bin/tini", "--"]
# The entrypoint can be set to "headless-narrative" to run headlessly
ENTRYPOINT ["kbase-narrative"]

ONBUILD USER root
ONBUILD ADD url.cfg /kb/dev_container/narrative/url.cfg
ONBUILD RUN cd /kb/dev_container/narrative && ./fixupURL.sh
ONBUILD USER nobody
