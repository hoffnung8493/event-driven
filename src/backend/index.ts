import express from 'express'
import path from 'path'
import { verify } from 'jsonwebtoken'
import { errorRouter } from './routes/error'
import { RedisClientType } from 'redis'
import { subjectRouter } from './routes/subject'
import { operationRouter } from './routes/operation'
import { authRouter } from './routes/auth'
export * from './models'

declare module 'express' {
  export interface Request {
    admin?: { id: string; authorized: boolean }
  }
}

const authenticateAdmin =
  (ACCESS_TOKEN_SECRET: string) => async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { admin_access_token } = req.headers
    if (typeof admin_access_token !== 'string') return next()
    const decoded = verify(admin_access_token, ACCESS_TOKEN_SECRET) as {
      admin: { id: string; authorized: boolean }
    }
    if (!decoded) return next()
    req.admin = decoded.admin
    return next()
  }

export const applyMiddleware = (app: express.Express, ACCESS_TOKEN_SECRET: string, redis: RedisClientType<any, any>) => {
  app.use(authenticateAdmin(ACCESS_TOKEN_SECRET))
  app.use(express.static(path.resolve(__dirname, '../../client/build')))
  app.use('/event-api/errors', errorRouter(redis))
  app.use('/event-api/subjects', subjectRouter(redis))
  app.use('/event-api/auth', authRouter())
  app.use('/event-api/operations', operationRouter())
}
