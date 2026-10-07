import { createForge } from '@lifeforge/server-utils'

import * as schema from './schema.drizzle'

const forge = createForge({ schema })

export default forge
