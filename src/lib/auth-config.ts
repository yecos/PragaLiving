// ============================================
// NextAuth Configuration for PRAGA Living
// ============================================
// Credentials provider with Supabase + fallback to hardcoded admin

import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { isSupabaseConfigured, createAdminSupabaseClient } from './supabase'

// Hardcoded admin credentials (fallback when Supabase is not configured)
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'praga2024',
  name: 'Administrador PRAGA',
  role: 'admin',
}

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

        // Try Supabase first
        if (isSupabaseConfigured()) {
          try {
            const supabase = createAdminSupabaseClient()
            const { data: admin, error } = await supabase
              .from('admin_users')
              .select('*')
              .eq('username', credentials.username)
              .single()

            if (!error && admin && admin.password === credentials.password) {
              return {
                id: admin.id,
                name: admin.name,
                email: `${admin.username}@pragaliving.com`,
                role: admin.role,
              }
            }
          } catch (err) {
            console.error('Supabase auth error, falling back:', err)
          }
        }

        // Fallback to hardcoded credentials
        if (
          credentials.username === ADMIN_CREDENTIALS.username &&
          credentials.password === ADMIN_CREDENTIALS.password
        ) {
          return {
            id: 'admin-1',
            name: ADMIN_CREDENTIALS.name,
            email: 'admin@pragaliving.com',
            role: 'admin',
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
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)
