BINARY_NAME=server
MAIN_PATH=./cmd/main.go

# Detect OS
ifeq ($(OS),Windows_NT)
	RM_CMD = if exist bin del /q /s bin\*
	BUILD_LINUX = set GOOS=linux&& set GOARCH=amd64&& set CGO_ENABLED=0&& go build
	BUILD_PI = set GOOS=linux&& set GOARCH=arm64&& set CGO_ENABLED=0&& go build
	BUILD_WINDOWS = set GOOS=windows&& set GOARCH=amd64&& set CGO_ENABLED=0&& go build
	CHMOD_CMD = @REM
else
	RM_CMD = rm -rf bin/*
	BUILD_LINUX = GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build
	BUILD_PI = GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build
	BUILD_WINDOWS = GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build
	CHMOD_CMD = chmod +x
endif

.PHONY: all build-linux build-pi build-windows clean

all: build-linux build-pi build-windows

build-linux:
	@echo "--- Budowanie na standardowy Linux (Intel/AMD) ---"
	$(BUILD_LINUX) -o bin/$(BINARY_NAME)_linux $(MAIN_PATH)
	$(CHMOD_CMD) bin/$(BINARY_NAME)_linux 2>/dev/null || true
	npm run build --prefix fe

build-pi:
	@echo "--- Budowanie na Raspberry Pi (Linux ARM64) ---"
	$(BUILD_PI) -o bin/$(BINARY_NAME)_pi_arm64 $(MAIN_PATH)
	$(CHMOD_CMD) bin/$(BINARY_NAME)_pi_arm64 2>/dev/null || true
	npm run build --prefix fe

build-windows:
	@echo "--- Budowanie na Windows ---"
	$(BUILD_WINDOWS) -o bin/$(BINARY_NAME).exe $(MAIN_PATH)
	npm run build --prefix fe

clean:
	@echo "--- Czyszczenie ---"
	$(RM_CMD)
