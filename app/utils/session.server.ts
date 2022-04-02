import bcrypt from 'bcrypt';
import { createCookieSessionStorage, redirect } from 'remix';
import { db } from '~/utils/db.server';

type RegisterForm = {
  username: string;
  email: string;
  password: string;
  service: string;
};

type LoginForm = {
  email: string;
  password: string;
};

export async function register({ username, email, password, service }: RegisterForm) {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.user.create({ data: { username, email, passwordHash, service } });
  return { id: user.id, data: user };
}

export async function login({ email, password }: LoginForm) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return null;
  const isCorrectPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isCorrectPassword) return null;
  return { id: user.id, email };
}

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error('SESSION_SECRET must be set');
}

const storage = createCookieSessionStorage({
  cookie: {
    secure: process.env.NODE_ENV === "production",
    // secure doesn't work on localhost for Safari
    // https://web.dev/when-to-use-local-https/
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days,
    path: '/',
    name: 'support_session',
    secrets: [sessionSecret]
  }
});

export function getUserSession(request: Request) {
  return storage.getSession(request.headers.get('Cookie'));
}

export async function getUserId(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get('userId');
  if (!userId || typeof userId !== 'string') return null;
  return userId;
}

// send to the login page when required by a protected route and redirect to the before page once logged in
export async function requireUserId(request: Request, redirectTo: string = new URL(request.url).pathname) {
  const session = await getUserSession(request);
  const userId = session.get('userId');
  if (!userId || typeof userId !== 'string') {
    const searchParams = new URLSearchParams([['redirectTo', redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return userId;
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (typeof userId !== 'string') {
    return null;
  }

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, createdAt: true, updatedAt: true, username: true, email: true, service: true },
    });
    return user;
  } catch {
    throw logout(request);
  }
}

export async function logout(request: Request) {
  const session = await getUserSession(request);
  return redirect('/login', {
    headers: { 'Set-Cookie': await storage.destroySession(session) },
  });
}

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await storage.getSession();
  session.set('userId', userId);
  return redirect(redirectTo, {
    headers: { 'Set-Cookie': await storage.commitSession(session) }
  });
}