const db = require("../Data/dbConfig"); 
const bcrypt = require('bcryptjs');
const { StatusCodes } = require('http-status-codes');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

async function register(req, res) {
    if (!req.user || req.user.user_type !== 'root') {
        return res.status(StatusCodes.FORBIDDEN).json({
            msg: "Access denied. Only root users can register new accounts."
        });
    } 

    
    const { name, email, password, phone, address, user_type, subject } = req.body;

    if (!name || !email || !password || !phone || !address || !user_type) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: "please provide all required information" });
    }

    try {
        const connection = await db;
        const existingUser = await connection.get(`SELECT userid FROM users WHERE email = ?`, [email]);
        if (existingUser) {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: "user already registered" });
        }

        const generatedPassword = crypto.randomBytes(4).toString('hex');

        
        let prefix = "";
        if (user_type === 'student') prefix = "STU-";
        else if (user_type === 'teacher') prefix = "TEA-";
        else if (user_type === 'parent') prefix = "PRT-";
        else prefix = "ADM-";

        const countData = await connection.get(`SELECT COUNT(*) as total FROM users WHERE user_type = ?`, [user_type]);
        const nextNumber = (countData.total + 1).toString().padStart(3, '0');
        const display_id = `${prefix}${nextNumber}`;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(generatedPassword, salt);

        
        await connection.run(
            `INSERT INTO users (display_id, name, email, password, phone, address, user_type, subject) VALUES (?,?,?,?,?,?,?,?)`,
            [display_id, name, email, hashedPassword, phone, address, user_type, subject || null]
        );

        return res.status(StatusCodes.CREATED).json({ 
            msg: "user registered", 
            display_id,
            Password: generatedPassword,
            Subject: user_type === 'teacher' ? subject : "N/A"
        });

    } catch (error) {
        console.log(error.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "something went wrong, try again later!" });
    }
}

async function login(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: "please enter all required fields" });
    }

    try {
        const connection = await db;
        
        // Fetch user including the 'name' field
        const user = await connection.get(`SELECT userid, display_id, name, password, user_type FROM users WHERE email = ?`, [email]);
        
        if (!user) {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: "invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: "invalid credentials" });
        }

        // Changed username to fullname using the 'name' column
        const fullname = user.name;
        const userid = user.userid;
        const display_id = user.display_id;
        const user_type = user.user_type;

        // Create token containing fullname
        const token = jwt.sign({ fullname, userid, display_id, user_type }, "secret", { expiresIn: "1d" });

        return res.status(StatusCodes.OK).json({ 
            msg: "user login successful", 
            token, 
            user: { fullname, display_id, user_type } 
        });

    } catch (error) {
        console.log(error.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "something went wrong, try again later!" });
    }
}

async function logout(req, res) {
    try {
        // In a JWT setup, the server is stateless. 
        // We just return a success message.
        return res.status(StatusCodes.OK).json({ 
            msg: "Logged out successfully",
            success: true 
        });
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
            msg: "Logout failed", 
            error: error.message 
        });
    }
}

async function checkUser(req, res) {
    
    const fullname = req.user.fullname;
    const userid = req.user.userid;
    const display_id = req.user.display_id;

    res.status(StatusCodes.OK).json({ msg: "valid user", fullname, userid, display_id });
}


const getAllUsers = async (req, res) => {
    try {
        const connection = await db;
        
      
        const query = `SELECT userid, name, display_id, user_type FROM users`;
        
        const users = await connection.all(query);
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ msg: "Database error" });
    }
};

module.exports = { register, login, logout, checkUser, getAllUsers };