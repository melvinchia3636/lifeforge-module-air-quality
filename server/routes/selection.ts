import { eq } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-orm/zod'
import z from 'zod'

import forge from '../forge'
import { airQualitySelectedStation } from '../schema.drizzle'

const selectionDto = createSelectSchema(airQualitySelectedStation)

const setBodyDto = z.object({
  stationId: z.string(),
  name: z.string(),
  lat: z.number(),
  lng: z.number()
})

export const get = forge
  .query({
    description: 'Get the station selected for the dashboard widget',
    output: {
      OK: z.object({ station: selectionDto.nullable() })
    }
  })
  .callback(async ({ db, response }) =>
    response.ok({
      station: (await db.query.selectedStation.findFirst()) ?? null
    })
  )

export const set = forge
  .mutation({
    description: 'Set the station displayed in the dashboard widget',
    input: {
      body: setBodyDto
    },
    output: {
      OK: selectionDto
    }
  })
  .callback(async ({ db, body, response }) => {
    const values = {
      station_id: body.stationId,
      name: body.name,
      lat: body.lat,
      lng: body.lng
    }

    const existing = await db.query.selectedStation.findFirst()

    if (existing) {
      const [updated] = await db
        .update(airQualitySelectedStation)
        .set(values)
        .where(eq(airQualitySelectedStation.id, existing.id))
        .returning()

      return response.ok(updated)
    }

    const [created] = await db
      .insert(airQualitySelectedStation)
      .values(values)
      .returning()

    return response.ok(created)
  })
