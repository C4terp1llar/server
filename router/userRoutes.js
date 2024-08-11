const express = require('express');
const UserController = require('../controllers/UserController');
const router = express.Router();
const authMiddleware = require('../middlewares/AuthMiddleware');

router.post('/login', UserController.login);
router.post('/register', UserController.register);
router.post('/refresh-token', UserController.refreshToken);
router.get('/users', authMiddleware.authenticateToken, UserController.getUsers);

module.exports = router;