import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { loadCurrentUser } from "@/features/auth/server/load-current-user";
import { CurrentUserProvider } from "@/features/auth/context/current-user-context";
import { AppHeader } from "@/components/layout/AppHeader";

const siteDescription = "역할 기반 온보딩부터 과제 관리까지 지원하는 경량 학습 관리 시스템";

export const metadata: Metadata = {
  title: {
    default: "VibeMafia LMS",
    template: "%s | VibeMafia LMS",
  },
  description: siteDescription,
  openGraph: {
    title: "VibeMafia LMS",
    description: siteDescription,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VibeMafia LMS",
    description: siteDescription,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await loadCurrentUser();

  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased font-sans">
        <Providers>
          <CurrentUserProvider initialState={currentUser}>
            <AppHeader />
            <main>{children}</main>
          </CurrentUserProvider>
        </Providers>
      </body>
    </html>
  );
}
