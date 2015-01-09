.PHONY: clean

build: index.js client.js

%.js: src/%.ts
	tsc --outDir . --declaration $<

clean:
	rm -rf client.js
