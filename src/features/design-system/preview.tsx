import * as React from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Divider } from '@/components/ui/divider'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordField } from '@/components/ui/password-field'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Toaster } from '@/components/ui/sonner'
import { FacebookMark, GoogleMark } from '@/shared/ui/brand-marks'

const palette = [
  ['ink', '--color-ink'],
  ['canvas', '--color-canvas'],
  ['primary', '--color-primary'],
  ['sand', '--color-sand'],
  ['highlight', '--color-highlight'],
  ['coral', '--color-coral'],
  ['text-secondary', '--color-text-secondary'],
  ['surface-card', '--color-surface-card'],
  ['surface-raised', '--color-surface-raised'],
  ['surface-dark', '--color-surface-dark'],
  ['field', '--color-field'],
  ['muted-strong', '--color-muted-strong'],
  ['amber', '--color-amber'],
  ['success', '--color-success'],
  ['error', '--color-error'],
  ['background', '--color-background'],
  ['foreground', '--color-foreground'],
  ['card', '--color-card'],
  ['popover', '--color-popover'],
  ['muted-foreground', '--color-muted-foreground'],
  ['border', '--color-border'],
  ['ring', '--color-ring'],
  ['destructive', '--color-destructive']
] as const

const typeScale = [
  ['display', 'text-display', 'SEJA DONO DO FUTURO'],
  ['title', 'text-title', 'Título 20 bold'],
  ['title-sm', 'text-title-sm', 'Preço 18 bold'],
  ['body', 'text-body', 'Corpo 16'],
  ['body-sm', 'text-body-sm', 'Corpo 15'],
  ['body-xs', 'text-body-xs', 'Corpo 14'],
  ['caption', 'text-caption', 'Legenda 13']
] as const

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-border border-t pt-6">
      <h2 className="text-title mb-4 font-bold">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  )
}

export default function DesignSystem() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-10">
      <header>
        <h1 className="text-display font-bold">Design System</h1>
        <p className="text-muted-foreground text-body-sm">
          Tokens e primitivas do Kurio (tema escuro). Página de desenvolvimento, não indexada.
        </p>
      </header>

      <Section title="Cores">
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {palette.map(([name, varName]) => (
            <li key={name} className="flex flex-col gap-1">
              <span
                className="border-border h-12 w-full rounded-md border"
                style={{ backgroundColor: `var(${varName})` }}
              />
              <span className="text-muted-foreground text-caption">{name}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Tipografia">
        {typeScale.map(([name, cls, sample]) => (
          <p key={name} className={cls}>
            <span className="text-muted-foreground text-caption">[{name}] </span>
            {sample}
          </p>
        ))}
      </Section>

      <Section title="Botões">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primário</Button>
          <Button variant="gradient" size="xl">Confirmar pagamento</Button>
          <Button variant="outline">Contorno</Button>
          <Button variant="secondary">Secundário</Button>
          <Button variant="ghost">Fantasma</Button>
          <Button variant="destructive">Destrutivo</Button>
          <Button variant="link">Link</Button>
          <Button disabled>Desativado</Button>
          <Button aria-busy="true" disabled>
            <Loader2 className="animate-spin" /> Enviando
          </Button>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="Adicionar"><Loader2 /></Button>
        </div>
        <p className="text-caption text-muted-foreground">Alturas do spec: primário 60px (xl), social 40px (social), input 50px.</p>
      </Section>

      <Section title="Social e marcas">
        <div className="flex max-w-sm flex-col gap-3">
          <Button variant="outline" size="social">
            <GoogleMark /> Continuar com Google
          </Button>
          <Button variant="outline" size="social">
            <FacebookMark /> Continuar com Facebook
          </Button>
        </div>
      </Section>

      <Section title="Campos">
        <div className="max-w-sm">
          <Label htmlFor="ds-email">E-mail</Label>
          <Input id="ds-email" placeholder="contato@email.com" className="mt-1" />
        </div>
        <div className="max-w-sm">
          <Label htmlFor="ds-pass">Senha</Label>
          <PasswordField id="ds-pass" label="Senha" defaultValue="password123" className="mt-1" />
        </div>
        <div className="max-w-sm">
          <Label htmlFor="ds-err">Campo inválido</Label>
          <Input id="ds-err" aria-invalid defaultValue="erro" className="mt-1" />
          <p className="text-error mt-1 text-caption">Informe um valor válido.</p>
        </div>
        <div className="flex items-center gap-4">
          <Checkbox id="ds-check" />
          <Label htmlFor="ds-check">Aceito os termos</Label>
        </div>
      </Section>

      <Section title="Seleção">
        <div className="max-w-sm">
          <Select>
            <SelectTrigger aria-label="Rede"><SelectValue placeholder="Rede" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="eth">Ethereum</SelectItem>
              <SelectItem value="polygon">Polygon</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <RadioGroup defaultValue="email" className="max-w-sm">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="email" id="ds-r1" />
            <Label htmlFor="ds-r1">E-mail</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="sms" id="ds-r2" />
            <Label htmlFor="ds-r2">SMS</Label>
          </div>
        </RadioGroup>
      </Section>

      <Section title="Badges, abas, feedback">
        <div className="flex flex-wrap gap-2">
          <Badge>RARO</Badge>
          <Badge variant="secondary">ABERTA</Badge>
          <span className="text-price text-title-sm font-bold">1,50 ETH</span>
        </div>
        <Tabs defaultValue="início" className="max-w-md">
          <TabsList>
            <TabsTrigger value="início">Início</TabsTrigger>
            <TabsTrigger value="mercado">Mercado</TabsTrigger>
          </TabsList>
          <TabsContent value="início"><p className="text-body-sm">Conteúdo Início.</p></TabsContent>
          <TabsContent value="mercado"><p className="text-body-sm">Conteúdo Mercado.</p></TabsContent>
        </Tabs>
        <Alert>
          <AlertTitle>Atualização em tempo real</AlertTitle>
          <AlertDescription>Uma oferta foi aceita enquanto você navegava.</AlertDescription>
        </Alert>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => toast.success('Cupom WELCOME10 aplicado.')}>
            Toast
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Menu">⋮</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem>Adicionar aos favoritos</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Denunciar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog>
            <DialogTrigger asChild><Button variant="outline">Abrir diálogo</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar saída</DialogTitle>
                <DialogDescription>Esc fecha e devolve o foco ao gatilho.</DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>
      </Section>

      <Section title="Divisores e skeleton">
        <Divider>Ou continue com</Divider>
        <Separator />
        <div className="max-w-sm"><Skeleton className="skeleton h-20 w-full" /></div>
      </Section>

      <Toaster position="bottom-right" theme="dark" />
    </main>
  )
}
