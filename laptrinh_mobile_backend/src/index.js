import express from 'express';
import router from './routes/index.route.js';

const app = express();

app.use(express.json());

// Khai báo route
app.use(router);

const PORT = process.env.PORT || 5000;



app.listen(PORT, () => {
    console.log(`Backend Express đang chạy trên port ${PORT}`);
});