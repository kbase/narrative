FROM kbase/kb_python:latest 

ENV JUPYTER_VERSION 5.4.1
ENV IPYWIDGETS_VERSION 7.1.2

RUN mkdir -p /kb/installers

RUN \
    curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash - && \
    apt-get install -y nodejs && \
    pip install --upgrade pip && \
    pip install setuptools==33.1.1  # https://github.com/pypa/setuptools/issues/942

# Install Node, R and Jupyter Notebook and ipywidgets
RUN conda update -n base conda && \
    conda install -c javascript bower && \
    conda install -c wakari grunt-cli

# Note that some R packages are available on multiple channels, and changing the channel
# may cause incompatibility with R version
ADD ./r-packages-postconda.R /root/r-packages.R
RUN conda install -c r r-base && \
    conda install -c conda-forge r-wordcloud r-timeseries  r-amap r-pheatmap r-googlevis r-tiff && \
    conda install -c r r-pkgconfig r-knitr r-plyr r-stringr r-rgl r-data.table r-ggplot2 r-lme4 r-reshape \
                   r-rcolorbrewer r-gplots r-png r-lattice r-tm r-igraph r-rjsonio r-curl \
                   r-tseries r-zoo r-xts r-lubridate r-codetools r-devtools && \
    R --vanilla < /root/r-packages.R

RUN conda install tornado=4.5.3 && \
    conda install -c anaconda notebook=${JUPYTER_VERSION} && \
    conda update six && \
    conda install ipywidgets==${IPYWIDGETS_VERSION} && \
    jupyter nbextension enable --py widgetsnbextension 

# The BUILD_DATE value seem to bust the docker cache when the timestamp changes, move to
# the end
LABEL org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.vcs-url="https://github.com/kbase/narrative.git" \
      org.label-schema.vcs-ref=$VCS_REF \
      org.label-schema.schema-version="1.0.0-rc1" \
      us.kbase.vcs-branch=$BRANCH \
      maintainer="William Riehl wjriehl@lbl.gov"
