const express = require('express');
const router = express.Router();
const Usermongo = require('../models/User-mongo');
const Postmongo = require('../models/post-mongo');
const shamemongo = require('../models/Shame-Panel');
const isloggedin = require('../middleware/isloggein');


module.exports = router;