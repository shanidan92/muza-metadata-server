/**
 * Handles file upload and server communication
 */
export class Uploader {
    constructor(folderInput, loading, responseArea, submitBtn) {
        this.folderInput = folderInput;
        this.loading = loading;
        this.responseArea = responseArea;
        this.submitBtn = submitBtn;
        
        // Progress bar elements
        this.progressContainer = document.getElementById('progressContainer');
        this.progressText = document.getElementById('progressText');
        this.progressFill = document.getElementById('progressFill');
        this.progressCompleted = document.getElementById('progressCompleted');
        this.progressRemaining = document.getElementById('progressRemaining');
        
        // Upload area and folder button elements
        this.uploadArea = document.getElementById('uploadArea');
        this.folderButton = this.uploadArea.querySelector('button[onclick*="folderInput"]');
        this.clearBtn = document.getElementById('clearBtn');
        
        this.uploadEndpoint = 'upload';
    }

    /**
     * Upload all selected files sequentially
     */
    async uploadFiles() {
        const files = Array.from(this.folderInput.files);
        
        if (files.length === 0) {
            this.showError('No Files Selected', 'Please select files before uploading.');
            return;
        }

        const uploadResults = {
            successful: [],
            failed: [],
            total: files.length
        };

        this.initializeUpload(files.length);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            this.updateProgress(i, files.length, file.name);
            
            try {
                const result = await this.uploadSingleFile(file);
                uploadResults.successful.push({ file: file.name, result });
            } catch (error) {
                uploadResults.failed.push({ file: file.name, error: error.message });
            }
        }

        this.finalizeUpload();
        this.displayUploadResults(uploadResults);
    }

    /**
     * Upload a single file
     */
    async uploadSingleFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        const uploadUrl = this.buildUploadUrl();
        
        const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Upload failed');
        }

        return result;
    }

    /**
     * Build the upload URL based on current location
     */
    buildUploadUrl() {
        const currentPath = window.location.pathname;
        const basePath = currentPath.endsWith('/') ? currentPath : currentPath + '/';
        return basePath + this.uploadEndpoint;
    }

    /**
     * Initialize upload UI state with progress bar
     */
    initializeUpload(totalFiles) {
        this.loading.style.display = 'block';
        this.responseArea.style.display = 'none';
        this.submitBtn.disabled = true;
        
        // Disable upload interactions
        this.disableUploadControls();
        
        // Show and initialize progress bar
        this.progressContainer.style.display = 'block';
        this.updateProgressBar(0, totalFiles, 'Starting upload...');
    }

    /**
     * Update progress indicator with detailed information
     */
    updateProgress(currentIndex, totalFiles, currentFileName) {
        const completed = currentIndex;
        const remaining = totalFiles - currentIndex;
        const progressText = `Uploading: ${currentFileName}`;
        
        this.updateProgressBar(completed, totalFiles, progressText);
    }

    /**
     * Update progress bar visual elements
     */
    updateProgressBar(completed, total, statusText) {
        const percentage = total > 0 ? (completed / total) * 100 : 0;
        const remaining = total - completed;
        
        // Update progress bar fill
        this.progressFill.style.width = `${percentage}%`;
        
        // Update text elements
        this.progressText.textContent = `${statusText} (${completed} / ${total})`;
        this.progressCompleted.textContent = `Completed: ${completed}`;
        this.progressRemaining.textContent = `Remaining: ${remaining}`;
    }

    /**
     * Finalize upload UI state
     */
    finalizeUpload() {
        this.loading.style.display = 'none';
        this.progressContainer.style.display = 'none';
        this.submitBtn.disabled = false;
        this.responseArea.style.display = 'block';
        
        // Re-enable upload interactions
        this.enableUploadControls();
    }

    /**
     * Disable upload area and folder selection during upload
     */
    disableUploadControls() {
        // Disable drag and drop by adding a disabled class and overlay
        this.uploadArea.classList.add('upload-disabled');
        this.uploadArea.style.pointerEvents = 'none';
        this.uploadArea.style.opacity = '0.6';
        
        // Disable folder input and button
        this.folderInput.disabled = true;
        if (this.folderButton) {
            this.folderButton.disabled = true;
        }
        
        // Disable clear button
        if (this.clearBtn) {
            this.clearBtn.disabled = true;
        }
    }

    /**
     * Re-enable upload area and folder selection after upload
     */
    enableUploadControls() {
        // Re-enable drag and drop
        this.uploadArea.classList.remove('upload-disabled');
        this.uploadArea.style.pointerEvents = '';
        this.uploadArea.style.opacity = '';
        
        // Re-enable folder input and button
        this.folderInput.disabled = false;
        if (this.folderButton) {
            this.folderButton.disabled = false;
        }
        
        // Re-enable clear button if there are files selected
        if (this.clearBtn && this.folderInput.files.length > 0) {
            this.clearBtn.disabled = false;
        }
    }

    /**
     * Display upload results summary
     */
    displayUploadResults(results) {
        if (results.failed.length === 0) {
            this.displaySuccessResults(results);
        } else if (results.successful.length === 0) {
            this.displayFailureResults(results);
        } else {
            this.displayMixedResults(results);
        }
    }

    /**
     * Display all successful uploads
     */
    displaySuccessResults(results) {
        const filesList = results.successful
            .map((item, index) => {
                const metadata = item.result.metadata || {};
                return `
                    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #c3e6cb; border-radius: 5px; background-color: #f8fff9;">
                        <h5 style="margin: 0 0 10px 0; color: #155724;">File ${index + 1}: ${item.file}</h5>
                        <pre style="margin: 0; font-size: 12px;">${JSON.stringify(metadata, null, 2)}</pre>
                    </div>
                `;
            })
            .join('');
        
        this.responseArea.className = 'response-area response-success';
        this.responseArea.innerHTML = `
            <h3>✅ Upload Successful!</h3>
            <p><strong>Files processed:</strong> ${results.successful.length}</p>
            <div style="max-height: 400px; overflow-y: auto;">
                ${filesList}
            </div>
        `;
    }

    /**
     * Display all failed uploads
     */
    displayFailureResults(results) {
        const errorList = results.failed
            .map(item => `<li>${item.file}: ${item.error}</li>`)
            .join('');

        this.responseArea.className = 'response-area response-error';
        this.responseArea.innerHTML = `
            <h3>❌ Upload Failed</h3>
            <p><strong>All ${results.total} files failed to upload</strong></p>
            <ul>${errorList}</ul>
        `;
    }

    /**
     * Display mixed results (some success, some failure)
     */
    displayMixedResults(results) {
        const successList = results.successful
            .map(item => `<li>✅ ${item.file}</li>`)
            .join('');
        
        const errorList = results.failed
            .map(item => `<li>❌ ${item.file}: ${item.error}</li>`)
            .join('');

        this.responseArea.className = 'response-area response-error';
        this.responseArea.innerHTML = `
            <h3>⚠️ Partial Upload Success</h3>
            <p><strong>Successful:</strong> ${results.successful.length} files</p>
            <p><strong>Failed:</strong> ${results.failed.length} files</p>
            
            <h4>Successful uploads:</h4>
            <ul>${successList}</ul>
            
            <h4>Failed uploads:</h4>
            <ul>${errorList}</ul>
        `;
    }

    /**
     * Show error message
     */
    showError(title, message) {
        this.responseArea.style.display = 'block';
        this.responseArea.className = 'response-area response-error';
        this.responseArea.innerHTML = `
            <h3>❌ ${title}</h3>
            <p><strong>Error:</strong> ${message}</p>
        `;
    }
}
