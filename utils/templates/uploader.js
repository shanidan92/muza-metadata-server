// Muza Uploader JavaScript
console.log('Uploader script loaded');

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing uploader...');
    
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const submitBtn = document.getElementById('submitBtn');
    const uploadForm = document.getElementById('uploadForm');
    const loading = document.getElementById('loading');
    const responseArea = document.getElementById('responseArea');
    const chooseFileBtn = document.getElementById('chooseFileBtn');

    console.log('Elements found:', {
        uploadArea: !!uploadArea,
        fileInput: !!fileInput,
        fileInfo: !!fileInfo,
        submitBtn: !!submitBtn,
        uploadForm: !!uploadForm,
        loading: !!loading,
        responseArea: !!responseArea,
        chooseFileBtn: !!chooseFileBtn
    });

    // Choose file button click
    chooseFileBtn.addEventListener('click', function() {
        console.log('Choose file button clicked');
        fileInput.click();
    });

    // Upload area click (alternative way to trigger file input)
    uploadArea.addEventListener('click', function() {
        console.log('Upload area clicked');
        fileInput.click();
    });

    // Drag and drop functionality
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        console.log('Drag over');
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', function() {
        console.log('Drag leave');
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        console.log('File dropped');
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            console.log('Files dropped:', files);
            handleFileSelect(files[0]);
        }
    });

    // File input change
    fileInput.addEventListener('change', function(e) {
        console.log('File input changed:', e.target.files);
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });

    function handleFileSelect(file) {
        console.log('Handling file selection:', file);
        
        // Check file type
        if (!file.name.toLowerCase().endsWith('.flac')) {
            alert('Please select a FLAC file (.flac)');
            return;
        }

        // Show file info
        fileInfo.style.display = 'block';
        fileInfo.innerHTML = `
            <strong>Selected file:</strong> ${file.name}<br>
            <strong>Size:</strong> ${(file.size / 1024 / 1024).toFixed(2)} MB<br>
            <strong>Type:</strong> ${file.type || 'audio/flac'}
        `;

        // Enable submit button
        submitBtn.disabled = false;
        
        console.log('File selected successfully:', file.name);
    }

    // Form submission
    uploadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Form submitted');
        
        const file = fileInput.files[0];
        if (!file) {
            alert('Please select a file first');
            return;
        }

        // Show loading
        loading.style.display = 'block';
        responseArea.style.display = 'none';
        submitBtn.disabled = true;

        // Create form data
        const formData = new FormData();
        formData.append('file', file);

        try {
            console.log('Uploading file:', file.name);
            
            // Get current path and build upload URL
            const currentPath = window.location.pathname;
            const basePath = currentPath.endsWith('/') ? currentPath : currentPath + '/';
            const uploadUrl = basePath + 'upload';
            
            console.log('Upload URL:', uploadUrl);
            
            const response = await fetch(uploadUrl, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            console.log('Upload response:', result);
            
            // Hide loading
            loading.style.display = 'none';
            submitBtn.disabled = false;

            // Show response
            responseArea.style.display = 'block';
            
            if (response.ok && result.success) {
                responseArea.className = 'response-area response-success';
                responseArea.innerHTML = `
                    <h3>✅ Upload Successful!</h3>
                    <p><strong>Message:</strong> ${result.message}</p>
                    <h4>Track Information:</h4>
                    <pre>${JSON.stringify(result.track, null, 2)}</pre>
                    <h4>Metadata:</h4>
                    <pre>${JSON.stringify(result.metadata, null, 2)}</pre>
                `;
            } else {
                responseArea.className = 'response-area response-error';
                responseArea.innerHTML = `
                    <h3>❌ Upload Failed</h3>
                    <p><strong>Error:</strong> ${result.error || 'Unknown error occurred'}</p>
                    <pre>${JSON.stringify(result, null, 2)}</pre>
                `;
            }
        } catch (error) {
            console.error('Upload error:', error);
            
            // Hide loading
            loading.style.display = 'none';
            submitBtn.disabled = false;

            // Show error
            responseArea.style.display = 'block';
            responseArea.className = 'response-area response-error';
            responseArea.innerHTML = `
                <h3>❌ Network Error</h3>
                <p><strong>Error:</strong> ${error.message}</p>
            `;
        }
    });

    console.log('Uploader initialized successfully');
});


