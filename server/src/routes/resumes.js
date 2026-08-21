const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { createResume, getResumes, uploadResume } = require('../controllers/resumesController');

router.post('/', createResume);
router.get('/', getResumes);
router.post('/upload', upload.single('resume'), uploadResume);

module.exports = router;