import { useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { useAuthDialog } from '@/features/auth/auth-dialog'

interface FooterLink {
  label: string
  to?: '/' | '/profile' | '/wallets' | '/cart'
  auth?: 'login' | 'signup'
}

const VALUE_PROPS = [
  {
    mark: 'W',
    title: 'Segurança da carteira',
    body: 'Proteja sua carteira e colecione arte digital verificada com confiança.'
  },
  {
    mark: 'C',
    title: 'Criadores em destaque',
    body: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.'
  },
  {
    mark: 'D',
    title: 'Alertas de lançamentos',
    body: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.'
  }
] as const

const LINK_COLUMNS: { heading: string; links: FooterLink[] }[] = [
  {
    heading: 'Meu perfil',
    links: [
      { label: 'Meu perfil', to: '/profile' },
      { label: 'Minha coleção' },
      { label: 'Atividade' },
      { label: 'Estúdio do criador' },
      { label: 'Lista de interesse' }
    ]
  },
  {
    heading: 'Central de ajuda',
    links: [
      { label: 'Central de ajuda' },
      { label: 'Como comprar NFTs' },
      { label: 'Carteira e segurança' },
      { label: 'Política do mercado' },
      { label: 'Denunciar item' }
    ]
  },
  {
    heading: 'Coleções',
    links: [
      { label: 'Arte digital' },
      { label: 'Fotografia' },
      { label: 'Música' },
      { label: 'Arte 3D' },
      { label: 'Utilidade' }
    ]
  }
]

const SOCIALS = ['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'YouTube'] as const

interface SiteFooterProps {
  onSubscribe?: (email: string) => void
  className?: string
}

/**
 * Figma `Footer`: a 250px value-prop card with 1px orange dividers, an 88px
 * contact bar on `#38220F`, the link columns block and the copyright line.
 */
export function SiteFooter({ onSubscribe, className }: SiteFooterProps) {
  const { openAuth } = useAuthDialog()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (onSubscribe) {
      onSubscribe(email)
      setStatus('Obrigado! Você está inscrito.')
      setEmail('')
      return
    }
    setStatus('Não disponível nesta demo.')
  }

  return (
    <footer className={cn('mt-24', className)}>
      <div className="mx-auto w-full max-w-[1248px] px-4 sm:px-6">
        {/* Value props + newsletter */}
        <div className="bg-surface-card px-8 py-8">
          <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[265fr_265fr_265fr_357fr] lg:divide-x lg:divide-primary">
            {VALUE_PROPS.map((item) => (
              <div key={item.title} className="flex min-w-0 flex-col gap-3 lg:px-4">
                <span
                  aria-hidden
                  className="bg-primary text-ink grid size-[74px] shrink-0 place-items-center rounded-full text-2xl leading-8 font-bold"
                >
                  {item.mark}
                </span>
                <h2 className="text-canvas text-[17px] leading-4 font-bold">{item.title}</h2>
                <p className="text-text-secondary max-w-[204px] text-sm leading-[22px]">{item.body}</p>
              </div>
            ))}

            <div className="flex min-w-0 flex-col gap-3 lg:px-4">
              <h2 className="text-canvas text-[18px] leading-4 font-bold">
                Antecipe-se ao próximo lançamento
              </h2>
              <form onSubmit={handleSubmit} className="flex">
                <label htmlFor="footer-newsletter" className="sr-only">
                  E-mail
                </label>
                <input
                  id="footer-newsletter"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="digite seu e-mail..."
                  required
                  className="bg-[#38220F] text-canvas placeholder:text-sand focus-visible:ring-primary/40 h-10 min-w-0 flex-1 rounded-l-md border-0 px-[13px] text-sm leading-4 outline-none focus-visible:ring-2"
                />
                <button
                  type="submit"
                  className="bg-primary text-ink h-10 w-[85px] shrink-0 rounded-r-md text-[18px] leading-4 font-bold"
                >
                  Enviar
                </button>
              </form>
              <p className="text-text-secondary text-[13px] leading-[22px]">
                Receba lançamentos selecionados, histórias de criadores e recompensas de
                colecionadores na sua caixa de entrada.
              </p>
              <div role="status" aria-live="polite" className="text-sand text-xs">
                {status}
              </div>
            </div>
          </div>
        </div>

        {/* Contact bar */}
        <div className="bg-surface-dark px-8 py-8">
          {/* Figma Frame 119: cada coluna começa na mesma coordenada das colunas de links. */}
          <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[211px_211px_211px_228px] lg:items-center lg:gap-[92px]">
            <span className="text-canvas text-sm leading-[18px] font-bold tracking-[0.1em]">
              KURIO
            </span>
            <p className="text-canvas text-sm leading-[22px] whitespace-pre-line">
              {'Feito para colecionadores,\ncriadores e cultura'}
            </p>
            <p className="text-canvas text-sm leading-[22px]">contato@email.com</p>
            <p className="text-canvas text-sm leading-[22px]">+55 11 4002 8922</p>
          </div>
        </div>

        {/* Link columns */}
        <div className="grid gap-8 px-8 py-8 sm:grid-cols-2 lg:grid-cols-[179px_179px_179px_228px] lg:gap-[124px]">
          {LINK_COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading} className="flex flex-col gap-2">
              <h2 className="text-canvas text-[18px] leading-4 font-bold">{column.heading}</h2>
              <ul className="flex flex-col">
                {column.links.map((link) => (
                  <li key={link.label} className="text-canvas text-sm leading-[30px]">
                    {link.auth ? (
                      <button
                        type="button"
                        onClick={() => openAuth(link.auth!)}
                        className="cursor-pointer text-left hover:text-highlight"
                      >
                        {link.label}
                      </button>
                    ) : link.to ? (
                      <Link to={link.to} className="hover:text-highlight">
                        {link.label}
                      </Link>
                    ) : (
                      <span aria-disabled="true" className="cursor-not-allowed">
                        {link.label}
                        <span className="sr-only"> (em breve)</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="flex flex-col gap-8">
            <nav aria-label="Redes sociais" className="flex flex-col gap-5">
              <h2 className="text-canvas text-[18px] leading-4 font-bold">Redes sociais</h2>
              {/* Figma Frame 113: caixas de 30x30, raio 4, borda 1px em #D28A4C e ícones de 16px. */}
              <ul className="flex items-center gap-[10px]">
                {SOCIALS.map((social) => (
                  <li key={social}>
                    <span
                      role="img"
                      aria-label={`${social} (em breve)`}
                      title={`${social} (em breve)`}
                      className="border-primary text-primary hover:bg-primary hover:text-ink grid size-[30px] place-items-center rounded-[4px] border transition-colors"
                    >
                      <SocialMark name={social} />
                    </span>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="flex flex-col gap-3">
              <h2 className="text-canvas text-[18px] leading-4 font-bold">Carteiras compatíveis</h2>
              <p className="bg-surface-dark border-muted-strong text-highlight flex h-[26px] w-[228px] items-center justify-center rounded-md border px-2 text-[9px] leading-3 font-bold tracking-[0.1em]">
                METAMASK • WALLETCONNECT • COINBASE
              </p>
            </div>
          </div>
        </div>

        <p className="text-canvas px-8 pb-2 text-center text-sm leading-[30px]">
          © 2026 Kurio. Propriedade digital para todos.
        </p>
      </div>
    </footer>
  )
}

/** O lucide não distribui logos de terceiros: as marcas do frame vão como SVG. */
function SocialMark({ name }: { name: (typeof SOCIALS)[number] }) {
  if (name === 'Facebook') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-2" fill="currentColor">
        <path d="M14.5 9H17V6h-2.5C12.6 6 11 7.6 11 9.5V11H9v3h2v7h3v-7h2.4l.6-3H14v-1.2c0-.5.2-.8.5-.8Z" />
      </svg>
    )
  }
  if (name === 'Instagram') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="4" y="4" width="16" height="16" rx="5" />
        <circle cx="12" cy="12" r="3.6" />
        <circle cx="16.8" cy="7.2" r="1" fill="currentColor" stroke="none" />
      </svg>
    )
  }
  if (name === 'Twitter') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden className="size-4" fill="currentColor">
        <path d="M22 5.8c-.7.3-1.5.6-2.3.7.8-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1A4 4 0 0 0 12 9.2a11.4 11.4 0 0 1-8.3-4.2 4 4 0 0 0 1.2 5.4c-.6 0-1.2-.2-1.8-.5a4 4 0 0 0 3.2 4 4 4 0 0 1-1.8.1 4 4 0 0 0 3.7 2.8A8 8 0 0 1 2 18.6 11.3 11.3 0 0 0 8.2 20c7.5 0 11.6-6.2 11.6-11.6v-.5c.8-.6 1.5-1.3 2.2-2.1Z" />
      </svg>
    )
  }
  if (name === 'LinkedIn') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden className="size-4" fill="currentColor">
        <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.5 4.78 5.75V21h-4v-5.6c0-1.34-.02-3.06-1.87-3.06-1.87 0-2.16 1.46-2.16 2.96V21H9V9Z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4" fill="currentColor">
      <path d="M21.6 7.2c-.2-.9-.9-1.6-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4c-.9.2-1.6.9-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.8c.2.9.9 1.6 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8ZM10 15.2V8.8l5.4 3.2-5.4 3.2Z" />
    </svg>
  )
}
