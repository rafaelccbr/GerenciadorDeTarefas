import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './db/schema.js';

export function isLocalDevelopment(request, env) {
  return env.DEV_AUTH_EMAILS === 'true' && ['localhost', '127.0.0.1', '[::1]'].includes(new URL(request.url).hostname);
}

export function createAuth(request, env) {
  const local = isLocalDevelopment(request, env);
  const origin = env.APP_URL || new URL(request.url).origin;
  const sendEmail = async (to, subject, url) => {
    if (local) return; // No production bypass. Development accounts do not require email verification.
    if (!env.BREVO_API_KEY || !env.MAIL_FROM) throw new Error('Configure BREVO_API_KEY e MAIL_FROM para enviar e-mails.');
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST', headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: { name: 'Organizador de Tarefas', email: env.MAIL_FROM }, to: [{ email: to }], subject, textContent: `Organizador de Tarefas\n\n${subject}\n\n${url}\n\nSe não foi você, ignore esta mensagem.` }),
    });
    if (!response.ok) throw new Error('O serviço de e-mail não conseguiu enviar a mensagem.');
  };
  return betterAuth({
    appName: 'Organizador de Tarefas',
    baseURL: origin, basePath: '/api/auth', secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(drizzle(env.DB, { schema }), { provider: 'sqlite', schema }),
    trustedOrigins: [origin, ...(local ? ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:8787', 'http://127.0.0.1:8787'] : [])],
    socialProviders: env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? {
      google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET, prompt: 'select_account' },
    } : {},
    emailAndPassword: {
      enabled: true, minPasswordLength: 8, maxPasswordLength: 128,
      requireEmailVerification: !local, autoSignIn: false,
      revokeSessionsOnPasswordReset: true,
      ...(env.BREVO_API_KEY && env.MAIL_FROM ? { sendResetPassword: async ({ user, url }) => sendEmail(user.email, 'Redefina sua senha', url) } : {}),
    },
    emailVerification: {
      sendOnSignUp: !local && !!env.BREVO_API_KEY, sendOnSignIn: !local && !!env.BREVO_API_KEY,
      sendVerificationEmail: async ({ user, url }) => sendEmail(user.email, 'Confirme seu e-mail', url),
    },
    user: { changeEmail: { enabled: true }, deleteUser: { enabled: true } },
    session: { expiresIn: 60 * 60 * 24 * 7, freshAge: 60 * 60 },
    rateLimit: { enabled: true, storage: 'database', window: 60, max: 30 },
    advanced: { ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] } },
  });
}
