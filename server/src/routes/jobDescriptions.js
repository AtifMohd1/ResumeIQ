const express = require('express');
const router = express.Router();
const { createJobDescription, getJobDescriptions } = require('../controllers/jobDescriptionsController');

router.post('/', createJobDescription);
router.get('/', getJobDescriptions);

module.exports = router;