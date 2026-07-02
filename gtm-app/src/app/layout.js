import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";

export const metadata = {
  title: "Tags de Conversão · GTM",
  description: "Crie tags de conversão (Meta e Google Ads) no Google Tag Manager.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          <Header />
          <main className="container">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
