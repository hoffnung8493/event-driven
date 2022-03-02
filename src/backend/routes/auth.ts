import express from 'express'
import { Admin, createAdmin, AdminDoc } from '../models'
import { hash, compare } from 'bcryptjs'
import { sign } from 'jsonwebtoken'

export const authRouter = () => {
  const router = express.Router()

  router.post('/register', async (req, res) => {
    try {
      const { username, password } = req.body
      if (username.trim().length < 3) throw new Error('Username must be at least 3 characters long')
      if (password.length < 8) throw new Error('Password must be at least 7 characters long')
      const admin = await Admin.findOne({ username: req.body.username })
      if (admin) throw new Error('This username is already used')
      const hashedPassword = await hash(req.body.password, 10)
      const newAdmin = await createAdmin({ username, hashedPassword })
      const accessToken = createAccessToken(newAdmin)
      return res.send({ id: newAdmin.id, username, accessToken })
    } catch (err) {
      if (err instanceof Error) res.status(500).json(err.message)
      else res.status(500).json('something went wrong')
    }
  })

  router.post('/signin', async (req, res) => {
    try {
      const { username, password } = req.body
      if (username.trim().length < 3) throw new Error('Username must be at least 3 characters long')
      if (password.length < 8) throw new Error('Password must be at least 7 characters long')
      const admin = await Admin.findOne({ username: req.body.username })
      if (!admin) throw new Error('This admin does not exist.')
      if (!(await compare(password, admin.hashedPassword))) throw new Error('Password/username is incorrect')
      const accessToken = createAccessToken(admin)
      return res.send({ id: admin.id, username, accessToken })
    } catch (err) {
      if (err instanceof Error) res.status(500).json(err.message)
      else res.status(500).json('something went wrong')
    }
  })

  return router
}

const createAccessToken = (admin: AdminDoc) => {
  const tokenBody = { admin: { id: admin.id, authorized: admin.authorized } }
  const accessToken = sign(tokenBody, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: '12h' })
  return accessToken
}
