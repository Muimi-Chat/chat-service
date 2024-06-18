import express, { Request, Response } from 'express';
import cors from 'cors';

import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';


import tokenRoutes from './api/routes/tokenRoutes'
import conversationRoutes from './api/routes/conversationRoutes'
import chatMessageConsumer from './api/consumers/chatMessageConsumer';

const app = express();
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

const server = createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Handle WebSocket connections
wss.on('connection', (ws: WebSocket) => {
	console.log('Client connected to /api-chat/chat');

	ws.on('message', (message: string) => {
		chatMessageConsumer(ws, message)
	});

	ws.on('close', () => {
		console.log('Client disconnected');
	});
});

// Middleware to handle upgrade requests to WebSocket on a specific path
server.on('upgrade', (request, socket, head) => {
	const pathname = new URL(request.url!, `http://${request.headers.host}`).pathname;

	if (pathname === '/api-chat/chat') {
		wss.handleUpgrade(request, socket, head, (ws: any) => {
			wss.emit('connection', ws, request);
		});
	} else {
		socket.destroy();
	}
});

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});