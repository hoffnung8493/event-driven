import express from 'express'
import path from 'path'
import { verify } from 'jsonwebtoken'
import { errorRouter } from './routes/error'
import { subjectRouter } from './routes/subject'
import { operationRouter } from './routes/operation'
import { authRouter } from './routes/auth'
import { streamRouter } from './routes/stream'
import { eventRouter } from './routes/event'
import { JetStreamManager, JetStreamClient } from 'nats'
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

export const eventManagerRouter = (ACCESS_TOKEN_SECRET: string, jsc: JetStreamManager, js: JetStreamClient) => {
  const router = express.Router()
  // router.use(express.static('../../client/build'))
  // const publicPath = path.resolve(__dirname, '../../client/build')
  // console.log({ publicPath })
  // router.use('/', express.static(publicPath))
  // router.use(express.static(publicPath))

  router.use(authenticateAdmin(ACCESS_TOKEN_SECRET))
  router.use('/api/streams', streamRouter(jsc))
  router.use('/api/events', eventRouter(js))
  router.use('/api/errors', errorRouter(js))
  router.use('/api/subjects', subjectRouter(js))
  router.use('/api/auth', authRouter())
  router.use('/api/operations', operationRouter())
  return router
}

export const eventManagerFrontendPath = path.resolve(__dirname, '../../client/build')
