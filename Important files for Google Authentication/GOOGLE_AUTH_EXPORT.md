# Google OAuth Configuration (Complete Export)

This file contains **every single Google OAuth key and configuration** found in the entire Project Codeloei codebase, including both the current (new) folders and the legacy (old) folders.

## 1. Google Client ID (Used Everywhere)

The same Client ID is used across **all** parts of the project (Frontend, Backend, Legacy Frontend, Legacy Backend).

**Key:** `GOOGLE_CLIENT_ID`
**Value:** `616609232183-qth5o01fmleiketoq9o4atjavcuom9bt.apps.googleusercontent.com`

---

## 2. Google Client Secret (Status)

**Status:** ⚠️ NOT FOUND / PLACEHOLDER ONLY
I have performed a deep scan of all files (including hidden `.env` files and legacy code). **No actual Client Secret key exists in the codebase.**

- **Backend (New)**: Uses ID Token verification which does *not* require a Client Secret.
- **Backend (Legacy)**: The file `backend-legacy/config.py` contains a placeholder: `'your-google-client-secret'`.
- **Frontend**: Client Secrets are never used in the frontend for security reasons.

**Action Required:** If you plan to use a flow that requires a secret (like the Authorization Code flow) in your new project, you will need to generate a new Client Secret from the [Google Cloud Console](https://console.cloud.google.com/).

---

## 3. detailed Configuration by Component

### Current Project (New)

#### Frontend (React)
- **Path:** `frontend/src/main.tsx`
- **Usage:**
  ```tsx
  <GoogleOAuthProvider clientId="616609232183-qth5o01fmleiketoq9o4atjavcuom9bt.apps.googleusercontent.com">
  ```

#### Backend (Node.js/TypeScript)
- **Path:** `backend/src/controllers/authController.ts`
- **Usage:**
  ```typescript
  // Uses ID Token flow - Secure and does not need Client Secret
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  ```

### Legacy Project (Old)

#### Frontend (Nuxt/Vue)
- **Path:** `frontend-legacy/pages/signin.vue`
- **Usage:**
  ```javascript
  const GOOGLE_CLIENT_ID = '616609232183-qth5o01fmleiketoq9o4atjavcuom9bt.apps.googleusercontent.com'
  ```
- **Path:** `frontend-legacy/nuxt.config.ts`
- **Usage:** Loads `https://accounts.google.com/gsi/client`

#### Backend (Python/Flask)
- **Path:** `backend-legacy/config.py`
- **Usage:**
  ```python
  GOOGLE_CLIENT_ID = '616609232183-qth5o01fmleiketoq9o4atjavcuom9bt.apps.googleusercontent.com'
  GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET') or 'your-google-client-secret' # Placeholder
  GOOGLE_DISCOVERY_URL = 'https://accounts.google.com/.well-known/openid_configuration'
  ```

## 4. Environment Variable Template (.env)

Use this for your new project to match the current setup exactly:

```env
# Google OAuth
GOOGLE_CLIENT_ID=616609232183-qth5o01fmleiketoq9o4atjavcuom9bt.apps.googleusercontent.com
# GOOGLE_CLIENT_SECRET=  <-- Leave empty or fill if you generate a new one
```

---

## 5. User Classification Logic (Logic Check)

The system automatically classifies users into types based on their email pattern. This logic is located in `backend/src/utils/userHelpers.ts`.

### Current Logic Rules

1.  **Department Student (นักศึกษาในแผนก 31901)**
    *   **Check**:
        1.  Email domain is `@loeitech.ac.th`
        2.  Username consists of **only digits** and is **exactly 11 characters** long.
        3.  Username **must contain** the sequence `31901`.
    *   **Result**: `college_member`

2.  **General Person (คนทั่วไป)**
    *   **Check**: All other cases (e.g. `@gmail.com`, or `@loeitech.ac.th` without the specific ID pattern).
    *   **Result**: `general`

*> Note: currently there is no separate specific logic for "General College Student" (outside dept 31901). They would fall under "General Person" unless the logic is modified.*

### Code Snippet (`userHelpers.ts`)

You can use this function in your new project to replicate the logic:

```typescript
export const classifyUserType = (email: string): 'general' | 'college_member' => {
    if (!email || !email.includes('@')) return 'general';

    const [username, domain] = email.split('@');

    // 1. Check Domain
    if (domain !== 'loeitech.ac.th') return 'general';

    // 2. Check ID Format (11 digits)
    if (!/^\d+$/.test(username) || username.length !== 11) return 'general';

    // 3. Check Department Code (31901)
    if (!username.includes('31901')) return 'general';

    return 'college_member';
};
```

