const News = require('../models/News');

// Get all news
exports.getNews = async (req, res) => {
    try {
        const news = await News.find().sort({ createdAt: -1 });
        res.json(news);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get single news by ID
exports.getNewsById = async (req, res) => {
    try {
        const news = await News.findById(req.params.id);
        if (!news) {
            return res.status(404).json({ msg: 'News not found' });
        }
        res.json(news);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'News not found' });
        }
        res.status(500).send('Server Error');
    }
};

// Seed initial data
exports.seedNews = async (req, res) => {
    try {
        const count = await News.countDocuments();
        if (count > 0) {
            return res.status(400).json({ msg: 'News already seeded' });
        }

        const initialNews = [
            {
                title: 'เปิดรับสมัครผลงาน Senior Project 2026',
                category: 'ACADEMIC',
                categoryColor: 'text-blue-400',
                description: 'ขอเชิญชวนนักศึกษาชั้นปีที่ 4 ส่งผลงานเข้าร่วมประกวดในโครงการ Senior Project ประจำปีการศึกษา 2568 ชิงเงินรางวัลรวมกว่า 50,000 บาท',
                content: `
                    <p>คณะเทคโนโลยีสารสนเทศ ขอเชิญชวนนักศึกษาชั้นปีที่ 4 ส่งผลงานเข้าร่วมประกวดในโครงการ Senior Project ประจำปีการศึกษา 2568</p>
                    <br/>
                    <h3>รายละเอียดการสมัคร</h3>
                    <ul>
                        <li>เปิดรับสมัคร: 1 มกราคม - 28 กุมภาพันธ์ 2568</li>
                        <li>ประกาศผลรอบคัดเลือก: 15 มีนาคม 2568</li>
                        <li>รอบชิงชนะเลิศ: 1 เมษายน 2568</li>
                    </ul>
                    <br/>
                    <h3>รางวัล</h3>
                    <ul>
                        <li>รางวัลชนะเลิศ: 20,000 บาท</li>
                        <li>รางวัลรองชนะเลิศอันดับ 1: 15,000 บาท</li>
                        <li>รางวัลรองชนะเลิศอันดับ 2: 10,000 บาท</li>
                        <li>รางวัลชมเชย 2 รางวัล: รางวัลละ 2,500 บาท</li>
                    </ul>
                `
            },
            {
                title: 'อัปเดตระบบจัดเก็บข้อมูลใหม่',
                category: 'SYSTEM UPDATE',
                categoryColor: 'text-green-400',
                description: 'ทางสาขาวิชาเทคโนโลยีสารสนเทศได้ทำการอัปเกรดระบบจัดเก็บข้อมูลเพื่อรองรับปริมาณงานที่เพิ่มขึ้น เพิ่มความเร็วในการเข้าถึงข้อมูล 20%',
                content: `
                    <p>เรียน อาจารย์และนักศึกษาทุกท่าน</p>
                    <p>ทางสาขาวิชาเทคโนโลยีสารสนเทศได้ดำเนินการอัปเกรดระบบ Server และ Storage ของคณะ เพื่อรองรับปริมาณข้อมูลโปรเจกต์นักศึกษาที่เพิ่มมากขึ้นในแต่ละปี</p>
                    <br/>
                    <h3>สิ่งที่ปรับเปลี่ยน</h3>
                    <ul>
                        <li>เพิ่มความจุ Storage เป็น 50TB</li>
                        <li>อัปเกรด RAM ของ Server หลัก</li>
                        <li>ปรับปรุงระบบ Network ภายในให้มี Bandwidth สูงขึ้น</li>
                    </ul>
                    <br/>
                    <p>ผลจากการปรับปรุงจะช่วยให้การ Upload และ Download ไฟล์งานรวดเร็วขึ้นประมาณ 20-30%</p>
                `
            },
            {
                title: 'กิจกรรม Workshop: Modern Web Dev',
                category: 'EVENT',
                categoryColor: 'text-purple-400',
                description: 'เตรียมพบกับกิจกรรม Workshop สอนพัฒนาเว็บแอปพลิเคชันด้วย React และ Tailwind CSS โดยรุ่นพี่ศิษย์เก่าที่มีประสบการณ์ทำงานจริง',
                content: `
                    <p>กลับมาอีกครั้งกับกิจกรรม IT Workshop Series ครั้งที่ 1 ประจำปี 2026</p>
                    <p>หัวข้อ: <strong>"Modern Web Development with React & Tailwind CSS"</strong></p>
                    <br/>
                    <p>สอนโดย: พี่บอม (Alumni รุ่น 15) Senior Frontend Developer จากบริษัท Tech ชั้นนำ</p>
                    <br/>
                    <p><strong>สิ่งที่น้องๆ จะได้เรียนรู้:</strong></p>
                    <ul>
                        <li>พื้นฐาน React Hooks (useState, useEffect)</li>
                        <li>การจัด Layout สวยๆ ด้วย Tailwind CSS</li>
                        <li>การเชื่อมต่อ API เบื้องต้น</li>
                        <li>Best Practices ในการเขียนโค้ด</li>
                    </ul>
                    <br/>
                    <p>ลงทะเบียนฟรี! รับจำนวนจำกัด 50 ที่นั่ง</p>
                `
            }
        ];

        await News.insertMany(initialNews);
        res.json({ msg: 'News seeded successfully', count: initialNews.length });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// --- Admin Only Methods ---

// Create News
exports.createNews = async (req, res) => {
    try {
        if (req.user.userType !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { title, category, categoryColor, description, content } = req.body;

        const newNews = new News({
            title,
            category,
            categoryColor,
            description,
            content
        });

        const news = await newNews.save();
        res.json(news);
    } catch (err) {
        console.error(err.message);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server Error');
    }
};

// Update News
exports.updateNews = async (req, res) => {
    try {
        if (req.user.userType !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { title, category, categoryColor, description, content } = req.body;

        let news = await News.findById(req.params.id);
        if (!news) {
            return res.status(404).json({ msg: 'News not found' });
        }

        news = await News.findByIdAndUpdate(
            req.params.id,
            { title, category, categoryColor, description, content },
            { new: true }
        );

        res.json(news);
    } catch (err) {
        console.error(err.message);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server Error');
    }
};

// Delete News
exports.deleteNews = async (req, res) => {
    try {
        if (req.user.userType !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const news = await News.findById(req.params.id);
        if (!news) {
            return res.status(404).json({ msg: 'News not found' });
        }

        await News.findByIdAndDelete(req.params.id);
        res.json({ msg: 'News removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
