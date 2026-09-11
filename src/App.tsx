import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import Header from './components/layout/Header';
import BottomSheet from './components/layout/BottomSheet';
import ShareButton from './components/layout/ShareButton';
import SearchBox from './components/controls/SearchBox';
import ModeSelector from './components/controls/ModeSelector';
import LanguageSelector from './components/controls/LanguageSelector';
import ControlsPeek from './components/controls/ControlsPeek';
import CountryDetailPanel, { CountryLanguages, CountryPeek } from './components/controls/CountryDetailPanel';
import MapLegend from './components/map/MapLegend';
import WorldMap from './components/map/WorldMap';
import type { MapInsets } from './components/map/WorldMap';
import { useElementSize } from './hooks/useElementSize';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useWorldGeometry } from './hooks/useWorldGeometry';
import { REPO_URL } from './config';
import { COUNTRY_COUNT, LANGUAGE_BY_CODE, languageName } from './data/dataset';
import { assignLanguageColors, computeFills, matchedLanguages, MAX_SELECTED_LANGUAGES } from './utils/colorScales';
import { formatUrlState, parseUrlState } from './utils/urlState';
import type { FocusRequest, MapCountry, VisualizationMode } from './types';
import './App.css';

/** Below this width the controls move into a bottom sheet. Keep in step with App.css. */
const MOBILE_QUERY = '(max-width: 860px)';
/** Height of the collapsed bottom sheet; matches --sheet-peek in index.css. */
const SHEET_PEEK = 120;
const NO_INSETS: MapInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const SHEET_INSETS: MapInsets = { top: 0, right: 0, bottom: SHEET_PEEK, left: 0 };
/** Room the floating country card takes on the right of the map. */
const CARD_INSET = 372;

interface LanguageSelection {
  languages: string[];
  colors: Record<string, string>;
}

const EMPTY_SELECTION: LanguageSelection = { languages: [], colors: {} };

function readUrlState() {
  const state = parseUrlState(window.location.hash);
  const languages = [...new Set(state.languages)]
    .filter((code) => LANGUAGE_BY_CODE.has(code))
    .slice(0, MAX_SELECTED_LANGUAGES);
  return { ...state, languages };
}

function withLanguages(previous: LanguageSelection, languages: string[]): LanguageSelection {
  return { languages, colors: assignLanguageColors(languages, previous.colors) };
}

function About() {
  return (
    <footer className="about">
      <p>
        A curated list of official and major languages for {COUNTRY_COUNT} countries, not every language
        spoken in each. Borders from{' '}
        <a href="https://www.naturalearthdata.com/" target="_blank" rel="noreferrer">
          Natural Earth
        </a>
        .
      </p>
      <p>
        <a href={`${REPO_URL}#about-the-data`} target="_blank" rel="noreferrer">
          About the data
        </a>{' '}
        ·{' '}
        <a href={REPO_URL} target="_blank" rel="noreferrer">
          Source on GitHub
        </a>
      </p>
    </footer>
  );
}

export default function App() {
  const [initial] = useState(readUrlState);
  const [mode, setMode] = useState<VisualizationMode>(initial.mode);
  const [selection, setSelection] = useState(() => withLanguages(EMPTY_SELECTION, initial.languages));
  const [selectedKey, setSelectedKey] = useState<string | null>(initial.country);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(
    initial.country ? { key: initial.country, nonce: 1 } : null
  );
  const [pinnedFamily, setPinnedFamily] = useState<string | null>(null);
  const [previewFamily, setPreviewFamily] = useState<string | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);

  const isMobile = useMediaQuery(MOBILE_QUERY);
  const [mapAreaRef, mapSize] = useElementSize<HTMLDivElement>();
  const { countries, countriesByKey, loading, error } = useWorldGeometry();
  const countryTitleId = useId();

  const focusFamily = mode === 'families' ? (previewFamily ?? pinnedFamily) : null;
  const { fills, stripes } = useMemo(
    () =>
      computeFills(countries, {
        mode,
        languages: selection.languages,
        colors: selection.colors,
        focusFamily,
      }),
    [countries, mode, selection, focusFamily]
  );

  const selectedCountry = selectedKey ? (countriesByKey.get(selectedKey) ?? null) : null;
  // Until the atlas has loaded, keep whatever country the URL asked for.
  const urlCountry = countries.length === 0 || selectedCountry ? selectedKey : null;

  // The URL always describes the current view, so the address bar is a share link.
  useEffect(() => {
    const { pathname, search, hash } = window.location;
    const nextHash = formatUrlState({ mode, languages: selection.languages, country: urlCountry });
    if (nextHash !== hash) window.history.replaceState(window.history.state, '', `${pathname}${search}${nextHash}`);
  }, [mode, selection.languages, urlCountry]);

  useEffect(() => {
    const handleHashChange = () => {
      const next = readUrlState();
      const country = next.country;
      setMode(next.mode);
      setSelection((previous) => withLanguages(previous, next.languages));
      setSelectedKey(country);
      if (country) setFocusRequest((previous) => ({ key: country, nonce: (previous?.nonce ?? 0) + 1 }));
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (!selectedKey) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) setSelectedKey(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedKey]);

  const updateLanguages = useCallback((update: (languages: string[]) => string[]) => {
    setSelection((previous) => withLanguages(previous, update(previous.languages)));
  }, []);

  const toggleLanguage = useCallback(
    (code: string) =>
      updateLanguages((languages) => {
        if (languages.includes(code)) return languages.filter((selected) => selected !== code);
        return languages.length < MAX_SELECTED_LANGUAGES ? [...languages, code] : languages;
      }),
    [updateLanguages]
  );

  /** Adds a language and switches to the language view so it shows up. */
  const showLanguage = useCallback(
    (code: string) => {
      setMode('highlight');
      updateLanguages((languages) =>
        languages.includes(code) || languages.length >= MAX_SELECTED_LANGUAGES ? languages : [...languages, code]
      );
    },
    [updateLanguages]
  );

  const clearLanguages = useCallback(() => updateLanguages(() => []), [updateLanguages]);

  const changeMode = useCallback((next: VisualizationMode) => {
    setMode(next);
    setPinnedFamily(null);
    setPreviewFamily(null);
  }, []);

  const handleMapSelect = useCallback((key: string | null) => {
    setSelectedKey(key);
    if (key) setSheetExpanded(false);
  }, []);

  /** Selects a country and flies the map to it. */
  const focusCountry = useCallback((key: string) => {
    setSelectedKey(key);
    setSheetExpanded(false);
    setFocusRequest((previous) => ({ key, nonce: (previous?.nonce ?? 0) + 1 }));
  }, []);

  const closeCountry = useCallback(() => setSelectedKey(null), []);

  const renderTooltip = useCallback(
    (country: MapCountry) => {
      const data = country.data;
      const matched = mode === 'highlight' ? matchedLanguages(data, selection.languages) : [];
      return (
        <>
          <div className="tip-title">{country.name}</div>
          {data ? (
            <>
              <ul className="tip-languages">
                {data.languages.map((code) => (
                  <li key={code}>
                    {matched.includes(code) && (
                      <span className="line-key" style={{ background: selection.colors[code] }} aria-hidden="true" />
                    )}
                    {languageName(code)}
                  </li>
                ))}
              </ul>
              <div className="tip-meta">{data.primaryFamily} family</div>
            </>
          ) : (
            <div className="tip-meta">No language data</div>
          )}
        </>
      );
    },
    [mode, selection]
  );

  // The country card offers to highlight each language; from the families view that switches views.
  const cardLanguages = mode === 'highlight' ? selection.languages : [];
  const canAddLanguage = mode !== 'highlight' || selection.languages.length < MAX_SELECTED_LANGUAGES;
  const toggleFromCard = mode === 'highlight' ? toggleLanguage : showLanguage;

  const legend = (
    <MapLegend
      mode={mode}
      selectedLanguages={selection.languages}
      languageColors={selection.colors}
      showStripes={stripes.length > 0}
      focusFamily={pinnedFamily}
      onFocusFamily={setPinnedFamily}
      onPreviewFamily={setPreviewFamily}
      onRemoveLanguage={toggleLanguage}
      onClearLanguages={clearLanguages}
      onSelectCountry={focusCountry}
    />
  );

  const picker =
    mode === 'highlight' ? (
      <LanguageSelector
        selectedLanguages={selection.languages}
        languageColors={selection.colors}
        onToggle={toggleLanguage}
      />
    ) : null;

  return (
    <div className="app">
      <Header
        search={
          <SearchBox
            countries={countries}
            compact={isMobile}
            onSelectCountry={focusCountry}
            onSelectLanguage={showLanguage}
          />
        }
        share={<ShareButton />}
      />

      <main className="app-main">
        {!isMobile && (
          <aside className="sidebar" aria-label="Map controls">
            <section className="panel-section" aria-label="Colour countries by">
              <h2 className="section-title">Colour countries by</h2>
              <ModeSelector mode={mode} onChange={changeMode} />
            </section>
            {legend}
            {picker}
            <About />
          </aside>
        )}

        <div ref={mapAreaRef} className="map-area">
          {error ? (
            <div className="map-status map-status-error" role="alert">
              Couldn’t load the map: {error}
            </div>
          ) : loading ? (
            <div className="map-status" role="status">
              Loading map…
            </div>
          ) : null}

          {countries.length > 0 && mapSize.width > 0 && mapSize.height > 0 && (
            <WorldMap
              countries={countries}
              countriesByKey={countriesByKey}
              fills={fills}
              stripes={stripes}
              width={mapSize.width}
              height={mapSize.height}
              insets={isMobile ? SHEET_INSETS : NO_INSETS}
              focusInsetRight={!isMobile && selectedCountry ? CARD_INSET : 0}
              cover={isMobile}
              selectedKey={selectedCountry ? selectedCountry.key : null}
              focusRequest={focusRequest}
              onSelect={handleMapSelect}
              renderTooltip={renderTooltip}
            />
          )}

          {!isMobile && selectedCountry && (
            <div key={selectedCountry.key} className="country-card-float">
              <CountryDetailPanel
                country={selectedCountry}
                selectedLanguages={cardLanguages}
                languageColors={selection.colors}
                canAddLanguage={canAddLanguage}
                onToggleLanguage={toggleFromCard}
                onClose={closeCountry}
              />
            </div>
          )}
        </div>

        {isMobile && (
          <BottomSheet
            label={selectedCountry ? selectedCountry.name : 'Map controls'}
            expanded={sheetExpanded}
            onExpandedChange={setSheetExpanded}
            peek={
              selectedCountry ? (
                <CountryPeek country={selectedCountry} titleId={countryTitleId} onClose={closeCountry} />
              ) : (
                <ControlsPeek
                  mode={mode}
                  onModeChange={changeMode}
                  selectedLanguages={selection.languages}
                  languageColors={selection.colors}
                  onRemoveLanguage={toggleLanguage}
                  focusFamily={pinnedFamily}
                  onFocusFamily={setPinnedFamily}
                  onExpand={() => setSheetExpanded(true)}
                />
              )
            }
          >
            {selectedCountry ? (
              <CountryLanguages
                country={selectedCountry}
                selectedLanguages={cardLanguages}
                languageColors={selection.colors}
                canAddLanguage={canAddLanguage}
                onToggleLanguage={toggleFromCard}
              />
            ) : (
              <>
                {legend}
                {picker}
                <About />
              </>
            )}
          </BottomSheet>
        )}
      </main>
    </div>
  );
}
