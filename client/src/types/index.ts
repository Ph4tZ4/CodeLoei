export interface Project {
    _id: string; // MongoDB ID
    name: string;
    description: string;
    language: string;
    stars: number;
    downloadCount: number;
    views: number;
    createdAt: string;
    updatedAt: string;
    ownerId: {
        _id: string;
        displayName: string;
        photoURL: string;
        isBanned?: boolean;
    } | string; // Populated or ID
    visibility: 'public' | 'private';
    license?: string;
    tags?: string[];
    starredBy?: string[]; // Array of user IDs
}

export interface FileNode {
    _id: string;
    path: string;
    name: string;
    type: 'file' | 'folder';
    size: number;
    children?: FileNode[]; // For tree structure on frontend
    content?: string; // Optional content
}

export interface User {
    _id: string;
    studentId?: string;
    email: string;
    displayName: string;
    photoURL?: string;
    userType: 'general' | 'college_member' | 'admin';
    bio?: string;
    location?: string;
    website?: string;
    publicEmail?: string;
    skills?: string[];
    pinnedProjects?: string[];
    followers?: string[];
    following?: string[];
    createdAt: string;
    isBanned?: boolean;
    bannedUntil?: string;
}

export interface News {
    _id: string;
    title: string;

    category: string;
    categoryColor: string;
    description: string;
    content: string;
    createdAt: string;
}
