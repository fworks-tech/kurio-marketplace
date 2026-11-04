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
    mark: 'K',
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
      { label: 'Perfil', to: '/profile' },
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
      { label: 'Política do marketplace' },
      { label: 'Denunciar um item' }
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

const SOCIALS = ['X', 'Discord', 'Instagram']

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
        <div className="bg-surface-card px-8 py-6">
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
                Receba drops selecionados, histórias de criadores e recompensas para colecionadores
                direto na sua caixa de entrada.
              </p>
              <div role="status" aria-live="polite" className="text-sand text-xs">
                {status}
              </div>
            </div>
          </div>
        </div>

        {/* Contact bar */}
        <div className="bg-[#38220F] px-8 py-5">
          <div className="flex flex-wrap items-center gap-x-[92px] gap-y-3">
            <span className="text-canvas text-sm leading-[18px] font-bold tracking-[0.1em]">
              KURIO
            </span>
            <p className="text-canvas text-sm leading-[22px] whitespace-pre-line">
              {'Feito para colecionadores,\r\ncriadores e cultura'}
            </p>
            <p className="text-canvas text-sm leading-[22px]">contato@email.com</p>
            <p className="text-canvas text-sm leading-[22px]">+55 11 4002 8922</p>
          </div>
        </div>

        {/* Link columns */}
        <div className="grid gap-8 px-8 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          {LINK_COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading} className="flex flex-col gap-2.5">
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

          <div className="flex flex-col gap-2.5">
            <nav aria-label="Redes sociais" className="flex flex-col gap-2.5">
              <h2 className="text-canvas text-[18px] leading-4 font-bold">Redes sociais</h2>
              <ul className="flex flex-col">
                {SOCIALS.map((social) => (
                  <li key={social} className="text-canvas text-sm leading-[30px]">
                    <span aria-disabled="true" className="cursor-not-allowed">
                      {social}
                      <span className="sr-only"> (em breve)</span>
                    </span>
                  </li>
                ))}
              </ul>
            </nav>
            <h2 className="text-canvas text-[18px] leading-4 font-bold">Carteiras compatíveis</h2>
            <p className="text-highlight text-[9px] leading-3 font-bold tracking-[0.1em]">
              METAMASK · PHANTOM · WALLETCONNECT
            </p>
          </div>
        </div>

        <p className="text-canvas px-8 pb-2 text-center text-sm leading-[30px]">
          © 2026 Kurio. Propriedade digital para todos.
        </p>
      </div>
    </footer>
  )
}
