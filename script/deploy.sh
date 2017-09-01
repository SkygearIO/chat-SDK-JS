#!/bin/bash -e
if [ -n "$TRAVIS_TAG" ]; then
  npm run deploy
fi

if [ "$TRAVIS_BRANCH" == "latest" ]; then
  npm run deploy-latest
fi

# Notify doc.esdoc.org to regenerate esdoc
if [ "$TRAVIS_BRANCH" == "master" ]; then
  curl 'https://doc.esdoc.org/api/create' \
    -XPOST \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    --data 'gitUrl=git%40github.com%3Askygeario%2Fchat-SDK-JS.git'
fi

if [ "$TRAVIS_BRANCH" == "update-doc" ]; then
  echo "update-doc"
  /tmp/publish-doc.sh . 'docs.skygear.io'  '/chat-js/reference' E31J8XF8IPV2V
fi


