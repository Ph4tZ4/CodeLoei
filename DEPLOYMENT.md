# คู่มือการ Deploy

คู่มือนี้จะอธิบายวิธีการนำ **Client** ขึ้น [Vercel](https://vercel.com) และ **Server** ขึ้น [Render](https://render.com)

## สิ่งที่ต้องเตรียม

1.  อัปโหลดโค้ดล่าสุดขึ้น GitHub Repository
2.  เตรียม Connection String ของ MongoDB (เช่น จาก MongoDB Atlas)

---

## ส่วนที่ 1: Deploy Server (Render)

1.  **สร้าง Web Service**
    *   เข้าสู่ระบบ [Render](https://render.com)
    *   คลิก **New +** -> **Web Service**
    *   เชื่อมต่อกับ GitHub Repository ของคุณ

2.  **ตั้งค่า Service**
    *   **Name:** `it-student-repo-server` (หรือชื่ออื่นๆ ที่ต้องการ)
    *   **Root Directory:** `server` (สำคัญมาก! ต้องเลือกโฟลเดอร์ server)
    *   **Runtime:** `Node`
    *   **Build Command:** `npm install`
    *   **Start Command:** `node server.js` (หรือ `npm start`)

3.  **ตั้งค่า Environment Variables**
    *   เลื่อนลงไปที่หัวข้อ "Environment Variables" แล้วกด Add Environment Variable:
        *   `MONGO_URI`: ใส่ Connection String ของ MongoDB (เช่น `mongodb+srv://...`)
        *   `NODE_ENV`: `production`
        *   `CLIENT_URL`: URL ของหน้าเว็บ Client ที่จะ Deploy บน Vercel (เช่น `https://your-app.vercel.app`)
            *   *หมายเหตุ: เนื่องจากเรายังไม่ได้ Deploy Client ในขั้นตอนนี้ คุณสามารถเว้นว่างไว้ก่อน หรือใส่ค่าชั่วคราว แล้วค่อยกลับมาแก้หลังจากทำส่วนที่ 2 เสร็จ*

4.  **สั่ง Deploy**
    *   คลิกปุ่ม **Create Web Service**
    *   รอจนกว่าสถานะจะขึ้นว่า Live
    *   **คัดลอก URL ของ Service** มาเก็บไว้ (เช่น `https://it-student-repo-server.onrender.com`) เราต้องใช้ URL นี้ในขั้นตอนต่อไป

---

## ส่วนที่ 2: Deploy Client (Vercel)

1.  **สร้าง Project ใหม่**
    *   เข้าสู่ระบบ [Vercel](https://vercel.com)
    *   คลิก **Add New...** -> **Project**
    *   เลือก Import Repository ของคุณ

2.  **ตั้งค่า Project**
    *   **Framework Preset:** `Vite` (Vercel ควรจะเลือกให้อัตโนมัติ)
    *   **Root Directory:** คลิก "Edit" แล้วเลือกโฟลเดอร์ `client`

3.  **ตั้งค่า Environment Variables**
    *   เปิดหัวข้อ "Environment Variables"
    *   เพิ่มตัวแปร:
        *   **Name:** `VITE_API_URL`
        *   **Value:** ใส่ URL ของ Server จาก Render แล้วเติม `/api` ต่อท้าย (ตัวอย่าง: `https://it-student-repo-server.onrender.com/api`)
        *   *สำคัญ: อย่าลืมเติม `/api` ที่ด้านหลัง เพราะโค้ด Client ของเราเรียกใช้ path นี้*

4.  **สั่ง Deploy**
    *   คลิก **Deploy**

---

## ส่วนที่ 3: เชื่อมต่อให้สมบูรณ์

1.  **อัปเดต Server CORS**
    *   กลับไปที่ Dashboard ของ **Render** (ส่วน Server)
    *   ไปที่เมนู **Environment Variables**
    *   อัปเดต (หรือเพิ่ม) `CLIENT_URL` ให้เป็น URL จริงของ Vercel ที่เพิ่ง Deploy เสร็จ (เช่น `https://your-app-123.vercel.app`) **(ไม่ต้องมี / ต่อท้าย)**
    *   Render จะทำการ Deploy รอบใหม่ให้อัตโนมัติเมื่อแก้ค่าตัวแปร

2.  **ตรวจสอบความเรียบร้อย**
    *   เปิดหน้าเว็บ Vercel ของคุณ
    *   ลองล็อกอินหรือใช้งานข้อมูลต่างๆ หน้าเว็บควรจะเชื่อมต่อกับ Server ที่อยู่บน Render ได้อย่างถูกต้อง
