interface StubScreenProps {
  title: string
}

export function StubScreen({ title }: StubScreenProps) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold">{title}</h1>
    </main>
  )
}
