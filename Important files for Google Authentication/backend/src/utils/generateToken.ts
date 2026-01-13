import jwt from 'jsonwebtoken';

const generateToken = (id: string): string => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'your-jwt-secret-key-here', {
        expiresIn: '30d',
    });
};

export default generateToken;
