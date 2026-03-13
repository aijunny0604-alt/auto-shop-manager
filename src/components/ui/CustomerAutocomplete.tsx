"use client";

import { useEffect, useRef, useState } from "react";
import { fetchCustomers } from "@/features/customers/api";
import type { Customer } from "@/types/customer";

interface CustomerAutocompleteProps {
  onSelect: (customer: Customer) => void;
  onNewCustomer: (name: string) => void;
  onQueryChange?: (query: string) => void;
  selectedCustomer: Customer | null;
  onClear: () => void;
}

export default function CustomerAutocomplete({
  onSelect,
  onNewCustomer,
  onQueryChange,
  selectedCustomer,
  onClear,
}: CustomerAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const listboxId = "customer-listbox";

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // 검색 디바운스
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const customers = await fetchCustomers(query.trim());
        setResults(customers);
        setIsOpen(true);
      } catch {
        setResults([]);
        setIsOpen(true);
      } finally {
        setIsLoading(false);
        setHighlightIdx(-1);
      }
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const showNewOption = query.trim() && !results.some(
    (c) => c.name.toLowerCase() === query.trim().toLowerCase()
  );
  const totalItems = results.length + (showNewOption ? 1 : 0);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || totalItems === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIdx >= 0 && highlightIdx < results.length) {
        selectCustomer(results[highlightIdx]);
      } else if (highlightIdx >= results.length && query.trim()) {
        onNewCustomer(query.trim());
        setQuery("");
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  function selectCustomer(customer: Customer) {
    onSelect(customer);
    setQuery("");
    setIsOpen(false);
  }

  const inputClass =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm";

  // 선택된 고객이 있으면 표시
  if (selectedCustomer) {
    return (
      <div className={`${inputClass} flex items-center justify-between`}>
        <span>
          <span className="font-medium">{selectedCustomer.name}</span>
          {selectedCustomer.phone && (
            <span className="text-[var(--muted-foreground)] ml-2">
              {selectedCustomer.phone}
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={onClear}
          aria-label="고객 선택 해제"
          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-sm px-1"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onQueryChange?.(e.target.value);
        }}
        onFocus={() => query.trim() && results.length > 0 && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="고객 이름 입력 (자동 검색)"
        className={inputClass}
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-activedescendant={
          highlightIdx >= 0 ? `customer-option-${highlightIdx}` : undefined
        }
      />

      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--background)] shadow-lg"
        >
          {isLoading && (
            <li className="px-3 py-3 text-sm text-[var(--muted-foreground)] text-center">
              검색 중...
            </li>
          )}

          {!isLoading && results.map((customer, idx) => (
            <li
              id={`customer-option-${idx}`}
              key={customer.id}
              role="option"
              aria-selected={highlightIdx === idx}
              onClick={() => selectCustomer(customer)}
              className={`px-3 py-3 text-sm cursor-pointer ${
                highlightIdx === idx
                  ? "bg-[var(--accent)]"
                  : "hover:bg-[var(--accent)]"
              }`}
            >
              <span className="font-medium">{customer.name}</span>
              {customer.phone && (
                <span className="text-[var(--muted-foreground)] ml-2">
                  {customer.phone}
                </span>
              )}
              {customer._count && (
                <span className="text-[var(--muted-foreground)] text-xs ml-2">
                  (예약 {customer._count.reservations}건)
                </span>
              )}
            </li>
          ))}

          {/* 신규 고객 등록 옵션 */}
          {!isLoading && showNewOption && (
            <li
              id={`customer-option-${results.length}`}
              role="option"
              aria-selected={highlightIdx === results.length}
              onClick={() => {
                onNewCustomer(query.trim());
                setQuery("");
                setIsOpen(false);
              }}
              className={`px-3 py-3 text-sm cursor-pointer ${
                results.length > 0 ? "border-t border-[var(--border)]" : ""
              } ${
                highlightIdx === results.length
                  ? "bg-[var(--accent)]"
                  : "hover:bg-[var(--accent)]"
              }`}
            >
              {results.length === 0 && (
                <span className="text-[var(--muted-foreground)]">
                  검색 결과 없음 —{" "}
                </span>
              )}
              <span className="text-[var(--primary)] font-medium">
                + &quot;{query.trim()}&quot; 신규 고객 등록
              </span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
