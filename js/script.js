// Matrix-style vertical binary rain using Canvas (ultra-low memory)
class MatrixRain {
    constructor() {
        this.canvas = document.getElementById('matrixRain');
        this.ctx = this.canvas.getContext('2d');
        
        // Ultra-low memory: Use primitive arrays instead of objects
        this.columnData = new Float32Array(0); // [x, y, speed, delay, highlightIndex, highlightTimer, delayTimer, charCount]
        this.charData = new Uint8Array(0); // Store characters as byte codes (0=48, 1=49)
        
        // Configuration
        this.fontSize = 18;
        this.columnWidth = 35;
        this.density = 0.9;
        this.speedMultiplier = 0.6;
        this.isActive = true;
        this.animationId = null;
        
        // Memory optimization: Pre-allocate fixed-size arrays
        this.maxColumns = 100; // Limit maximum columns
        this.maxCharsPerColumn = 30; // Limit characters per column
        
        this.init();
        this.animate();
    }
    
    init() {
        // Set canvas size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Debounced resize handler
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.resize();
            }, 100);
        });
        
        // Create columns with minimal memory
        this.createColumns();
    }
    
    createColumns() {
        const baseColumnCount = Math.floor(this.canvas.width / 35);
        const columnCount = Math.min(
            Math.max(
                Math.floor(baseColumnCount * this.density), 
                Math.floor(this.canvas.width / 40)
            ),
            this.maxColumns // Hard limit
        );
        
        // Pre-allocate arrays with exact size needed
        const dataSize = columnCount * 8; // 8 values per column
        const charSize = columnCount * this.maxCharsPerColumn;
        
        this.columnData = new Float32Array(dataSize);
        this.charData = new Uint8Array(charSize);
        
        // Pre-calculate screen width
        const screenWidth = this.canvas.width - 35;
        
        // Fill arrays directly (no object creation)
        for (let i = 0; i < columnCount; i++) {
            const baseIndex = i * 8;
            const charBaseIndex = i * this.maxCharsPerColumn;
            
            // Column data: [x, y, speed, delay, highlightIndex, highlightTimer, delayTimer, charCount]
            this.columnData[baseIndex + 0] = (i / (columnCount - 1)) * screenWidth + (Math.random() * 8); // x
            this.columnData[baseIndex + 1] = -(Math.random() * this.canvas.height); // y
            this.columnData[baseIndex + 2] = 40 / (Math.random() * 20 + 15); // speed
            this.columnData[baseIndex + 3] = Math.random() * 5; // delay
            this.columnData[baseIndex + 4] = 0; // highlightIndex
            this.columnData[baseIndex + 5] = 0; // highlightTimer
            this.columnData[baseIndex + 6] = 0; // delayTimer
            this.columnData[baseIndex + 7] = Math.floor(Math.random() * 20) + 10; // charCount
            
            // Generate characters as byte codes (0=48, 1=49)
            const charCount = this.columnData[baseIndex + 7];
            for (let j = 0; j < charCount; j++) {
                this.charData[charBaseIndex + j] = Math.random() < 0.5 ? 48 : 49; // '0' or '1'
            }
        }
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.createColumns();
    }
    
    animate() {
        if (!this.isActive) return;
        
        // Clear canvas efficiently
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Set font once
        this.ctx.font = `bold ${this.fontSize}px 'Courier New', monospace`;
        
        // Process columns with minimal memory allocation
        const columnCount = this.columnData.length / 8;
        
        for (let i = 0; i < columnCount; i++) {
            const baseIndex = i * 8;
            const charBaseIndex = i * this.maxCharsPerColumn;
            
            // Extract column data
            const x = this.columnData[baseIndex + 0];
            let y = this.columnData[baseIndex + 1];
            const speed = this.columnData[baseIndex + 2];
            const delay = this.columnData[baseIndex + 3];
            let highlightIndex = this.columnData[baseIndex + 4];
            let highlightTimer = this.columnData[baseIndex + 5];
            let delayTimer = this.columnData[baseIndex + 6];
            const charCount = this.columnData[baseIndex + 7];
            
            // Handle delay
            if (delayTimer < delay * 60) {
                delayTimer++;
                this.columnData[baseIndex + 6] = delayTimer;
                continue;
            }
            
            // Update position
            y += speed * this.speedMultiplier;
            
            // Reset when off screen
            if (y > this.canvas.height) {
                y = -this.fontSize * charCount;
                // Regenerate characters
                for (let j = 0; j < charCount; j++) {
                    this.charData[charBaseIndex + j] = Math.random() < 0.5 ? 48 : 49;
                }
                highlightIndex = 0;
                highlightTimer = 0;
            }
            
            // Update highlight
            highlightTimer++;
            if (highlightTimer > (100 + Math.random() * 500) / 16.67) {
                highlightIndex = Math.floor(Math.random() * charCount);
                highlightTimer = 0;
            }
            
            // Update stored values
            this.columnData[baseIndex + 1] = y;
            this.columnData[baseIndex + 4] = highlightIndex;
            this.columnData[baseIndex + 5] = highlightTimer;
            
            // Draw characters
            for (let j = 0; j < charCount; j++) {
                const charY = y + (j * this.fontSize);
                
                if (charY < -this.fontSize || charY > this.canvas.height) continue;
                
                const char = String.fromCharCode(this.charData[charBaseIndex + j]);
                
                if (j === highlightIndex) {
                    this.ctx.fillStyle = '#0a91b1';
                    this.ctx.shadowColor = '#0a91b1';
                    this.ctx.shadowBlur = 10;
                    this.ctx.strokeStyle = '#ffffff';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeText(char, x, charY);
                } else {
                    this.ctx.fillStyle = 'rgba(10, 145, 177, 0.3)';
                    this.ctx.shadowBlur = 0;
                    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                    this.ctx.lineWidth = 0.5;
                    this.ctx.strokeText(char, x, charY);
                }
                
                this.ctx.fillText(char, x, charY);
            }
        }
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    destroy() {
        this.isActive = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        // Clear arrays to free memory
        this.columnData = new Float32Array(0);
        this.charData = new Uint8Array(0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    pause() {
        this.isActive = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
    
    resume() {
        if (!this.isActive) {
            this.isActive = true;
            this.animate();
        }
    }
}

// Initialize matrix rain
let matrixRain;
let loadingMatrixRain;

// Loading Screen Matrix Rain Class
class LoadingMatrixRain {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.columns = [];
        this.fontSize = 14;
        this.isActive = true;
        
        this.init();
        this.animate();
    }
    
    init() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        const columnCount = Math.floor(this.canvas.width / this.fontSize);
        
        for (let i = 0; i < columnCount; i++) {
            this.columns[i] = {
                x: i * this.fontSize,
                y: Math.random() * this.canvas.height,
                speed: Math.random() * 3 + 2,
                chars: []
            };
            
            // Generate random characters for each column
            for (let j = 0; j < 20; j++) {
                this.columns[i].chars.push(Math.random() < 0.5 ? '0' : '1');
            }
        }
    }
    
    animate() {
        if (!this.isActive) return;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#0a91b1';
        this.ctx.font = `${this.fontSize}px 'Courier New', monospace`;
        
        this.columns.forEach(column => {
            column.chars.forEach((char, index) => {
                const y = column.y + (index * this.fontSize);
                
                if (index === 0) {
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.shadowColor = '#0a91b1';
                    this.ctx.shadowBlur = 10;
                } else {
                    this.ctx.fillStyle = `rgba(10, 145, 177, ${1 - (index * 0.05)})`;
                    this.ctx.shadowBlur = 0;
                }
                
                this.ctx.fillText(char, column.x, y);
            });
            
            column.y += column.speed;
            
            if (column.y > this.canvas.height) {
                column.y = -this.fontSize * column.chars.length;
                // Regenerate characters
                for (let j = 0; j < column.chars.length; j++) {
                    column.chars[j] = Math.random() < 0.5 ? '0' : '1';
                }
            }
        });
        
        requestAnimationFrame(() => this.animate());
    }
    
    destroy() {
        this.isActive = false;
    }
}

// Loading Screen Controller
class LoadingScreen {
    constructor() {
        this.loadingScreen = document.getElementById('loadingScreen');
        this.progressBar = document.querySelector('.loading-progress');
        this.percentage = document.querySelector('.loading-percentage');
        this.techCard = document.querySelector('.tech-card');
        this.progress = 0;
        
        this.startLoading();
    }
    
    startLoading() {
        // Initialize loading matrix
        loadingMatrixRain = new LoadingMatrixRain('loadingMatrix');
        
        // Simulate loading progress
        const loadingInterval = setInterval(() => {
            this.progress += Math.random() * 15 + 5;
            
            if (this.progress >= 100) {
                this.progress = 100;
                clearInterval(loadingInterval);
                
                setTimeout(() => {
                    this.completeLoading();
                }, 1000);
            }
            
            this.updateProgress();
        }, 200);
    }
    
    updateProgress() {
        this.progressBar.style.width = `${this.progress}%`;
        this.percentage.textContent = `${Math.floor(this.progress)}%`;
    }
    
    completeLoading() {
        // Fade out loading screen
        this.loadingScreen.classList.add('fade-out');
        
        // Destroy loading matrix
        if (loadingMatrixRain) {
            loadingMatrixRain.destroy();
        }
        
        // Show main content
        setTimeout(() => {
            this.loadingScreen.style.display = 'none';
            this.techCard.classList.add('loaded');
            
            // Initialize main matrix rain
            matrixRain = new MatrixRain();
        }, 1000);
    }
}

// Initialize animations
window.addEventListener('DOMContentLoaded', async () => {
    // Start loading screen
    new LoadingScreen();
    
    // Add page visibility API support to save resources
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (matrixRain) matrixRain.pause();
        } else {
            if (matrixRain) matrixRain.resume();
        }
    });
    
    // Load projects from JSON file
    await loadProjects();

    // Function to load projects from JSON file
    async function loadProjects() {
        try {
            const response = await fetch('data/projects.json');
            const projects = await response.json();
            
            const projectsGrid = document.getElementById('projectsGrid');
            
            // Generate HTML for each project
            const projectsHTML = Object.entries(projects).map(([id, project]) => `
                <div class="project-card p-4 relative" data-project-id="${id}">
                    <div class="project-badge">${project.category}</div>
                    <img src="${project.images[0].src}" 
                         alt="${project.images[0].alt}" 
                         class="w-full h-48 object-cover rounded-lg mb-4">
                    <h3 class="text-xl font-semibold text-white mb-2">${project.title}</h3>
                    <p class="text-gray-400 text-sm mb-3">${project.description}</p>
                    <div class="flex flex-wrap">
                        ${project.technologies.slice(0, 3).map(tech => `
                            <span class="tech-tag">${tech}</span>
                        `).join('')}
                    </div>
                </div>
            `).join('');
            
            projectsGrid.innerHTML = projectsHTML;
            
            // Re-attach event listeners to project cards
            attachProjectCardListeners();
            
        } catch (error) {
            console.error('Error loading projects:', error);
            const projectsGrid = document.getElementById('projectsGrid');
            projectsGrid.innerHTML = '<p class="text-red-400 col-span-full text-center">Error loading projects. Please try again.</p>';
        }
    }
    
    // Function to attach event listeners to project cards
    function attachProjectCardListeners() {
        const projectCards = document.querySelectorAll('.project-card');
        projectCards.forEach(card => {
            card.addEventListener('click', () => {
                const projectId = card.getAttribute('data-project-id');
                loadProjectDetail(projectId);
                projectsModal.classList.remove('active');
                projectDetailModal.classList.add('active');
            });
        });
    }

    // Projects modal functionality
    const viewProjectsBtn = document.getElementById('viewProjectsBtn');
    const projectsModal = document.getElementById('projectsModal');
    const closeProjectsModal = document.getElementById('closeProjectsModal');

    viewProjectsBtn.addEventListener('click', () => {
        projectsModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    closeProjectsModal.addEventListener('click', () => {
        projectsModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    // Project detail modal functionality
    const projectDetailModal = document.getElementById('projectDetailModal');
    const projectDetailContent = document.getElementById('projectDetailContent');
    const closeProjectDetail = document.getElementById('closeProjectDetail');

    closeProjectDetail.addEventListener('click', () => {
        projectDetailModal.classList.remove('active');
        projectsModal.classList.add('active');
        // Keep body overflow hidden since we're returning to projects modal
    });

    // Lightbox functionality
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');

    let currentGallery = [];
    let currentIndex = 0;

    lightboxClose.addEventListener('click', () => {
        lightbox.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    lightboxPrev.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length;
        updateLightboxImage();
    });

    lightboxNext.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % currentGallery.length;
        updateLightboxImage();
    });

    function updateLightboxImage() {
        const item = currentGallery[currentIndex];
        
        // Add loading state
        lightboxImg.style.opacity = '0.5';
        lightboxImg.style.filter = 'blur(2px)';
        
        lightboxImg.onload = () => {
            lightboxImg.style.opacity = '1';
            lightboxImg.style.filter = 'blur(0)';
        };
        
        lightboxImg.onerror = () => {
            lightboxImg.style.opacity = '1';
            lightboxImg.style.filter = 'blur(0)';
            console.error('Failed to load image:', item.src);
        };
        
        lightboxImg.src = item.src;
        lightboxImg.alt = item.alt;
        lightboxCaption.textContent = item.caption || '';
    }

    // Function to open lightbox
    function openLightbox(galleryItems, index) {
        currentGallery = galleryItems;
        currentIndex = index;
        updateLightboxImage();
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Function to load project details
    async function loadProjectDetail(projectId) {
        try {
            // Fetch projects data from JSON file
            const response = await fetch('data/projects.json');
            const projects = await response.json();
            
            const project = projects[projectId];
            
            if (!project) {
                projectDetailContent.innerHTML = '<p class="text-red-400">Project not found.</p>';
                return;
            }

            // Create HTML for project detail
        const html = `
                    <div class="mb-8">
                        <span class="text-cyan-400 font-medium">${project.category}</span>
                        <h2 class="text-3xl font-bold text-white mt-2 mb-4">${project.title}</h2>
                        <p class="text-gray-300 text-lg mb-6">${project.description}</p>
                        
                        <div class="flex flex-col md:flex-row gap-8">
                            <div class="md:w-1/2">
                                <!-- Main project image -->
                                <img src="${project.images[0].src}" alt="${project.images[0].alt}" 
                                     class="w-full rounded-lg shadow-lg cursor-pointer mb-4 hover:opacity-90 transition-opacity"
                                     onclick="openImageModal('${project.images[0].src}', '${project.images[0].alt}', '${project.images[0].caption || ''}')">
                                
                                <!-- Project gallery -->
                                <h4 class="text-lg font-semibold text-white mb-3">Project Screenshots</h4>
                                <div class="project-gallery grid grid-cols-2 gap-3">
                                    ${project.images.map((image, index) => `
                                        <div class="gallery-item cursor-pointer hover:opacity-90 transition-opacity" onclick="openImageModal('${image.src}', '${image.alt}', '${image.caption || ''}')">
                                            <img src="${image.src}" alt="${image.alt}" class="w-full h-24 object-cover rounded-lg">
                                        </div>
                                    `).join('')}
                                </div>
                                
                                <div class="mt-6 flex space-x-4">
                                    ${project.liveUrl && project.liveUrl !== '#' ? `
                                        <a href="${project.liveUrl}" class="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md transition duration-300">
                                            <i class="fas fa-external-link-alt mr-2"></i> Live Demo
                                        </a>
                                    ` : ''}
                                    ${project.githubUrl && project.githubUrl !== '#' ? `
                                        <a href="${project.githubUrl}" class="px-4 py-2 border border-cyan-400 hover:bg-cyan-900/30 text-cyan-400 rounded-md transition duration-300">
                                            <i class="fab fa-github mr-2"></i> View Code
                                        </a>
                                    ` : ''}
                                </div>
                            </div>
                            
                            <div class="md:w-1/2">
                                <h3 class="text-xl font-semibold text-white mb-4">Project Details</h3>
                                <p class="text-gray-400 mb-6">${project.longDescription}</p>
                                
                                <h4 class="text-lg font-semibold text-white mb-3">Technologies Used</h4>
                                <div class="flex flex-wrap mb-6">
                                    ${project.technologies.map(tech => `
                                        <span class="tech-tag">${tech}</span>
                                    `).join('')}
                                </div>
                                
                                <h4 class="text-lg font-semibold text-white mb-3">Key Features</h4>
                                <ul class="list-disc list-inside text-gray-400 space-y-2">
                                    ${project.features.map(feature => `
                                        <li>${feature}</li>
                                    `).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>
                `;

        projectDetailContent.innerHTML = html;
        } catch (error) {
            console.error('Error loading project details:', error);
            projectDetailContent.innerHTML = '<p class="text-red-400">Error loading project details. Please try again.</p>';
        }
    }

    // Make openLightbox function available globally
    window.openLightbox = openLightbox;

    // Function to open image modal
    function openImageModal(imageSrc, imageAlt, imageCaption) {
        const imageModal = document.getElementById('imageModal');
        const imageModalImg = document.getElementById('imageModalImg');
        const imageModalCaption = document.getElementById('imageModalCaption');
        
        imageModalImg.src = imageSrc;
        imageModalImg.alt = imageAlt;
        imageModalCaption.textContent = imageCaption;
        
        imageModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Make openImageModal function available globally
    window.openImageModal = openImageModal;

    // Add keyboard support for lightbox
    document.addEventListener('keydown', (e) => {
        if (lightbox.classList.contains('active')) {
            switch(e.key) {
                case 'Escape':
                    lightbox.classList.remove('active');
                    document.body.style.overflow = 'auto';
                    break;
                case 'ArrowLeft':
                    currentIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length;
                    updateLightboxImage();
                    break;
                case 'ArrowRight':
                    currentIndex = (currentIndex + 1) % currentGallery.length;
                    updateLightboxImage();
                    break;
            }
        }
        
        // Add keyboard support for image modal
        if (document.getElementById('imageModal').classList.contains('active')) {
            if (e.key === 'Escape') {
                document.getElementById('imageModal').classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        }
    });

    // Close lightbox when clicking outside the image
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    // Close image modal when clicking outside the image
    document.addEventListener('click', (e) => {
        const imageModal = document.getElementById('imageModal');
        if (e.target === imageModal) {
            imageModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    // Close image modal with close button
    const imageModalClose = document.getElementById('imageModalClose');
    if (imageModalClose) {
        imageModalClose.addEventListener('click', () => {
            const imageModal = document.getElementById('imageModal');
            imageModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }
});