const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const auth = require('../middleware/auth');

const authOptional = require('../middleware/authOptional');

// Public routes (with optional auth to see private content)
router.get('/', authOptional, projectController.getProjects);
router.get('/popular', projectController.getPopularProjects); // Probably public only?
router.get('/user/:userId', authOptional, projectController.getProjectsByUser); // New route
router.get('/:id', authOptional, projectController.getProject);
router.get('/:id/files', authOptional, projectController.getProjectFiles);
router.get('/:id/file', authOptional, projectController.getFileContent);

// Protected routes
router.post('/', auth, projectController.createProject);
router.put('/:id', auth, projectController.updateProject);
router.delete('/:id', auth, projectController.deleteProject);

router.post('/upload', auth, projectController.uploadFiles);
router.delete('/:id/files', auth, projectController.deleteFile);
router.put('/:id/star', auth, projectController.starProject);
router.get('/:id/download', auth, projectController.downloadProject); // Auth required to track download? Maybe optional but for now Auth.

router.get('/stats/dashboard', auth, projectController.getDashboardStats); // New route for dashboard

module.exports = router;
