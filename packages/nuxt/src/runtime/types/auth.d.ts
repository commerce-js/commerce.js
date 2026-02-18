// ---------------------------------------------------------------------------
// Session type augmentation for nuxt-auth-utils
// ---------------------------------------------------------------------------
// Extends the UserSession interface so session.user.role is properly typed.

declare module '#auth-utils' {
  interface User {
    id: string
    email: string
    name: string | null
    role: 'admin'
  }

  interface UserSession {
    loggedInAt?: number
  }
}

export {}
