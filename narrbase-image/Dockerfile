FROM kbase/kb_python:python3

ENV NOTEBOOK_VERSION 6.0.2
ENV IPYTHON_VERSION 7.9.0
ENV IPYWIDGETS_VERSION 7.5.0
ENV NODEJS_VERSION 14
ENV TAR /bin/tar

# Install Base libraries, Node, R and Jupyter Notebook and ipywidgets from distinct channels
ADD ./conda-requirements /root/conda

RUN mkdir -p /kb/installers && \
    # run conda installs
    conda update -n base -c defaults conda && \
    conda install conda && \
    conda install -c conda-forge --file /root/conda/base && \
    conda install -c etetoolkit ete3 && \
    conda install -c anaconda-platform --file /root/conda/base.anaconda-platform && \
    conda install -c javascript --file /root/conda/base.javascript && \
    conda install --file /root/conda/biokbase-requirements.txt && \
    conda install -c r r-base && \
    conda install -c conda-forge --file /root/conda/r.conda-forge && \
    conda install -c r --file /root/conda/r.r && \
    # Install apt-get prereqs for node and R
    apt-get update && \
    apt-get install -y gfortran gnupg && \
    # Install nodejs at a useful version
    curl -sL https://deb.nodesource.com/setup_${NODEJS_VERSION}.x | bash - && \
    apt-get install -y nodejs

# Install misc R packages not available on Conda
ADD ./r-packages-postconda.R /root/r-packages.R
RUN R --vanilla < /root/r-packages.R && \
    # Install IPython, Jupyter Notebook, and ipywidgets at controlled versions
    conda install -c conda-forge ipython=${IPYTHON_VERSION} notebook=${NOTEBOOK_VERSION} ipywidgets==${IPYWIDGETS_VERSION} && \
    conda update six && \
    jupyter nbextension enable --py widgetsnbextension

# The BUILD_DATE value seem to bust the docker cache when the timestamp changes, move to
# the end
LABEL org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.vcs-url="https://github.com/kbase/narrative.git" \
      org.label-schema.vcs-ref=$VCS_REF \
      org.label-schema.schema-version="1.0.0-rc1" \
      us.kbase.vcs-branch=$BRANCH \
      maintainer="William Riehl wjriehl@lbl.gov"
