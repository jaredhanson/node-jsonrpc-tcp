NODE = node
TEST = ./node_modules/.bin/vows
TESTS ?= test/*-test.js

test:
	@NODE_ENV=test NODE_PATH=lib $(TEST) $(TEST_FLAGS) $(TESTS)

docs: docs/api.html

docs/api.html: lib/jsonrpc-tcp/*.js
	dox \
		--title JSONRPC-TCP \
		--desc "JSON-RPC over TCP for Node.js" \
		$(shell find lib/jsonrpc-tcp/* -type f) > $@

docclean:
	rm -f docs/*.{1,html}

.PHONY: test docs docclean
