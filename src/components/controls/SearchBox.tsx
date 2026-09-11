import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { LanguageSummary, MapCountry } from '../../types';
import { LANGUAGES, languageName } from '../../data/dataset';
import { searchMap } from '../../utils/search';
import { SearchIcon } from '../icons';

interface SearchBoxProps {
  countries: MapCountry[];
  /** Phone layout: an icon that opens the search over the header. */
  compact: boolean;
  onSelectCountry: (key: string) => void;
  onSelectLanguage: (code: string) => void;
}

type SearchOption =
  | { kind: 'country'; country: MapCountry }
  | { kind: 'language'; language: LanguageSummary };

function describe(option: SearchOption): { key: string; label: string; detail: string } {
  if (option.kind === 'country') {
    const { country } = option;
    return {
      key: `country:${country.key}`,
      label: country.name,
      detail: country.data ? country.data.languages.map(languageName).join(', ') : 'No language data',
    };
  }
  const { language } = option;
  const count = language.countries.length;
  const native = language.nativeName && language.nativeName !== language.name ? `${language.nativeName} · ` : '';
  return {
    key: `language:${language.code}`,
    label: language.name,
    detail: `${native}official in ${count === 1 ? '1 country' : `${count} countries`}`,
  };
}

export default function SearchBox({ countries, compact, onSelectCountry, onSelectLanguage }: SearchBoxProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);

  const results = useMemo(() => searchMap(query, countries, LANGUAGES), [query, countries]);
  const options = useMemo<SearchOption[]>(
    () => [
      ...results.countries.map((country) => ({ kind: 'country' as const, country })),
      ...results.languages.map((language) => ({ kind: 'language' as const, language })),
    ],
    [results]
  );

  const showResults = focused && query.trim().length > 0;
  const active = Math.min(activeIndex, options.length - 1);
  const optionId = (index: number) => `${listId}-option-${index}`;

  // "/" jumps to the search from anywhere outside a text field.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable]')) return;
      event.preventDefault();
      if (compact) setOpen(true);
      else inputRef.current?.focus();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [compact]);

  const close = () => {
    setQuery('');
    setActiveIndex(0);
    setOpen(false);
    inputRef.current?.blur();
  };

  const choose = (option: SearchOption) => {
    if (option.kind === 'country') onSelectCountry(option.country.key);
    else onSelectLanguage(option.language.code);
    close();
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex(Math.min(active + 1, options.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex(Math.max(active - 1, 0));
        break;
      case 'Enter':
        if (options[active]) {
          event.preventDefault();
          choose(options[active]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        if (query) {
          setQuery('');
          setActiveIndex(0);
        } else {
          close();
        }
        break;
    }
  };

  if (compact && !open) {
    return (
      <button
        type="button"
        className="header-button"
        aria-label="Search countries and languages"
        onClick={() => setOpen(true)}
      >
        <SearchIcon />
      </button>
    );
  }

  const countryCount = results.countries.length;
  const renderOption = (option: SearchOption, index: number) => {
    const { key, label, detail } = describe(option);
    return (
      <div
        key={key}
        id={optionId(index)}
        role="option"
        aria-selected={index === active}
        className={`search-option${index === active ? ' is-active' : ''}`}
        onPointerMove={() => setActiveIndex(index)}
        onClick={() => choose(option)}
      >
        <span className="search-option-label">{label}</span>
        <span className="search-option-detail">{detail}</span>
      </div>
    );
  };

  return (
    <div className={compact ? 'search search-overlay' : 'search'} role="search">
      <div className="search-field">
        <SearchIcon className="search-field-icon" />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-label="Search countries and languages"
          aria-expanded={showResults}
          aria-controls={showResults ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={showResults && active >= 0 ? optionId(active) : undefined}
          placeholder={compact ? 'Country or language' : 'Search a country or language'}
          value={query}
          autoFocus={compact}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            if (compact && !query) setOpen(false);
          }}
          onKeyDown={handleKeyDown}
        />
        {!compact && !query && (
          <kbd className="search-kbd" aria-hidden="true">
            /
          </kbd>
        )}
      </div>
      {compact && (
        <button type="button" className="text-button search-cancel" onClick={close}>
          Cancel
        </button>
      )}
      {showResults && (
        <div
          id={listId}
          role="listbox"
          aria-label="Search results"
          className="search-results"
          onMouseDown={(event) => event.preventDefault()}
        >
          {options.length === 0 && (
            <div className="search-empty">No country or language matches “{query.trim()}”.</div>
          )}
          {countryCount > 0 && (
            <div role="group" aria-label="Countries">
              <div className="search-group-label" aria-hidden="true">
                Countries
              </div>
              {options.slice(0, countryCount).map((option, index) => renderOption(option, index))}
            </div>
          )}
          {results.languages.length > 0 && (
            <div role="group" aria-label="Languages">
              <div className="search-group-label" aria-hidden="true">
                Languages
              </div>
              {options.slice(countryCount).map((option, index) => renderOption(option, countryCount + index))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
