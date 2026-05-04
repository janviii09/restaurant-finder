const express = require('express');
const auth = require('../middleware/auth');
const bookmarkController = require('../controllers/bookmarkController');

const router = express.Router();

router.use(auth);

router.get('/', bookmarkController.getBookmarks);
router.post('/', bookmarkController.addBookmark);
router.delete('/:geoapifyId', bookmarkController.removeBookmark);

module.exports = router;
