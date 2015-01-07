.PHONY: clean

build: index.js client.js

%.js: src/%.ts
	tsc --outDir . --declaration --module commonjs $<

clean:
	rm -rf client.js
