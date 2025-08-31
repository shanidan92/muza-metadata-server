export class CoverUploader {
  constructor() {
    this.form = document.getElementById('coverUploadForm');
    this.fileInput = document.getElementById('coverFileInput');
    this.uploadBtn = document.getElementById('coverUploadBtn');
    this.responseArea = document.getElementById('coverResponseArea');
    this.previewImg = document.getElementById('coverPreview');
    this.cdnUrlInput = document.getElementById('coverCdnUrl');
    this.copyBtn = document.getElementById('copyCdnUrlBtn');

    this.bindEvents();
  }

  bindEvents() {
    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.uploadCover().catch((err) =>
          this.showError('Upload failed', err.message || String(err)),
        );
      });
    }

    if (this.fileInput) {
      this.fileInput.addEventListener('change', () => this.updatePreview());
    }

    if (this.copyBtn) {
      this.copyBtn.addEventListener('click', async () => {
        const url = this.cdnUrlInput.value;
        if (!url) return;
        try {
          await navigator.clipboard.writeText(url);
          this.showSuccess(`Copied URL to clipboard`);
        } catch {
          this.showError('Copy failed', 'Could not copy to clipboard');
        }
      });
    }
  }

  updatePreview() {
    const file = this.fileInput.files?.[0];
    if (!file) {
      this.previewImg.style.display = 'none';
      this.previewImg.src = '';
      return;
    }
    const url = URL.createObjectURL(file);
    this.previewImg.src = url;
    this.previewImg.style.display = 'block';
  }

  async uploadCover() {
    const file = this.fileInput.files?.[0];
    if (!file) {
      this.showError('No file selected', 'Please choose an image file');
      return;
    }

    // Request presigned URL
    const presignResp = await fetch('/admin/presign/cover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        content_type: file.type || 'image/jpeg',
      }),
    });
    const presignData = await presignResp.json();
    if (!presignResp.ok || !presignData.upload_url) {
      throw new Error(presignData.error || 'Failed to get upload URL');
    }

    // Upload directly to S3
    const putResp = await fetch(presignData.upload_url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'image/jpeg' },
      body: file,
    });
    if (!putResp.ok) {
      throw new Error(`S3 upload failed (${putResp.status})`);
    }

    const cdnUrl = presignData.cdn_url || '';
    this.cdnUrlInput.value = cdnUrl;
    if (cdnUrl) {
      this.responseArea.className = 'response-area response-success';
      this.responseArea.innerHTML = `
        <h3>✅ Cover Uploaded</h3>
        <p>CDN URL:</p>
        <p><a href="${cdnUrl}" target="_blank" rel="noopener">${cdnUrl}</a></p>
      `;
      this.responseArea.style.display = 'block';
    } else {
      this.showSuccess('Cover uploaded (no CDN URL configured)');
    }
  }

  showError(title, message) {
    this.responseArea.className = 'response-area response-error';
    this.responseArea.innerHTML = `
      <h3>❌ ${title}</h3>
      <p>${message}</p>
    `;
    this.responseArea.style.display = 'block';
  }

  showSuccess(message) {
    this.responseArea.className = 'response-area response-success';
    this.responseArea.innerHTML = `
      <h3>✅ Success</h3>
      <p>${message}</p>
    `;
    this.responseArea.style.display = 'block';
  }
}
