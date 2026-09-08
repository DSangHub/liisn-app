export const metadata = {
  title: "Liisn — Listen to us. We buy your products.",
  description: "Scan the receipt. Message the seller or manufacturer. Get a real answer.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
