VENV_DIR := venv
PYTHON := python3
PIP := pip3
CERT_DIR := certs

# Container-related variables
CONTAINER_ENGINE := podman
IMAGE_NAME := muza-metadata-server
IMAGE_TAG := latest

# Detect OS for cross-platform support
ifeq ($(OS),Windows_NT)
    VENV_ACTIVATE := $(VENV_DIR)\Scripts\activate.bat
    PYTHON := python
    PIP := pip
    RM := del /q
    RMDIR := rmdir /s /q
else
    VENV_ACTIVATE := . $(VENV_DIR)/bin/activate
    RM := rm -f
    RMDIR := rm -rf
endif

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
	@echo "Windows Commands:"
	@echo "  make install-win    - Install dependencies (Windows)"
	@echo "  make run-dev-win    - Run development server (Windows)"
	@echo "  make clean-win      - Clean build artifacts (Windows)"
	@echo ""
	@echo "Cleanup Commands:"
	@echo "  make clean          - Remove build artifacts and virtual environment"

.PHONY: venv
venv:
	$(PYTHON) -m venv $(VENV_DIR)

.PHONY: install
install: venv
ifeq ($(OS),Windows_NT)
	$(VENV_DIR)\Scripts\activate.bat && $(PIP) install -r requirements.txt
else
	. $(VENV_DIR)/bin/activate && $(PIP) install -r requirements.txt
endif

# Windows-specific targets
.PHONY: install-win
install-win:
	$(PYTHON) -m venv $(VENV_DIR)
	$(VENV_DIR)\Scripts\activate.bat && $(PIP) install -r requirements.txt

.PHONY: run-dev
run-dev:
	. $(VENV_DIR)/bin/activate && \
	${PYTHON} run_dev.py $(ARGS)

.PHONY: run
run:
	./run.sh

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
	$(PYTHON) -m utils.uploader $(ARGS)

# Windows-specific targets
.PHONY: run-dev-win
run-dev-win:
	$(VENV_DIR)\Scripts\activate.bat && $(PYTHON) run_dev.py $(ARGS)

.PHONY: run-uploader-win
run-uploader-win:
	$(VENV_DIR)\Scripts\activate.bat && $(PYTHON) -m utils.uploader $(ARGS)

.PHONY: clean-win
clean-win:
	if exist $(VENV_DIR) $(RMDIR) $(VENV_DIR)
	if exist *.egg-info $(RMDIR) *.egg-info
	if exist dist $(RMDIR) dist
	if exist build $(RMDIR) build
	if exist data $(RMDIR) data
	if exist certs $(RMDIR) certs
	if exist *.db $(RM) *.db
	if exist *.pyc $(RM) *.pyc