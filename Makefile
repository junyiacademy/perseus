.PHONY: help build server all subperseus put put-js put-css install clean lint test jest
PORT=9000
WEBAPP=../webapp

NPM_BIN=$(shell npm bin)
API_VERSION_MAJOR:=$(shell node node/echo-major-api-version.js)
PERSEUS_BUILD_JS=build/perseus-$(API_VERSION_MAJOR).js
PERSEUS_BUILD_CSS=build/perseus-$(API_VERSION_MAJOR).css

help:
	@echo "make dev               # (development) compiles into $(PERSEUS_BUILD_JS) and $(PERSEUS_BUILD_CSS)"
	@echo "make build             # (production) compiles into $(PERSEUS_BUILD_JS) and $(PERSEUS_BUILD_CSS)"
	@echo "make watch             # use watchify to auto compile perseus"
	@echo "make server PORT=9000  # runs the perseus server"
	@echo "make ke                # build symlink to khan-exercises"
	@echo "make all               # build perseus into webapp"

dev:        prebuild buildcss devjs
build:      prebuild buildcss buildjs
watch:      prebuild buildcss watchjs

devjs:
	@echo "Building js (development) ..."
	@npm run dev -s > $(PERSEUS_BUILD_JS)

buildjs:
	@echo "Building js (production) ..."
	@npm run build -s > $(PERSEUS_BUILD_JS)

watchjs:
	@echo "Watching js ..."
	@npm run watch -- -o $(PERSEUS_BUILD_JS)

buildcss:
	@echo "Building css ..."
	@$(NPM_BIN)/lessc stylesheets/exercise-content-package/perseus.less $(PERSEUS_BUILD_CSS)

prebuild:
	mkdir -p build
ifeq ("$(wildcard node_modules/react-components/package.json)","")
	@echo "Installing npm packages ..."
	@npm install --no-optional --silent --no-progress
endif
	@# should be fixed by khan/react-components
	@sed -i -- 's/reactify/babelify/g' node_modules/react-components/package.json

server: ke
	php -S 0.0.0.0:$(PORT)

demo:
	git checkout gh-pages
	git reset --hard origin/master
	make build
	git add -f $(PERSEUS_BUILD_JS)
	git commit -nm 'demo update'
	git checkout master
	git push -f origin gh-pages:gh-pages

all: subperseus

subperseus: clean install build put

put: put-js put-css

put-js: build
	cp $(PERSEUS_BUILD_JS) "$(WEBAPP)/javascript/perseus-package/"

put-css: build
	cp stylesheets/perseus-admin-package/* "$(WEBAPP)/stylesheets/perseus-admin-package"
	cp $(PERSEUS_BUILD_CSS) "$(WEBAPP)/stylesheets/exercise-content-package/"

install:
	npm install

clean:
	-rm -rf build/*

lint:
	~/Khan/devtools/khan-linter/runlint.py

test:
	find -E src -type f -regex '.*/__tests__/.*\.jsx?' | xargs ./node_modules/.bin/mocha --reporter spec -r node/environment.js

build/ke.js:
	(cd ke && ../node_modules/.bin/r.js -o requirejs.config.js out=../build/ke.js)

jest: build/ke.js
	./node_modules/.bin/jest

ke:
	ln -s ../../khan-exercises $@

