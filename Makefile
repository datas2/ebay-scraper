update-dependencies:
	npx npm-check-updates -u
	npm install

run-dev:
	nodemon index.js

run-test:
	npm test
