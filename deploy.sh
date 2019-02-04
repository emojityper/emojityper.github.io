#!/bin/bash

set -eu

# check that branch switch is safe
git checkout gh-pages
git checkout master

# build and copy
yarn dist
git checkout gh-pages
git pull
rm *.js*
cp -R dist/* .

# try to checkin code, only commit if change
git add .
if git diff-index --quiet HEAD --; then
  git status
else
  git commit -m "release $(date)"
  git push
fi

# back to master
git checkout master
