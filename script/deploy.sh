#!/bin/bash -e
if [ -n "$TRAVIS_TAG" ]; then
  npm run deploy
fi

if [ "$TRAVIS_TAG" == "latest" ]; then
  generate-js-doc --pwd $PWD
  publish-doc --platform js --pwd $PWD  --doc-dir $PWD/esdoc --bucket 'docs.skygear.io' --prefix '/js/chat/reference' --version $TRAVIS_TAG --distribution-id E31J8XF8IPV2V
  npm run deploy-latest
fi
