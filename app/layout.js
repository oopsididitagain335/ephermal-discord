// app/layout.js
import { getAuthUserId } from '@/lib/auth';

export default async function RootLayout({ children }) {
  const userId = getAuthUserId(cookies());
  if (!userId) {
    return Response.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL));
  }
  return <html><body>{children}</body></html>;
}
