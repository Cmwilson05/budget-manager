// 12 distinct colors for accounts
export const accountColors = [
  { bg: 'bg-blue-900', border: 'border-blue-500', shadow: 'shadow-blue-500/30', text: 'text-blue-400', label: 'text-blue-300' },
  { bg: 'bg-emerald-900', border: 'border-emerald-500', shadow: 'shadow-emerald-500/30', text: 'text-emerald-400', label: 'text-emerald-300' },
  { bg: 'bg-purple-900', border: 'border-purple-500', shadow: 'shadow-purple-500/30', text: 'text-purple-400', label: 'text-purple-300' },
  { bg: 'bg-amber-900', border: 'border-amber-500', shadow: 'shadow-amber-500/30', text: 'text-amber-400', label: 'text-amber-300' },
  { bg: 'bg-rose-900', border: 'border-rose-500', shadow: 'shadow-rose-500/30', text: 'text-rose-400', label: 'text-rose-300' },
  { bg: 'bg-cyan-900', border: 'border-cyan-500', shadow: 'shadow-cyan-500/30', text: 'text-cyan-400', label: 'text-cyan-300' },
  { bg: 'bg-orange-900', border: 'border-orange-500', shadow: 'shadow-orange-500/30', text: 'text-orange-400', label: 'text-orange-300' },
  { bg: 'bg-indigo-900', border: 'border-indigo-500', shadow: 'shadow-indigo-500/30', text: 'text-indigo-400', label: 'text-indigo-300' },
  { bg: 'bg-teal-900', border: 'border-teal-500', shadow: 'shadow-teal-500/30', text: 'text-teal-400', label: 'text-teal-300' },
  { bg: 'bg-pink-900', border: 'border-pink-500', shadow: 'shadow-pink-500/30', text: 'text-pink-400', label: 'text-pink-300' },
  { bg: 'bg-lime-900', border: 'border-lime-500', shadow: 'shadow-lime-500/30', text: 'text-lime-400', label: 'text-lime-300' },
  { bg: 'bg-fuchsia-900', border: 'border-fuchsia-500', shadow: 'shadow-fuchsia-500/30', text: 'text-fuchsia-400', label: 'text-fuchsia-300' },
]

export const getAccountColor = (index: number) => {
  return accountColors[index % accountColors.length]
}

// Map account names to their colors based on accounts array order
export const getAccountColorMap = (accounts: { id: string; name: string }[]): Map<string, typeof accountColors[0]> => {
  const colorMap = new Map<string, typeof accountColors[0]>()
  accounts.forEach((account, index) => {
    colorMap.set(account.name, getAccountColor(index))
  })
  return colorMap
}
