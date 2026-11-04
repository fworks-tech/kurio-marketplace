import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

type PasswordFieldProps = React.ComponentProps<'input'> & {
  label?: string
}

function PasswordField({ className, label, id, ...props }: PasswordFieldProps) {
  const generatedId = React.useId()
  const inputId = id ?? generatedId
  const [visible, setVisible] = React.useState(false)

  return (
    <div className={cn('relative', className)}>
      <Input
        id={inputId}
        type={visible ? 'text' : 'password'}
        className="pr-11"
        aria-label={label}
        {...props}
      />
      <button
        type="button"
        aria-pressed={visible}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        onClick={() => setVisible((v) => !v)}
        className="text-icon hover:text-foreground absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-md transition-colors"
      >
        {visible ? <EyeOff /> : <Eye />}
      </button>
    </div>
  )
}

export { PasswordField }
