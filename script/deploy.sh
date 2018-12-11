#!/bin/bash -e
if [ -n "$TRAVIS_TAG" ]; then
  npm run deploy
fi

# generate doc for all tags and branches
generate-js-doc --pwd $PWD

# only deploy on latest tag
if [ "$TRAVIS_TAG" == "latest" ]; then
  publish-doc --platform js --pwd $PWD  --doc-dir $PWD/esdoc --bucket 'docs.skygear.io' --prefix '/js/chat/reference' --version $TRAVIS_TAG --distribution-id E31J8XF8IPV2V
  npm run deploy-latest
fi
