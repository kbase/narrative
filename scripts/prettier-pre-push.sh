#!/bin/bash

export BRANCH=$(git branch --show-current)
prettier --check $(git diff --stat --name-only  "origin/$BRANCH" HEAD | egrep "\\.js$")