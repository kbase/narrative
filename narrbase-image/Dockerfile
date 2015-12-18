FROM kbase/narrprereq:1.0
MAINTAINER William Riehl wjriehl@lbl.gov

ENV JUPYTER_VERSION 4.0.6
ENV IPYWIDGETS_VERSION 4.1.1

RUN mkdir -p /kb/installers

ADD https://github.com/jupyter/notebook/archive/${JUPYTER_VERSION}.tar.gz /kb/installers/jupyter_notebook/jupyter.tar.gz
ADD https://github.com/ipython/ipywidgets/archive/${IPYWIDGETS_VERSION}.tar.gz /kb/installers/ipywidgets/ipywidgets.tar.gz

