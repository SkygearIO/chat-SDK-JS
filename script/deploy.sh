#!/bin/bash -e
curl 'https://doc.esdoc.org/api/create' \
  -XPOST \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data 'gitUrl=git%40github.com%3Askygeario%2Fchat-SDK-JS.git'
