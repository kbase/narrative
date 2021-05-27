export BRANCH=$(git branch --show-current)
eslint $(git diff --stat --name-only  origin/$BRANCH HEAD | egrep "\\.js$")