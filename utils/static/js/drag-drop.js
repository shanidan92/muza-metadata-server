/**
 * Handles drag and drop functionality for file uploads
 * Supports files, directories, and mixed content
 */
export class DragDropHandler {
    constructor(uploadArea, onFilesDropped) {
        this.uploadArea = uploadArea;
        this.onFilesDropped = onFilesDropped;
        this.supportedExtensions = ['.flac'];
        
        this.init();
    }

    /**
     * Initialize event listeners for drag and drop
     */
    init() {
        this.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.uploadArea.addEventListener('drop', this.handleDrop.bind(this));
    }

    /**
     * Handle drag over event
     */
    handleDragOver(event) {
        event.preventDefault();
        
        // Don't show dragover state if upload area is disabled
        if (this.isUploadDisabled()) {
            return;
        }
        
        this.uploadArea.classList.add('dragover');
    }

    /**
     * Handle drag leave event
     */
    handleDragLeave() {
        // Don't remove dragover state if upload area is disabled
        if (this.isUploadDisabled()) {
            return;
        }
        
        this.uploadArea.classList.remove('dragover');
    }

    /**
     * Handle drop event - main entry point for dropped content
     */
    async handleDrop(event) {
        event.preventDefault();
        this.uploadArea.classList.remove('dragover');
        
        // Don't process drops if upload area is disabled
        if (this.isUploadDisabled()) {
            return;
        }
        
        const { items, files } = event.dataTransfer;
        const allFiles = [];
        const unsupportedFiles = [];

        // Try using items for modern browsers that support DataTransferItem
        if (items && items.length > 0) {
            await this.processDataTransferItems(items, allFiles, unsupportedFiles);
        } 
        // Fallback for older browsers
        else if (files && files.length > 0) {
            this.processFileList(files, allFiles, unsupportedFiles);
        }

        this.onFilesDropped(allFiles, unsupportedFiles);
    }

    /**
     * Process DataTransfer items (modern browsers) with directory support
     */
    async processDataTransferItems(items, allFiles, unsupportedFiles) {
        const processingPromises = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file') {
                const entry = item.webkitGetAsEntry();
                if (entry) {
                    processingPromises.push(
                        this.processFileSystemEntry(entry, allFiles, unsupportedFiles)
                    );
                }
            }
        }

        await Promise.all(processingPromises);
    }

    /**
     * Process FileList (fallback for older browsers) no directory support
     */
    processFileList(files, allFiles, unsupportedFiles) {
        Array.from(files).forEach(file => {
            if (this.isSupportedFile(file.name)) {
                allFiles.push(file);
            }
        });
    }

    /**
     * Recursively process file system entries (files and directories)
     */
    async processFileSystemEntry(entry, files, unsupportedFiles, basePath = '') {
        return new Promise((resolve) => {
            if (entry.isFile) {
                this.processFileEntry(entry, files, unsupportedFiles, basePath, resolve);
            } else if (entry.isDirectory) {
                this.processDirectoryEntry(entry, files, unsupportedFiles, basePath, resolve);
            } else {
                resolve();
            }
        });
    }

    /**
     * Process a file entry
     */
    processFileEntry(entry, files, unsupportedFiles, basePath, resolve) {
        entry.file((file) => {
            const fullPath = this.buildFilePath(basePath, file.name);
            
            if (this.isSupportedFile(file.name)) {
                file.displayPath = fullPath;
                files.push(file);
            }
            
            resolve();
        });
    }

    /**
     * Process a directory entry
     */
    processDirectoryEntry(entry, files, unsupportedFiles, basePath, resolve) {
        const dirReader = entry.createReader();
        const currentPath = this.buildFilePath(basePath, entry.name);
        
        dirReader.readEntries(async (entries) => {
            const processingPromises = entries.map(subEntry => 
                this.processFileSystemEntry(subEntry, files, unsupportedFiles, currentPath)
            );
            await Promise.all(processingPromises);
            resolve();
        });
    }

    /**
     * Check if file has supported extension
     */
    isSupportedFile(filename) {
        const lowercaseName = filename.toLowerCase();
        return this.supportedExtensions.some(ext => lowercaseName.endsWith(ext));
    }

    /**
     * Build file path with proper separators
     */
    buildFilePath(basePath, filename) {
        return basePath ? `${basePath}/${filename}` : filename;
    }

    /**
     * Check if upload area is currently disabled
     */
    isUploadDisabled() {
        return this.uploadArea.classList.contains('upload-disabled');
    }
}
