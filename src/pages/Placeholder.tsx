export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      <p className="text-muted-foreground text-center max-w-md">
        Modul ini sedang dalam tahap pengembangan. Silakan kembali lagi nanti untuk fitur lengkapnya.
      </p>
    </div>
  );
}
