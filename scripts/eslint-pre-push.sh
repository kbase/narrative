#!/bin/bash

export BRANCH=$(git branch --show-current)
eslint --max-warnings=0 $(git diff --stat --name-only  "origin/$BRANCH" HEAD | egrep "\\.js$")