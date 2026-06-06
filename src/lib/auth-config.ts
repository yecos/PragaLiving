// ============================================
// NextAuth Configuration for PRAGA Living
// ============================================
// Credentials provider with Supabase + bcrypt password verification
// NO hardcoded credentials — uses environment variables

import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { verifyAdmin } from './data'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credenciales',
      credentials: {
        username: { label: 'Usuario', type: 'text', placeholder: 'admin' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        // Use the centralized verifyAdmin (supports bcrypt hashing + Supabase + Prisma + env fallback)
        const result = await verifyAdmin(credentials.username, credentials.password)
        if (result.success && result.user) {
          return {
            id: result.user.id,
            name: result.user.name,
            email: `${result.user.username}@pragaliving.com`,
            role: result.user.role,
          }
        }

        return null
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/admin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role || 'admin'
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as { role?: string }).role = token.role as string
        ;(session.user as { id?: string }).id = token.id as string
      }
      return session
    },
  },
  // SECURITY: No fallback — if NEXTAUTH_SECRET is not set, the app MUST fail to start
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)
