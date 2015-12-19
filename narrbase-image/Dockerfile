FROM kbase/narrprereq:1.0
MAINTAINER William Riehl wjriehl@lbl.gov

ENV JUPYTER_VERSION 4.0.6
ENV IPYWIDGETS_VERSION 4.1.1

RUN mkdir -p /kb/installers

# Download Jupyter Notebook
ADD https://github.com/jupyter/notebook/archive/${JUPYTER_VERSION}.tar.gz /kb/installers/jupyter_notebook/notebook-${JUPYTER_VERSION}.tar.gz

# Install Jupyter Notebook
RUN cd /kb/installers/jupyter_notebook && tar -xvf notebook-${JUPYTER_VERSION}.tar.gz && cd notebook-${JUPYTER_VERSION} && pip install --pre -e .

# Install IPywidgets
RUN pip install ipywidgets==${IPYWIDGETS_VERSION}