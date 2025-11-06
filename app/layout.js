import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Cypherize",
  description: "Generated Cypher with natural language.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}

        <Toaster
          position="top-left"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#20282E',
              color: '#E6EEF2',
              border: '1px solid #2A3239',
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              borderRadius: '5px'
            },
            success: {
              iconTheme: { primary: '#34B27B', secondary: '#11181C' }
            },
            error: {
              iconTheme: { primary: '#EF4444', secondary: '#11181C' }
            }
          }}
        />
      </body>
    </html>
  );
}
