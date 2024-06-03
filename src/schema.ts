/*
NOTE:
For namining conventions for custom indexing, include the abbreivation of the table's name at the start,
then column name, then 'idx', all lower-case.

Example, `word_retrieval_session_message` indexes `session_id` column.
Index name should be `wrsm_sessionid_idx`

(`word_retrieval_session_message` -> `wrsm`)
*/

import { integer, pgTable, uuid, text, index, uniqueIndex, varchar, date, timestamp, primaryKey, pgEnum, serial, smallint, bigint, boolean } from "drizzle-orm/pg-core";

const defaultTokenCount = parseInt(process.env.DEFAULT_STARTING_TOKEN || "25000") ?? 25000;

export const account = pgTable('account', {
	id: uuid('id').primaryKey(),
	token: integer('token').default(defaultTokenCount).notNull(),
	freeTokenUsage: boolean('free_token_usage').default(false).notNull()
});

export const conversation = pgTable('conversation', {
	id: serial('id').primaryKey(),
	accountID: uuid('account_id').references(() => account.id, {onDelete: 'restrict'}).notNull(),
	title: varchar('title', { length: 256 }).notNull(),
	archived: boolean('archived').default(false).notNull(),
	deleted: boolean('deleted').default(false).notNull(),
	creationDate: date('creation_date', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
	return {
	  accountIdx: index("account_c_idx").on(table.accountID)
	};
});

export const messageAuthorEnum = pgEnum('message_author_enum', 
	['SYSTEM', 'BOT', 'USER']
)

export const message = pgTable('message', {
	id: serial('id').primaryKey(),
	conversationID: serial('conversation_id').references(() => conversation.id, {onDelete: 'restrict'}).notNull(),
	content: text('content').notNull(),
	tokenCost: integer('token_cost').notNull(),
	sender: messageAuthorEnum('sender').notNull(),
	botModel: text('bot_model'),
	creationDate: timestamp('creation_date', { mode: 'date', precision: 0, withTimezone: false }).defaultNow().notNull()
}, (table) => {
	return {
	  conversationIdx: index("conversation_m_idx").on(table.conversationID)
	};
});

export const messageAttachment = pgTable('message_attachment', {
	id: serial('id').primaryKey(),
	conversationID: serial('conversation_id').references(() => conversation.id, {onDelete: 'restrict'}).notNull(),
	messageID: serial('message_id').references(() => message.id, {onDelete: 'restrict'}).notNull(),
	fileName: text('file_name').notNull(),
	fileType: text('file_type').notNull(),
	creationDate: timestamp('creation_date', { mode: 'date', precision: 0, withTimezone: false }).defaultNow().notNull(),
	collectionID: text('collection_id').unique(),
}, (table) => {
	return {
	  messageIdx: index("message_a_idx").on(table.messageID),
	  conversationIdx: index("conversation_a_idx").on(table.conversationID),
	};
});


export const shareStatusEnum = pgEnum('share_status_enum', 
	['NONE', 'INVITE_ONLY', 'PUBLIC_PASSWORD', 'PUBLIC']
)

export const sharedConversation = pgTable('shared_conversation', {
	id: uuid('id').defaultRandom().primaryKey(),
	conversationID: serial('conversation_id').references(() => conversation.id, {onDelete: 'restrict'}).notNull(),
	status: shareStatusEnum("status").notNull().default("NONE"),
	expiryDate: timestamp('expiry_date', { mode: 'date', precision: 0, withTimezone: false }),
	hashedPassword: text('hashed_password')
}, (table) => {
	return {
	  conversationIdx: index("conversation_sc_idx").on(table.conversationID),
	};
});

export const sharedUser = pgTable('shared_user', {
	sharedConversationID: uuid('shardc_id').references(() => sharedConversation.id, {onDelete: 'restrict'}).notNull(),
	accountID: uuid('account_id').references(() => account.id, {onDelete: 'restrict'}).notNull()
}, (table) => {
	return {
	  pk: primaryKey({ columns: [table.sharedConversationID, table.accountID] })
	};
});


export const logSeverityEnum = pgEnum('log_severity_enum', 
	['INFO', 'DEBUG', 'VERBOSE', 'WARNING', 'ERROR', 'CRITICAL']
)

export const log = pgTable('log', {
	id: serial('id').primaryKey(),
	content: text('content').notNull(),
	severity: logSeverityEnum('severity').notNull().default("INFO"),
	createdAt: timestamp('at', { mode: 'date', precision: 0, withTimezone: false }).defaultNow().notNull(),
})