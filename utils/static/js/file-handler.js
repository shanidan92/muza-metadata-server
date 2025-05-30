/**
 * Handles file selection, display, and validation
 */
export class FileHandler {
    constructor(fileInfo, submitBtn, folderInput, responseArea, clearBtn) {
        this.fileInfo = fileInfo;
        this.submitBtn = submitBtn;
        this.folderInput = folderInput;
        this.responseArea = responseArea;
        this.clearBtn = clearBtn;
        
        this.maxDisplayHeight = '200px';
        this.supportedExtension = '.flac';
        
        this.init();
    }

    /**
     * Initialize event listeners
     */
    init() {
        this.folderInput.addEventListener('change', (event) => {
            this.handleFileSelection(event.target.files);
        });

        this.clearBtn.addEventListener('click', () => {
            this.clearSelection();
        });
    }

    /**
     * Handle file selection from input elements or drag/drop
     */
    handleFileSelection(files) {
        this.clearPreviousErrors();
        
        const flacFiles = this.filterFlacFiles(files);
        
        if (flacFiles.length === 0) {
            this.showNoFilesError();
            return;
        }

        this.displayFileList(flacFiles);
        this.updateFileInput(flacFiles);
        this.enableSubmission();
    }

    /**
     * Filter files to only include FLAC files
     */
    filterFlacFiles(files) {
        return Array.from(files).filter(file => 
            file.name.toLowerCase().endsWith(this.supportedExtension)
        );
    }

    /**
     * Display the list of selected files
     */
    displayFileList(files) {
        this.fileInfo.style.display = 'block';
        
        const header = this.createFileListHeader(files.length);
        const fileItems = this.createFileListItems(files);
        
        this.fileInfo.innerHTML = `
            <div style="height: ${this.maxDisplayHeight}; overflow-y: scroll;">
                ${header}
                ${fileItems}
            </div>
        `;
    }

    /**
     * Create header for file list
     */
    createFileListHeader(fileCount) {
        const pluralSuffix = fileCount !== 1 ? 's' : '';
        return `<p><strong>Found ${fileCount} FLAC file${pluralSuffix} to upload:</strong></p>`;
    }

    /**
     * Create HTML for individual file items
     */
    createFileListItems(files) {
        return files.map((file, index) => {
            const filePath = this.getDisplayPath(file);
            const fileSize = this.formatFileSize(file.size);
            const fileType = file.type || 'audio/flac';
            
            return this.createFileItemHtml(index + 1, filePath, fileSize, fileType);
        }).join('');
    }

    /**
     * Get display path for file (relative path or display path)
     */
    getDisplayPath(file) {
        return file.webkitRelativePath || file.displayPath || file.name;
    }

    /**
     * Format file size in MB
     */
    formatFileSize(sizeInBytes) {
        return (sizeInBytes / 1024 / 1024).toFixed(2);
    }

    /**
     * Create HTML for individual file item
     */
    createFileItemHtml(fileNumber, filePath, fileSize, fileType) {
        return `
            <div style="margin-bottom: 10px; padding: 10px; border-left: 3px solid #007bff; background-color: #f8f9fa;">
                <strong>File ${fileNumber}:</strong> ${filePath}<br>
                <strong>Size:</strong> ${fileSize} MB<br>
                <strong>Type:</strong> ${fileType}
            </div>
        `;
    }

    /**
     * Update the folder input with filtered files
     */
    updateFileInput(flacFiles) {
        const dataTransfer = new DataTransfer();
        flacFiles.forEach(file => dataTransfer.items.add(file));
        this.folderInput.files = dataTransfer.files;
    }

    /**
     * Enable the submit button and clear button
     */
    enableSubmission() {
        this.submitBtn.disabled = false;
        this.clearBtn.disabled = false;
    }

    /**
     * Clear the file selection and reset form state
     */
    clearSelection() {
        // Clear the file input
        this.folderInput.value = '';
        
        // Hide file info display
        this.fileInfo.style.display = 'none';
        this.fileInfo.innerHTML = '';
        
        // Clear response area
        this.clearPreviousErrors();
        
        // Disable buttons
        this.submitBtn.disabled = true;
        this.clearBtn.disabled = true;
    }

    /**
     * Show error when no FLAC files are found
     */
    showNoFilesError() {
        this.fileInfo.innerHTML = `
            <p style="color: #721c24;">
                No FLAC files found. Please select FLAC files (.flac).
            </p>
        `;
        this.fileInfo.style.display = 'block';
        this.submitBtn.disabled = true;
        this.clearBtn.disabled = true;
    }

    /**
     * Clear previous error messages
     */
    clearPreviousErrors() {
        this.responseArea.style.display = 'none';
    }

    /**
     * Show error message in response area
     */
    showError(title, message, details = []) {
        this.responseArea.style.display = 'block';
        this.responseArea.className = 'response-area response-error';
        
        const detailsHtml = details.length > 0 ? this.createDetailsHtml(details) : '';
        
        this.responseArea.innerHTML = `
            <h3>❌ ${title}</h3>
            <p><strong>Error:</strong> ${message}</p>
            ${detailsHtml}
        `;
    }

    /**
     * Create HTML for error details list
     */
    createDetailsHtml(details) {
        const detailItems = details.map(detail => `<li>${detail}</li>`).join('');
        return `
            <p><strong>Details:</strong></p>
            <ul style="max-height: 200px; overflow-y: auto;">
                ${detailItems}
            </ul>
        `;
    }
}
