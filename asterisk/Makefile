IMAGE_NAME := asterisk-iot
DOCKER_REPO_NAME := $(IMAGE_NAME)

GIT_BRANCH_NAME := $(shell git rev-parse --abbrev-ref HEAD | sed "sX/X-Xg")
GIT_TAG_NAME := $(shell git describe --always HEAD)

TAGS := $(GIT_BRANCH_NAME) $(GIT_TAG_NAME)

ifeq ($(GIT_BRANCH_NAME),master)
  TAGS += latest
endif

#
# default build target
#
all: build
.PHONY: all

#
# docker pull latest dependencies.
#
pull:
	docker pull $(shell sed -n 's/^FROM // p' Dockerfile)
.PHONY: pull

#
# docker build the image
#
build:
	docker build -t $(DOCKER_REPO_NAME) .
.PHONY: build

#
# docker tag the build
#
tag: build
	echo $(TAGS) | xargs -n 1 docker tag $(DOCKER_REPO_NAME)
.PHONY: tag

#
# docker push the tags to the respoke registry
#
push: tag
	echo $(TAGS) | xargs -n 1 docker push
.PHONY: push

#
# quick cleanup; leaves things that are expensive to remove or rebuild
#
clean:
	rm -rf build/
	rm -f version.txt
.PHONY: clean

#
# remove any images generated by this build
#
clean-images:
	docker images -f 'label=cirrus.name=$(IMAGE_NAME)' \
				  --format="{{.Repository}} {{.Tag}} {{.ID}}" | \
		awk '{ \
			if ($$2=="<none>") { \
				print $$3 \
			} else { \
				print $$1 ":" $$2 \
			} \
		}' | \
		xargs docker rmi
.PHONY: clean-images

#
# clean up even the stuff that's expensive to build
#
really-clean: clean clean-images
.PHONY: really-clean

#
# bamboo build process
#
bamboo: pull build tag push
	echo $(GIT_TAG_NAME) > version.txt
.PHONY: bamboo