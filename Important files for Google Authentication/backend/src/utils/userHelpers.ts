export const isCollegeMemberEmail = (email: string): boolean => {
    if (!email || !email.includes('@')) {
        return false;
    }

    const [username, domain] = email.split('@');

    // Check domain
    if (domain !== 'loeitech.ac.th') {
        return false;
    }

    // Check if username contains only digits and is exactly 11 digits
    if (!/^\d+$/.test(username) || username.length !== 11) {
        return false;
    }

    // Check if username contains the sequence 31901
    if (!username.includes('31901')) {
        return false;
    }

    return true;
};

export const classifyUserType = (email: string): 'general' | 'college_member' => {
    return isCollegeMemberEmail(email) ? 'college_member' : 'general';
};
