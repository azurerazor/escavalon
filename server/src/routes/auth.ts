import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import { Router, Request, Response } from 'express';

require('dotenv').config();
const AUTH_KEY = process.env.AUTH_KEY;

// Acquires a signed JWT token for the given user ID
function acquireToken(id: string): string {
    return jwt.sign({ id }, AUTH_KEY, { expiresIn: '3d' });
}

// Set up the router
const router = Router();

// Registers a new user
router.post('/register', async (req: Request, res: Response, next: () => void) => {
    try {
        // Validate the request
        const { email, username, password } = req.body;
        if (!email || !username || !password) {
            res
                .status(400)
                .json({ message: "Missing one or more required fields" });
            return;
        }

        // Check if a user with this email or username already exists
        const by_email = await User.findOne({ email });
        if (by_email) {
            res
                .status(403)
                .json({ message: "Email is already in use" });
            return;
        }
        const by_username = await User.findOne({ username });
        if (by_username) {
            res
                .status(403)
                .json({ message: "Username is already in use" });
            return;
        }

        // Create the new user and authenticate
        const user = await User.create({ email, username, password });
        const token = acquireToken(user._id.toString());
        res.cookie('token', token, { httpOnly: false });

        // Respond (duh)
        res
            .status(201)
            .json({ message: "User successfully created" });
        next();
    } catch (err) {
        // Uh oh!
        console.error(err);
        res
            .status(500)
            .json({ message: "Internal server error" });
    }
});

// Logs a user in
router.post('/login', async (req: Request, res: Response, next: () => void) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            res
                .status(400)
                .json({ message: "Username and password are required" });
            return;
        }

        // Find the user
        const user = await User.findOne({ username });
        if (!user) {
            res
                .status(401)
                .json({ message: "User does not exist" });
            return;
        }

        // Check the password
        const auth = await bcrypt.compare(password, user.password);
        if (!auth) {
            res
                .status(401)
                .json({ message: "Invalid password" });
            return;
        }

        // Authenticate
        const token = acquireToken(user._id.toString());
        res.cookie('token', token, { httpOnly: false });

        // Respond
        res
            .status(200)
            .json({ message: "User successfully logged in" });
        next();
    } catch (err) {
        console.error(err);
        res
            .status(500)
            .json({ message: "Internal server error" });
    }
});

// Logs a user out
router.post('/logout', (req: Request, res: Response) => {
    res.clearCookie('token');
    res
        .status(200)
        .json({ message: "User successfully logged out" });
});

export default router;
