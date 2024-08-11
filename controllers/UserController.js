const User = require('../models/User');
const Token = require('../models/Token');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middlewares/AuthMiddleware');

class UserController {
    // Метод для входа
    async login(req, res) {
        try {
            const { email, password, device } = req.body;

            if (!email || !password || !device) {
                return res.status(400).json({ error: "Не хватает данных" });
            }

            const user = await User.findOne({ email });

            if (!user || !await bcrypt.compare(password, user.password)) {
                return res.status(400).json({ error: "Неверный логин или пароль" });
            }

            // Генерация токенов
            const accessToken = jwt.sign({ userId: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
            const refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '30d' });

            // Проверяю если тоуен сущесвует
            let tokenRecord = await Token.findOne({ userID: user._id, device: device });

            if (tokenRecord) {
                // если токен по устройтву есть то обновляем его на новый
                tokenRecord.token = refreshToken;
                tokenRecord.createdAt = Date.now();
                await tokenRecord.save();
            } else {
                // если токена нет то сохраняем его в бд под новым устройством
                tokenRecord = new Token({
                    userID: user._id,
                    token: refreshToken,
                    device: device,
                });

                await tokenRecord.save();
            }


            return res.status(200).json({ accessToken, refreshToken });
        } catch (err) {
            return res.status(500).json({ error: "Ошибка сервера", details: err.message });
        }
    }

    // Метод для регистрации
    async register(req, res) {
        try {
            const { name, email, password, device } = req.body;

            if (!name || !email || !password || !device) {
                return res.status(400).json({ error: "Не хватает данных" });
            }

            const existingUser = await User.findOne({ email });

            if (existingUser) {
                return res.status(400).json({ error: "Пользователь с таким email уже существует" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = new User({ name, email, password: hashedPassword });

            await newUser.save();

            // Генерация токенов после регистрации
            const accessToken = jwt.sign({ userId: newUser._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
            const refreshToken = jwt.sign({ userId: newUser._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '30d' });

            const token = new Token({
                userID: newUser._id,
                token: refreshToken,
                device: device,
            });

            await token.save();

            return res.status(201).json({ accessToken, refreshToken });
        } catch (err) {
            return res.status(500).json({ error: "Ошибка сервера", details: err.message });
        }
    }

    async getUsers(req, res) {
        try {
            // Используем middleware для аутентификации
            await authMiddleware.authenticateToken(req, res, async () => {
                const users = await User.find();
                return res.status(200).json(users);
            });
        } catch (err) {
            return res.status(500).json({ error: "Ошибка сервера", details: err.message });
        }
    }

    // Метод для обновления токена
    async refreshToken(req, res) {
        try {
            await authMiddleware.refreshToken(req, res, () => {
                return res.status(200).json({ accessToken: req.accessToken });
            });
        } catch (err) {
            return res.status(500).json({ error: "Ошибка сервера", details: err.message });
        }
    }
}

module.exports = new UserController();
