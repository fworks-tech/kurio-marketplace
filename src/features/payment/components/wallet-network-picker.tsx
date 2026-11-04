/**
 * Figma `Carteira e rede` (Desktop / Pagamento, summary column):
 * heading 17/16 bold, then three 405x45 option rows with a 16px dot and a
 * 16px gutter between rows.
 */


// The frame lists WalletConnect first and the designer's comment #70 confirms it.
export const WALLET_OPTIONS = ['WalletConnect', 'MetaMask', 'Coinbase Wallet'] as const

export type WalletOption = (typeof WALLET_OPTIONS)[number]

interface WalletNetworkPickerProps {
  value: WalletOption
  onChange: (value: WalletOption) => void
  className?: string
  /** Simulated handshake state/handlers; omitted renders the plain selector. */
  connection?: WalletConnectionState
}

export interface WalletConnectionState {
  status: 'idle' | 'connecting' | 'awaiting-approval' | 'connected' | 'refused'
  wallet: WalletOption | null
  address: string | null
  onConnect: () => void
  onApprove: () => void
  onRefuse: () => void
  onDisconnect: () => void
  onRetry: () => void
}

const SHORT_ADDRESS = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`

export function WalletNetworkPicker({ value, onChange, className, connection }: WalletNetworkPickerProps) {
  return (
    <div className={className}>
      <h2 className="text-[17px] leading-4 font-bold">Carteira e rede</h2>
      <div className="mt-5 space-y-4" role="radiogroup" aria-label="Carteira e rede">
        {WALLET_OPTIONS.map((option) => {
          const selected = option === value
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option)}
              className={
                'flex h-[45px] w-full items-center gap-3 rounded-[3px] border px-3 text-left text-[15px] leading-5 transition-colors ' +
                (selected
                  ? 'border-primary text-canvas'
                  : 'border-field text-canvas hover:border-primary/60')
              }
            >
              <span
                aria-hidden
                className={
                  'border-primary grid size-4 shrink-0 place-items-center rounded-full border'
                }
              >
                {selected ? <span className="bg-primary size-2.5 rounded-full" /> : null}
              </span>
              {option}
            </button>
          )
        })}
      </div>

      {connection ? <WalletConnectionPanel wallet={value} connection={connection} /> : null}
    </div>
  )
}

/** Inline handshake simulator: connect, approve/refuse, disconnect, retry. */
function WalletConnectionPanel({
  wallet,
  connection
}: {
  wallet: WalletOption
  connection: WalletConnectionState
}) {
  const { status, address } = connection
  const base = 'mt-3 rounded-[5px] border px-3 py-2 text-[13px] leading-5'

  if (status === 'connected') {
    return (
      <div className={base + ' border-success/40 bg-success/10'}>
        <p className="text-success font-semibold">Carteira conectada</p>
        <p className="text-canvas/80 tabular-nums">{address ? SHORT_ADDRESS(address) : ''}</p>
        <button
          type="button"
          onClick={connection.onDisconnect}
          className="text-highlight mt-1 font-semibold underline underline-offset-2"
        >
          Desconectar
        </button>
      </div>
    )
  }

  if (status === 'connecting') {
    return (
      <div className={base + ' border-field text-canvas/80'} role="status">
        Conectando à {connection.wallet ?? wallet}…
      </div>
    )
  }

  if (status === 'awaiting-approval') {
    return (
      <div className={base + ' border-primary/50 bg-primary/10'} role="group" aria-label="Aprovar conexão da carteira">
        <p className="text-canvas">Aprove a conexão na {connection.wallet ?? wallet}.</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={connection.onApprove}
            className="bg-primary text-ink rounded-[4px] px-3 py-1 font-bold"
          >
            Aprovar
          </button>
          <button
            type="button"
            onClick={connection.onRefuse}
            className="border-field text-canvas rounded-[4px] border px-3 py-1 font-semibold"
          >
            Recusar
          </button>
        </div>
      </div>
    )
  }

  if (status === 'refused') {
    return (
      <div className={base + ' border-coral/50 bg-coral/10'} role="alert">
        <p className="text-coral font-semibold">Conexão recusada na carteira</p>
        <p className="text-canvas/80">Nada foi cobrado. Você pode tentar de novo quando quiser.</p>
        <button
          type="button"
          onClick={connection.onRetry}
          className="text-highlight mt-1 font-semibold underline underline-offset-2"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={connection.onConnect}
      className="border-field text-canvas hover:border-primary/60 mt-3 h-[45px] w-full rounded-[5px] border text-[15px] font-semibold transition-colors"
    >
      Conectar {wallet}
    </button>
  )
}
