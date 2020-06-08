include .makerc

.PHONY: check-env
check-env:
	if test "$(STAGE)" = "" ; then \
	  echo "STAGE not set"; \
          exit 1; \
        fi

.PHONY: clean
clean:
	yarn clean

.PHONY: install-deps
install-deps:
	NODE_ENV=dev yarn install --ignore-scripts --non-interactive --frozen-lockfile

.PHONY: build
build: clean install-deps
	yarn prod-build

.PHONY: sls-deploy
sls-deploy: check-env build
	yarn run sls deploy --stage $(STAGE)

.PHONY: migrate
migrate: check-env
	yarn run sls invoke --stage $(STAGE) -f api --path deploy/lambda-migrate-database.js

.PHONY: deploy
deploy: sls-deploy migrate
