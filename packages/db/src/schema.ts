import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const passengers = sqliteTable('passengers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  dob: text('dob').notNull(), // Format: YYYY-MM-DD
  gender: text('gender').notNull(), // 'Male', 'Female', 'Transgender'
  nationality: text('nationality').notNull().default('Indian'),
  aadhaar: text('aadhaar'),
  passport: text('passport'),
  mobile: text('mobile'),
  email: text('email'),
  preferredBerth: text('preferred_berth'), // 'Lower', 'Middle', 'Upper', 'Side Lower', 'Side Upper', etc.
  mealPreference: text('meal_preference'), // 'Veg', 'Non-Veg', 'No Preference'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const documents = sqliteTable('documents', {
  id: text('id').primaryKey(),
  passengerId: text('passenger_id').references(() => passengers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'passport' | 'aadhaar' | 'pan' | 'visa' | 'insurance' | 'other'
  filePath: text('file_path').notNull(),
  ocrText: text('ocr_text'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const memories = sqliteTable('memories', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  embedding: text('embedding').notNull(), // JSON array of numbers
  tags: text('tags').notNull(), // JSON array of string tags
  metadata: text('metadata'), // JSON string of custom metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});
