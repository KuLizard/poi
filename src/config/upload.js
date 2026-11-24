import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';

const carpeta = path.join(process.cwd(), 'public/uploads/profiles');

if (!fs.existsSync(carpeta)) {
    fs.mkdirSync(carpeta, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, carpeta),
    filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname).toLowerCase()}`)
});

const fileFilter = (req, file, cb) => {
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];

    if (tiposPermitidos.includes(file.mimetype)) {
        return cb(null, true);
    }

    return cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

export default upload;