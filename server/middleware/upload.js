const multer = require('multer');
const sharp = require('sharp');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
const { CLOUDINARY } = require('../config/env');

// ─── Configure Cloudinary ─────────────────────────────────────────
cloudinary.config({
  cloud_name: CLOUDINARY.cloud_name,
  api_key: CLOUDINARY.api_key,
  api_secret: CLOUDINARY.api_secret,
});

// ─── Multer: memory storage (no filesystem writes) ────────────────
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WebP, and AVIF images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per file
    files: 5,                   // Max 5 files per request
  },
});

// ─── Helper: upload buffer to Cloudinary ──────────────────────────
function uploadToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'restaurant-finder',
        resource_type: 'image',
        ...options,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

// ─── Generate BlurHash-like placeholder (tiny base64 thumbnail) ───
async function generateBlurPlaceholder(buffer) {
  try {
    const tiny = await sharp(buffer)
      .resize(20, 20, { fit: 'inside' })
      .blur(5)
      .webp({ quality: 20 })
      .toBuffer();

    return `data:image/webp;base64,${tiny.toString('base64')}`;
  } catch {
    return '';
  }
}

// ═══════════════════════════════════════════════════════════════════
//  MIDDLEWARE: Process uploaded images
// ═══════════════════════════════════════════════════════════════════

/**
 * After multer populates `req.files`, this middleware:
 * 1. Resizes each image with Sharp (max 1200px wide)
 * 2. Creates a thumbnail (300px wide)
 * 3. Generates a blur placeholder
 * 4. Uploads both full + thumb to Cloudinary
 * 5. Populates `req.processedImages` with the results
 */
async function processImages(req, res, next) {
  if (!req.files || req.files.length === 0) {
    req.processedImages = [];
    return next();
  }

  try {
    const results = await Promise.all(
      req.files.map(async (file) => {
        // 1. Resize full image (max 1200px wide, maintain aspect ratio)
        const fullBuffer = await sharp(file.buffer)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer();

        // 2. Create thumbnail (300px wide)
        const thumbBuffer = await sharp(file.buffer)
          .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 70 })
          .toBuffer();

        // 3. Generate blur placeholder
        const blurHash = await generateBlurPlaceholder(file.buffer);

        // 4. Upload full image to Cloudinary
        const fullResult = await uploadToCloudinary(fullBuffer, {
          transformation: { quality: 'auto', fetch_format: 'auto' },
        });

        // 5. Upload thumbnail to Cloudinary
        const thumbResult = await uploadToCloudinary(thumbBuffer, {
          folder: 'restaurant-finder/thumbs',
        });

        return {
          url: fullResult.secure_url,
          thumbUrl: thumbResult.secure_url,
          publicId: fullResult.public_id,
          blurHash,
          uploadedBy: req.user?._id || null,
        };
      })
    );

    req.processedImages = results;
    next();
  } catch (err) {
    console.error('Image processing error:', err);
    next(err);
  }
}

// ─── Middleware combo for restaurant images ────────────────────────
const uploadRestaurantImages = upload.array('images', 5);

module.exports = {
  upload,
  uploadRestaurantImages,
  processImages,
  uploadToCloudinary,
  cloudinary,
};
