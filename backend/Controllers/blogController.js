const db = require('../Data/dbConfig');
const path = require('path');
const multer = require('multer');
const { StatusCodes } = require('http-status-codes');

/* ---------------- MULTER CONFIG ---------------- */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });


/* ---------------- CREATE POST ---------------- */
async function createPost(req, res) {
    try {
        const { title, content } = req.body;
        const author_id = req.user.userid;
        const { user_type } = req.user;

        if (user_type !== 'root') {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                msg: "Access denied. Only root can post."
            });
        }

        // images handling
        const images = req.files
            ? req.files.map(file => `/uploads/${file.filename}`)
            : [];

        const images_json = JSON.stringify(images);

        await db.query(
            `INSERT INTO posts (title, content, author_id, image_url)
             VALUES ($1, $2, $3, $4)`,
            [title, content, author_id, images_json]
        );

        return res.status(StatusCodes.CREATED).json({
            msg: "News posted successfully!",
            images
        });

    } catch (error) {
        console.error("Create Post Error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            msg: "Server failed to save post",
            error: error.message
        });
    }
}


/* ---------------- GET ALL POSTS ---------------- */
async function getAllPosts(req, res) {
    try {
        const result = await db.query(`
            SELECT 
                posts.*,
                users.name AS author_name
            FROM posts
            JOIN users ON posts.author_id = users.userid
            ORDER BY posts.created_at DESC
        `);

        return res.status(StatusCodes.OK).json(result.rows);

    } catch (error) {
        console.error("Get Posts Error:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            msg: "Failed to fetch news",
            error: error.message
        });
    }
}

module.exports = { createPost, upload, getAllPosts };