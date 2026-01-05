import User from '../models/User.js';
import Invite from '../models/Invite.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// --- 1. REGISTER / SIGNUP LOGIC ---
export const register = async (req, res) => {
  try {
    const { name, password, token } = req.body; 
    const email = req.body.email.toLowerCase().trim();
    const HEAD_ADMIN_EMAIL = process.env.HEAD_ADMIN_EMAIL?.toLowerCase().trim();

    console.log("🚀 Registration Attempt for:", email);

    let userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    let finalRole = 'user';
    let finalApproval = true; 
    let canInvite = false;

    // Check if Head Admin
    if (email === HEAD_ADMIN_EMAIL) {
      finalRole = 'admin';
      canInvite = true;
    } 
    // Check if invited by another Admin
    else if (token) {
      const invite = await Invite.findOne({ email, token });
      if (invite) {
        if (invite.expiresAt > Date.now()) {
          finalRole = 'admin';
          canInvite = false; 
          await Invite.deleteOne({ _id: invite._id }); 
        } else {
          return res.status(400).json({ message: "Invite link has expired." });
        }
      } else {
        return res.status(400).json({ message: "Invalid invite link or email mismatch." });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name, 
      email, 
      password: hashedPassword,
      role: finalRole,
      isApproved: finalApproval, 
      canInvite: canInvite
    });

    await newUser.save();
    res.status(201).json({ message: `Account created successfully as ${finalRole}!`, role: finalRole });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- 2. LOGIN LOGIC ---
export const login = async (req, res) => {
  try {
    const email = req.body.email.toLowerCase().trim();
    const { password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "User nahi mila!" });

    if (user.role === 'admin' && !user.isApproved) {
      return res.status(403).json({ message: "Access Denied. Unauthorized Admin account." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Galt password!" });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ 
      token, 
      user: { id: user._id, name: user.name, role: user.role, canInvite: user.canInvite } 
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// --- 3. GOOGLE LOGIN LOGIC ---
export const googleLogin = async (req, res) => {
  try {
    const { credential, inviteToken } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const { email, name } = ticket.getPayload();
    const normalizedEmail = email.toLowerCase().trim();
    const HEAD_ADMIN_EMAIL = process.env.HEAD_ADMIN_EMAIL?.toLowerCase().trim();

    let finalRole = 'user';
    let canInvite = false;

    if (normalizedEmail === HEAD_ADMIN_EMAIL) {
      finalRole = 'admin';
      canInvite = true;
    } else if (inviteToken) {
      const invite = await Invite.findOne({ email: normalizedEmail, token: inviteToken });
      if (invite) {
        finalRole = 'admin';
        await Invite.deleteOne({ _id: invite._id }); 
      }
    }

    let user = await User.findOne({ email: normalizedEmail });
    
    if (!user) {
      user = new User({
        name,
        email: normalizedEmail,
        role: finalRole,
        isApproved: true,
        password: Math.random().toString(36).slice(-8)
      });
      await user.save();
    } else if (normalizedEmail === HEAD_ADMIN_EMAIL) {
      user.role = 'admin';
      user.canInvite = true;
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({ 
      token, 
      user: { id: user._id, name: user.name, role: user.role, canInvite: user.canInvite } 
    });

  } catch (err) {
    res.status(500).json({ message: "Google Authentication failed" });
  }
};