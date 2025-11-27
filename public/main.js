document.addEventListener('DOMContentLoaded', async () => {
  // ==================== UTILITY FUNCTIONS ====================
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function showLoading(element) {
    element.innerHTML = '<div class="loading">Loading...</div>';
  }

  function showError(element, message) {
    element.innerHTML = `<p class="text-danger">${message}</p>`;
  }

  // ==================== IMAGE VIEWER MODAL ====================
  const ImageViewer = {
    elements: {},
    
    init() {
      this.createModal();
      this.bindEvents();
    },
    
    createModal() {
      // Create modal HTML
      const modalHTML = `
        <div id="imageViewerModal" class="image-viewer-modal">
          <div class="image-viewer-content">
            <span class="image-viewer-close">&times;</span>
            <img id="viewerImage" src="" alt="Enlarged view" />
            <div class="image-viewer-controls">
              <button class="viewer-btn viewer-prev" aria-label="Previous image">‹</button>
              <button class="viewer-btn viewer-next" aria-label="Next image">›</button>
            </div>
            <div class="image-viewer-info">
              <span id="viewerFilename"></span>
              <span id="viewerLikes" class="viewer-likes"></span>
            </div>
          </div>
        </div>
      `;
      
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      this.cacheElements();
    },
    
    cacheElements() {
      this.elements = {
        modal: document.getElementById('imageViewerModal'),
        image: document.getElementById('viewerImage'),
        closeBtn: document.querySelector('.image-viewer-close'),
        prevBtn: document.querySelector('.viewer-prev'),
        nextBtn: document.querySelector('.viewer-next'),
        filename: document.getElementById('viewerFilename'),
        likes: document.getElementById('viewerLikes')
      };
    },
    
    bindEvents() {
      const { elements } = this;
      
      // Close modal events
      elements.closeBtn.onclick = () => this.close();
      elements.modal.onclick = (e) => {
        if (e.target === elements.modal) this.close();
      };
      
      // Keyboard events
      document.addEventListener('keydown', (e) => {
        if (elements.modal.style.display === 'flex') {
          if (e.key === 'Escape') this.close();
          if (e.key === 'ArrowLeft') this.previousImage();
          if (e.key === 'ArrowRight') this.nextImage();
        }
      });
      
      // Navigation buttons
      elements.prevBtn.onclick = () => this.previousImage();
      elements.nextBtn.onclick = () => this.nextImage();
    },
    
    open(imageSrc, filename, likes = 0) {
      const { elements } = this;
      
      elements.image.src = imageSrc;
      elements.filename.textContent = filename;
      elements.likes.textContent = `${likes} ❤️`;
      elements.modal.style.display = 'flex';
      
      // Store current image info for navigation
      this.currentImage = { imageSrc, filename, likes };
      
      // Prevent body scrolling
      document.body.style.overflow = 'hidden';
    },
    
    close() {
      this.elements.modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    },
    
    previousImage() {
      // You can implement gallery navigation here
      console.log('Previous image - implement navigation if needed');
    },
    
    nextImage() {
      // You can implement gallery navigation here
      console.log('Next image - implement navigation if needed');
    }
  };

  // ==================== YOUTUBE VIDEOS ====================
  async function loadVideos() {
    const videoList = document.getElementById('videoList');
    const loadingElement = document.getElementById('loading');
    
    try {
      showLoading(videoList);
      
      const res = await fetch('/api/videos');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const videos = await res.json();

      if (!Array.isArray(videos) || videos.length === 0) {
        videoList.innerHTML = '<p>No videos found.</p>';
      } else {
        videoList.innerHTML = videos.map(video => `
          <div class="mb-4">
            <iframe 
              src="https://www.youtube.com/embed/${video.id}" 
              frameborder="0" 
              allowfullscreen 
              class="w-100" 
              style="height:300px;"
              title="${video.title}">
            </iframe>
            <p class="mt-2 fw-bold">${video.title}</p>
          </div>
        `).join('');
      }
      loadingElement.style.display = 'none';
    } catch (err) {
      showError(videoList, 'Failed to load videos. Please try again.');
      console.error('Error loading videos:', err);
    }
  }

  // ==================== GALLERY MANAGEMENT ====================
  // ==================== GALLERY MANAGEMENT ====================
// ==================== GALLERY MANAGEMENT ====================
const Gallery = {
    currentImages: [], // Store current gallery images for navigation
    
    async load() {
        const gallery = document.getElementById('gallery');
        if (!gallery) return console.error('❌ Gallery element not found in DOM');

        try {
            showLoading(gallery);
            console.log('🔄 Fetching gallery from /api/gallery...');

            const res = await fetch('/api/gallery');
            if (!res.ok) throw new Error(`Server returned ${res.status}: ${res.statusText}`);

            const images = await res.json();
            console.log('📸 Gallery API response:', images);

            // Store images for viewer navigation
            this.currentImages = images;

            if (!images?.length) {
                gallery.innerHTML = '<p>No images uploaded yet. Upload some images to see them here!</p>';
                return console.info('ℹ️ No images found in gallery');
            }

            console.log(`🎨 Rendering ${images.length} gallery items...`);
            gallery.innerHTML = images.map((img, index) => {
                return `
                <div class="gallery-item">
                    <img src="${img.url}" alt="${img.name}" data-index="${index}" 
                         data-filename="${img.name}" data-likes="${img.likes || 0}" />
                    <div class="overlay">
                        <span class="heart" role="button" tabindex="0" aria-label="Like image" 
                              data-filename="${img.name}">
                            ${this.getHeartSVG()}
                        </span>
                        <span class="likes">${img.likes || 0}</span>
                    </div>
                </div>
                `;
            }).join('');

            console.log('✅ Gallery rendered successfully');

        } catch (err) {
            showError(gallery, 'Failed to load gallery. Please try again later.');
            console.error('❌ Failed to load gallery:', err);
        }
    },

    getHeartSVG() {
        // Always return filled heart (red)
        return `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#ff4757" stroke="#ff4757" 
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="heart-svg">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
        `;
    },

    setupLikeHandler() {
        const gallery = document.getElementById('gallery');
        if (!gallery) return console.warn('Gallery element not found for like handler');

        console.log('🔄 Setting up like handler...');
        gallery.addEventListener('click', debounce(async (e) => {
            // Handle image clicks for viewer
            if (e.target.tagName === 'IMG' && e.target.closest('.gallery-item')) {
                const img = e.target;
                const filename = img.dataset.filename;
                const likes = parseInt(img.dataset.likes) || 0;
                console.log('🖼️ Image clicked:', filename);
                ImageViewer.open(img.src, filename, likes);
                return;
            }

            // Handle heart clicks for likes
            const heartEl = e.target.closest('.heart');
            if (!heartEl) return;

            console.log('❤️ Heart clicked');
            await this.handleLike(heartEl);
        }, 300));

        gallery.addEventListener('keypress', e => {
            if (['Enter', ' '].includes(e.key)) {
                const heartEl = e.target.closest('.heart');
                if (heartEl) {
                    e.preventDefault();
                    heartEl.click();
                }
            }
        });
    },

    async handleLike(heartEl) {
    const likesEl = heartEl.nextElementSibling;
    if (!likesEl) {
        console.error('❌ Likes element not found');
        return;
    }

    const filename = heartEl.dataset.filename;
    let likesCount = parseInt(likesEl.textContent) || 0;

    console.log(`🔄 Adding like for ${filename}, current likes: ${likesCount}`);

    // Prevent rapid double clicks
    if (heartEl.classList.contains('processing')) {
        console.log('⏳ Already processing like, skipping...');
        return;
    }

    heartEl.classList.add('processing');

    // Update likes count - always add 1
    likesCount += 1;
    likesEl.textContent = likesCount;

    console.log(`👍 New likes count: ${likesCount}`);

    // Send to server
    try {
        console.log('📡 Sending like to server for filename:', filename);
        
        const res = await fetch('/api/gallery/like', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                filename
            })
        });
        
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        
        const result = await res.json();
        console.log('✅ Server response:', result);
        
        if (result.success) {
            // Update with server count to ensure consistency
            likesEl.textContent = result.likes;
            console.log(`🔄 Updated likes count from server: ${result.likes}`);
            
            // Also update the data attribute for consistency
            const galleryItem = heartEl.closest('.gallery-item');
            const imgEl = galleryItem.querySelector('img');
            imgEl.dataset.likes = result.likes;
        }
    } catch (err) {
        // Revert optimistic update on error
        console.error('❌ Failed to send like:', err);
        likesEl.textContent = likesCount - 1;
        console.log('🔄 Reverted like due to error');
    } finally {
        heartEl.classList.remove('processing');
    }
}
};
  // ==================== STATS COUNTER ====================
  const Stats = {
    async update() {
      try {
        const res = await fetch('/api/counter');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const data = await res.json();
        document.getElementById('visitorCount').textContent = `Visitors: ${data.visits}`;
        document.getElementById('likeCount').textContent = data.likes;
        document.getElementById('avgRating').textContent = data.avgRating;
        document.getElementById('ratingTotal').textContent = data.ratings;
      } catch (err) {
        console.error('Failed to update stats:', err);
      }
    },

    async like() {
      await this.sendAction('like');
    },

    async rate(value) {
      await this.sendAction('rate', value);
    },

    async sendAction(action, value = null) {
      try {
        const body = value !== null ? { action, value } : { action };
        
        const res = await fetch('/api/counter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        await this.update();
      } catch (err) {
        console.error('Failed to send action:', err);
      }
    }
  };

  // ==================== UPLOAD MODAL ====================
  // ==================== UPLOAD MODAL ====================
// ==================== UPLOAD MODAL ====================
// ==================== UPLOAD MODAL ====================
const UploadModal = {
    elements: {},
    selectedFile: null,

    init() {
        this.cacheElements();
        this.bindEvents();
    },

    cacheElements() {
        this.elements = {
            uploadModal: document.getElementById("uploadModal"),
            uploadBtn: document.getElementById("uploadBtn"),
            cancelBtn: document.getElementById("cancelBtn"),
            confirmPass: document.getElementById("confirmPass"),
            closeUpload: document.getElementById("closeUpload"),
            backToPassword: document.getElementById("backToPassword"),
            passwordSection: document.getElementById("passwordSection"),
            uploadSection: document.getElementById("uploadSection"),
            changePasswordSection: document.getElementById("changePasswordSection"),
            adminPass: document.getElementById("adminPass"),
            dropArea: document.getElementById("dropArea"),
            browseBtn: document.getElementById("browseBtn"),
            imageInput: document.getElementById("imageInput"),
            previewImg: document.getElementById("previewImg"),
            previewContainer: document.getElementById("previewContainer"),
            fileInfo: document.getElementById("fileInfo"),
            fileName: document.getElementById("fileName"),
            fileSize: document.getElementById("fileSize"),
            removeFile: document.getElementById("removeFile"),
            uploadImage: document.getElementById("uploadImage"),
            uploadProgress: document.getElementById("uploadProgress"),
            progressBar: document.getElementById("progressBar"),
            progressPercent: document.getElementById("progressPercent"),
            uploadStatus: document.getElementById("uploadStatus"),
            // Password change elements
            changePassBtn: document.getElementById("changePassBtn"),
            currentPassword: document.getElementById("currentPassword"),
            newPassword: document.getElementById("newPassword"),
            confirmNewPassword: document.getElementById("confirmNewPassword"),
            saveNewPassword: document.getElementById("saveNewPassword"),
            cancelChangePass: document.getElementById("cancelChangePass"),
            backToUpload: document.getElementById("backToUpload"),
            // Password visibility toggles
            toggleCurrentPass: document.getElementById("toggleCurrentPass"),
            toggleNewPass: document.getElementById("toggleNewPass"),
            toggleConfirmPass: document.getElementById("toggleConfirmPass")
        };
    },

    bindEvents() {
        const { elements } = this;

        // Modal controls
        elements.uploadBtn.onclick = () => this.open();
        elements.cancelBtn.onclick = () => this.close();
        elements.closeUpload.onclick = () => this.close();
        elements.backToPassword.onclick = () => this.showPasswordSection();
        elements.backToUpload.onclick = () => this.showUploadSection();

        // Password handling
        elements.confirmPass.onclick = () => this.authenticate();
        elements.adminPass.addEventListener('keypress', e => {
            if (e.key === 'Enter') this.authenticate();
        });

        // Password change handling
        elements.changePassBtn.onclick = () => this.showChangePasswordSection();
        elements.cancelChangePass.onclick = () => this.showUploadSection();
        elements.saveNewPassword.onclick = () => this.changePassword();

        // Enter key for password change
        elements.newPassword.addEventListener('keypress', e => {
            if (e.key === 'Enter') this.changePassword();
        });
        elements.confirmNewPassword.addEventListener('keypress', e => {
            if (e.key === 'Enter') this.changePassword();
        });

        // Password visibility toggles
        if (elements.toggleCurrentPass) {
            elements.toggleCurrentPass.onclick = () => this.togglePasswordVisibility('currentPassword', 'toggleCurrentPass');
        }
        if (elements.toggleNewPass) {
            elements.toggleNewPass.onclick = () => this.togglePasswordVisibility('newPassword', 'toggleNewPass');
        }
        if (elements.toggleConfirmPass) {
            elements.toggleConfirmPass.onclick = () => this.togglePasswordVisibility('confirmNewPassword', 'toggleConfirmPass');
        }

        // File handling
        elements.browseBtn.onclick = () => elements.imageInput.click();
        elements.dropArea.onclick = () => elements.imageInput.click();

        // Drag and drop
        elements.dropArea.addEventListener("dragover", e => {
            e.preventDefault();
            elements.dropArea.classList.add("dragover");
        });
        
        elements.dropArea.addEventListener("dragleave", () => {
            elements.dropArea.classList.remove("dragover");
        });
        
        elements.dropArea.addEventListener("drop", e => {
            e.preventDefault();
            elements.dropArea.classList.remove("dragover");
            if (e.dataTransfer.files.length > 0) {
                this.handleFile(e.dataTransfer.files[0]);
            }
        });

        elements.imageInput.onchange = () => {
            if (elements.imageInput.files.length > 0) {
                this.handleFile(elements.imageInput.files[0]);
            }
        };

        elements.removeFile.onclick = () => this.resetFileSelection();
        elements.uploadImage.onclick = () => this.uploadFile();

        // Close modal on background click
        elements.uploadModal.addEventListener('click', e => {
            if (e.target === elements.uploadModal) this.close();
        });
    },

    open() {
        this.elements.uploadModal.style.display = "flex";
        this.elements.adminPass.focus();
        this.reset();
    },

    close() {
        this.elements.uploadModal.style.display = "none";
        this.reset();
    },

    reset() {
        this.showPasswordSection();
        this.elements.adminPass.value = "";
        this.resetFileSelection();
        this.hideStatus();
        // Clear password change fields
        if (this.elements.currentPassword) this.elements.currentPassword.value = "";
        if (this.elements.newPassword) this.elements.newPassword.value = "";
        if (this.elements.confirmNewPassword) this.elements.confirmNewPassword.value = "";
    },

    showPasswordSection() {
        this.elements.uploadSection.style.display = "none";
        if (this.elements.changePasswordSection) this.elements.changePasswordSection.style.display = "none";
        this.elements.passwordSection.style.display = "block";
        this.resetFileSelection();
        this.hideStatus();
    },

    showUploadSection() {
        this.elements.passwordSection.style.display = "none";
        if (this.elements.changePasswordSection) this.elements.changePasswordSection.style.display = "none";
        this.elements.uploadSection.style.display = "block";
        this.hideStatus();
    },

    showChangePasswordSection() {
        this.elements.uploadSection.style.display = "none";
        this.elements.passwordSection.style.display = "none";
        if (this.elements.changePasswordSection) {
            this.elements.changePasswordSection.style.display = "block";
            if (this.elements.currentPassword) this.elements.currentPassword.focus();
        }
        this.hideStatus();
    },

    async authenticate() {
        const password = this.elements.adminPass.value.trim();
        
        if (!password) {
            return this.showStatus("Please enter password", "error");
        }

        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const result = await res.json();
            
            if (result.authenticated) {
                this.elements.passwordSection.style.display = "none";
                this.elements.uploadSection.style.display = "block";
                this.hideStatus();
            } else {
                this.showStatus(result.message || "Incorrect password!", "error");
                this.elements.adminPass.focus();
                this.elements.adminPass.select();
            }
        } catch (err) {
            this.showStatus("Authentication failed. Please try again.", "error");
            console.error('Auth error:', err);
        }
    },

    async changePassword() {
        if (!this.elements.currentPassword || !this.elements.newPassword || !this.elements.confirmNewPassword) {
            return this.showStatus("Password change not available", "error");
        }

        const currentPassword = this.elements.currentPassword.value.trim();
        const newPassword = this.elements.newPassword.value.trim();
        const confirmNewPassword = this.elements.confirmNewPassword.value.trim();

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            return this.showStatus("Please fill all password fields", "error");
        }

        if (newPassword !== confirmNewPassword) {
            return this.showStatus("New passwords do not match", "error");
        }

        if (newPassword.length < 4) {
            return this.showStatus("New password must be at least 4 characters", "error");
        }

        try {
            this.showStatus("Changing password...", "info");
            if (this.elements.saveNewPassword) {
                this.elements.saveNewPassword.disabled = true;
                this.elements.saveNewPassword.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Saving...';
            }

            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const result = await res.json();
            
            if (result.success) {
                this.showStatus("✅ Password changed successfully! Returning to upload...", "success");
                
                // Clear all fields
                if (this.elements.currentPassword) this.elements.currentPassword.value = "";
                if (this.elements.newPassword) this.elements.newPassword.value = "";
                if (this.elements.confirmNewPassword) this.elements.confirmNewPassword.value = "";
                
                // Reset button
                if (this.elements.saveNewPassword) {
                    this.elements.saveNewPassword.disabled = false;
                    this.elements.saveNewPassword.innerHTML = '<i class="fas fa-save me-1"></i> Save Password';
                }
                
                // Auto-return to upload after 2 seconds
                setTimeout(() => {
                    this.showUploadSection();
                    this.hideStatus();
                }, 2000);
                
            } else {
                this.showStatus("❌ " + (result.message || "Failed to change password"), "error");
                if (this.elements.saveNewPassword) {
                    this.elements.saveNewPassword.disabled = false;
                    this.elements.saveNewPassword.innerHTML = '<i class="fas fa-save me-1"></i> Save Password';
                }
                if (this.elements.currentPassword) {
                    this.elements.currentPassword.focus();
                    this.elements.currentPassword.select();
                }
            }
        } catch (err) {
            this.showStatus("❌ Network error. Please check connection and try again.", "error");
            console.error('Change password error:', err);
            if (this.elements.saveNewPassword) {
                this.elements.saveNewPassword.disabled = false;
                this.elements.saveNewPassword.innerHTML = '<i class="fas fa-save me-1"></i> Save Password';
            }
        }
    },

    togglePasswordVisibility(passwordFieldId, toggleButtonId) {
        const passwordField = document.getElementById(passwordFieldId);
        const toggleButton = document.getElementById(toggleButtonId);
        
        if (!passwordField || !toggleButton) return;
        
        if (passwordField.type === 'password') {
            passwordField.type = 'text';
            toggleButton.innerHTML = '<i class="fas fa-eye-slash"></i>';
        } else {
            passwordField.type = 'password';
            toggleButton.innerHTML = '<i class="fas fa-eye"></i>';
        }
    },

    handleFile(file) {
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        
        if (!validTypes.includes(file.type)) {
            return this.showStatus("Please select a valid image file (JPEG, PNG, GIF, WebP)", "error");
        }
        
        if (file.size > 10 * 1024 * 1024) {
            return this.showStatus("File too large (max 10MB)", "error");
        }

        this.selectedFile = file;
        this.hideStatus();
        
        this.elements.fileName.textContent = file.name;
        this.elements.fileSize.textContent = this.formatFileSize(file.size);
        this.elements.fileInfo.style.display = "block";

        const reader = new FileReader();
        reader.onload = () => {
            this.elements.previewImg.src = reader.result;
            this.elements.previewContainer.style.display = "block";
        };
        reader.readAsDataURL(file);
        
        this.elements.uploadImage.disabled = false;
    },

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' bytes';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    },

    resetFileSelection() {
        this.selectedFile = null;
        this.elements.previewContainer.style.display = "none";
        this.elements.fileInfo.style.display = "none";
        this.elements.uploadImage.disabled = true;
        this.elements.uploadProgress.style.display = "none";
        this.elements.imageInput.value = "";
        this.elements.progressBar.style.width = "0%";
        this.elements.progressPercent.textContent = "0%";
    },

    hideStatus() {
        this.elements.uploadStatus.style.display = "none";
        this.elements.uploadStatus.className = "";
        this.elements.uploadStatus.innerHTML = "";
    },

    showStatus(message, type) {
        this.elements.uploadStatus.innerHTML = message;
        this.elements.uploadStatus.className = type === 'success' ? 'upload-success' : 'upload-error';
        if (type === 'info') {
            this.elements.uploadStatus.className = 'upload-info';
        }
        this.elements.uploadStatus.style.display = 'block';
    },

    uploadFile() {
        if (!this.selectedFile) {
            return this.showStatus("Please select an image first", "error");
        }

        this.elements.uploadProgress.style.display = "block";
        this.elements.uploadImage.disabled = true;
        this.hideStatus();

        const formData = new FormData();
        formData.append("image", this.selectedFile);

        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener("progress", e => {
            if (e.lengthComputable) {
                const pct = (e.loaded / e.total) * 100;
                this.elements.progressBar.style.width = pct + "%";
                this.elements.progressPercent.textContent = Math.round(pct) + "%";
            }
        });

        xhr.addEventListener("load", () => {
            this.elements.uploadProgress.style.display = "none";
            
            if (xhr.status === 200) {
                try {
                    const result = JSON.parse(xhr.responseText);
                    if (result.success) {
                        this.showStatus(`Image uploaded successfully!<br>${result.file.filename}`, "success");
                        Gallery.load(); // Refresh gallery after upload
                        setTimeout(() => this.close(), 2000);
                    } else {
                        this.showStatus("Upload failed: " + (result.message || "unknown error"), "error");
                    }
                } catch (e) {
                    this.showStatus("Error parsing server response", "error");
                }
            } else {
                this.showStatus(`Upload failed: ${xhr.status}`, "error");
            }
            this.elements.uploadImage.disabled = false;
        });

        xhr.addEventListener("error", () => {
            this.elements.uploadProgress.style.display = "none";
            this.showStatus("Upload error - please check your connection", "error");
            this.elements.uploadImage.disabled = false;
        });

        xhr.open("POST", "/upload");
        xhr.send(formData);
    }
};
  // ==================== INITIALIZATION ====================
  async function initialize() {
    // Initialize image viewer first
    ImageViewer.init();
    
    // Load all content
    await loadVideos();
    await Gallery.load();
    await Stats.update();

    // Setup event handlers
    Gallery.setupLikeHandler();
    UploadModal.init();

    // Bind global event handlers
    document.getElementById('likeBtn').onclick = () => Stats.like();
    window.sendRating = (value) => Stats.rate(value);
  }

  // Start the application
  await initialize();
});