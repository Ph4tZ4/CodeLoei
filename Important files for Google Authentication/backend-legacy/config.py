import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key-here'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'your-jwt-secret-key-here'
    
    # MongoDB settings
    MONGODB_SETTINGS = {
        'db': 'codeloei_db',
        'host': 'localhost',
        'port': 27017
    }
    
    # Google OAuth settings
    GOOGLE_CLIENT_ID = '616609232183-qth5o01fmleiketoq9o4atjavcuom9bt.apps.googleusercontent.com'
    GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET') or 'your-google-client-secret'
    GOOGLE_DISCOVERY_URL = 'https://accounts.google.com/.well-known/openid_configuration'