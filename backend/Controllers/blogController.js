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
        const { user_type } = req.user;
        
        if (user_type !== 'root') {
            return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Access denied. Only root can post." });
        }

        const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
        const images_json = JSON.stringify(images);

        const db = await conn; 

        // MySQL uses .execute() or .query(). 
        // Note: MySQL results are [rows, fields], so we don't need to destructure here for an INSERT
        await db.execute(
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
        
        // In mysql2/promise, we destructure the first element [rows]
        const [posts] = await db.execute(`
            SELECT posts.*, users.name as author_name 
            FROM posts 
            JOIN users ON posts.author_id = users.userid 
            ORDER BY created_at DESC
        `);

        res.json(posts);
    } catch (error) {
        console.error("Fetch Error:", error);
        res.status(500).json({ msg: "Failed to fetch news" });
    }
}

module.exports = { createPost, upload, getAllPosts };