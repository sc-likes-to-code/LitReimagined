export default function ReadLayout({ children }: LayoutProps<"/read">) {
  return (
    <main id="main" className="flex-1">
      {children}
    </main>
  );
}
