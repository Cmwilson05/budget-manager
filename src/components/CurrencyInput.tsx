import { useState, useEffect, useRef } from 'react'

interface CurrencyInputProps {
  value: string
  onChange: (value: string) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  className?: string
  placeholder?: string
  required?: boolean
  autoFocus?: boolean
}

export default function CurrencyInput({
  value,
  onChange,
  onKeyDown,
  className = '',
  placeholder = '0.00',
  required = false,
  autoFocus = false
}: CurrencyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Convert the stored value (e.g., "123.45" or "") to cents for internal use
  const valueToCents = (val: string): number => {
    if (!val) return 0
    const num = parseFloat(val)
    if (isNaN(num)) return 0
    return Math.round(num * 100)
  }

  // Convert cents to display format (e.g., "1,234.56")
  const centsToDisplay = (cents: number): string => {
    const dollars = cents / 100
    return dollars.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  // Convert cents back to the raw value string for the parent (e.g., "123.45")
  const centsToValue = (cents: number): string => {
    return (cents / 100).toFixed(2)
  }

  const [displayValue, setDisplayValue] = useState(() => value === '' ? '' : centsToDisplay(valueToCents(value)))

  // Sync display value when external value changes
  useEffect(() => {
    const newDisplay = value === '' ? '' : centsToDisplay(valueToCents(value))
    if (newDisplay !== displayValue) {
      setDisplayValue(newDisplay)
    }
  }, [value])

  // Check if all text is selected
  const isAllSelected = (): boolean => {
    const input = inputRef.current
    if (!input) return false
    return input.selectionStart === 0 && input.selectionEnd === input.value.length && input.value.length > 0
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, arrows
    if ([8, 9, 27, 13, 46, 37, 39].includes(e.keyCode)) {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault()
        // If all selected, clear the field
        if (isAllSelected()) {
          onChange('')
          setDisplayValue('')
        } else {
          const currentCents = valueToCents(value)
          const newCents = Math.floor(currentCents / 10)
          const newValue = centsToValue(newCents)
          onChange(newValue)
          setDisplayValue(centsToDisplay(newCents))
        }
      } else if (onKeyDown) {
        onKeyDown(e)
      }
      return
    }

    // Only allow digits
    if (!/^\d$/.test(e.key)) {
      e.preventDefault()
      return
    }

    e.preventDefault()

    const digit = parseInt(e.key, 10)

    // If all selected, start fresh with just this digit
    const startFresh = isAllSelected()
    const currentCents = startFresh ? 0 : valueToCents(value)
    const newCents = currentCents * 10 + digit

    // Prevent overflow (max ~$999,999,999.99)
    if (newCents > 99999999999) return

    const newValue = centsToValue(newCents)
    onChange(newValue)
    setDisplayValue(centsToDisplay(newCents))
  }

  const handleFocus = () => {
    // Select all on focus for easy replacement
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const handleBlur = () => {
    // Ensure display is synced on blur
    setDisplayValue(value === '' ? '' : centsToDisplay(valueToCents(value)))
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={() => {}} // Controlled via keyDown
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={className}
      placeholder={placeholder}
      required={required}
      autoFocus={autoFocus}
    />
  )
}
