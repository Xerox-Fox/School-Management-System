const express = require('express');
const { createPost, upload, getAllPosts } = require('../Controllers/blogController');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware')

router.post('/post', authMiddleware, upload.array('images', 20), createPost);
router.get('/see-posts', authMiddleware, getAllPosts);



module.exports = router