const supabase = require('../Data/dbConfig');
const { StatusCodes } = require('http-status-codes');

/* ---------------- CREATE POST (ROOT ONLY) ---------------- */
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

        // Image paths handling (Local disk version)
        // Note: On Render/Vercel, these images will be lost on restart.
        // Consider using Supabase Storage buckets for a permanent fix!
        const images = req.files
            ? req.files.map(file => `/uploads/${file.filename}`)
            : [];

        const { error } = await supabase
            .from('posts')
            .insert([{
                title,
                content,
                author_id,
                image_url: images // Supabase handles JSON arrays naturally
            }]);

        if (error) throw error;

        return res.status(StatusCodes.CREATED).json({
            msg: "News posted successfully!",
            images
        });

    } catch (error) {
        console.error("Create Post Error:", error);
        return res.status(500).json({
            msg: "Server failed to save post",
            error: error.message
        });
    }
}

/* ---------------- GET ALL POSTS ---------------- */
async function getAllPosts(req, res) {
    try {
        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                author:users!author_id ( name )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Optional: Format the author name to match your old SQL join result
        const formattedData = data.map(post => ({
            ...post,
            author_name: post.author?.name || 'Unknown'
        }));

        return res.status(StatusCodes.OK).json(formattedData);

    } catch (error) {
        console.error("Get Posts Error:", error);
        return res.status(500).json({
            msg: "Failed to fetch news",
            error: error.message
        });
    }
}

module.exports = { createPost, getAllPosts };