import express from 'express';
import cors from 'cors';


import tokenRoutes from './api/routes/tokenRoutes'
import conversationRoutes from './api/routes/conversationRoutes'
import chatMessageConsumer from './api/consumers/chatMessageConsumer';

const app = express();

import expressWs from 'express-ws';
expressWs(app);

const port = 3000;

app.use(cors({
	origin: "*"
}));

app.use(express.json());

app.use('/api-chat/token', tokenRoutes);
app.use('/api-chat/', conversationRoutes);

app.get('/api-chat/ping', (req, res) => {
	res.send('Pong!');
});

const wsRouter = express.Router();

wsRouter.ws("/", (ws, req) => {
  ws.on("message", (msg) => {
	chatMessageConsumer(ws, msg)
  });
});

app.use('/api-chat/chat', wsRouter);

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});