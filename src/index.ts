import express, { Request, Response } from 'express';
import cors from 'cors';

import tokenRoutes from './api/routes/tokenRoutes'

const app = express();
const port = 3000;

app.use(cors({
    origin:"*"
}));

app.use(express.json());

app.use('/api-chat/token', tokenRoutes);


app.get('/api-chat/ping', (req, res) => {
	res.send('Pong!');
});

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});