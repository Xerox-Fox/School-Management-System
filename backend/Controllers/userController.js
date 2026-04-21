const db = require("../Data/dbConfig");
const bcrypt = require("bcryptjs");
const { StatusCodes } = require("http-status-codes");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

/* ---------------- REGISTER ---------------- */
async function register(req, res) {
    try {
        if (!req.user || req.user.user_type !== "root") {
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

        // CHECK USER EXISTS
        const existingUser = await db.query(
            "SELECT userid FROM users WHERE email = $1",
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                msg: "user already registered"
            });
        }

        // GENERATE PASSWORD
        const generatedPassword = crypto.randomBytes(4).toString("hex");

        // PREFIX
        let prefix = "ADM-";
        if (user_type === "student") prefix = "STU-";
        else if (user_type === "teacher") prefix = "TEA-";
        else if (user_type === "parent") prefix = "PRT-";

        // COUNT USERS
        const countResult = await db.query(
            "SELECT COUNT(*) FROM users WHERE user_type = $1",
            [user_type]
        );

        const count = parseInt(countResult.rows[0].count);
        const nextNumber = (count + 1).toString().padStart(3, "0");

        const display_id = `${prefix}${nextNumber}`;

        // HASH PASSWORD
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        // INSERT USER
        await db.query(
            `INSERT INTO users 
            (display_id, name, email, password, phone, address, user_type, subject)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [
                display_id,
                name,
                email,
                hashedPassword,
                phone,
                address,
                user_type,
                subject || null
            ]
        );

        // EMAIL
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
                <h2>Welcome ${name}</h2>
                <p><b>Role:</b> ${user_type}</p>
                <p><b>Password:</b> ${generatedPassword}</p>
            `
        });

        return res.status(StatusCodes.CREATED).json({
            msg: "user registered",
            display_id,
            Password: generatedPassword,
            Subject: user_type === "teacher" ? subject : "N/A"
        });

    } catch (error) {
        console.error("REGISTER ERROR:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            msg: "something went wrong"
        });
    }
}

/* ---------------- LOGIN ---------------- */
async function login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            msg: "please enter all required fields"
        });
    }

    try {
        const result = await db.query(
            `SELECT userid, display_id, name, password, user_type 
             FROM users WHERE email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                msg: "invalid credentials"
            });
        }

        const user = result.rows[0];

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                msg: "invalid credentials"
            });
        }

        const token = jwt.sign(
            {
                fullname: user.name,
                userid: user.userid,
                display_id: user.display_id,
                user_type: user.user_type.toLowerCase().trim()
            },
            "secret",
            { expiresIn: "1d" }
        );

        return res.status(StatusCodes.OK).json({
            msg: "user login successful",
            token,
            user: {
                fullname: user.name,
                display_id: user.display_id,
                user_type: user.user_type
            }
        });

    } catch (error) {
        console.error("LOGIN ERROR:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            msg: "server error"
        });
    }
}

/* ---------------- LOGOUT ---------------- */
function logout(req, res) {
    return res.status(StatusCodes.OK).json({
        msg: "Logged out successfully",
        success: true
    });
}

/* ---------------- CHECK USER ---------------- */
function checkUser(req, res) {
    return res.status(StatusCodes.OK).json({
        msg: "valid user",
        fullname: req.user.fullname,
        userid: req.user.userid,
        display_id: req.user.display_id
    });
}

/* ---------------- GET ALL USERS ---------------- */
async function getAllUsers(req, res) {
    try {
        if (req.user.user_type !== "root") {
            return res.status(403).json({ msg: "Admins only" });
        }

        const result = await db.query(`
            SELECT 
                userid,
                name,
                email,
                phone,
                address,
                display_id,
                user_type,
                subject,
                created_at
            FROM users
            ORDER BY created_at DESC
        `);

        return res.status(200).json(result.rows);

    } catch (error) {
        console.error("GET USERS ERROR:", error);
        return res.status(500).json({
            msg: "Database error"
        });
    }
}

module.exports = {
    register,
    login,
    logout,
    checkUser,
    getAllUsers
};