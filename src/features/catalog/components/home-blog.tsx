const POSTS = [
  {
    date: '12 de setembro',
    read: 'Leitura de 6 min',
    title: 'Como funciona a propriedade de NFTs',
    excerpt: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    image: '/images/nft-03.webp'
  },
  {
    date: '13 de setembro',
    read: 'Leitura de 2 min',
    title: '10 artistas digitais para acompanhar',
    excerpt: 'Conheça criadores que moldam a cultura digital.',
    image: '/images/nft-04.webp'
  },
  {
    date: '15 de setembro',
    read: 'Leitura de 3 min',
    title: 'Raridade, atributos e procedência',
    excerpt: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    image: '/images/nft-05.webp'
  },
  {
    date: '15 de setembro',
    read: 'Leitura de 2 min',
    title: 'Como proteger sua carteira',
    excerpt: 'Proteja sua carteira, seus ativos e sua identidade.',
    image: '/images/nft-07.webp'
  }
]

/** Home blog strip (Figma "Blog" / "Diário da Cunhagem") — four editorial cards. */
export function HomeBlog() {
  return (
    <section className="mx-auto w-full max-w-[1248px] px-4 sm:px-6">
      <header className="flex flex-col items-center gap-3 text-center">
        <h2 className="text-canvas text-[28px] leading-9 font-bold">Diário da Cunhagem</h2>
        <p className="text-text-secondary text-sm leading-[18px]">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </header>
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {POSTS.map((post) => (
          <article
            key={post.title}
            className="bg-surface-card flex h-[369px] flex-col overflow-hidden rounded-lg"
          >
            <img src={post.image} alt="" aria-hidden className="h-[195px] w-full object-cover" />
            <div className="flex flex-1 flex-col gap-2 p-4">
              <p className="text-text-secondary text-xs leading-4 font-medium">
                {post.date} | {post.read}
              </p>
              <h3 className="text-canvas text-base leading-5 font-bold">{post.title}</h3>
              <p className="text-text-secondary text-xs leading-4 font-medium">{post.excerpt}</p>
              <button
                type="button"
                disabled
                title="Em breve nesta demo"
                className="text-highlight mt-1 inline-flex items-center gap-1 text-xs font-bold"
              >
                Ler mais
                <span aria-hidden>→</span>
                <span className="sr-only"> (em breve)</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
