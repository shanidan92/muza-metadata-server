VENV_DIR := venv
PYTHON := python3
PIP := pip3
CERT_DIR := certs
SSL_CERT := $(CERT_DIR)/server.crt
SSL_KEY := $(CERT_DIR)/server.key

# Container-related variables
CONTAINER_ENGINE := podman
IMAGE_NAME := muza-metadata-server
IMAGE_TAG := latest
REGISTRY := quay.io/yaacov

.PHONY: help
help:
	@echo "Muza Metadata Server Make Commands"
	@echo ""
	@echo "Development Commands:"
	@echo "  make install        - Install dependencies into the virtual environment"
	@echo "  make run-dev        - Run the development server"
	@echo "  make run-uploader   - Run the utils FLAC processing API server"
	@echo "  make format         - Format Python code using black"
	@echo "  make lint           - Check Python code formatting using black"
	@echo ""
	@echo "Production Commands:"
	@echo "  make run            - Run the production server (no SSL)"
	@echo "  make run-ssl        - Run the production server with SSL"
	@echo "  make certs          - Generate self-signed SSL certificates"
	@echo ""
	@echo "Container Commands:"
	@echo "  make container      - Build container image"
	@echo "  make container-run  - Run container (no SSL)"
	@echo "  make container-run-ssl - Run container with SSL"
	@echo "  make container-push - Push container to registry"
	@echo "  make container-clean - Remove container image"
	@echo ""
	@echo "Cleanup Commands:"
	@echo "  make clean          - Remove build artifacts and virtual environment"

.PHONY: venv
venv:
	$(PYTHON) -m venv $(VENV_DIR)

.PHONY: install
install: venv
	. $(VENV_DIR)/bin/activate && \
	$(PIP) install -r requirements.txt


.PHONY: run-dev
run-dev:
	. $(VENV_DIR)/bin/activate && \
	${PYTHON} run_dev.py $(ARGS)

.PHONY: run
run:
	./run.sh

.PHONY: run-ssl
run-ssl:
	@if [ ! -f "$(SSL_CERT)" ]; then \
		echo "Error: SSL certificate file $(SSL_CERT) not found"; \
		echo "Run 'make certs' to generate SSL certificates"; \
		exit 1; \
	fi
	@if [ ! -f "$(SSL_KEY)" ]; then \
		echo "Error: SSL key file $(SSL_KEY) not found"; \
		echo "Run 'make certs' to generate SSL certificates"; \
		exit 1; \
	fi
	SSL_ENABLE=true SSL_CERT=$(SSL_CERT) SSL_KEY=$(SSL_KEY) ./run.sh

.PHONY: clean
clean:
	rm -rf $(VENV_DIR)
	rm -rf *.egg-info
	rm -rf dist
	rm -rf build
	rm -rf data
	rm -rf certs
	rm -f *.db
	rm -f *.pyc
	find . -type d -name __pycache__ -exec rm -r {} +
	find . -type d -name .pytest_cache -exec rm -r {} +

.PHONY: certs
certs:
	mkdir -p $(CERT_DIR)
	openssl req -x509 -newkey rsa:4096 -nodes \
		-out $(SSL_CERT) \
		-keyout $(SSL_KEY) \
		-days 365 \
		-subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

.PHONY: container
container:
	$(CONTAINER_ENGINE) build -t $(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG) -f Containerfile .

.PHONY: container-run
container-run:
	$(CONTAINER_ENGINE) run -it --rm \
		-p 5000:5000 \
		-v $(PWD)/data:/data:Z \
		$(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)

.PHONY: container-run-ssl
container-run-ssl:
	$(CONTAINER_ENGINE) run -it --rm \
		-p 5443:5000 \
		-v $(PWD)/data:/data:Z \
		-v $(PWD)/$(CERT_DIR):/app/certs:Z \
		-e SSL_ENABLE=true \
		$(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)

.PHONY: container-push
container-push:
	$(CONTAINER_ENGINE) push $(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)

.PHONY: container-clean
container-clean:
	$(CONTAINER_ENGINE) rmi -f $(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)

.PHONY: format
format:
	. $(VENV_DIR)/bin/activate && \
	black .

.PHONY: lint
lint:
	. $(VENV_DIR)/bin/activate && \
	black --check .

.PHONY: run-uploader
run-uploader:
	. $(VENV_DIR)/bin/activate && \
	$(PYTHON) -m utils.app $(ARGS)
