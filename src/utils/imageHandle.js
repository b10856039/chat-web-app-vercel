/**
 * 解析 Base64 影像類型
 * @param {string} base64 - Base64 字串
 * @returns {string} - 影像 MIME 類型
 */
export default function getImageType(base64) {
    const pngSignature = 'iVBORw0KGgo';
    const jpegSignature = '/9j/';
    const gifSignature = 'R0lGODlh';

    if (base64.startsWith(pngSignature)) return 'image/png';
    if (base64.startsWith(jpegSignature)) return 'image/jpeg';
    if (base64.startsWith(gifSignature)) return 'image/gif';

    return '';
}