import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "Notch",
    template: "%s | Notch",
  },
  description: "Habit tracking, simplified.",
  metadataBase: new URL("https://notchhabits.com"),
  openGraph: {
    title: "Notch",
    description: "Habit tracking, simplified.",
    url: "https://notchhabits.com",
    siteName: "Notch",
    type: "website",
    images: [{ url: "/og.svg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Notch",
    description: "Habit tracking, simplified.",
    images: ["/og.svg"],
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
