FROM kbase/narrprereq:1.3
MAINTAINER William Riehl wjriehl@lbl.gov

ENV JUPYTER_VERSION 5.4.1
ENV IPYWIDGETS_VERSION 7.1.2

RUN mkdir -p /kb/installers

# Download Jupyter Notebook
ADD https://github.com/jupyter/notebook/archive/${JUPYTER_VERSION}.tar.gz /kb/installers/jupyter_notebook/notebook-${JUPYTER_VERSION}.tar.gz

RUN \
    curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash - && \
    apt-get install -y nodejs && \
    pip install --upgrade pip && \
    pip install setuptools==33.1.1  # https://github.com/pypa/setuptools/issues/942

# Install Jupyter Notebook
RUN cd /kb/installers/jupyter_notebook && tar -xvf notebook-${JUPYTER_VERSION}.tar.gz && cd notebook-${JUPYTER_VERSION} && pip install --pre -e .

# Install IPywidgets
RUN pip install --upgrade six
RUN pip install ipywidgets==${IPYWIDGETS_VERSION}
RUN jupyter nbextension enable --py widgetsnbextension
