import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'النظام الإلكتروني لإدارة الحضور وشئون الطلاب - التعليم الفني الصناعي',
  description: 'منظومة إدارة الحضور والغياب للورش والفصول وشئون الطلاب بالمدارس الثانوية الصناعية المصرية',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 font-['Cairo'] antialiased">
        {children}
      </body>
    </html>
  );
}
