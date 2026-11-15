import React from 'react'

/**
 * A text box that hides rows of the server-rendered list inside it. Rows opt in with
 * a `data-filter` attribute (its value is searched; empty means "use the row's text").
 *
 * No React on the client: the /will-it-run pages ship as plain HTML (see
 * scripts/prune-export.mjs), so the behaviour comes from FILTER_SCRIPT, which
 * PageShell includes once per page.
 */
export function ListFilter({
  label,
  placeholder,
  emptyText,
  children,
}: {
  label: string
  placeholder: string
  emptyText: React.ReactNode
  children: React.ReactNode
}) {
  const id = `filter-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  return (
    <div data-list-filter="">
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-gray-300">
        {label}
      </label>
      <input
        id={id}
        type="search"
        placeholder={placeholder}
        autoComplete="off"
        className="mb-4 w-full rounded-md border border-gray-700 bg-black/40 px-3 py-2 text-base text-gray-100 placeholder:text-gray-500 focus:border-cyan-500 focus:outline-none sm:text-sm"
      />
      {children}
      <div data-empty="" hidden className="mt-2 text-sm text-gray-300">
        {emptyText}
      </div>
    </div>
  )
}

export const FILTER_SCRIPT = `document.querySelectorAll('[data-list-filter]').forEach(function(box){
var input=box.querySelector('input'),empty=box.querySelector('[data-empty]');
input.addEventListener('input',function(){
var terms=input.value.toLowerCase().split(/\\s+/).filter(Boolean),visible=0;
box.querySelectorAll('[data-filter]').forEach(function(el){
var hay=(el.dataset.filter||el.textContent||'').toLowerCase();
var match=terms.every(function(t){return hay.indexOf(t)>=0});
el.hidden=!match;if(match)visible++;});
empty.hidden=!(terms.length&&visible===0);});});`
