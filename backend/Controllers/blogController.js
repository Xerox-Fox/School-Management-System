const db = require('../Data/dbConfig');
const path = require('path');
const multer = require('multer');
const { StatusCodes } = require('http-status-codes');


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });


function createPost(req, res) {
    try {
        const { title, content } = req.body;
        const author_id = req.user.userid;
        const { user_type } = req.user;

        if (user_type !== 'root') {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                msg: "Access denied. Only root can post."
            });
        }

        
        const images = req.files
            ? req.files.map(file => `/uploads/${file.filename}`)
            : [];

        const images_json = JSON.stringify(images);

        db.prepare(
            "INSERT INTO posts (title, content, author_id, image_url) VALUES (?, ?, ?, ?)"
        ).run(title, content, author_id, images_json);

        return res.status(StatusCodes.CREATED).json({
            msg: "News posted successfully!",
            images
        });

    } catch (error) {
        console.error("Create Post Error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            msg: "Server failed to save post"
        });
    }
}


function getAllPosts(req, res) {
    try {
        const posts = db.prepare(`
            SELECT posts.*, users.name as author_name 
            FROM posts 
            JOIN users ON posts.author_id = users.userid 
            ORDER BY created_at DESC
        `).all();

        res.json(posts);

    } catch (error) {
        console.error("Get Posts Error:", error);
        res.status(500).json({ msg: "Failed to fetch news" });
    }
}

module.exports = { createPost, upload, getAllPosts };