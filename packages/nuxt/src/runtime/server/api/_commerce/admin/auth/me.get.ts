// Admin Auth: Current user


export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  if (!session?.user || session.user.role !== 'admin') {
    throw createError({
      statusCode: 401,
      message: 'Not authenticated.',
    })
  }

  return {
    user: session.user,
    loggedInAt: session.loggedInAt,
  }
})
