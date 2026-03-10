// Admin Auth: Login — DB-backed
import { defineEventHandler, readBody, createError } from 'h3'
import { useAdminAPI } from '../../../../utils/admin'


export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)

  if (!email || !password) {
    throw createError({ statusCode: 400, message: 'Email and password are required.' })
  }

  try {
    const admin = useAdminAPI(event)
    const user = await admin.auth.login(email, password)

    await setUserSession(event, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as 'admin',
      },
      loggedInAt: Date.now(),
    })

    return { success: true, user }
  } catch {
    throw createError({ statusCode: 401, message: 'Invalid email or password.' })
  }
})
