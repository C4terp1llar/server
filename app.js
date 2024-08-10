const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const userRoutes = require('./router/userRoutes');

dotenv.config();

const PORT = process.env.PORT || 5000;

const app = express();
app.use(express.json());
app.use(cors())
app.use('/api', userRoutes)

mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log('БД подключена'))
    .catch(err => console.log(err));

app.listen(PORT, 'localhost',(err) => {
    err? console.log(err) : console.log('Запущен на http://localhost:', PORT);
})