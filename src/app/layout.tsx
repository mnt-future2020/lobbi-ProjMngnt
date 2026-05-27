import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ProjectProvider } from "@/contexts/ProjectContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LOBBI - Project Management",
  description: "Task and Team Management Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ProjectProvider>
          {children}
        </ProjectProvider>
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
