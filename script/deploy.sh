#!/bin/bash -e
if [ -n "$TRAVIS_TAG" ]; then
  npm run deploy
fi

if [ "$TRAVIS_TAG" == "latest" ]; then
  generate-js-doc --pwd $PWD
  publish-doc --platform js --pwd $PWD  --doc-dir $PWD/esdoc --bucket 'docs.skygear.io' --prefix '/js/chat/reference' --version $TRAVIS_TAG --distribution-id E31J8XF8IPV2V
  npm run deploy-latest
fi

# Notify doc.esdoc.org to regenerate esdoc
if [ "$TRAVIS_BRANCH" == "master" ]; then
  curl 'https://doc.esdoc.org/api/create' \
    -XPOST \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    --data 'gitUrl=git%40github.com%3Askygeario%2Fchat-SDK-JS.git'
fi
