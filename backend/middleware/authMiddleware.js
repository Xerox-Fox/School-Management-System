const { StatusCodes } = require('http-status-codes');
const jwt = require('jsonwebtoken');

async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Authentication invalid' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const { fullname, userid, display_id, user_type } = jwt.verify(token, "secret");
        
        req.user = { fullname, userid, display_id, user_type };
        
        next();
    } catch (error) {
        console.log("JWT Error:", error.message);
        return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Authentication invalid' });
    }
}

module.exports = authMiddleware;