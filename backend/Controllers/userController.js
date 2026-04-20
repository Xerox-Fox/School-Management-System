const db = require("../Data/dbConfig"); 
const bcrypt = require('bcryptjs');
const { StatusCodes } = require('http-status-codes');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require("nodemailer");



async function register(req, res) {
    if (!req.user || req.user.user_type !== 'root') {
        return res.status(StatusCodes.FORBIDDEN).json({
            msg: "Access denied. Only root users can register new accounts."
        });
    }

    const { name, email, password, phone, address, user_type, subject } = req.body;

    if (!name || !email || !password || !phone || !address || !user_type) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            msg: "please provide all required information"
        });
    }

    try {
        // CHECK USER EXISTS
        const existingUser = db.prepare(
            "SELECT userid FROM users WHERE email = ?"
        ).get(email);

        if (existingUser) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                msg: "user already registered"
            });
        }

        // GENERATE PASSWORD
        const generatedPassword = crypto.randomBytes(4).toString('hex');

        // PREFIX
        let prefix = "";
        if (user_type === 'student') prefix = "STU-";
        else if (user_type === 'teacher') prefix = "TEA-";
        else if (user_type === 'parent') prefix = "PRT-";
        else prefix = "ADM-";

        // COUNT USERS
        const countData = db.prepare(
            "SELECT COUNT(*) as total FROM users WHERE user_type = ?"
        ).get(user_type);

        const nextNumber = (countData.total + 1).toString().padStart(3, '0');
        const display_id = `${prefix}${nextNumber}`;

        // HASH PASSWORD
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(generatedPassword, salt);

        // INSERT USER
        db.prepare(`
            INSERT INTO users 
            (display_id, name, email, password, phone, address, user_type, subject) 
            VALUES (?,?,?,?,?,?,?,?)
        `).run(
            display_id,
            name,
            email,
            hashedPassword,
            phone,
            address,
            user_type,
            subject || null
        );

        // EMAIL SETUP
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: '"School System" <your_email@gmail.com>',
            to: email,
            subject: "Account Created Successfully",
            html: `
                <h2>Welcome ${name} to LCCS School Management System</h2>
                <p>Your account has been created successfully.</p>
                <p><b>Your Role:</b> ${user_type}</p>
                <p><b>Password:</b> ${generatedPassword}</p>
                <p>Now you can log in and access the portal features.</p>
            `
        });

        return res.status(StatusCodes.CREATED).json({
            msg: "user registered",
            display_id,
            Password: generatedPassword,
            Subject: user_type === 'teacher' ? subject : "N/A"
        });

    } catch (error) {
        console.log(error.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            msg: "something went wrong, try again later!"
        });
    }
}

function login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: "please enter all required fields" });
    }

    try {
        const user = db.prepare(`
            SELECT userid, display_id, name, password, user_type 
            FROM users WHERE email = ?
        `).get(email);

        if (!user) {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: "invalid credentials" });
        }

        const isMatch = bcrypt.compareSync(password, user.password);

        if (!isMatch) {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: "invalid credentials" });
        }

        const fullname = user.name;
        const userid = user.userid;
        const display_id = user.display_id;
        const user_type = user.user_type;

        const token = jwt.sign(
            {
                fullname,
                userid,
                display_id,
                user_type: user_type.toLowerCase().trim()
            },
            "secret",
            { expiresIn: "1d" }
        );

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

function logout(req, res) {
    try {
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

function checkUser(req, res) {
    const fullname = req.user.fullname;
    const userid = req.user.userid;
    const display_id = req.user.display_id;

    res.status(StatusCodes.OK).json({ 
        msg: "valid user", 
        fullname, 
        userid, 
        display_id 
    });
}

function getAllUsers(req, res) {
    try {
        const users = db.prepare(`
            SELECT userid, name, display_id, user_type 
            FROM users
        `).all();

        res.json(users);
    } catch (error) {
        console.error("Get Users Error:", error);
        res.status(500).json({ msg: "Database error" });
    }
}

module.exports = { register, login, logout, checkUser, getAllUsers };