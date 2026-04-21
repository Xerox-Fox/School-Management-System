const supabase = require("../Data/dbConfig"); // Now importing the Supabase client
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
        const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('userid')
            .eq('email', email)
            .maybeSingle();

        if (existingUser) {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: "user already registered" });
        }

        // GENERATE PASSWORD & PREFIX
        const generatedPassword = crypto.randomBytes(4).toString("hex");
        let prefix = user_type === "student" ? "STU-" : user_type === "teacher" ? "TEA-" : user_type === "parent" ? "PRT-" : "ADM-";

        // COUNT USERS for custom ID
        const { count, error: countError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('user_type', user_type);

        const nextNumber = (count + 1).toString().padStart(3, "0");
        const display_id = `${prefix}${nextNumber}`;

        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        // INSERT USER
        const { error: insertError } = await supabase
            .from('users')
            .insert([{
                display_id,
                name,
                email,
                password: hashedPassword,
                phone,
                address,
                user_type,
                subject: subject || null
            }]);

        if (insertError) throw insertError;

        // EMAIL logic remains the same...
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        await transporter.sendMail({
            from: '"School System" <your_email@gmail.com>',
            to: email,
            subject: "Account Created Successfully",
            html: `<h2>Welcome ${name}</h2><p><b>Password:</b> ${generatedPassword}</p>`
        });

        return res.status(StatusCodes.CREATED).json({
            msg: "user registered",
            display_id,
            Password: generatedPassword
        });

    } catch (error) {
        console.error("REGISTER ERROR:", error);
        return res.status(500).json({ msg: "something went wrong", error: error.message });
    }
}

/* ---------------- LOGIN ---------------- */
async function login(req, res) {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ msg: "Missing fields" });

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('userid, display_id, name, password, user_type')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(400).json({ msg: "invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: "invalid credentials" });

        const token = jwt.sign(
            { fullname: user.name, userid: user.userid, display_id: user.display_id, user_type: user.user_type.toLowerCase().trim() },
            "secret",
            { expiresIn: "1d" }
        );

        return res.status(200).json({ msg: "user login successful", token, user });

    } catch (error) {
        return res.status(500).json({ msg: "server error" });
    }
}

/* ---------------- GET ALL USERS ---------------- */
async function getAllUsers(req, res) {
    try {
        if (req.user.user_type !== "root") {
            return res.status(403).json({ msg: "Admins only" });
        }

        const { data, error } = await supabase
            .from('users')
            .select('userid, name, email, phone, address, display_id, user_type, subject, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return res.status(200).json(data); // returns clean array for .forEach()

    } catch (error) {
        return res.status(500).json({ msg: "Database error" });
    }
}

module.exports = { register, login, logout: (req, res) => res.json({ msg: "Logged out" }), checkUser: (req, res) => res.json(req.user), getAllUsers };