/**
 * Kakera - Main Application
 * Color-preserving ASCII art generator
 */

import { generateAscii } from './modules/ascii-generator.js';
import { exportAndDownload, copyAsText } from './modules/exporter.js';

// Application state
const state = {
    image: null,
    asciiData: null,
    objectUrl: null,
    zoomLevel: 1
};

// DOM Elements
const elements = {
    // Upload
    uploadArea: document.getElementById('uploadArea'),
    uploadDropzone: document.getElementById('uploadDropzone'),
    fileInput: document.getElementById('fileInput'),
    imagePreview: document.getElementById('imagePreview'),
    previewImage: document.getElementById('previewImage'),
    imageDetails: document.getElementById('imageDetails'),
    removeImage: document.getElementById('removeImage'),
    
    // Settings
    asciiWidth: document.getElementById('asciiWidth'),
    asciiWidthValue: document.getElementById('asciiWidthValue'),
    charDensity: document.getElementById('charDensity'),
    charDensityValue: document.getElementById('charDensityValue'),
    fontSize: document.getElementById('fontSize'),
    fontSizeValue: document.getElementById('fontSizeValue'),
    colorMode: document.getElementById('colorMode'),
    backgroundColor: document.getElementById('backgroundColor'),
    bgColorValue: document.getElementById('bgColorValue'),
    textColor: document.getElementById('textColor'),
    textColorValue: document.getElementById('textColorValue'),
    textColorSetting: document.getElementById('textColorSetting'),
    charRamp: document.getElementById('charRamp'),
    customRamp: document.getElementById('customRamp'),
    customRampSetting: document.getElementById('customRampSetting'),
    brightness: document.getElementById('brightness'),
    brightnessValue: document.getElementById('brightnessValue'),
    contrast: document.getElementById('contrast'),
    contrastValue: document.getElementById('contrastValue'),
    gamma: document.getElementById('gamma'),
    gammaValue: document.getElementById('gammaValue'),
    invertColors: document.getElementById('invertColors'),
    threshold: document.getElementById('threshold'),
    thresholdValue: document.getElementById('thresholdValue'),
    dithering: document.getElementById('dithering'),
    generateBtn: document.getElementById('generateBtn'),
    
    // Preview
    asciiPreview: document.getElementById('asciiPreview'),
    asciiPreviewWrapper: null, // Will be set after render
    previewContainer: document.getElementById('previewContainer'),
    previewPlaceholder: document.getElementById('previewPlaceholder'),
    
    // Actions
    copyBtn: document.getElementById('copyBtn'),
    exportBtn: document.getElementById('exportBtn'),
    exportMenu: document.getElementById('exportMenu'),
    exportOptions: document.querySelectorAll('.export-option'),
    zoomControls: document.getElementById('zoomControls'),
    zoomIn: document.getElementById('zoomIn'),
    zoomOut: document.getElementById('zoomOut'),
    zoomReset: document.getElementById('zoomReset'),
    zoomLevel: document.getElementById('zoomLevel')
};

/**
 * Initialize the application
 */
function init() {
    setupEventListeners();
    updateGenerateButton();
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Upload area - drag and drop
    elements.uploadArea.addEventListener('dragover', handleDragOver);
    elements.uploadArea.addEventListener('dragleave', handleDragLeave);
    elements.uploadArea.addEventListener('drop', handleDrop);
    elements.uploadArea.addEventListener('click', () => elements.fileInput.click());
    elements.uploadArea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            elements.fileInput.click();
        }
    });
    
    // File input
    elements.fileInput.addEventListener('change', handleFileSelect);
    
    // Remove image
    elements.removeImage.addEventListener('click', (e) => {
        e.stopPropagation();
        clearImage();
    });
    
    // Settings - width
    elements.asciiWidth.addEventListener('input', () => {
        elements.asciiWidthValue.textContent = elements.asciiWidth.value;
        if (state.asciiData) generate();
    });
    
    // Settings - density
    elements.charDensity.addEventListener('input', () => {
        elements.charDensityValue.textContent = parseFloat(elements.charDensity.value).toFixed(1);
        if (state.asciiData) generate();
    });

    // Settings - font size
    elements.fontSize.addEventListener('input', () => {
        elements.fontSizeValue.textContent = `${elements.fontSize.value}px`;
        if (state.asciiData) generate();
    });
    
    // Settings - color mode
    elements.colorMode.addEventListener('change', () => {
        const isCustom = elements.colorMode.value === 'custom';
        elements.textColorSetting.hidden = !isCustom;
        if (state.asciiData) generate();
    });
    
    // Settings - background color
    elements.backgroundColor.addEventListener('input', () => {
        elements.bgColorValue.textContent = elements.backgroundColor.value;
        if (state.asciiData) generate();
    });

    // Settings - text color
    elements.textColor.addEventListener('input', () => {
        elements.textColorValue.textContent = elements.textColor.value;
        if (state.asciiData) generate();
    });
    
    // Settings - character ramp
    elements.charRamp.addEventListener('change', () => {
        const isCustom = elements.charRamp.value === 'custom';
        elements.customRampSetting.hidden = !isCustom;
        if (state.asciiData) generate();
    });

    // Settings - custom ramp
    elements.customRamp.addEventListener('input', () => {
        if (state.asciiData) generate();
    });
    
    // Settings - brightness
    elements.brightness.addEventListener('input', () => {
        elements.brightnessValue.textContent = elements.brightness.value;
        if (state.asciiData) generate();
    });

    // Settings - contrast
    elements.contrast.addEventListener('input', () => {
        elements.contrastValue.textContent = `${elements.contrast.value}%`;
        if (state.asciiData) generate();
    });

    // Settings - gamma
    elements.gamma.addEventListener('input', () => {
        elements.gammaValue.textContent = (parseFloat(elements.gamma.value) / 100).toFixed(1);
        if (state.asciiData) generate();
    });

    // Settings - invert
    elements.invertColors.addEventListener('change', () => {
        if (state.asciiData) generate();
    });

    // Settings - threshold
    elements.threshold.addEventListener('input', () => {
        elements.thresholdValue.textContent = elements.threshold.value;
        if (state.asciiData) generate();
    });

    // Settings - dithering
    elements.dithering.addEventListener('change', () => {
        if (state.asciiData) generate();
    });
    
    // Generate button
    elements.generateBtn.addEventListener('click', generate);
    
    // Copy button
    elements.copyBtn.addEventListener('click', handleCopy);
    
    // Export dropdown
    elements.exportBtn.addEventListener('click', toggleExportMenu);
    elements.exportOptions.forEach(option => {
        option.addEventListener('click', () => handleExport(option.dataset.format));
    });
    
    // Close export menu on outside click
    document.addEventListener('click', (e) => {
        if (!elements.exportBtn.contains(e.target) && !elements.exportMenu.contains(e.target)) {
            closeExportMenu();
        }
    });
    
    // Keyboard navigation for export menu
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeExportMenu();
    });
    
    // Zoom controls
    elements.zoomIn.addEventListener('click', () => adjustZoom(1.25));
    elements.zoomOut.addEventListener('click', () => adjustZoom(0.8));
    elements.zoomReset.addEventListener('click', resetZoom);
}

/**
 * Handle drag over event
 */
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.uploadArea.classList.add('drag-over');
}

/**
 * Handle drag leave event
 */
function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.uploadArea.classList.remove('drag-over');
}

/**
 * Handle drop event
 */
function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.uploadArea.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

/**
 * Handle file input change
 */
function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

/**
 * Process a file
 */
function handleFile(file) {
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        alert('Unsupported file format. Please use PNG, JPG, or WEBP.');
        return;
    }
    
    // Check file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
        alert('File too large. Maximum size is 20MB.');
        return;
    }
    
    // Revoke previous object URL
    if (state.objectUrl) {
        URL.revokeObjectURL(state.objectUrl);
    }
    
    // Create object URL and load image
    state.objectUrl = URL.createObjectURL(file);
    loadImage(state.objectUrl);
}

/**
 * Load image from URL
 */
function loadImage(url) {
    const img = new Image();
    img.onload = () => {
        state.image = img;
        showImagePreview(url);
        updateGenerateButton();
    };
    img.onerror = () => {
        alert('Failed to load image. The file may be corrupted.');
        URL.revokeObjectURL(url);
    };
    img.src = url;
}

/**
 * Show image preview
 */
function showImagePreview(url) {
    elements.previewImage.src = url;
    elements.imagePreview.hidden = false;
    elements.uploadDropzone.hidden = true;
    
    // Populate image details
    const file = elements.fileInput.files[0];
    if (file) {
        const sizeKB = (file.size / 1024).toFixed(1);
        const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
        elements.imageDetails.innerHTML = `
            <div class="detail-row"><span class="detail-label">Name:</span><span class="detail-value">${file.name}</span></div>
            <div class="detail-row"><span class="detail-label">Size:</span><span class="detail-value">${sizeStr}</span></div>
            <div class="detail-row"><span class="detail-label">Type:</span><span class="detail-value">${file.type}</span></div>
            <div class="detail-row"><span class="detail-label">Dimensions:</span><span class="detail-value">${elements.previewImage.naturalWidth} × ${elements.previewImage.naturalHeight}</span></div>
        `;
    }
}

/**
 * Clear current image
 */
function clearImage() {
    if (state.objectUrl) {
        URL.revokeObjectURL(state.objectUrl);
        state.objectUrl = null;
    }
    state.image = null;
    state.asciiData = null;
    state.zoomLevel = 1;
    
    elements.fileInput.value = '';
    elements.previewImage.src = '';
    elements.imagePreview.hidden = true;
    elements.uploadDropzone.hidden = false;
    elements.imageDetails.innerHTML = '';
    elements.previewContainer.classList.remove('has-content');
    elements.previewContainer.style.backgroundColor = '';
    elements.asciiPreview.textContent = '';
    elements.asciiPreview.style.transform = '';
    elements.previewPlaceholder.hidden = false;
    elements.zoomControls.hidden = true;
    
    updateGenerateButton();
    updateActionButtons();
}

/**
 * Update generate button state
 */
function updateGenerateButton() {
    elements.generateBtn.disabled = !state.image;
}

/**
 * Update action buttons state
 */
function updateActionButtons() {
    const hasContent = !!state.asciiData;
    elements.copyBtn.disabled = !hasContent;
    elements.exportBtn.disabled = !hasContent;
}

/**
 * Generate ASCII art from current image and settings
 */
function generate() {
    if (!state.image) return;
    
    // Show loading state
    elements.generateBtn.textContent = 'Generating...';
    elements.generateBtn.disabled = true;
    
    // Use requestAnimationFrame to allow UI to update
    requestAnimationFrame(() => {
        try {
            const options = {
                width: parseInt(elements.asciiWidth.value, 10),
                charDensity: parseFloat(elements.charDensity.value),
                ramp: elements.charRamp.value,
                customRamp: elements.customRamp.value || '',
                colorMode: elements.colorMode.value,
                backgroundColor: elements.backgroundColor.value,
                textColor: elements.textColor.value,
                fontSize: parseInt(elements.fontSize.value, 10),
                brightness: parseInt(elements.brightness.value, 10),
                contrast: parseInt(elements.contrast.value, 10),
                gamma: parseFloat(elements.gamma.value) / 100,
                invert: elements.invertColors.checked,
                threshold: parseInt(elements.threshold.value, 10),
                dithering: elements.dithering.value
            };
            
            state.asciiData = generateAscii(state.image, options);
            renderPreview(state.asciiData);
            
            elements.generateBtn.textContent = 'Generate ASCII Art';
            updateActionButtons();
        } catch (error) {
            console.error('Generation failed:', error);
            alert('Failed to generate ASCII art. Please try again.');
            elements.generateBtn.textContent = 'Generate ASCII Art';
            elements.generateBtn.disabled = false;
        }
    });
}

/**
 * Render ASCII preview
 */
function renderPreview(asciiData) {
    const { rows, colors, colorMode, backgroundColor, fontSize, charHeight, charWidth } = asciiData;
    
    // Reset zoom
    state.zoomLevel = 1;
    updateZoomDisplay();
    
    // Clear previous content
    elements.asciiPreview.innerHTML = '';
    elements.previewPlaceholder.hidden = true;
    elements.previewContainer.classList.add('has-content');
    
    // Apply background color to preview container
    elements.previewContainer.style.backgroundColor = backgroundColor;
    
    // Create wrapper if not exists
    if (!elements.asciiPreviewWrapper) {
        elements.asciiPreviewWrapper = document.createElement('div');
        elements.asciiPreviewWrapper.className = 'ascii-preview-wrapper';
        elements.previewContainer.insertBefore(elements.asciiPreviewWrapper, elements.asciiPreview);
        elements.asciiPreviewWrapper.appendChild(elements.asciiPreview);
    }
    
    // Set font size and line height on the preview element to match export metrics
    // Use the fontSize from settings (stored in asciiData) and charHeight for line-height
    const previewFontSize = fontSize || 8;
    const previewLineHeight = charHeight || (previewFontSize * 1.05);
    
    elements.asciiPreview.style.fontSize = `${previewFontSize}px`;
    elements.asciiPreview.style.lineHeight = `${previewLineHeight}px`;
    
    // Create document fragment for performance
    const fragment = document.createDocumentFragment();
    
    rows.forEach((row, rowIndex) => {
        const line = document.createElement('div');
        line.style.display = 'block';
        line.style.whiteSpace = 'pre';
        line.style.lineHeight = `${previewLineHeight}px`;
        line.style.height = `${previewLineHeight}px`;
        
        const rowColors = colors[rowIndex];
        
        row.split('').forEach((char, charIndex) => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char; // Use NBSP for spaces to maintain width
            span.style.display = 'inline-block';
            span.style.width = `${charWidth || previewFontSize}px`;
            span.style.textAlign = 'center';
            
            if (colorMode === 'color') {
                span.style.color = rowColors[charIndex];
            } else {
                // In monochrome mode, we still use the color (which is grayscale)
                span.style.color = rowColors[charIndex];
            }
            
            line.appendChild(span);
        });
        
        fragment.appendChild(line);
    });
    
    elements.asciiPreview.appendChild(fragment);
    
    // Show zoom controls
    elements.zoomControls.hidden = false;
    
    // Apply initial zoom (fit to width)
    fitToWidth();
}

/**
 * Adjust zoom level
 */
function adjustZoom(factor) {
    state.zoomLevel = Math.max(0.25, Math.min(4, state.zoomLevel * factor));
    applyZoom();
}

/**
 * Reset zoom to 100%
 */
function resetZoom() {
    state.zoomLevel = 1;
    applyZoom();
}

/**
 * Fit preview to container width
 */
function fitToWidth() {
    if (!elements.asciiPreviewWrapper || !elements.asciiPreview) return;
    
    const wrapperRect = elements.asciiPreviewWrapper.getBoundingClientRect();
    const previewRect = elements.asciiPreview.getBoundingClientRect();
    
    if (previewRect.width > 0 && wrapperRect.width > 0) {
        const padding = 24; // Account for padding
        const fitScale = (wrapperRect.width - padding) / previewRect.width;
        state.zoomLevel = Math.min(1, fitScale);
        applyZoom();
    }
}

/**
 * Apply zoom transform
 */
function applyZoom() {
    if (!elements.asciiPreview) return;
    
    elements.asciiPreview.style.transform = `scale(${state.zoomLevel})`;
    updateZoomDisplay();
}

/**
 * Update zoom level display
 */
function updateZoomDisplay() {
    elements.zoomLevel.textContent = `${Math.round(state.zoomLevel * 100)}%`;
}

/**
 * Handle copy to clipboard
 */
async function handleCopy() {
    if (!state.asciiData) return;
    
    const originalText = elements.copyBtn.innerHTML;
    elements.copyBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <polyline points="20 6 9 17 4 12"/>
        </svg>
        Copied!
    `;
    elements.copyBtn.disabled = true;
    
    const success = await copyAsText(state.asciiData);
    
    if (!success) {
        elements.copyBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            Failed
        `;
    }
    
    setTimeout(() => {
        elements.copyBtn.innerHTML = originalText;
        elements.copyBtn.disabled = false;
    }, 2000);
}

/**
 * Toggle export menu
 */
function toggleExportMenu() {
    const isOpen = !elements.exportMenu.hidden;
    if (isOpen) {
        closeExportMenu();
    } else {
        openExportMenu();
    }
}

/**
 * Open export menu
 */
function openExportMenu() {
    elements.exportMenu.hidden = false;
    elements.exportBtn.setAttribute('aria-expanded', 'true');
}

/**
 * Close export menu
 */
function closeExportMenu() {
    elements.exportMenu.hidden = true;
    elements.exportBtn.setAttribute('aria-expanded', 'false');
}

/**
 * Handle export
 */
async function handleExport(format) {
    if (!state.asciiData) return;
    
    closeExportMenu();
    
    const originalText = elements.exportBtn.innerHTML;
    elements.exportBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" class="spinning">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="1" stroke-linecap="round"/>
        </svg>
        Exporting...
    `;
    elements.exportBtn.disabled = true;
    
    // Add spinning animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spinning { animation: spin 1s linear infinite; }
    `;
    document.head.appendChild(style);
    
    try {
        const result = await exportAndDownload(state.asciiData, format, { 
            scale: 2,
            fontSize: parseInt(elements.fontSize.value, 10)
        });
        
        if (result.success) {
            elements.exportBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                Exported!
            `;
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Export failed:', error);
        elements.exportBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            Failed
        `;
    }
    
    setTimeout(() => {
        elements.exportBtn.innerHTML = originalText;
        elements.exportBtn.disabled = false;
        document.head.removeChild(style);
    }, 2000);
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (state.objectUrl) {
        URL.revokeObjectURL(state.objectUrl);
    }
});