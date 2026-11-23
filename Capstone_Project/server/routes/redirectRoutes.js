const express = require('express');
const router = express.Router();
const { handleRedirect } = require('../controllers/redirectController');

// Short code redirection: GET /:code
router.get('/:code', handleRedirect);

module.exports = router;
