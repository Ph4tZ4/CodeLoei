import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import User from '../models/User';
import generateToken from '../utils/generateToken';
import { classifyUserType } from '../utils/userHelpers';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response) => {
    try {
        const { username, email, password, name } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ msg: 'Please include all fields' });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ msg: 'Email already exists' });
        }

        const usernameExists = await User.findOne({ username });
        if (usernameExists) {
            return res.status(400).json({ msg: 'Username already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userType = classifyUserType(email);

        // Create user
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            name: name || '',
            user_type: userType,
        });

        if (user) {
            res.status(200).json({ // 200 to match legacy? Usually 201. Legacy used 200.
                msg: 'User registered successfully',
                access_token: generateToken((user._id as unknown as string)),
                user: {
                    id: (user._id as unknown as string),
                    username: user.username,
                    email: user.email,
                    name: user.name,
                    user_type: user.user_type,
                },
            });
        } else {
            res.status(400).json({ msg: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Registration failed', error: (error as Error).message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response) => {
    try {
        const { identifier, password } = req.body; // legacy uses 'identifier'

        if (!identifier || !password) {
            return res.status(400).json({ msg: 'Email or username is required' });
        }

        // Check for user email or username
        const user = await User.findOne({
            $or: [{ email: identifier }, { username: identifier }],
        });

        if (user && user.password && (await bcrypt.compare(password, user.password))) {
            res.json({
                access_token: generateToken((user._id as unknown as string)),
                user: {
                    id: (user._id as unknown as string),
                    username: user.username,
                    email: user.email,
                    name: user.name,
                    picture: user.picture,
                    user_type: user.user_type,
                },
            });
        } else {
            res.status(401).json({ msg: 'Invalid credentials' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Login failed', error: (error as Error).message });
    }
};

// @desc    Google Auth
// @route   POST /api/auth/google
// @access  Public
export const googleLogin = async (req: Request, res: Response) => {
    try {
        const { id_token } = req.body;

        if (!id_token) {
            return res.status(400).json({ msg: 'ID token is required' });
        }

        let payload: any; // Using any to accommodate both TokenPayload and UserInfo response

        // 1. Try passing as ID token
        try {
            const ticket = await client.verifyIdToken({
                idToken: id_token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            payload = ticket.getPayload();
        } catch (error) {
            // 2. If valid JWT signature fails, try as Access Token (UserInfo)
            try {
                const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${id_token}` }
                });
                payload = response.data;
            } catch (innerError) {
                return res.status(400).json({ msg: 'Invalid Google Token' });
            }
        }

        if (!payload) {
            return res.status(400).json({ msg: 'Invalid Google Token' });
        }

        const { email, sub: googleId, name, picture } = payload;

        if (!email) {
            return res.status(400).json({ msg: 'Email not found in Google Token' });
        }

        // Check if user exists
        let user = await User.findOne({ google_id: googleId });

        if (user) {
            // Update existing user
            user.name = name || user.name;
            user.picture = picture || user.picture; // Fixed typo in legacy thought
            user.is_oauth_user = true;
            user.user_type = classifyUserType(email);
            user.updated_at = new Date();
            await user.save();
        } else {
            // Check by email
            user = await User.findOne({ email });

            if (user) {
                user.google_id = googleId;
                user.name = name || user.name;
                user.picture = picture || user.picture;
                user.is_oauth_user = true;
                user.user_type = classifyUserType(email);
                user.updated_at = new Date();
                await user.save();
            } else {
                // Create new user
                let username = email.split('@')[0];
                const baseUsername = username;
                let counter = 1;

                while (await User.findOne({ username })) {
                    username = `${baseUsername}${counter}`;
                    counter++;
                }

                user = await User.create({
                    username,
                    email,
                    google_id: googleId,
                    name: name || '',
                    picture: picture || '',
                    is_oauth_user: true,
                    user_type: classifyUserType(email),
                    password: '', // Optional
                });
            }
        }

        res.json({
            access_token: generateToken((user._id as unknown as string)),
            user: {
                id: (user._id as unknown as string),
                username: user.username,
                email: user.email,
                name: user.name,
                picture: user.picture,
                is_oauth_user: user.is_oauth_user,
                user_type: user.user_type,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Google authentication failed', error: (error as Error).message });
    }
};
