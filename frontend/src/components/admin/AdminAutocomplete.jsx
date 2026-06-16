import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

export function AdminAutocomplete({
  id,
  label,
  options = [],
  selectedValue,
  placeholder,
  emptyMessage = 'Sin resultados',
  getOptionValue,
  getOptionLabel,
  getOptionMeta,
  getOptionSearchText,
  onSelect,
  onClear,
}) {
  const wrapperRef = useRef(null);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = useMemo(() => (
    options.find((option) => String(getOptionValue(option)) === String(selectedValue))
  ), [getOptionValue, options, selectedValue]);

  const selectedLabel = selectedOption ? getOptionLabel(selectedOption) : '';

  useEffect(() => {
    if (!isOpen) {
      setQuery(selectedLabel);
    }
  }, [isOpen, selectedLabel]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!wrapperRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const shouldFilter = normalizedQuery && normalizedQuery !== selectedLabel.trim().toLowerCase();
  const visibleOptions = useMemo(() => {
    if (!shouldFilter) return options;
    return options.filter((option) => {
      const searchText = getOptionSearchText
        ? getOptionSearchText(option)
        : [getOptionLabel(option), getOptionMeta?.(option)].filter(Boolean).join(' ');
      return searchText.toLowerCase().includes(normalizedQuery);
    });
  }, [getOptionLabel, getOptionMeta, getOptionSearchText, normalizedQuery, options, shouldFilter]);

  const clearSelection = () => {
    setQuery('');
    setIsOpen(false);
    onClear();
  };

  return (
    <div className="field admin-autocomplete" ref={wrapperRef}>
      <span>{label}</span>
      <div className="admin-autocomplete-control">
        <Search size={15} aria-hidden="true" />
        <input
          id={id}
          type="search"
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            if (selectedValue) onClear();
          }}
        />
        {selectedValue && (
          <button type="button" aria-label={`Limpiar ${label.toLowerCase()}`} onClick={clearSelection}>
            <X size={14} />
          </button>
        )}
      </div>
      {isOpen && (
        <div className="admin-autocomplete-menu" role="listbox" aria-label={label}>
          {visibleOptions.length ? visibleOptions.slice(0, 8).map((option) => {
            const value = getOptionValue(option);
            const optionLabel = getOptionLabel(option);
            const meta = getOptionMeta?.(option);
            return (
              <button
                key={value}
                type="button"
                role="option"
                aria-selected={String(value) === String(selectedValue)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelect(value);
                  setQuery(optionLabel);
                  setIsOpen(false);
                }}
              >
                <strong>{optionLabel}</strong>
                {meta && <small>{meta}</small>}
              </button>
            );
          }) : (
            <span className="admin-autocomplete-empty">{emptyMessage}</span>
          )}
        </div>
      )}
    </div>
  );
}
