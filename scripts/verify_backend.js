// Native fetch in Node 18+

const BASE_URL = 'http://127.0.0.1:8000/api';
const EMAIL = `test_${Date.now()}@test.com`;
const PASSWORD = 'password123';
const ADMIN_EMAIL = 'admin@codeloei.com'; // Adjust if needed
const ADMIN_PASSWORD = 'secureAdminPassword'; // Adjust if needed

// Note: Node 18+ has native fetch. If on older node, might fail without package.
// We will assume environment supports it or use http module if needed.
// For robustness, let's use a simple http wrapper to avoid dependencies if possible,
// but fetch is cleaner. Let's try native fetch first.

async function verifyFeatures() {
    console.log("Starting Verification...");

    // 1. Test OTP Flow
    console.log("\n--- Testing OTP Flow ---");
    let otp = '';

    // 1.1 Register
    console.log(`Registering user: ${EMAIL}`);
    try {
        const res = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD, displayName: 'TestUser' })
        });
        const data = await res.json();
        console.log('Register Response Status:', res.status);
        console.log('Register Response Data:', data);

        if (data.requireOtp) {
            console.log("✅ OTP Flow Triggered (requireOtp: true)");
            // We cannot easily get the OTP from email log here without access to stdout of server or DB.
            // But we verified the API responds correctly.
            // For full verification, we need to cheat and find the OTP in DB or Server Logs.
            // Or we just trust the response for now.
        } else {
            console.log("❌ OTP Flow FAILED (requireOtp missing)");
        }

    } catch (e) {
        console.error("❌ Register Failed:", e.message);
    }

    // 2. Test AI Logic
    console.log("\n--- Testing AI Logic ---");
    // We need a token. We can try to use a mock token if auth middleware allows, or login as admin.
    // Let's try to create a temp admin or verify admin login logic if we knew creds.
    // Instead, let's try to use the user we JUST created, but we can't login without OTP...
    // So let's try to register a Google User (bypass OTP) to get a token?
    // Google Login requires an ID token... might be hard to mock using just backend script.

    // Alternative: We check /api/projects/public without token (just to ensure basic API up)
    // Then we try to hit /api/ai/analyze without token -> Expect 401

    try {
        const res401 = await fetch(`${BASE_URL}/ai/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        console.log("AI Analyze without token status (Expect 401/403):", res401.status);

        if (res401.status === 401 || res401.status === 403) {
            console.log("✅ Auth Middleware working on AI verification.");
        }

        // Ideally we want to verify AI actually works.
        // We can create a script inside server context to run the controller function directly?
        // That might be better than valid HTTP request without token.
    } catch (e) {
        console.error("AI Request Failed:", e.message);
    }
}

verifyFeatures();
