export function getEmbedUrl(url: string): string | null {
    if (!url) return null;

    // YouTube: https://www.youtube.com/watch?v=VIDEO_ID
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch && youtubeMatch[1]) {
        return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // Vimeo: https://vimeo.com/VIDEO_ID
    const vimeoRegex = /(?:vimeo\.com\/)(\d+)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch && vimeoMatch[1]) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    // Mux or Generic MP4 (Direct file)
    if (url.endsWith('.mp4') || url.includes('mux.com')) {
        return url;
    }

    // Return original if no match (hope for the best or it's already an embed link)
    return url;
}

export function getPdfEmbedUrl(url: string): string | null {
    if (!url) return null;

    // Google Drive: Convert /view or /share to /preview
    // Pattern: https://drive.google.com/file/d/FILE_ID/view...
    const driveRegex = /drive\.google\.com\/file\/d\/([^\/]+)/;
    const driveMatch = url.match(driveRegex);

    if (driveMatch && driveMatch[1]) {
        return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    }

    // Generic PDF (Direct link)
    if (url.endsWith('.pdf')) {
        return url;
    }

    // Return original for other cases (e.g. other embeddable viewers)
    return url;
}
