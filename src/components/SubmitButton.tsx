import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

interface Props {
  /** Muestra el spinner y bloquea el botón mientras dura la petición. */
  loading?: boolean
  /** Texto durante la carga; por defecto "Guardando…". */
  loadingLabel?: string
  disabled?: boolean
  type?: 'submit' | 'button'
  onClick?: () => void
  variant?: 'primary' | 'outline'
  className?: string
  children: ReactNode
}

const styles = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-700',
  outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
}

export default function SubmitButton({
  loading = false,
  loadingLabel = 'Guardando…',
  disabled = false,
  type = 'submit',
  onClick,
  variant = 'primary',
  className = '',
  children,
}: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      aria-busy={loading}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {loading ? loadingLabel : children}
    </button>
  )
}
