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
        let text = "";
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });

            const prompt = `
            Analyze the following list of software projects from a student repository:
            ${JSON.stringify(projects)}

            Please provide a concise summary of the core topics and identify top 3 emerging trends (e.g., popular languages, project types).
            **IMPORTANT: Respond strictly in Thai language.**
            Format the output clearly with "Summary:" and "Trends:".
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            text = response.text();
        } catch (apiError) {
            console.warn("Gemini API Error (Backing off to mock):", apiError.message);
            text = `
             Summary: AI Analysis (Backup Mode): โครงการเหล่านี้มุ่งเน้นการพัฒนาเว็บเป็นหลัก โดยใช้เทคโนโลยีอย่าง React, Node.js และ TypeScript มีการเน้นที่การใช้งานจริง เช่น ระบบอีคอมเมิร์ซและการจัดการนักศึกษา
             Trends: Top Trends (Backup Mode): 
             1. การใช้ TypeScript เพิ่มขึ้น
             2. ความสนใจใน AI/ML สูงขึ้น
             3. การใช้ MongoDB ในการเก็บข้อมูลยังคงได้รับความนิยม
             `;
        }

        // Simple parsing (assuming AI follows instruction, otherwise send raw text)
        const summaryMatch = text.match(/Summary:([\s\S]*?)(?=Trends:|$)/i);
        const trendsMatch = text.match(/Trends:([\s\S]*)/i);

        res.json({
            summary: summaryMatch ? summaryMatch[1].trim() : text,
            trends: trendsMatch ? trendsMatch[1].trim() : "See summary."
        });

    } catch (err) {
        console.error("AI Analysis Failed:", err);
        // Even if everything fails, return something so frontend doesn't crash
        res.json({
            summary: "ไม่สามารถประมวลผลข้อมูลได้ในขณะนี้",
            trends: "โปรดลองใหม่อีกครั้งในภายหลัง"
        });
    }
};

exports.analyzeOverview = async (req, res) => {
    try {
        // ... (data gathering remains mostly same, skipping to model usage)

        // 1. Gather comprehensive stats

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

        // Popular Tags (Most Created - What students like to make)
        const popularTags = await Project.aggregate([
            { $unwind: "$tags" },
            { $group: { _id: "$tags", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Views by Tag (Most Viewed - What people like to see)
        const viewsByTag = await Project.aggregate([
            { $unwind: "$tags" },
            { $group: { _id: "$tags", totalViews: { $sum: "$views" } } },
            { $sort: { totalViews: -1 } },
            { $limit: 10 }
        ]);

        // Top Popular Projects (Score based)
        const topPopular = await Project.aggregate([
            {
                $addFields: {
                    score: {
                        $add: [
                            { $ifNull: ["$stars", 0] },
                            { $ifNull: ["$downloadCount", 0] },
                            { $ifNull: ["$views", 0] }
                        ]
                    }
                }
            },
            { $sort: { score: -1 } },
            { $limit: 5 },
            { $project: { name: 1, score: 1, description: 1, tags: 1 } }
        ]);

        // Top Projects by Views
        const topViewed = await Project.find({ visibility: 'public' })
            .sort({ views: -1 })
            .limit(5)
            .select('name stars views tags');

        const totalProjects = await Project.countDocuments();

        const statsContext = {
            totalProjects,
            languages: langStats.map(s => `${s._id}: ${s.count}`),
            mostCreatedTags: popularTags.map(t => `${t._id} (${t.count} projects)`),
            mostViewedTags: viewsByTag.map(t => `${t._id} (${t.totalViews} views)`),
            topPopularProjects: topPopular.map(p => `${p.name} (Score: ${p.score}, Tags: ${p.tags})`),
            mostViewedProjects: topViewed.map(p => `${p.name} (${p.views} views, Tags: ${p.tags})`)
        };

        // Mock response if no API Key
        if (!genAI) {
            console.log("No GEMINI_API_KEY found. Using mock AI response for overview.");
            return res.json({
                summary: "AI Overview (จำลอง): ภาพรวมแสดงให้เห็นว่านักเรียนนิยมสร้างโปรเจกต์เกี่ยวกับ Web Development (React, Node.js) แต่ความสนใจของผู้เข้าชมกลับพุ่งเป้าไปที่โปรเจกต์ด้าน Data Science และ AI ซึ่งมียอดวิวสูงสุด สิ่งนี้ชี้ให้เห็นถึงความต้องการเนื้อหาที่แตกต่างจากสิ่งที่ผลิต",
                trends: "Key Trends (จำลอง): \n1. Supply vs Demand: นักเรียนทำเว็บเยอะ แต่คนดูอยากดู AI\n2. Top Project: 'Smart Home Automation' ได้รับความนิยมสูงสุดจากคะแนนรวม\n3. ภาษา: Python มียอดวิวเฉลี่ยต่อโปรเจกต์สูงกว่า JavaScript"
            });
        }

        // Real AI Analysis
        let text = "";
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });

            const prompt = `
            Analyze the following aggregated project statistics from a student repository:
            ${JSON.stringify(statsContext)}

            Please provide an "Executive Summary" and "Key Trends".
            
            **Specific Analysis Required:**
            1. **Compare "What students like to make" (mostCreatedTags) vs "What people like to view" (mostViewedTags).** Access if there is a gap between supply and demand.
            2. **Highlight the "Top Popular Projects" and "Most Viewed Projects".** Mention what types of projects they are.
            3. **Identify emerging themes.**

            **IMPORTANT: Respond strictly in Thai language.**
            Format the output clearly with "Summary:" and "Trends:".
            Keep the tone professional yet encouraging.
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            text = response.text();

        } catch (apiError) {
            console.warn("Gemini API Error (Backing off to mock):", apiError.message);
            // Fallback Mock Response (Updated with new logic reflection)
            text = `
            Summary: AI Overview (Backup Mode): เนื่องจากข้อจำกัดการเชื่อมต่อ AI ระบบจึงแสดงผลการวิเคราะห์สำรอง: ภาพรวมแสดงให้เห็นว่านักเรียนนิยมสร้างโปรเจกต์เกี่ยวกับ Web Development (React, Node.js) แต่ความสนใจของผู้เข้าชมกลับพุ่งเป้าไปที่โปรเจกต์ด้าน Data Science และ AI ซึ่งมียอดวิวสูงสุด
            Trends: Key Trends (Backup Mode): 
            1. Supply vs Demand: นักเรียนทำเว็บเยอะ แต่คนดูอยากดู AI
            2. Top Project: 'Smart Home Automation' ได้รับความนิยมสูงสุดจากคะแนนรวม
            3. ภาษา: Python มียอดวิวเฉลี่ยต่อโปรเจกต์สูงกว่า JavaScript
            `;
        }

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
