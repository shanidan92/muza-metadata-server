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
	@echo "Available targets:"
	@echo "  make venv          Create a new Python virtual environment"
	@echo "  make install       Install dependencies into the virtual environment"
	@echo "  make run           Run the production server (no SSL)"
	@echo "  make run-ssl       Run the production server with SSL"
	@echo "  make run-dev       Run the development server"
	@echo "  make clean         Remove build artifacts and virtual environment"
	@echo "  make certs         Generate self-signed SSL certificates"
	@echo "  make container     Build container image"
	@echo "  make container-run Run container (no SSL)"
	@echo "  make container-ssl Run container with SSL"
	@echo "  make container-push Push container to registry"
	@echo "  make container-clean Remove container image"

.PHONY: venv
venv:
	$(PYTHON) -m venv $(VENV_DIR)

.PHONY: install
install: venv
	. $(VENV_DIR)/bin/activate && \
	$(PIP) install -r requirements.txt

.PHONY: run
run:
	./run.sh

.PHONY: run-ssl
run-ssl:
	SSL_ENABLE=true SSL_CERT=$(SSL_CERT) SSL_KEY=$(SSL_KEY) ./run.sh

.PHONY: run-dev
run-dev:
	. $(VENV_DIR)/bin/activate && \
	${PYTHON} run_dev.py $(ARGS)

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

.PHONY: container-ssl
container-ssl:
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
