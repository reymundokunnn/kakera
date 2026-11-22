/**
 * Export Module - Handles exporting ASCII art to various formats
 */

import { renderAsciiToCanvas, asciiToText } from './ascii-generator.js';

/**
 * Export format configurations
 */
export const EXPORT_FORMATS = {
    png: { mime: 'image/png', extension: 'png', quality: undefined },
    jpg: { mime: 'image/jpeg', extension: 'jpg', quality: 0.92 },
    webp: { mime: 'image/webp', extension: 'webp', quality: 0.9 },
    txt: { mime: 'text/plain', extension: 'txt', quality: undefined }
};

/**
 * Generate filename with timestamp
 * @param {string} extension - File extension
 * @param {string} prefix - Filename prefix
 * @returns {string} Generated filename
 */
export function generateFilename(extension, prefix = 'kakera') {
    const now = new Date();
    const timestamp = now.toISOString()
        .replace(/[:.]/g, '-')
        .replace('T', '_')
        .split('Z')[0];
    return `${prefix}_${timestamp}.${extension}`;
}

/**
 * Download a blob as a file
 * @param {Blob} blob - Blob to download
 * @param {string} filename - Filename for download
 */
export function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoke after a short delay to ensure download starts
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Export ASCII art as image
 * @param {Object} asciiData - ASCII art data from generateAscii
 * @param {string} format - Export format ('png', 'jpg', 'webp')
 * @param {Object} options - Render options
 * @returns {Promise<Blob>} Image blob
 */
export async function exportAsImage(asciiData, format, options = {}) {
    const canvas = renderAsciiToCanvas(asciiData, options);
    const formatConfig = EXPORT_FORMATS[format];
    
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error(`Failed to create ${format.toUpperCase()} blob`));
                }
            },
            formatConfig.mime,
            formatConfig.quality
        );
    });
}

/**
 * Export ASCII art as text file
 * @param {Object} asciiData - ASCII art data
 * @returns {Blob} Text blob
 */
export function exportAsText(asciiData) {
    const text = asciiToText(asciiData);
    return new Blob([text], { type: EXPORT_FORMATS.txt.mime });
}

/**
 * Export ASCII art and trigger download
 * @param {Object} asciiData - ASCII art data
 * @param {string} format - Export format
 * @param {Object} options - Render options
 */
export async function exportAndDownload(asciiData, format, options = {}) {
    try {
        let blob;
        const formatConfig = EXPORT_FORMATS[format];
        
        if (format === 'txt') {
            blob = exportAsText(asciiData);
        } else {
            blob = await exportAsImage(asciiData, format, options);
        }
        
        const filename = generateFilename(formatConfig.extension);
        downloadBlob(blob, filename);
        
        return { success: true, filename };
    } catch (error) {
        console.error('Export failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Copy ASCII art as plain text to clipboard
 * @param {Object} asciiData - ASCII art data
 * @returns {Promise<boolean>} Success status
 */
export async function copyAsText(asciiData) {
    try {
        const text = asciiToText(asciiData);
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Copy failed:', error);
        return false;
    }
}

/**
 * Get canvas data URL for preview/sharing
 * @param {Object} asciiData - ASCII art data
 * @param {string} format - Image format
 * @param {Object} options - Render options
 * @returns {Promise<string>} Data URL
 */
export async function getDataUrl(asciiData, format = 'png', options = {}) {
    const canvas = renderAsciiToCanvas(asciiData, options);
    const formatConfig = EXPORT_FORMATS[format];
    
    return canvas.toDataURL(formatConfig.mime, formatConfig.quality);
}