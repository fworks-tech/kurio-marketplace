import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AppleMark, GoogleMark } from '@/shared/ui/brand-marks'
import { Input } from '@/components/ui/input'
import { PasswordField } from '@/components/ui/password-field'
import { authService } from '@/shared/services'
import { storeSession, toFieldErrors, type AuthFieldErrors } from './auth-errors'

type AuthMode = 'login' | 'signup'

interface MobileAuthPageProps {
  mode: AuthMode
  onAuthenticated: () => void
}

/**
 * Figma `Mobile / Login` (16:1022) and `Mobile / Cadastro` (16:1228): a full
 * page instead of the desktop dialog — 80px top inset, 28px gutters, a 358px
 * column, 50px fields with a 10px radius, a 60px primary button, the 40px
 * social buttons and the link at the bottom.
 */
export function MobileAuthPage({ mode, onAuthenticated }: MobileAuthPageProps) {
  const [tab, setTab] = useState<AuthMode>(mode)
  useEffect(() => setTab(mode), [mode])

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-canvas">
      <main className="w-full px-7 pt-20 pb-6">
      <div className="mx-auto flex w-full max-w-[358px] flex-col">
        <div className="flex h-[136px] items-center justify-center">
          <span className="text-canvas text-[32px] leading-[42px] font-bold tracking-[0.04em]">
            KURIO
          </span>
        </div>

        <h1
          className={
            tab === 'login'
              ? 'text-canvas mt-10 text-center text-xl leading-4 font-bold'
              : 'text-canvas mt-10 text-center text-lg leading-4 font-bold'
          }
        >
          {tab === 'login' ? 'Entrar' : 'Criar perfil de colecionador'}
        </h1>

        {tab === 'login' ? (
          <LoginBody onAuthenticated={onAuthenticated} onSwitch={() => setTab('signup')} />
        ) : (
          <SignupBody onAuthenticated={onAuthenticated} onSwitch={() => setTab('login')} />
        )}
      </div>
      </main>
    </div>
  )
}

const FIELD =
  'relative [&_input]:h-[50px] [&_input]:rounded-[10px] [&_input]:border-transparent [&_input]:bg-[#241612]! [&_input]:px-4 [&_input]:text-sm [&_input]:leading-4 [&_input]:placeholder:text-[#B39463] [&_input]:placeholder:opacity-100'

function SocialBlock() {
  return (
    <div className="mt-10 space-y-4">
      <div className="text-canvas flex items-center gap-3 text-[13px] leading-4">
        <span aria-hidden className="h-px w-[110px] shrink-0 bg-white/15" />
        <span className="flex-1 text-center whitespace-nowrap">Ou continue com</span>
        <span aria-hidden className="h-px w-[110px] shrink-0 bg-white/15" />
      </div>
      <div className="space-y-4">
        {[
          { label: 'Google', mark: <GoogleMark className="size-4" /> },
          { label: 'Apple', mark: <AppleMark className="size-4" /> }
        ].map((social) => (
          <button
            key={social.label}
            type="button"
            disabled
            title="Em breve nesta demo"
            className="text-canvas flex h-10 w-full items-center justify-center gap-3 rounded-[5px] border border-white/10 text-sm leading-4 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {social.mark}
            Continue com {social.label}
            <span className="sr-only"> (não disponível nesta demo)</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function FooterLink({
  label,
  action,
  onClick
}: {
  label: string
  action: string
  onClick: () => void
}) {
  return (
    <p className="mt-10 text-center text-[15px] leading-[19.8px] text-[#CFB28C]">
      {label}{' '}
      <button
        type="button"
        onClick={onClick}
        className="text-highlight focus-visible:ring-highlight font-bold focus-visible:ring-2 focus-visible:outline-none"
      >
        {action}
      </button>
    </p>
  )
}

function LoginBody({
  onAuthenticated,
  onSwitch
}: {
  onAuthenticated: () => void
  onSwitch: () => void
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ usuario: '', senha: '' })
  const [errors, setErrors] = useState<AuthFieldErrors>({ fields: {} })

  const login = useMutation({
    mutationFn: () => authService.login({ email: form.usuario, password: form.senha }),
    onSuccess: (session) => {
      storeSession(queryClient, session)
      onAuthenticated()
    },
    onError: (error) => setErrors(toFieldErrors(error))
  })

  return (
    <>
      <form
        noValidate
        className="mt-10 space-y-3"
        onSubmit={(event) => {
          event.preventDefault()
          setErrors({ fields: {} })
          login.mutate()
        }}
      >
        <label htmlFor="m-login-usuario" className="sr-only">
          Usuário
        </label>
        <div className={FIELD}>
        <Input
          id="m-login-usuario"
          autoComplete="username"
          placeholder="Digite seu usuário"
          value={form.usuario}
          onChange={(e) => setForm((f) => ({ ...f, usuario: e.target.value }))}
        />
        </div>
        {errors.fields.email ? (
          <p role="alert" className="text-error text-xs">
            {errors.fields.email}
          </p>
        ) : null}

        <label htmlFor="m-login-senha" className="sr-only">
          Senha
        </label>
        <div className={FIELD}>
        <PasswordField
          id="m-login-senha"
          autoComplete="current-password"
          placeholder="Digite sua senha"
          value={form.senha}
          onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
        />
        </div>
        {errors.fields.password ? (
          <p role="alert" className="text-error text-xs">
            {errors.fields.password}
          </p>
        ) : null}

        <div className="flex justify-end pt-1">
          <button
            type="button"
            disabled
            title="Em breve nesta demo"
            className="text-highlight cursor-not-allowed text-sm leading-4"
          >
            Esqueceu a senha?
          </button>
        </div>

        {errors.general ? (
          <p role="alert" className="text-error text-sm">
            {errors.general}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={login.isPending}
          className="text-ink bg-primary mt-10 flex h-[60px] w-full items-center justify-center rounded-[10px] text-base leading-4 font-bold disabled:opacity-70"
        >
          {login.isPending ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <SocialBlock />
      <FooterLink label="Novo na Kurio?" action="Crie uma conta" onClick={onSwitch} />
    </>
  )
}

function SignupBody({
  onAuthenticated,
  onSwitch
}: {
  onAuthenticated: () => void
  onSwitch: () => void
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ usuario: '', email: '', senha: '', confirmar: '' })
  const [errors, setErrors] = useState<AuthFieldErrors>({ fields: {} })

  const signup = useMutation({
    mutationFn: () =>
      authService.register({
        username: form.usuario,
        email: form.email,
        password: form.senha,
        walletAddress: ''
      }),
    onSuccess: (session) => {
      storeSession(queryClient, session)
      onAuthenticated()
    },
    onError: (error) => setErrors(toFieldErrors(error))
  })

  const mismatch = form.confirmar !== '' && form.senha !== form.confirmar

  return (
    <>
      <form
        noValidate
        className="mt-10 space-y-3"
        onSubmit={(event) => {
          event.preventDefault()
          if (mismatch) {
            setErrors({ fields: { confirmar: 'As senhas não coincidem.' } })
            return
          }
          setErrors({ fields: {} })
          signup.mutate()
        }}
      >
        <label htmlFor="m-su-usuario" className="sr-only">
          Usuário
        </label>
        <div className={FIELD}>
        <Input
          id="m-su-usuario"
          autoComplete="username"
          placeholder="Nome de usuário"
          value={form.usuario}
          onChange={(e) => setForm((f) => ({ ...f, usuario: e.target.value }))}
        />
        </div>
        <label htmlFor="m-su-email" className="sr-only">
          E-mail
        </label>
        <div className={FIELD}>
        <Input
          id="m-su-email"
          type="email"
          autoComplete="email"
          placeholder="Digite seu e-mail"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        </div>
        <label htmlFor="m-su-senha" className="sr-only">
          Senha
        </label>
        <div className={FIELD}>
        <PasswordField
          id="m-su-senha"
          autoComplete="new-password"
          placeholder="Digite sua senha"
          value={form.senha}
          onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
        />
        </div>
        <label htmlFor="m-su-confirmar" className="sr-only">
          Confirmar senha
        </label>
        <div className={FIELD}>
        <PasswordField
          id="m-su-confirmar"
          autoComplete="new-password"
          placeholder="Repita a senha"
          value={form.confirmar}
          onChange={(e) => setForm((f) => ({ ...f, confirmar: e.target.value }))}
        />
        </div>

        {[
          errors.fields.username,
          errors.fields.email,
          errors.fields.password,
          errors.fields.confirmar ?? (mismatch ? 'As senhas não coincidem.' : undefined)
        ]
          .filter(Boolean)
          .map((message) => (
            <p key={message} role="alert" className="text-error text-xs">
              {message}
            </p>
          ))}

        {errors.general ? (
          <p role="alert" className="text-error text-sm">
            {errors.general}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={signup.isPending}
          className="text-ink bg-primary mt-10 flex h-[60px] w-full items-center justify-center rounded-[10px] text-base leading-4 font-bold disabled:opacity-70"
        >
          {signup.isPending ? 'Criando conta…' : 'Criar perfil'}
        </button>
      </form>

      <SocialBlock />
      <FooterLink label="Já tem uma conta?" action="Entre" onClick={onSwitch} />
    </>
  )
}
