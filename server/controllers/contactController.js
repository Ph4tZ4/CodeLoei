const Contact = require('../models/Contact');

// @desc    Submit contact form
// @route   POST /api/contact
// @access  Public
exports.submitContactForm = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Basic validation
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ msg: 'Please enter all fields' });
        }

        const newContact = new Contact({
            name,
            email,
            subject,
            message
        });

        const savedContact = await newContact.save();

        res.status(201).json({
            msg: 'Message sent successfully',
            contact: savedContact
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
