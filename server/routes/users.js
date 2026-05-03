const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// All user routes require authentication
router.use(auth);

// Profile
router.put('/profile', userController.updateProfile);

// Bookmarks
router.get('/bookmarks', userController.getBookmarks);
router.post('/bookmarks', userController.addBookmark);
router.delete('/bookmarks/:id', userController.removeBookmark);
router.get('/bookmarks/export', userController.exportBookmarksCSV);

module.exports = router;
