const express = require('express');
const UserController = require('../controllers/UserController');
const router = express.Router();

router.post('/login', UserController.login)
router.post('/registration', UserController.register)

router.get('/users', UserController.getUsers)

module.exports = router;