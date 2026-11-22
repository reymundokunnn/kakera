/**
 * Character Ramps for ASCII Art Generation
 * Each ramp maps luminance (0-255) to a character, from darkest to lightest
 */

export const CHAR_RAMPS = {
    standard: '@%#*+=-:. ',
    blocks: '█▓▒░ ',
    minimal: '#+-:. ',
    dense: "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. "
};

/**
 * Bayer matrix for ordered dithering (4x4)
 */
const BAYER_MATRIX = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5]
];

/**
 * Character metrics - must match CSS values
 * CSS: font-size: 0.525rem (8.4px at 16px base), line-height: 1.05
 */
export const CHAR_METRICS = {
    fontSize: 8.4,
    lineHeight: 8.82, // 8.4 * 1.05
    get width() { return this.fontSize; },
    get height() { return this.lineHeight; },
    get aspectRatio() { return this.width / this.height; } // ~0.952
};

/**
 * Get character ramp by name
 * @param {string} name - Ramp name
 * @returns {string} Character ramp string
 */
export function getCharRamp(name) {
    return CHAR_RAMPS[name] || CHAR_RAMPS.standard;
}

/**
 * Map luminance value (0-255) to character from ramp
 * @param {number} luminance - Luminance value (0 = black, 255 = white)
 * @param {string} ramp - Character ramp string
 * @returns {string} ASCII character
 */
export function luminanceToChar(luminance, ramp) {
    const index = Math.floor((luminance / 255) * (ramp.length - 1));
    return ramp[Math.max(0, Math.min(ramp.length - 1, index))];
}

/**
 * Apply image processing adjustments
 * @param {ImageData} imageData - Image data to process
 * @param {Object} options - Processing options
 */
function applyImageProcessing(imageData, options) {
    const { brightness, contrast, gamma, invert, threshold, dithering } = options;
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Pre-calculate contrast factor
    const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    
    // First pass: apply brightness, contrast, gamma, invert
    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];
        
        // Brightness (-100 to 100)
        if (brightness !== 0) {
            r = Math.max(0, Math.min(255, r + brightness));
            g = Math.max(0, Math.min(255, g + brightness));
            b = Math.max(0, Math.min(255, b + brightness));
        }
        
        // Contrast (0 to 200, where 100 is no change)
        if (contrast !== 100) {
            r = Math.max(0, Math.min(255, contrastFactor * (r - 128) + 128));
            g = Math.max(0, Math.min(255, contrastFactor * (g - 128) + 128));
            b = Math.max(0, Math.min(255, contrastFactor * (b - 128) + 128));
        }
        
        // Gamma correction
        if (gamma !== 1.0) {
            const invGamma = 1 / gamma;
            r = Math.max(0, Math.min(255, Math.pow(r / 255, invGamma) * 255));
            g = Math.max(0, Math.min(255, Math.pow(g / 255, invGamma) * 255));
            b = Math.max(0, Math.min(255, Math.pow(b / 255, invGamma) * 255));
        }
        
        // Invert
        if (invert) {
            r = 255 - r;
            g = 255 - g;
            b = 255 - b;
        }
        
        data[i] = Math.round(r);
        data[i + 1] = Math.round(g);
        data[i + 2] = Math.round(b);
    }
    
    // Threshold/Posterize
    if (threshold > 0 && threshold < 255) {
        for (let i = 0; i < data.length; i += 4) {
            const luminance = Math.round(0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]);
            const value = luminance > threshold ? 255 : 0;
            data[i] = value;
            data[i + 1] = value;
            data[i + 2] = value;
        }
    }
    
    // Dithering
    if (dithering !== 'none') {
        applyDithering(imageData, dithering);
    }
}

/**
 * Apply dithering to image data
 * @param {ImageData} imageData - Image data to dither
 * @param {string} method - Dithering method
 */
function applyDithering(imageData, method) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    if (method === 'ordered') {
        // Ordered dithering with Bayer matrix
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const bayerValue = BAYER_MATRIX[y % 4][x % 4] / 16;
                const threshold = bayerValue * 255;
                
                const luminance = Math.round(0.2126 * data[idx] + 0.7152 * data[idx + 1] + 0.0722 * data[idx + 2]);
                const value = luminance > threshold ? 255 : 0;
                
                data[idx] = value;
                data[idx + 1] = value;
                data[idx + 2] = value;
            }
        }
    } else if (method === 'floyd-steinberg' || method === 'atkinson') {
        // Error diffusion dithering - convert to grayscale first
        const grayData = new Float32Array(width * height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                grayData[y * width + x] = 0.2126 * data[idx] + 0.7152 * data[idx + 1] + 0.0722 * data[idx + 2];
            }
        }
        
        if (method === 'floyd-steinberg') {
            // Floyd-Steinberg dithering
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = y * width + x;
                    const oldPixel = grayData[idx];
                    const newPixel = oldPixel > 128 ? 255 : 0;
                    const error = oldPixel - newPixel;
                    
                    grayData[idx] = newPixel;
                    
                    // Distribute error
                    if (x + 1 < width) grayData[idx + 1] += error * 7 / 16;
                    if (x - 1 >= 0 && y + 1 < height) grayData[idx + width - 1] += error * 3 / 16;
                    if (y + 1 < height) grayData[idx + width] += error * 5 / 16;
                    if (x + 1 < width && y + 1 < height) grayData[idx + width + 1] += error * 1 / 16;
                }
            }
        } else if (method === 'atkinson') {
            // Atkinson dithering
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = y * width + x;
                    const oldPixel = grayData[idx];
                    const newPixel = oldPixel > 128 ? 255 : 0;
                    const error = (oldPixel - newPixel) / 8;
                    
                    grayData[idx] = newPixel;
                    
                    // Distribute error (Atkinson uses 1/8 to 6 neighbors)
                    if (x + 1 < width) grayData[idx + 1] += error;
                    if (x + 2 < width) grayData[idx + 2] += error;
                    if (x - 1 >= 0 && y + 1 < height) grayData[idx + width - 1] += error;
                    if (y + 1 < height) grayData[idx + width] += error;
                    if (x + 1 < width && y + 1 < height) grayData[idx + width + 1] += error;
                    if (y + 2 < height) grayData[idx + 2 * width] += error;
                }
            }
        }
        
        // Write back dithered values
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const value = Math.max(0, Math.min(255, Math.round(grayData[y * width + x])));
                data[idx] = value;
                data[idx + 1] = value;
                data[idx + 2] = value;
            }
        }
    }
}

/**
 * Calculate average luminance of an image data region
 * @param {ImageData} imageData - Image data from canvas
 * @param {number} x - Starting x coordinate
 * @param {number} y - Starting y coordinate
 * @param {number} width - Region width
 * @param {number} height - Region height
 * @param {number} imageWidth - Full image width
 * @returns {{luminance: number, color: {r: number, g: number, b: number}}} Average luminance and color
 */
export function getRegionStats(imageData, x, y, width, height, imageWidth) {
    let r = 0, g = 0, b = 0;
    let count = 0;
    
    const data = imageData.data;
    const maxX = Math.min(x + width, imageWidth);
    const maxY = Math.min(y + height, imageData.height);
    
    for (let iy = y; iy < maxY; iy++) {
        for (let ix = x; ix < maxX; ix++) {
            const idx = (iy * imageWidth + ix) * 4;
            r += data[idx];
            g += data[idx + 1];
            b += data[idx + 2];
            count++;
        }
    }
    
    if (count === 0) {
        return { luminance: 255, color: { r: 255, g: 255, b: 255 } };
    }
    
    r = Math.round(r / count);
    g = Math.round(g / count);
    b = Math.round(b / count);
    
    // Calculate perceived luminance (ITU-R BT.709)
    const luminance = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    
    return { luminance, color: { r, g, b } };
}

/**
 * Convert RGB to hex string
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {string} Hex color string
 */
export function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate ASCII art from image data
 * @param {HTMLImageElement|HTMLCanvasElement} source - Source image
 * @param {Object} options - Generation options
 * @param {number} options.width - Output width in characters
 * @param {number} options.charDensity - Character density compensation (default 1.0)
 * @param {string} options.ramp - Character ramp name
 * @param {string} options.customRamp - Custom character ramp string
 * @param {string} options.colorMode - 'color', 'monochrome', or 'custom'
 * @param {string} options.backgroundColor - Background color hex
 * @param {string} options.textColor - Text color for custom mode
 * @param {number} options.fontSize - Font size for export
 * @param {number} options.brightness - Brightness adjustment (-100 to 100)
 * @param {number} options.contrast - Contrast adjustment (0 to 200)
 * @param {number} options.gamma - Gamma correction (0.1 to 3.0)
 * @param {boolean} options.invert - Invert colors
 * @param {number} options.threshold - Threshold/posterize (0-255)
 * @param {string} options.dithering - Dithering method
 * @returns {Object} ASCII art data with rows, colors, and dimensions
 */
export function generateAscii(source, options) {
    const {
        width = 120,
        charDensity = 1.0,
        ramp = 'standard',
        customRamp = '',
        colorMode = 'color',
        backgroundColor = '#1a1a2e',
        textColor = '#00ff00',
        fontSize = 8,
        brightness = 0,
        contrast = 100,
        gamma = 1.0,
        invert = false,
        threshold = 128,
        dithering = 'none'
    } = options;
    
    // Determine character ramp
    let charRamp;
    if (ramp === 'custom' && customRamp.length > 0) {
        charRamp = customRamp;
    } else {
        charRamp = getCharRamp(ramp);
    }
    
    // Create offscreen canvas for image processing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    // Calculate output dimensions accounting for character aspect ratio
    // Use actual character cell aspect ratio from CSS metrics, adjusted by charDensity
    const charAspectRatio = CHAR_METRICS.aspectRatio * charDensity;
    
    // Draw source image to canvas at target width
    canvas.width = width;
    canvas.height = Math.max(1, Math.round(width * charAspectRatio * (source.height / source.width)));
    
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Apply image processing
    applyImageProcessing(imageData, { brightness, contrast, gamma, invert, threshold, dithering });
    
    const { data, width: imgWidth, height: imgHeight } = imageData;
    
    const rows = [];
    const colors = [];
    
    // Process each row
    for (let y = 0; y < imgHeight; y++) {
        const rowChars = [];
        const rowColors = [];
        
        for (let x = 0; x < imgWidth; x++) {
            const idx = (y * imgWidth + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            
            // Calculate luminance
            const luminance = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
            
            // Map to character
            const char = luminanceToChar(luminance, charRamp);
            rowChars.push(char);
            
            // Store color based on mode
            if (colorMode === 'color') {
                rowColors.push(rgbToHex(r, g, b));
            } else if (colorMode === 'custom') {
                // Custom tint: use text color with luminance as alpha
                const alpha = luminance / 255;
                const tr = parseInt(textColor.slice(1, 3), 16);
                const tg = parseInt(textColor.slice(3, 5), 16);
                const tb = parseInt(textColor.slice(5, 7), 16);
                rowColors.push(rgbToHex(
                    Math.round(tr * alpha),
                    Math.round(tg * alpha),
                    Math.round(tb * alpha)
                ));
            } else {
                // Monochrome: use luminance for grayscale
                const gray = luminance;
                rowColors.push(rgbToHex(gray, gray, gray));
            }
        }
        
        rows.push(rowChars.join(''));
        colors.push(rowColors);
    }
    
return {
        rows,
        colors,
        width: imgWidth,
        height: imgHeight,
        backgroundColor,
        charWidth: fontSize,
        charHeight: fontSize * 1.05,
        fontSize
    };
}

/**
 * Render ASCII art to canvas for export
 * @param {Object} asciiData - ASCII art data from generateAscii
 * @param {Object} options - Render options
 * @param {number} options.scale - Export scale multiplier
 * @param {string} options.fontFamily - Font family
 * @param {number} options.fontSize - Font size in px (base size, will be multiplied by scale)
 * @returns {HTMLCanvasElement} Rendered canvas
 */
export function renderAsciiToCanvas(asciiData, options = {}) {
    const {
        scale = 2,
        fontFamily = "'JetBrains Mono', 'Fira Code', monospace",
        fontSize = asciiData.fontSize || CHAR_METRICS.fontSize
    } = options;
    
    const { rows, colors, width, height, backgroundColor, charWidth, charHeight } = asciiData;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Calculate canvas dimensions using character metrics scaled
    const charW = charWidth * scale;
    const charH = charHeight * scale;
    
    canvas.width = width * charW;
    canvas.height = height * charH;
    
    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Set font - use scaled font size
    ctx.font = `${fontSize * scale}px ${fontFamily}`;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    
    // Render each character
    for (let y = 0; y < height; y++) {
        const row = rows[y];
        const rowColors = colors[y];
        
        for (let x = 0; x < width; x++) {
            const char = row[x];
            if (char === ' ') continue; // Skip spaces for performance
            
            ctx.fillStyle = rowColors[x];
            ctx.fillText(char, x * charW, y * charH);
        }
    }
    
    return canvas;
}

/**
 * Convert ASCII data to plain text
 * @param {Object} asciiData - ASCII art data
 * @param {boolean} includeColors - Whether to include ANSI color codes (not implemented, placeholder)
 * @returns {string} Plain text representation
 */
export function asciiToText(asciiData) {
    return asciiData.rows.join('\n');
}