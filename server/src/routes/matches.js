const express = require('express');
const router = express.Router();
const { createMatch, getMatchById, getMatches } = require('../controllers/matchesController');

router.post('/', createMatch);
router.get('/', getMatches);
router.get('/:id', getMatchById);

module.exports = router;