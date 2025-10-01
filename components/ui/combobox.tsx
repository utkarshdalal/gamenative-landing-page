'use client'

import * as React from 'react'
import { ChevronsUpDown, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { CommandDialog } from '@/components/ui/command'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

type ComboItem = {
  value: string
  label: string
  meta?: string
}

type ComboboxProps = {
  label?: string
  placeholder?: string
  inputValue: string
  onInputChange: (value: string) => void
  items: ComboItem[]
  emptyText?: string
  onSelect: (item: ComboItem) => void
  className?: string
}

export function Combobox({
  label,
  placeholder,
  inputValue,
  onInputChange,
  items,
  emptyText = 'No results',
  onSelect,
  className,
}: ComboboxProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState(inputValue)

  React.useEffect(() => {
    setSearch(inputValue)
  }, [inputValue])

  const triggerClasses = cn(
    'rounded-md bg-black/40 border border-gray-700 px-3 py-2 text-gray-100 placeholder-gray-400 outline-none focus:border-cyan-500 w-full text-left flex items-center justify-between gap-2',
  )

  const renderList = (
    <>
      <CommandInput
        value={search}
        onValueChange={(v) => {
          setSearch(v)
          onInputChange(v)
        }}
        placeholder={placeholder}
        className="h-11"
      />
      <CommandList>
        <CommandEmpty>{emptyText}</CommandEmpty>
        <CommandGroup>
          {items.map((item) => (
            <CommandItem
              key={`${item.value}|${item.label}`}
              value={item.label}
              onSelect={() => {
                onSelect(item)
                setOpen(false)
              }}
            >
              <div className="flex min-w-0 items-center justify-between gap-3 w-full">
                <span className="truncate">{item.label}</span>
                {item.meta ? (
                  <span className="text-muted-foreground text-xs truncate">{item.meta}</span>
                ) : null}
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </>
  )

  return (
    <div className={cn('flex flex-col', className)}>
      {label ? (
        <label className="text-sm text-gray-300 mb-2">{label}</label>
      ) : null}

      {isMobile ? (
        <>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={triggerClasses}
          >
            <span className={cn('truncate', !inputValue ? 'text-gray-400' : undefined)}>
              {inputValue || placeholder}
            </span>
            <ChevronsUpDown className="size-4 opacity-60" />
          </button>
          <CommandDialog open={open} onOpenChange={setOpen} showCloseButton>
            {renderList}
          </CommandDialog>
        </>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button type="button" className={triggerClasses} onClick={() => setOpen((v) => !v)}>
              <span className={cn('truncate', !inputValue ? 'text-gray-400' : undefined)}>
                {inputValue || placeholder}
              </span>
              <ChevronsUpDown className="size-4 opacity-60" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[360px]" align="start">
            <Command>{renderList}</Command>
          </PopoverContent>
        </Popover>
      )}

      {!!inputValue && (
        <button
          type="button"
          className="self-end mt-1 text-xs text-gray-400 hover:text-gray-200 inline-flex items-center gap-1"
          onClick={() => {
            onInputChange('')
            // Keep dialog/popover closed on clear
            setOpen(false)
          }}
          aria-label="Clear selection"
        >
          <X className="size-3" /> Clear
        </button>
      )}
    </div>
  )
}


