import { useMemo, useState } from "react";
import type { RTokenMarket } from "../features/rtoken-markets";
import { searchRTokenMarkets } from "../features/rtoken-markets";
import { ChevronDownIcon } from "./Icons";

interface HeaderProps {
  dataStatus: "loading" | "live" | "unavailable";
  selectedMarket: RTokenMarket;
  markets: RTokenMarket[];
  marketsStatus: "loading" | "ready" | "unavailable";
  onMarketChange: (market: RTokenMarket) => void;
}

export function Header({ dataStatus, selectedMarket, markets, marketsStatus, onMarketChange }: HeaderProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const filteredMarkets = useMemo(() => {
    return searchRTokenMarkets(markets, query);
  }, [markets, query]);
  const options = marketsStatus === "unavailable"
    ? [{ symbol: "RAAPLUSDT", baseCoin: "rAAPL" }]
    : filteredMarkets;

  const selectMarket = (market: RTokenMarket) => {
    onMarketChange(market);
    setQuery("");
    setIsOpen(false);
    setActiveIndex(-1);
  };

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <div className="app-header__identity">
          <div className="brand-wordmark" aria-label="rToken Lab">
            <img className="brand-mark" src="/favicon.svg" alt="" aria-hidden="true" />
            <span><span className="brand-wordmark__r">r</span><span>Token</span></span>
            <span className="brand-wordmark__lab">Lab</span>
          </div>
          <span className="brand-descriptor">MARKET STRUCTURE / RESEARCH DESK</span>
        </div>
      </div>

      <div className="header-market-label">
        <span>BITGET SPOT</span>
        <div className="market-picker">
          <span className="visually-hidden">Search Bitget Reality spot markets</span>
          <input
            type="search"
            onClick={() => {
              if (!isOpen) {
                setQuery("");
                setIsOpen(true);
              }
            }}
            value={isOpen ? query : `${selectedMarket.baseCoin} / USDT`}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(-1);
              setIsOpen(true);
            }}
            onFocus={() => {
              setQuery("");
              setActiveIndex(-1);
              setIsOpen(true);
            }}
            onBlur={() => window.setTimeout(() => {
              if (document.activeElement?.closest(".market-picker")) return;
              setIsOpen(false);
              setQuery("");
            }, 0)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                if (!isOpen) setIsOpen(true);
                if (options.length > 0) {
                  setActiveIndex((current) => event.key === "ArrowDown"
                    ? (current + 1 + options.length) % options.length
                    : (current < 0 ? options.length - 1 : (current - 1 + options.length) % options.length));
                }
              }
              if (event.key === "Home" && isOpen && options.length > 0) {
                event.preventDefault();
                setActiveIndex(0);
              }
              if (event.key === "End" && isOpen && options.length > 0) {
                event.preventDefault();
                setActiveIndex(options.length - 1);
              }
              if (event.key === "Escape") {
                setIsOpen(false);
                setQuery("");
                setActiveIndex(0);
              }
              if (event.key === "Enter" && isOpen && options[activeIndex < 0 ? 0 : activeIndex]) {
                event.preventDefault();
                selectMarket(options[activeIndex < 0 ? 0 : activeIndex]!);
              }
            }}
            aria-label="Search verified Bitget Reality spot markets"
            role="combobox"
            aria-haspopup="listbox"
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls={isOpen ? "rtoken-market-options" : undefined}
            aria-activedescendant={isOpen && activeIndex >= 0 && options.length > activeIndex ? `rtoken-market-option-${activeIndex}` : undefined}
            placeholder="Search symbol…"
            autoComplete="off"
          />
          <ChevronDownIcon className="market-picker__chevron" />
          {isOpen && (
            <div className="market-picker__menu" aria-busy={marketsStatus === "loading"}>
              {marketsStatus === "loading" && <span className="market-picker__message" role="status">Loading Bitget markets…</span>}
              {marketsStatus === "unavailable" && <span className="market-picker__message" role="status">Market list unavailable. Only the default market can be selected.</span>}
              {marketsStatus === "ready" && filteredMarkets.length === 0 && <span className="market-picker__message" role="status">No verified market matches.</span>}
              <div id="rtoken-market-options" role="listbox" aria-label="Verified Bitget Reality spot markets">
                {options.map((market, index) => (
                  <div
                    key={market.symbol}
                    id={`rtoken-market-option-${index}`}
                    role="option"
                    aria-selected={market.symbol === selectedMarket.symbol}
                    className={index === activeIndex ? "is-active" : undefined}
                    onMouseMove={() => setActiveIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectMarket(market)}
                  >
                    <strong>{market.baseCoin} / USDT</strong>
                    <span>{market.symbol}</span>
                  </div>
                ))}
              </div>
              {marketsStatus === "ready" && filteredMarkets.length > 0 && (
                <span className="market-picker__footnote">Showing up to 12 · online Bitget Reality spot instruments</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="app-header__status">
        <span className={`data-state data-state--${dataStatus}`} role="status">
          <span className="data-state__mark" aria-hidden="true" />
          {dataStatus === "live" ? `BITGET ${selectedMarket.baseCoin.toUpperCase()} SNAPSHOT` : dataStatus === "loading" ? "CHECKING BITGET SPOT" : `${selectedMarket.baseCoin.toUpperCase()} SNAPSHOT UNAVAILABLE`}
        </span>
      </div>
    </header>
  );
}
