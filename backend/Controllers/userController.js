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

        // MySQL returns an array [rows, fields]
        const [existingUsers] = await connection.execute(`SELECT userid FROM users WHERE email = ?`, [email]);
        
        if (existingUsers.length > 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: "user already registered" });
        }

        const generatedPassword = crypto.randomBytes(4).toString('hex');
        
        let prefix = "";
        if (user_type === 'student') prefix = "STU-";
        else if (user_type === 'teacher') prefix = "TEA-";
        else if (user_type === 'parent') prefix = "PRT-";
        else prefix = "ADM-";

        // Fetching the count
        const [countData] = await connection.execute(`SELECT COUNT(*) as total FROM users WHERE user_type = ?`, [user_type]);
        const nextNumber = (countData[0].total + 1).toString().padStart(3, '0');
        const display_id = `${prefix}${nextNumber}`;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(generatedPassword, salt);

        await connection.execute(
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
        console.error(error.message);
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
        
        // Find user
        const [users] = await connection.execute(
            `SELECT userid, display_id, name, password, user_type FROM users WHERE email = ?`, 
            [email]
        );
        
        if (users.length === 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: "invalid credentials" });
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: "invalid credentials" });
        }

        const fullname = user.name;
        const userid = user.userid;
        const display_id = user.display_id;
        const user_type = user.user_type;

        // In production, keep your secret in .env!
        const token = jwt.sign({ fullname, userid, display_id, user_type }, process.env.JWT_SECRET || "secret", { expiresIn: "1d" });

        return res.status(StatusCodes.OK).json({ 
            msg: "user login successful", 
            token, 
            user: { fullname, display_id, user_type } 
        });

    } catch (error) {
        console.error(error.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "something went wrong, try again later!" });
    }
}

async function logout(req, res) {
    return res.status(StatusCodes.OK).json({ 
        msg: "Logged out successfully",
        success: true 
    });
}

async function checkUser(req, res) {
    const { fullname, userid, display_id } = req.user;
    res.status(StatusCodes.OK).json({ msg: "valid user", fullname, userid, display_id });
}

const getAllUsers = async (req, res) => {
    try {
        const connection = await db;
        const query = `SELECT userid, name, display_id, user_type FROM users`;
        
        const [users] = await connection.execute(query);
        res.status(200).json(users);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: "Database error" });
    }
};

const getSystemStats = async (req, res) => {
    try {
        const [students] = await db.execute("SELECT COUNT(*) as count FROM users WHERE user_type = 'student'");
        const [teachers] = await db.execute("SELECT COUNT(*) as count FROM users WHERE user_type = 'teacher'");
        const [total] = await db.execute("SELECT COUNT(*) as count FROM users");
        
        res.status(200).json({
            students: students[0].count,
            teachers: teachers[0].count,
            total: total[0].count
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching system stats", error: error.message });
    }
};

module.exports = { register, login, logout, checkUser, getAllUsers, getSystemStats };