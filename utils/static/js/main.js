import { DragDropHandler } from './drag-drop.js';
import { FileHandler } from './file-handler.js';
import { Uploader } from './uploader.js';

/**
 * Main application controller for the Muza file uploader
 * Coordinates between drag-drop, file handling, and upload functionality
 */
class MuzaUploader {
    constructor() {
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        const domElements = this.getDomElements();
        this.validateDomElements(domElements);
        
        this.initializeComponents(domElements);
        this.setupEventListeners(domElements);
    }

    /**
     * Get all required DOM elements
     */
    getDomElements() {
        return {
            uploadArea: document.getElementById('uploadArea'),
            folderInput: document.getElementById('folderInput'),
            fileInfo: document.getElementById('fileInfo'),
            submitBtn: document.getElementById('submitBtn'),
            clearBtn: document.getElementById('clearBtn'),
            uploadForm: document.getElementById('uploadForm'),
            loading: document.getElementById('loading'),
            responseArea: document.getElementById('responseArea'),
            progressContainer: document.getElementById('progressContainer'),
            progressText: document.getElementById('progressText'),
            progressFill: document.getElementById('progressFill'),
            progressCompleted: document.getElementById('progressCompleted'),
            progressRemaining: document.getElementById('progressRemaining')
        };
    }

    /**
     * Validate that all required DOM elements exist
     */
    validateDomElements(elements) {
        const missingElements = Object.entries(elements)
            .filter(([name, element]) => !element)
            .map(([name]) => name);

        if (missingElements.length > 0) {
            throw new Error(`Missing DOM elements: ${missingElements.join(', ')}`);
        }
    }

    /**
     * Initialize component classes
     */
    initializeComponents(elements) {
        const { fileInfo, submitBtn, folderInput, responseArea, loading, uploadArea, clearBtn } = elements;
        
        // Initialize file handler
        this.fileHandler = new FileHandler(
            fileInfo, 
            submitBtn, 
            folderInput, 
            responseArea,
            clearBtn
        );
        
        // Initialize uploader
        this.uploader = new Uploader(
            folderInput, 
            loading, 
            responseArea, 
            submitBtn
        );
        
        // Initialize drag and drop with callback
        this.dragDropHandler = new DragDropHandler(
            uploadArea, 
            this.handleDroppedFiles.bind(this)
        );
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners(elements) {
        elements.uploadForm.addEventListener('submit', this.handleFormSubmit.bind(this));
    }

    /**
     * Handle form submission
     */
    async handleFormSubmit(event) {
        event.preventDefault();
        
        try {
            await this.uploader.uploadFiles();
        } catch (error) {
            console.error('Upload error:', error);
            this.fileHandler.showError(
                'Upload Error', 
                'An unexpected error occurred during upload.'
            );
        }
    }

    /**
     * Handle files dropped via drag and drop
     */
    handleDroppedFiles(allFiles, unsupportedFiles) {
        // Show error if unsupported files were found
        if (unsupportedFiles.length > 0) {
            this.fileHandler.showError(
                'Unsupported File Types',
                'Only FLAC files (.flac) are supported.',
                unsupportedFiles
            );
            return;
        }

        // Process valid files
        if (allFiles.length > 0) {
            const dataTransfer = new DataTransfer();
            allFiles.forEach(file => dataTransfer.items.add(file));
            this.fileHandler.handleFileSelection(dataTransfer.files);
        } else {
            this.fileHandler.showError(
                'No FLAC Files Found',
                'No FLAC files were found in the dropped content. Please drop FLAC files or directories containing FLAC files.'
            );
        }
    }
}

/**
 * Initialize application when DOM is ready
 */
function initializeApp() {
    try {
        new MuzaUploader();
        console.log('Muza Uploader initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Muza Uploader:', error);
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
