import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Opero — calm procedure walkthroughs",
  description:
    "Opero turns dense clinical procedure notes into calm, non-graphic 3D walkthroughs with a warm voice, in the patient's own language.",
};

export const viewport: Viewport = { themeColor: "#f7f4ef" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}>
      <head>
        <link
          rel="stylesheet"
          href="https://db.onlinewebfonts.com/c/04e6981992c0e2e7642af2074ebe3901?family=Helvetica+Now+Display+Bold"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
