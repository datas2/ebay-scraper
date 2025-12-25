# npm commands
update-dependencies:
	npx npm-check-updates -u
	npm install

run-dev:
	npm run dev

run-test:
	npm test

# docker commands
build-docker:
	docker build -t ebay-scraper-api .

run-docker:
	docker run -d -p 8000:8080 -e PORT=8080 --name ebay-scraper-api ebay-scraper-api

stop-docker:
	docker stop ebay-scraper-api
	docker rm ebay-scraper-api

# cloudrun commands
login-artifact-registry:
	gcloud auth configure-docker us-central1-docker.pkg.dev

build-image:
	docker buildx build --platform linux/amd64 -t us-central1-docker.pkg.dev/<project_id>/ebay-scraper-api/api .


create-repository:
	gcloud artifacts repositories create ebay-scraper-api \
		--repository-format=docker \
		--location=us-central1 \
		--description="Docker repository for ebay-scraper API"

push-image:
	docker push us-central1-docker.pkg.dev/<project_id>/ebay-scraper-api/api

deploy-cloudrun:
	gcloud run deploy ebay-scraper-api \
		--image us-central1-docker.pkg.dev/<project_id>/ebay-scraper-api/api \
		--region us-central1 \
		--set-env-vars API_KEY=<your_api_key_here> \
		--memory 256Mi \
		--cpu 1 \
		--max-instances 1 \
		--timeout 60 \
		--allow-unauthenticated
