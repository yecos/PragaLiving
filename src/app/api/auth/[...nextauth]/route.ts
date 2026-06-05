import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { verifyAdmin } from '@/lib/data'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Usuario', type: 'text' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

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
  pages: {
    signIn: '/admin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).role = token.role
        ;(session.user as any).id = token.id
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'praga-living-dev-secret-change-in-production',
})

export { handler as GET, handler as POST }
