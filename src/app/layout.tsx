import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Providers } from "@/components/providers";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/config/constants";
import { DEFAULT_MOOD, MOOD_STORAGE_KEY } from "@/config/moods";
import "./globals.css";

const happiness = localFont({
  src: "../../public/fonts/Happiness.otf",
  variable: "--font-heading",
  display: "swap",
  weight: "400",
});

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${PRODUCT_NAME} — ${PRODUCT_TAGLINE}`,
    template: `%s · ${PRODUCT_NAME}`,
  },
  description: "The Meechie Project staff and community tools for programs, events, volunteers, fundraising, and impact reporting in Dallas.",
};

const moodBootScript = `(function(){try{var k=${JSON.stringify(MOOD_STORAGE_KEY)};var m=localStorage.getItem(k);if(m)document.documentElement.setAttribute("data-mood",m);else document.documentElement.setAttribute("data-mood",${JSON.stringify(DEFAULT_MOOD)});}catch(e){document.documentElement.setAttribute("data-mood",${JSON.stringify(DEFAULT_MOOD)});}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-mood={DEFAULT_MOOD}
      className={`${dmSans.variable} ${happiness.variable} ${geistMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: moodBootScript }} />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
