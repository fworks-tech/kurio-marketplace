import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { XIcon } from 'lucide-react'
import { authService } from '@/shared/services'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordField } from '@/components/ui/password-field'
import {
  Dialog,
  DialogContent,
  DialogTitle
} from '@/components/ui/dialog'
import { GoogleMark } from '@/shared/ui/brand-marks'
import { storeSession, toFieldErrors, type AuthFieldErrors } from './auth-errors'

type AuthMode = 'login' | 'signup'

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: AuthMode
  onAuthenticated: () => void
}

export function AuthModal({ open, onOpenChange, mode, onAuthenticated }: AuthModalProps) {
  const [tab, setTab] = useState<AuthMode>(mode)
  useEffect(() => setTab(mode), [mode, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="bg-surface-card max-w-[500px] gap-0 overflow-hidden rounded-card border-white/10 p-0 sm:max-w-[500px]"
      >
        <DialogTitle className="sr-only">
          {tab === 'login' ? 'Entrar' : 'Criar conta'}
        </DialogTitle>
        <button
          type="button"
          aria-label="Fechar"
          onClick={() => onOpenChange(false)}
          className="text-primary absolute top-4 right-4 grid size-10 place-items-center rounded-full hover:bg-white/5"
        >
          <XIcon className="size-6" />
        </button>

        <div className="flex items-center justify-center gap-2 px-6 pt-12 text-[20px]" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'login'}
            aria-current={tab === 'login' ? 'page' : undefined}
            onClick={() => setTab('login')}
            className={tab === 'login' ? 'text-highlight font-semibold' : 'font-medium'}
          >
            Entrar
          </button>
          <span aria-hidden className="h-5 w-px bg-[#F0805F]" />
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'signup'}
            aria-current={tab === 'signup' ? 'page' : undefined}
            onClick={() => setTab('signup')}
            className={tab === 'signup' ? 'text-highlight font-semibold' : 'font-medium'}
          >
            Criar conta
          </button>
        </div>

        <p className="text-canvas mx-auto max-w-[404px] px-6 pt-10 text-center text-[13px] leading-4">
          Entre para gerenciar sua carteira, coleção e perfil de criador.
        </p>

        {tab === 'login' ? (
          <LoginForm onAuthenticated={onAuthenticated} />
        ) : (
          <SignupForm onAuthenticated={onAuthenticated} />
        )}

        <div className="mt-5 h-2.5 w-full bg-[#D28A4C]" aria-hidden />
      </DialogContent>
    </Dialog>
  )
}

function Field({
  id,
  label,
  required,
  error,
  children
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="sr-only">
        {label}
        {required ? <span className="text-error"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-error text-xs">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function SocialDivider() {
  return (
    <div className="space-y-4">
      <Button type="button" variant="outline" className="w-full gap-3" disabled title="Em breve nesta demo">
        <GoogleMark className="size-4" />
        Continue with Google
        <span className="sr-only"> (não disponível nesta demo)</span>
      </Button>
      <div className="text-text-secondary flex items-center gap-3 text-[13px]">
        <span aria-hidden className="bg-white/10 h-px flex-1" />
        Ou continue com
        <span aria-hidden className="bg-white/10 h-px flex-1" />
      </div>
    </div>
  )
}

function LoginForm({ onAuthenticated }: { onAuthenticated: () => void }) {
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
    <form
      className="space-y-3 px-7 pt-6 sm:px-20 [&_input]:h-[50px] [&_input]:rounded-[10px] [&_input]:px-4 [&_input]:text-sm sm:[&_input]:h-10 sm:[&_input]:rounded-[5px]"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        setErrors({ fields: {} })
        login.mutate()
      }}
    >
      <SocialDivider />
      <Field id="login-usuario" label="Usuário" required error={errors.fields.email}>
        <Input
          id="login-usuario"
          autoComplete="username"
          placeholder="Digite seu usuário"
          value={form.usuario}
          onChange={(e) => setForm((f) => ({ ...f, usuario: e.target.value }))}
        />
      </Field>
      <Field id="login-senha" label="Senha" required error={errors.fields.password}>
        <PasswordField
          id="login-senha"
          autoComplete="current-password"
          placeholder="Digite sua senha"
          value={form.senha}
          onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
        />
      </Field>
      {errors.general ? (
        <p role="alert" className="text-error text-sm">
          {errors.general}
        </p>
      ) : null}
      <div className="flex justify-end">
        <button type="button" disabled title="Em breve nesta demo" className="text-highlight cursor-not-allowed text-sm">
          Esqueceu sua senha?
        </button>
      </div>
      <Button
        type="submit"
        className="mt-3 h-[60px] w-full rounded-[10px] text-base font-bold sm:h-[45px] sm:rounded-[5px]"
        disabled={login.isPending}
      >
        {login.isPending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}

function SignupForm({ onAuthenticated }: { onAuthenticated: () => void }) {
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
    <form
      className="space-y-3 px-7 pt-6 sm:px-20 [&_input]:h-[50px] [&_input]:rounded-[10px] [&_input]:px-4 [&_input]:text-sm sm:[&_input]:h-10 sm:[&_input]:rounded-[5px]"
      noValidate
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
      <Field id="su-usuario" label="Usuário" required error={errors.fields.username}>
        <Input
          id="su-usuario"
          autoComplete="username"
          placeholder="Digite seu usuário"
          value={form.usuario}
          onChange={(e) => setForm((f) => ({ ...f, usuario: e.target.value }))}
        />
      </Field>
      <Field id="su-email" label="E-mail" required error={errors.fields.email}>
        <Input
          id="su-email"
          type="email"
          autoComplete="email"
          placeholder="Digite seu e-mail"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
      </Field>
      <Field id="su-senha" label="Senha" required error={errors.fields.password}>
        <PasswordField
          id="su-senha"
          autoComplete="new-password"
          placeholder="Digite sua senha"
          value={form.senha}
          onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
        />
      </Field>
      <Field id="su-confirmar" label="Confirmar senha" required error={errors.fields.confirmar ?? (mismatch ? 'As senhas não coincidem.' : undefined)}>
        <PasswordField
          id="su-confirmar"
          autoComplete="new-password"
          placeholder="Repita a senha"
          value={form.confirmar}
          onChange={(e) => setForm((f) => ({ ...f, confirmar: e.target.value }))}
        />
      </Field>
      {errors.general ? (
        <p role="alert" className="text-error text-sm">
          {errors.general}
        </p>
      ) : null}
      <Button
        type="submit"
        className="mt-3 h-[60px] w-full rounded-[10px] text-base font-bold sm:h-[45px] sm:rounded-[5px]"
        disabled={signup.isPending}
      >
        {signup.isPending ? 'Criando conta…' : 'Criar conta'}
      </Button>
    </form>
  )
}
