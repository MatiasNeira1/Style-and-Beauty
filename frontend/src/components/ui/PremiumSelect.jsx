import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';

export function PremiumSelect({ id, label, value, options = [], onChange }) {
  const normalizedOptions = options.map((option) => (
    typeof option === 'string' ? { label: option, value: option, disabled: false } : option
  ));

  return (
    <Listbox value={value} onChange={onChange}>
      {({ open }) => (
        <div className="premium-select" data-open={open ? 'true' : 'false'}>
          <span id={`${id}-label`} className="premium-select-label">{label}</span>
          <ListboxButton
            id={id}
            className="premium-select-trigger"
            aria-labelledby={`${id}-label ${id}`}
          >
            <span className="premium-select-value">{value}</span>
            <ChevronDown className="premium-select-chevron" size={18} aria-hidden="true" />
          </ListboxButton>

          <ListboxOptions
            anchor="bottom start"
            transition
            className="premium-select-options"
          >
            {normalizedOptions.map((option) => (
              <ListboxOption
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="premium-select-option"
              >
                {({ selected, disabled }) => (
                  <>
                    <span>{option.label}</span>
                    {disabled && <small>Próximamente</small>}
                    {selected && <Check size={16} aria-hidden="true" />}
                  </>
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </div>
      )}
    </Listbox>
  );
}
