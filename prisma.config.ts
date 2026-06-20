import { defineConfig } from '@prisma/config'
import dotenv from 'dotenv'
dotenv.config()

export default defineConfig({
  earlyAccess: true,
  studio: {
    url: process.env.DATABASE_URL
  },
  migrations: {
    schemaPath: 'prisma/schema.prisma',
    url: process.env.DATABASE_URL,
  },
  datasource: {
    url: process.env.DATABASE_URL
  }
})
