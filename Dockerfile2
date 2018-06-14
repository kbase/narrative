# Mini dockerfile to serve up narrative version until we can migrate this into
# the narrative method service

FROM nginx:stable-alpine

# These ARGs values are passed in via the docker build command
ARG BUILD_DATE
ARG VCS_REF
ARG BRANCH=develop
ARG NARRATIVE_VERSION

EXPOSE 80

COPY --from=kbase/narrative:tmp /kb/deployment/services/kbase-ui/ /usr/share/nginx/html

# Replace index file with redirect to www.kbase.us

RUN echo >/usr/share/nginx/html/index.html '<html>\
  <head><meta http-equiv="refresh" content="0; url=http://www.kbase.us/"> \
  <script type="text/javascript">window.location.href = "http://www.kbase.us"</script> \
  </head></body></html>'

LABEL org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.vcs-url="https://github.com/kbase/narrative.git" \
      org.label-schema.vcs-ref=$VCS_REF \
      org.label-schema.schema-version="1.0.0-rc1" \
      us.kbase.vcs-branch=$BRANCH \
      us.kbase.narrative-version=$NARRATIVE_VERSION \
      maintainer="William Riehl wjriehl@lbl.gov"

