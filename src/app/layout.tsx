import type { Metadata } from "next";
import { Sidebar } from "@/components/layout/sidebar";
import { ThemeProvider } from "@/components/layout/theme-provider";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Focus — Personal Productivity Assistant",
  description: "Your daily and weekly accountability assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <div className="min-h-screen bg-background">
            <Sidebar />
            <main className="lg:pl-64">
              <div className="mx-auto max-w-5xl px-4 py-8 pt-16 lg:pt-8 lg:px-8">
                {children}
              </div>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
