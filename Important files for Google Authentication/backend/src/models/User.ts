import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    username: string;
    email: string;
    password?: string;
    google_id?: string;
    name?: string;
    picture?: string;
    is_oauth_user: boolean;
    user_type: 'general' | 'college_member';
    bio?: string;
    location?: string;
    website?: string;
    skills: string[];
    settings: Record<string, any>;
    created_at: Date;
    updated_at: Date;
}

const UserSchema: Schema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: false
    },
    google_id: {
        type: String,
        unique: true,
        sparse: true
    },
    name: {
        type: String
    },
    picture: {
        type: String
    },
    is_oauth_user: {
        type: Boolean,
        default: false
    },
    user_type: {
        type: String,
        required: true,
        enum: ['general', 'college_member'],
        default: 'general'
    },
    // Profile fields
    bio: {
        type: String,
        maxlength: 500
    },
    location: {
        type: String,
        maxlength: 100
    },
    website: {
        type: String
    },
    skills: [{
        type: String,
        maxlength: 50
    }],
    settings: {
        type: Map, // Use Map for dictionary or Mixed
        of: Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'users' // Ensure consistent collection name
});

export default mongoose.model<IUser>('User', UserSchema);
