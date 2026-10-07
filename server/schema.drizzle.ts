import { type RelationsBuilder } from 'drizzle-orm'
import {
  doublePrecision,
  text,
  timestamp,
  uuid
} from 'drizzle-orm/pg-core'

import { createModuleTable } from '@lifeforge/drizzle'

const pgTable = createModuleTable()

export const airQualitySelectedStation = pgTable('selected_station', {
  id: uuid('id').defaultRandom().primaryKey(),
  station_id: text('station_id').notNull(),
  name: text('name').notNull(),
  lat: doublePrecision('lat').notNull(),
  lng: doublePrecision('lng').notNull(),
  created: timestamp('created', { mode: 'date' }).defaultNow().notNull(),
  updated: timestamp('updated', { mode: 'date' }).defaultNow().notNull()
})

export const tables = { selectedStation: airQualitySelectedStation }

export const relations = (_r: RelationsBuilder<typeof tables>) => ({})
