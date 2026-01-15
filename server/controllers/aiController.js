const { GoogleGenerativeAI } = require("@google/generative-ai");
const Project = require('../models/Project');

// Initialize Gemini if API Key is available
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

exports.analyzeProjects = async (req, res) => {
    try {
        // Fetch all projects (or top 20 recent to save tokens)
        const projects = await Project.find({ visibility: 'public' })
            .select('name description tags language createdAt views')
            .sort({ createdAt: -1 })
            .limit(20);

        if (projects.length === 0) {
            return res.json({ summary: "No projects to analyze.", trends: "N/A" });
        }

        // Mock response if no API Key
        if (!genAI) {
            console.log("No GEMINI_API_KEY found. Using mock AI response.");
            return res.json({
                summary: "AI Analysis (จำลอง): โครงการเหล่านี้มุ่งเน้นการพัฒนาเว็บเป็นหลัก โดยใช้เทคโนโลยีอย่าง React, Node.js และ TypeScript มีการเน้นที่การใช้งานจริง เช่น ระบบอีคอมเมิร์ซและการจัดการนักศึกษา",
                trends: "Top Trends (จำลอง): \n1. การใช้ TypeScript เพิ่มขึ้น\n2. ความสนใจใน AI/ML สูงขึ้น\n3. การใช้ MongoDB ในการเก็บข้อมูลยังคงได้รับความนิยม"
            });
        }

        // Real AI Analysis
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
        Analyze the following list of software projects from a student repository:
        ${JSON.stringify(projects)}

        Please provide a concise summary of the core topics and identify top 3 emerging trends (e.g., popular languages, project types).
        **IMPORTANT: Respond strictly in Thai language.**
        Format the output clearly with "Summary:" and "Trends:".
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Simple parsing (assuming AI follows instruction, otherwise send raw text)
        const summaryMatch = text.match(/Summary:([\s\S]*?)(?=Trends:|$)/i);
        const trendsMatch = text.match(/Trends:([\s\S]*)/i);

        res.json({
            summary: summaryMatch ? summaryMatch[1].trim() : text,
            trends: trendsMatch ? trendsMatch[1].trim() : "See summary."
        });

    } catch (err) {
        console.error("AI Analysis Failed:", err);
        res.status(500).json({ msg: "AI Analysis Service Unavailable", error: err.message });
    }
};

exports.analyzeOverview = async (req, res) => {
    try {
        // 1. Gather comprehensive stats (duplicated from projectController to be self-contained)

        // Language Distribution
        const langStats = await Project.aggregate([
            { $group: { _id: "$language", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // Visibility
        const visibilityStats = await Project.aggregate([
            { $group: { _id: "$visibility", count: { $sum: 1 } } }
        ]);

        // Popular Tags
        const popularTags = await Project.aggregate([
            { $unwind: "$tags" },
            { $group: { _id: "$tags", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Top Projects (Context for AI)
        const topProjects = await Project.find({ visibility: 'public' })
            .sort({ views: -1 })
            .limit(5)
            .select('name description stars views language tags');

        const totalProjects = await Project.countDocuments();

        const statsContext = {
            totalProjects,
            languages: langStats.map(s => `${s._id}: ${s.count}`),
            visibility: visibilityStats.map(s => `${s._id}: ${s.count}`),
            topTags: popularTags.map(t => `${t._id} (${t.count})`),
            sampleTopProjects: topProjects
        };

        // Mock response if no API Key
        if (!genAI) {
            console.log("No GEMINI_API_KEY found. Using mock AI response for overview.");
            return res.json({
                summary: "AI Overview (จำลอง): ภาพรวมโครงการแสดงให้เห็นถึงความตื่นตัวในการพัฒนาเว็บแอปพลิเคชัน โดยภาษา JavaScript และ TypeScript เป็นภาษาที่ได้รับความนิยมสูงสุด โปรเจกต์ส่วนใหญ่มีการเปิดเผยเป็นสาธารณะเพื่อแบ่งปันความรู้",
                trends: "Key Trends (จำลอง): \n1. Full-stack Development เป็นที่นิยมสูงสุด\n2. มีการใช้ AI/ML libraries เพิ่มขึ้นในโปรเจกต์ปีนี้\n3. การทำโปรเจกต์เพื่อสังคมและการศึกษาได้รับความสนใจมากขึ้น"
            });
        }

        // Real AI Analysis
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
        Analyze the following aggregated project statistics from a student repository:
        ${JSON.stringify(statsContext)}

        Please provide an "Executive Summary" (overview of the ecosystem state) and identify "Key Trends & Patterns" (what students are focusing on).
        
        **IMPORTANT: Respond strictly in Thai language.**
        Format the output clearly with "Summary:" and "Trends:".
        Keep the tone professional yet encouraging for students.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Simple parsing
        const summaryMatch = text.match(/Summary:([\s\S]*?)(?=Trends:|$)/i);
        const trendsMatch = text.match(/Trends:([\s\S]*)/i);

        res.json({
            summary: summaryMatch ? summaryMatch[1].trim() : text,
            trends: trendsMatch ? trendsMatch[1].trim() : "See summary."
        });

    } catch (err) {
        console.error("AI Overview Analysis Failed:", err);
        res.status(500).json({ msg: "AI Service Unavailable", error: err.message });
    }
};
