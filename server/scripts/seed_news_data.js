const mongoose = require('mongoose');
const News = require('../models/News');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const MOCK_NEWS = [
    {
        title: 'ปิดปรับปรุงระบบชั่วคราว',
        description: 'ระบบจะปิดปรับปรุงเพื่ออัปเกรดประสิทธิภาพ ในวันที่ 25 มกราคม 2568 เวลา 02:00 น. - 04:00 น.',
        content: '<p>เรียน ผู้ใช้งานทุกท่าน</p><p>ทางทีมงานขอแจ้งปิดปรับปรุงระบบชั่วคราวเพื่ออัปเกรดเซิร์ฟเวอร์และเพิ่มประสิทธิภาพการทำงาน ในวันเสาร์ที่ 25 มกราคม 2568 ตั้งแต่เวลา 02:00 น. ถึง 04:00 น.</p><p>ขออภัยในความไม่สะดวกมา ณ ที่นี้</p>',
        category: 'SYSTEM UPDATE',
        categoryColor: 'text-red-500',
        isPopup: true,
        popupDuration: 1
    },
    {
        title: 'ขอเชิญร่วมนิทรรศการโครงงานนักศึกษา IT Showcase 2025',
        description: 'พบกับผลงานนวัตกรรมจากนักศึกษาชั้นปีที่ 4 สาขาเทคโนโลยีสารสนเทศ',
        content: '<p>ขอเชิญชวนอาจารย์ นักศึกษา และผู้สนใจทุกท่าน เข้าร่วมชมงานแสดงผลงานจบการศึกษา (Senior Project) ของนักศึกษาชั้นปีที่ 4</p><p>ภายในงานพบกับโครงงานกว่า 50 ผลงาน ทั้ง Web App, Mobile App, IoT และ AI</p><p><strong>สถานที่:</strong> หอประชุมใหญ่ ชั้น 2</p><p><strong>วันที่:</strong> 15 กุมภาพันธ์ 2568</p>',
        category: 'EVENT',
        categoryColor: 'text-purple-500',
        isPopup: false
    },
    {
        title: 'ประกาศรับสมัครทุนเรียนดี ปีการศึกษา 2568',
        description: 'เปิดรับสมัครทุนการศึกษาสำหรับนักศึกษาที่มีผลการเรียนดีเด่น ประจำปีการศึกษา 2568',
        content: '<p>งานกิจการนักศึกษา เปิดรับสมัครทุนเรียนดีสำหรับนักศึกษาชั้นปีที่ 2-4 ที่มีเกรดเฉลี่ยสะสม (GPAX) ตั้งแต่ 3.50 ขึ้นไป</p><p><strong>ส่งใบสมัครได้ที่:</strong> ห้องสำนักงานคณะ</p><p><strong>หมดเขต:</strong> 28 กุมภาพันธ์ 2568</p>',
        category: 'SCHOLARSHIP',
        categoryColor: 'text-yellow-500',
        isPopup: false
    },
    {
        title: 'แจ้งกำหนดการลงทะเบียนเรียน ภาคเรียนที่ 1/2569',
        description: 'นักศึกษาสามารถตรวจสอบกำหนดการลงทะเบียนเรียนล่วงหน้าได้แล้ววันนี้',
        content: '<p>ปฏิทินการศึกษาประจำภาคเรียนที่ 1/2569 ได้ประกาศแล้ว</p><ul><li>ลงทะเบียนเรียนล่วงหน้า: 1-5 มีนาคม 2569</li><li>ชำระค่าธรรมเนียม: 1-10 มีนาคม 2569</li><li>เปิดภาคเรียน: 15 พฤษภาคม 2569</li></ul>',
        category: 'ACADEMIC',
        categoryColor: 'text-blue-500',
        isPopup: false
    },
    {
        title: 'รับสมัครทีมแข่งขัน Hackathon: AI for Good',
        description: 'เฟ้นหาสุดยอดไอเดียใช้ AI เพื่อสังคม ชิงเงินรางวัลรวมกว่า 50,000 บาท',
        content: '<p>ชมรมคอมพิวเตอร์ ขอเชิญชวนนิสิตนักศึกษาที่สนใจด้าน AI เข้าร่วมแข่งขัน Hackathon ในหัวข้อ "AI for Good"</p><p>รวมทีม 3-5 คน สมัครได้แล้ววันนี้ - 10 กุมภาพันธ์ 2568</p>',
        category: 'ACTIVITY',
        categoryColor: 'text-green-500',
        isPopup: false
    },
    {
        title: 'ผลการคัดเลือกตัวแทนแข่งขันทักษะวิชาชีพ',
        description: 'ประกาศรายชื่อนักศึกษาตัวแทนคณะเข้าร่วมแข่งขันทักษะวิชาชีพระดับภาค',
        content: '<p>ขอแสดงความยินดีกับนักศึกษาที่ผ่านการคัดเลือกเป็นตัวแทนคณะ เพื่อเข้าร่วมการแข่งขันทักษะวิชาชีพ ประเภทการเขียนโปรแกรมคอมพิวเตอร์</p><p>1. นายสมชาย ใจดี</p><p>2. นางสาวสมหญิง จริงใจ</p>',
        category: 'ANNOUNCEMENT',
        categoryColor: 'text-orange-500',
        isPopup: false
    }
];

const seedNews = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/it-student-repo';
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('MongoDB Connected');

        // Clear existing news
        console.log('Clearing existing news...');
        await News.deleteMany({});

        // Insert new news
        console.log('Inserting news items...');
        await News.insertMany(MOCK_NEWS);

        console.log(`Seeding complete. Inserted ${MOCK_NEWS.length} news items.`);
        process.exit();
    } catch (err) {
        console.error('Error seeding news:', err);
        process.exit(1);
    }
};

seedNews();
