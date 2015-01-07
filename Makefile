.PHONY: clean

build: index.js client.js

%.js: src/%.ts
	tsc --outDir . --module commonjs $<

clean:
	rm -rf client.js
