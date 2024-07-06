import express from 'express';
import cors from 'cors';

import { db } from "src/db";
import { configuration } from "src/schema";

import tokenRoutes from './api/routes/tokenRoutes'
import conversationRoutes from './api/routes/conversationRoutes'
import chatMessageConsumer from './api/consumers/chatMessageConsumer';

const app = express();

import expressWs from 'express-ws';
import insertLog from './api/repositories/insertLog';
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

async function _initalizeConfiguration() {
	const rows = await db.select().from(configuration);
	
	if (rows.length <= 0) {
		await db.insert(configuration).values({
			defaultUsersTokenCount: 25000
		})
		await insertLog("Created configuration", "INFO")
		console.log("Missing configuration, added.")
	} else if (rows.length >= 2) {
		await insertLog("There is more than one configuration row in the database. This should not happen!", "WARNING")
		console.warn("More than 1 configuration row exists!")
	} else {
		console.log("Configuration exists!")
	}
}

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);

	_initalizeConfiguration().then(() => {
		console.log("Checked configuration")}
	)
});