VERSION ?= $(shell git describe --always)
OS = $(shell uname -s)

ifeq ($(OS),Darwin)
SED := sed -i ""
else
SED := sed -i""
endif

.PHONY: release-commit
release-commit:
	./script/release-commit.sh

.PHONY: update-version
update-version:
	$(SED) "s/\"version\": \".*\",/\"version\": \"$(VERSION)\",/" ./package.json

