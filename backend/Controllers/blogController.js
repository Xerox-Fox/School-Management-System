const conn = require('../Data/dbConfig');
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
})

const upload = multer({ storage: storage });

async function createPost(req, res) {
    try {
        const { title, content } = req.body; 
        const author_id = req.user.userid;
        const { user_type, userid } = req.user;
        console.log("Attempting to post. User Type:", user_type);

        if (user_type !== 'root') {
            return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Access denied. Only root can post." });
        }
        const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
        const images_json = JSON.stringify(images);

        const db = await conn; 

        await db.run(
            `INSERT INTO posts (title, content, author_id, image_url) VALUES (?, ?, ?, ?)`,
            [title, content, author_id, images_json]
        );

        return res.status(StatusCodes.ACCEPTED).json({ msg: "News posted successfully!", images });

    } catch (error) {
        console.error("Internal Controller Error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Server failed to save post." });
    }
}

async function getAllPosts(req, res) {
    try {
        const db = await conn;
        // Join with users table to get the author's name
        const posts = await db.all(`
            SELECT posts.*, users.name as author_name 
            FROM posts 
            JOIN users ON posts.author_id = users.userid 
            ORDER BY created_at DESC
        `);
        res.json(posts);
    } catch (error) {
        res.status(500).json({ msg: "Failed to fetch news" });
    }
}

module.exports = { createPost, upload, getAllPosts };