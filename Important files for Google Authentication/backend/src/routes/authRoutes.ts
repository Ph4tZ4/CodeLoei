import express from 'express';
import { register, login, googleLogin } from '../controllers/authController';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
// Map both legacy paths if needed, or stick to clean REST.
// Legacy had /google (access_token) and /verify-google-token (id_token).
// We'll standardise on /google accepting id_token for simplicity in React, 
// but can alias /verify-google-token to googleLogin as well for parity if frontend sends it.
router.post('/google', googleLogin);
router.post('/verify-google-token', googleLogin); // Alias for compatibility

export default router;
