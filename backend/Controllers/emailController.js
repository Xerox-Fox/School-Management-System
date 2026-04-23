const nodemailer = require('nodemailer');
const db = require('../Data/dbConfig');

async function sendLoginNotification(req, res) {
    const { email } = req.body; // Sent from your Clerk frontend after login

    try {
        const connection = await db;
        
        // 1. Double check our MySQL DB to get the user's display_id (e.g., STU-001)
        const [rows] = await connection.execute(
            `SELECT name, display_id FROM users WHERE email = ?`,
            [email]
        );

        if (rows.length === 0) {
            return res.status(404).json({ msg: "User not found in local DB" });
        }

        const { name, display_id } = rows[0];

        // 2. Configure Nodemailer with App Password
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS 
            }
        });

        // 3. Email Content
        const mailOptions = {
            from: `"LCCS Security" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Login Notification - LCCS Portal',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #ddd; padding: 20px;">
                    <h2 style="color: #1a73e8;">Security Alert</h2>
                    <p>Hello <strong>${name}</strong>,</p>
                    <p>Your account (<strong>${display_id}</strong>) was just accessed from a new session.</p>
                    <p>If this was you, no further action is required. If you did not authorize this, please reset your password immediately.</p>
                    <br />
                    <p style="font-size: 12px; color: #555;">Sent from LCCS School Management System, Addis Ababa.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        return res.status(200).json({ msg: "Security email sent successfully." });

    } catch (error) {
        console.error("Email error:", error);
        return res.status(500).json({ msg: "Failed to send notification." });
    }
}

module.exports = { sendLoginNotification };