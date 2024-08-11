const jwt = require('jsonwebtoken');
const Token = require('../models/Token');

class AuthMiddleware {
    // Middleware для проверки токена
    async authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // берем ацесс токен из хедера

        if (!token) {
            return res.status(401).json({ error: "Доступ запрещён, токен не предоставлен" }); // если нет токена то ретерним ошибку
        }

        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ error: "Неверный или просроченный токен" }); // если токен истек или невалидный ретерним 403
            }
            req.user = user;
            next();
        });
    }

    // Middleware для обновления refresh токена
    async refreshToken(req, res, next) {
        try {
            const { refreshToken, device } = req.body;

            if (!refreshToken || !device) {
                return res.status(400).json({ error: "Не хватает данных" });
            }

            jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, user) => {
                if (err) {
                    return res.status(403).json({ error: "Неверный или просроченный токен" });
                }

                const tokenRecord = await Token.findOne({ userID: user.userId, device: device });

                if (!tokenRecord || tokenRecord.token !== refreshToken) {
                    return res.status(403).json({ error: "Токен не найден или не соответствует устройству" });
                }

                // Генерация нового access токена
                const accessToken = jwt.sign({ userId: user.userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });

                req.accessToken = accessToken;
                req.userId = user.userId;
                next();
            });
        } catch (err) {
            return res.status(500).json({ error: "Ошибка сервера", details: err.message });
        }
    }
}

module.exports = new AuthMiddleware();
