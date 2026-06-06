const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('../config/db');

// ── Nodemailer transporter ───────────────────────────────────────────────────
function createTransporter() {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

// ── Send password reset email ────────────────────────────────────────────────
async function sendResetEmail({ to, resetUrl, expiresInMin }) {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"FAQ System" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to,
    subject: '🔐 Password Reset — FAQ Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; color: #1a1a2e;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; color: #1a1a2e; margin: 0;">🔐 Password Reset</h1>
          <p style="color: #6b7280; margin: 8px 0 0;">FAQ Management System</p>
        </div>
        <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <p style="margin: 0 0 16px; font-size: 15px; color: #374151;">You requested a password reset. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetUrl}"
               style="display: inline-block; background: #4f46e5; color: #fff; text-decoration: none;
                      font-weight: 600; font-size: 15px; padding: 12px 28px; border-radius: 8px;">
              Reset Password
            </a>
          </div>
          <p style="margin: 0 0 12px; font-size: 14px; color: #6b7280;">
            This link expires in <strong>${expiresInMin} minutes</strong> and can only be used once.
          </p>
          <p style="margin: 0; font-size: 13px; color: #9ca3af;">
            If you didn't request this, ignore this email.
          </p>
        </div>
      </div>
    `,
  });
}

// ── POST /api/auth/forgot-password ──────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await db.User_findOne({ email });
    if (!user) {
      // Always return 200 — prevent email enumeration
      return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const EXPIRES_MS = parseInt(process.env.RESET_TOKEN_EXPIRY_MIN || '15', 10) * 60 * 1000;
    const expiresAt = new Date(Date.now() + EXPIRES_MS).toISOString();

    await db.PasswordReset_deleteOne({ email });
    await db.PasswordReset_create({ email, token, expiresAt });

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password/${token}`;

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await sendResetEmail({ to: email, resetUrl, expiresInMin: Math.round(EXPIRES_MS / 60000) });
    } else {
      console.log(`\n📧 [DEV] Password reset link: ${resetUrl}\n`);
    }

    res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (err) {
    console.error('forgotPassword error:', err);
    res.status(500).json({ message: 'Failed to process request.' });
  }
};

// ── POST /api/auth/reset-password ───────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token)  return res.status(400).json({ message: 'Reset token is required' });
    if (!password) return res.status(400).json({ message: 'New password is required' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });

    const record = await db.PasswordReset_findOne({ token });
    if (!record) return res.status(400).json({ message: 'Invalid or expired reset token. Please request a new one.' });

    if (new Date(record.expiresAt) < new Date()) {
      await db.PasswordReset_deleteOne({ token });
      return res.status(400).json({ message: 'This reset link has expired. Please request a new one.' });
    }

    const user = await db.User_findOne({ email: record.email });
    if (!user) return res.status(400).json({ message: 'User not found.' });

    const hashed = await bcrypt.hash(password, 10);
    await db.User_findOneAndUpdate({ email: record.email }, { password: hashed });
    await db.PasswordReset_deleteOne({ token });

    res.status(200).json({ message: 'Your password has been reset. You can now sign in.' });
  } catch (err) {
    console.error('resetPassword error:', err);
    res.status(500).json({ message: 'Failed to reset password.' });
  }
};

// ── GET /api/auth/reset-validate/:token ────────────────────────────────────
exports.validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    const record = await db.PasswordReset_findOne({ token });
    if (!record) return res.status(400).json({ valid: false, message: 'Invalid token' });
    if (new Date(record.expiresAt) < new Date()) {
      await db.PasswordReset_deleteOne({ token });
      return res.status(400).json({ valid: false, message: 'Token expired' });
    }
    res.json({ valid: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const existing = await db.User_findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await db.User_create({ name, email, password: hashed, role: role || 'user' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'faq_secret_2024', { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await db.User_findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'faq_secret_2024', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await db.User_findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { password, ...rest } = user;
    res.json(rest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};