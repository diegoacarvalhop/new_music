import { useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { getApiClient } from '../api/client'
import type { Page } from '../types'

export interface SelectSearchOption {
  value: string
  label: string
}

interface SelectSearchProps {
  id?: string
  value: string
  onChange: (value: string, label: string) => void
  searchUrl?: string
  options?: SelectSearchOption[]
  placeholder?: string
  disabled?: boolean
  emptyOption?: SelectSearchOption
  extraParams?: Record<string, string>
  required?: boolean
  className?: string
  portal?: boolean
  'aria-label'?: string
}

function getRawFromResponse(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  const page = data as Page<Record<string, unknown>>
  return page?.content ?? []
}

function getLabelFromItem(o: Record<string, unknown>): string {
  const id = o.id as number
  const nome = (o.nome as string) ?? (o.instrumentoNome && o.professorNome ? `${o.instrumentoNome} - ${o.professorNome}` : null) ?? String(id)
  return String(nome)
}

export default function SelectSearch({
  id,
  value,
  onChange,
  searchUrl,
  options: optionsProp,
  placeholder = 'Digite para buscar...',
  disabled = false,
  emptyOption,
  extraParams = {},
  required,
  className = '',
  portal = false,
  'aria-label': ariaLabel
}: SelectSearchProps) {
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<SelectSearchOption[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState('')
  const [portalStyle, setPortalStyle] = useState<React.CSSProperties | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const extraParamsRef = useRef(extraParams)
  const requestIdRef = useRef(0)
  const queryRef = useRef(query)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  queryRef.current = query
  extraParamsRef.current = extraParams
  const isStatic = Array.isArray(optionsProp) && optionsProp.length >= 0

  const filterStaticOptions = useCallback((busca: string) => {
    if (!optionsProp?.length) return []
    const term = (busca ?? '').trim().toLowerCase()
    if (!term) return optionsProp
    return optionsProp.filter((opt) => opt.label.toLowerCase().includes(term))
  }, [optionsProp])

  const fetchOptions = useCallback(async (busca: string) => {
    if (isStatic) {
      setOptions(filterStaticOptions(busca))
      return
    }
    if (!searchUrl) return
    const reqId = ++requestIdRef.current
    setLoading(true)
    try {
      const api = getApiClient()
      const params: Record<string, string | number | undefined> = { size: 20, page: 0, ...extraParamsRef.current }
      if (busca?.trim()) params.busca = busca.trim()
      const res = await api.get(searchUrl, { params })
      if (reqId !== requestIdRef.current) return
      const raw = getRawFromResponse(res.data)
      let opts: SelectSearchOption[] = (Array.isArray(raw) ? raw : []).map((item: unknown) => {
        const o = item as Record<string, unknown>
        return { value: String(o.id), label: getLabelFromItem(o) }
      })
      if (busca?.trim()) {
        const term = busca.trim().toLowerCase()
        opts = opts.filter((opt) => opt.label.toLowerCase().includes(term))
      }
      setOptions(opts)
    } catch {
      if (reqId !== requestIdRef.current) return
      setOptions([])
    } finally {
      if (reqId === requestIdRef.current) setLoading(false)
    }
  }, [searchUrl, isStatic, filterStaticOptions])

  useEffect(() => {
    if (!open) return
    if (isStatic) setOptions(filterStaticOptions(queryRef.current))
    else if (searchUrl) fetchOptions(queryRef.current)
  }, [open, isStatic, searchUrl, filterStaticOptions, fetchOptions])

  useEffect(() => {
    if (isStatic) {
      setOptions(filterStaticOptions(query))
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!open) return
    debounceRef.current = setTimeout(() => fetchOptions(query), 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, open, isStatic, filterStaticOptions, fetchOptions])

  useEffect(() => {
    if (value && !selectedLabel) {
      const fromOptions = options.find((o) => o.value === value)
      if (fromOptions) setSelectedLabel(fromOptions.label)
      else if (isStatic && optionsProp) {
        const fromProp = optionsProp.find((o) => o.value === value)
        if (fromProp) setSelectedLabel(fromProp.label)
      }
    }
    if (!value) setSelectedLabel('')
  }, [value, options, selectedLabel, isStatic, optionsProp])

  const displayValue = value ? selectedLabel : query
  const showPlaceholder = !value && !query

  const handleSelect = (optValue: string, optLabel: string) => {
    onChange(optValue, optLabel)
    setSelectedLabel(optLabel)
    setQuery('')
    setOpen(false)
  }

  const handleInputChange = (v: string) => {
    if (value) {
      onChange('', '')
      setSelectedLabel('')
    }
    setQuery(v)
    setOpen(true)
  }

  useEffect(() => {
    if (!open || !portal) {
      setPortalStyle(null)
      return
    }

    const update = () => {
      const el = wrapRef.current ?? inputRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setPortalStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        right: 'auto',
        zIndex: 5000
      })
    }

    update()
    window.addEventListener('resize', update)
    // Captura scroll inclusive de containers (ex.: modal com overflow)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, portal])

  const dropdown = (
    <ul
      className="select-search-dropdown relatorio-select-search-dropdown"
      role="listbox"
      style={portal ? (portalStyle ?? undefined) : undefined}
    >
      {emptyOption && (
        <li
          role="option"
          className="select-search-dropdown-item"
          onMouseDown={(e) => { e.preventDefault(); handleSelect(emptyOption.value, emptyOption.label); }}
        >
          {emptyOption.label}
        </li>
      )}
      {loading ? (
        <li className="relatorio-select-search-loading">Carregando...</li>
      ) : (
        options.map((opt) => (
          <li
            key={opt.value}
            role="option"
            className="select-search-dropdown-item"
            onMouseDown={(e) => { e.preventDefault(); handleSelect(opt.value, opt.label); }}
          >
            {opt.label}
          </li>
        ))
      )}
    </ul>
  )

  return (
    <div ref={wrapRef} className={`select-search-wrap relatorio-select-search ${className}`.trim()}>
      <input
        id={id}
        type="text"
        autoComplete="off"
        className="select-search-input"
        ref={inputRef}
        value={displayValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => { if (!disabled) setOpen(true); if (!options.length && !query) fetchOptions(queryRef.current) }}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder={showPlaceholder ? placeholder : undefined}
        disabled={disabled}
        required={required && !value}
        aria-label={ariaLabel}
      />
      {open && !disabled && (
        portal ? createPortal(dropdown, document.body) : dropdown
      )}
    </div>
  )
}
