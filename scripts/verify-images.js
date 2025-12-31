/**
 * 이미지 파일 형식 검증 스크립트
 * 사용법: node scripts/verify-images.js
 */
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');

const FILE_SIGNATURES = {
    PNG: [0x89, 0x50, 0x4E, 0x47], // 89 50 4E 47
    JPEG: [0xFF, 0xD8, 0xFF],      // FF D8 FF
    GIF: [0x47, 0x49, 0x46],       // GIF
    WEBP: [0x52, 0x49, 0x46, 0x46] // RIFF
};

function getActualFormat(filePath) {
    const buffer = Buffer.alloc(8);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 8, 0);
    fs.closeSync(fd);

    for (const [format, signature] of Object.entries(FILE_SIGNATURES)) {
        if (signature.every((byte, i) => buffer[i] === byte)) {
            return format;
        }
    }
    return 'UNKNOWN';
}

function checkImages(dir) {
    const errors = [];
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            errors.push(...checkImages(filePath));
            continue;
        }

        const ext = path.extname(file).toLowerCase();
        if (!['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) continue;

        const actualFormat = getActualFormat(filePath);
        const expectedFormat = ext === '.jpg' || ext === '.jpeg' ? 'JPEG' : ext.slice(1).toUpperCase();

        if (actualFormat !== expectedFormat && actualFormat !== 'UNKNOWN') {
            errors.push({
                file: filePath,
                extension: ext,
                actualFormat,
                message: `❌ ${file}: 확장자는 ${ext}인데 실제로는 ${actualFormat} 형식`
            });
        } else {
            console.log(`✅ ${file}: ${actualFormat}`);
        }
    }

    return errors;
}

console.log('🔍 이미지 파일 형식 검증 시작...\n');
const errors = checkImages(ASSETS_DIR);

if (errors.length > 0) {
    console.log('\n⚠️ 문제 발견:');
    errors.forEach(e => console.log(e.message));
    process.exit(1);
} else {
    console.log('\n✅ 모든 이미지 파일 형식이 정상입니다!');
}
