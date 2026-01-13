exports.classifyUserType = (email) => {
    if (!email || !email.includes('@')) return 'general';

    const [username, domain] = email.split('@');

    // 1. Check Domain
    if (domain !== 'loeitech.ac.th') return 'general';

    // 2. Check ID Format (11 digits)
    if (!/^\d+$/.test(username) || username.length !== 11) return 'general';

    // 3. Check Department Code (31901 or 21901)
    if (!username.includes('31901') && !username.includes('21901')) return 'general';

    return 'college_member';
};
