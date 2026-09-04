"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export interface FormSelectOption {
  value: string;
  label: string;
  subLabel?: string;
}

export interface FormSelectProps {
  label?: string;
  required?: boolean;
  clearable?: boolean;
  error?: string | boolean;
  helperText?: string;
  options: (FormSelectOption | string | number)[];
  value: string | number;
  onChange: (value: string) => void;
  onSearchChange?: (query: string) => void;
  allowCustom?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  searchNumericOnly?: boolean;
  searchMaxLength?: number;
  className?: string;
  containerClassName?: string;
  id?: string;
}

/**
 * Finds and focuses the next/previous focusable element in the DOM
 */
function focusNextElement(currentElement: HTMLElement, reverse: boolean = false) {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(", ");

  const allFocusable = Array.from(
    document.querySelectorAll<HTMLElement>(focusableSelectors)
  ).filter((el) => {
    return (
      el.offsetParent !== null &&
      !el.closest(".form-select-dropdown") &&
      getComputedStyle(el).visibility !== "hidden" &&
      getComputedStyle(el).display !== "none"
    );
  });

  const currentIndex = allFocusable.indexOf(currentElement);
  if (currentIndex !== -1) {
    const nextIndex = reverse ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex >= 0 && nextIndex < allFocusable.length) {
      allFocusable[nextIndex]?.focus();
    }
  }
}

export function FormSelect({
  label,
  required = false,
  clearable = false,
  error,
  helperText,
  options,
  value,
  onChange,
  onSearchChange,
  allowCustom = false,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  disabled = false,
  searchable = false,
  searchNumericOnly = false,
  searchMaxLength,
  className,
  containerClassName,
  id,
}: FormSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
    openUpwards: boolean;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionsListRef = useRef<HTMLDivElement>(null);
  const isClickingRef = useRef(false);

  const hasError = Boolean(error);
  const errorMessage = typeof error === "string" ? error : undefined;
  const inputId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

  // Normalize options
  const normalizedOptions: FormSelectOption[] = options.map((opt) => {
    if (typeof opt === "object" && opt !== null && "value" in opt) {
      return opt as FormSelectOption;
    }
    return {
      value: String(opt),
      label: String(opt),
    };
  });

  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));

  // Filter options based on search query
  const filteredOptions = normalizedOptions.filter((opt) => {
    if (!searchable || !searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      opt.label.toLowerCase().includes(q) ||
      (opt.subLabel && opt.subLabel.toLowerCase().includes(q))
    );
  });

  // Calculate dropdown viewport position (Portal fixed positioning)
  const updatePosition = useCallback(() => {
    if (!triggerButtonRef.current) return;
    const rect = triggerButtonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const estimatedHeight = 220;

    const openUpwards = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;
    const maxHeight = openUpwards
      ? Math.min(spaceAbove - 16, 240)
      : Math.min(spaceBelow - 16, 240);

    setDropdownPos({
      top: openUpwards ? rect.top - 4 : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      maxHeight: Math.max(maxHeight, 120),
      openUpwards,
    });
  }, []);

  // Update position on open, window resize, and scroll (including inside modals)
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
    }
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, updatePosition, filteredOptions.length]);

  // Highlight currently selected item when dropdown opens or when search query changes
  useEffect(() => {
    if (isOpen) {
      if (!searchQuery.trim()) {
        const selectedIdx = filteredOptions.findIndex(
          (opt) => String(opt.value) === String(value)
        );
        setHighlightedIndex(selectedIdx >= 0 ? selectedIdx : 0);
      } else {
        setHighlightedIndex(0);
      }
    }
  }, [isOpen, searchQuery, value]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && optionsListRef.current) {
      const optionElements = optionsListRef.current.querySelectorAll<HTMLElement>("[data-option-item]");
      const targetEl = optionElements[highlightedIndex];
      if (targetEl && typeof targetEl.scrollIntoView === "function") {
        targetEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchable) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen, searchable]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    // Return focus to trigger button so subsequent Tab moves to next form field
    setTimeout(() => {
      triggerButtonRef.current?.focus();
    }, 10);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div ref={containerRef} className={cn("space-y-1 relative", containerClassName)}>
      {label && (
        <Label
          htmlFor={inputId}
          className="text-[11px] font-bold text-black flex items-center gap-0.5 leading-none"
        >
          {label}
          {required && <span className="text-red-500 font-bold">*</span>}
        </Label>
      )}

      {/* Trigger button */}
      <button
        ref={triggerButtonRef}
        id={inputId}
        type="button"
        disabled={disabled}
        onMouseDown={() => {
          isClickingRef.current = true;
        }}
        onFocus={() => {
          if (!disabled && !isClickingRef.current) {
            setIsOpen(true);
          }
        }}
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev);
            isClickingRef.current = false;
          }
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            if (!isOpen) {
              setIsOpen(true);
            } else if (filteredOptions.length > 0) {
              if (e.key === "ArrowDown") {
                setHighlightedIndex((prev) => (prev + 1) % filteredOptions.length);
              } else {
                setHighlightedIndex((prev) => (prev <= 0 ? filteredOptions.length - 1 : prev - 1));
              }
            }
          } else if (e.key === "Enter" || (e.key === " " && !isOpen)) {
            e.preventDefault();
            e.stopPropagation();
            if (!isOpen) {
              setIsOpen(true);
            } else if (filteredOptions.length > 0) {
              const targetOpt =
                highlightedIndex >= 0 && highlightedIndex < filteredOptions.length
                  ? filteredOptions[highlightedIndex]
                  : filteredOptions[0];
              handleSelect(targetOpt.value);
            }
          } else if (e.key === "Tab") {
            if (isOpen) {
              setIsOpen(false);
            }
          } else if (e.key === "Escape") {
            if (isOpen) {
              e.preventDefault();
              setIsOpen(false);
            }
          }
        }}
        className={cn(
          "w-full h-8 px-2.5 flex items-center justify-between rounded border border-black bg-white text-xs text-left transition-colors outline-none",
          hasError
            ? "border-red-500 focus:ring-2 focus:ring-red-400/20"
            : "hover:border-black focus:border-black focus:ring-2 focus:ring-black/20",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:border-slate-300 disabled:text-slate-700 disabled:opacity-100",
          disabled && "pointer-events-none cursor-not-allowed bg-slate-100 border-slate-300 text-slate-700 opacity-100",
          isOpen && "border-black ring-2 ring-black/20",
          className
        )}
      >
        <span className={cn("truncate", selectedOption ? (disabled ? "text-slate-700 font-medium" : "text-black font-medium") : "text-slate-400")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <div className="flex items-center gap-1 text-slate-400 flex-shrink-0 ml-1">
          {clearable && value && !disabled && (
            <span
              onClick={handleClear}
              className="p-0.5 hover:text-slate-700 rounded transition-colors cursor-pointer"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronsUpDown className="w-3.5 h-3.5 opacity-60" />
        </div>
      </button>

      {/* Floating Dropdown Portal (Floats freely without causing modal/form layout shifts or getting clipped) */}
      {isOpen && dropdownPos && typeof document !== "undefined" && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            top: dropdownPos.openUpwards ? "auto" : `${dropdownPos.top}px`,
            bottom: dropdownPos.openUpwards ? `${window.innerHeight - dropdownPos.top}px` : "auto",
            left: `${dropdownPos.left}px`,
            width: `${dropdownPos.width}px`,
            maxHeight: `${dropdownPos.maxHeight}px`,
            zIndex: 999999,
          }}
          className="form-select-dropdown rounded border border-black bg-white shadow-2xl text-xs overflow-hidden flex flex-col animate-in fade-in-0 zoom-in-95 duration-100"
        >
          {/* Optional search bar when searchable=true */}
          {searchable && (
            <div className="p-2 border-b border-slate-200 bg-slate-50/70 shrink-0">
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  maxLength={searchMaxLength}
                  inputMode={searchNumericOnly ? "numeric" : undefined}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (searchNumericOnly) {
                      val = val.replace(/\D/g, "");
                    }
                    if (searchMaxLength && searchMaxLength > 0) {
                      val = val.slice(0, searchMaxLength);
                    }
                    setSearchQuery(val);
                    onSearchChange?.(val);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      if (filteredOptions.length > 0) {
                        setHighlightedIndex((prev) => (prev + 1) % filteredOptions.length);
                      }
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      if (filteredOptions.length > 0) {
                        setHighlightedIndex((prev) =>
                          prev <= 0 ? filteredOptions.length - 1 : prev - 1
                        );
                      }
                    } else if (e.key === "Enter") {
                      e.preventDefault();
                      e.stopPropagation();
                      if (filteredOptions.length > 0) {
                        const targetOpt =
                          highlightedIndex >= 0 && highlightedIndex < filteredOptions.length
                            ? filteredOptions[highlightedIndex]
                            : filteredOptions[0];
                        handleSelect(targetOpt.value);
                      } else if (allowCustom && searchQuery.trim()) {
                        handleSelect(searchQuery.trim());
                      }
                    } else if (e.key === "Tab") {
                      e.preventDefault();
                      setIsOpen(false);
                      if (triggerButtonRef.current) {
                        focusNextElement(triggerButtonRef.current, e.shiftKey);
                      }
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      setIsOpen(false);
                      triggerButtonRef.current?.focus();
                    }
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full h-7 pl-8 pr-2.5 bg-white border border-black rounded text-xs text-black outline-none focus:border-black transition-colors"
                />
              </div>
            </div>
          )}

          {/* Options list */}
          <div ref={optionsListRef} className="overflow-y-auto py-1 flex-1">
            {allowCustom && searchQuery.trim() && !normalizedOptions.some((o) => o.value.toLowerCase() === searchQuery.trim().toLowerCase()) && (
              <button
                type="button"
                tabIndex={-1}
                onClick={() => handleSelect(searchQuery.trim())}
                className="w-full px-3 py-1.5 flex items-center justify-between text-left hover:bg-blue-50 text-[#2980b9] font-semibold text-xs border-b border-slate-100 cursor-pointer"
              >
                <span>Use: &quot;{searchQuery.trim()}&quot;</span>
                <span className="text-[10px] bg-blue-100 text-[#2980b9] px-1.5 py-0.5 rounded">Custom</span>
              </button>
            )}

            {filteredOptions.length === 0 && (!allowCustom || !searchQuery.trim()) ? (
              <div className="py-3 text-center text-slate-400 text-xs">
                No options found
              </div>
            ) : (
              filteredOptions.map((opt, optIdx) => {
                const isSelected = String(opt.value) === String(value);
                const isHighlighted = optIdx === highlightedIndex;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    tabIndex={-1}
                    data-option-item
                    onMouseEnter={() => setHighlightedIndex(optIdx)}
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "w-full px-3 py-2 flex items-center justify-between text-left transition-colors cursor-pointer",
                      (isSelected || isHighlighted)
                        ? "bg-slate-100 font-semibold"
                        : "hover:bg-slate-50"
                    )}
                  >
                    <div>
                      <div className="text-black font-medium">{opt.label}</div>
                      {opt.subLabel && (
                        <div className="text-[10px] text-slate-500">{opt.subLabel}</div>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-black flex-shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}

      {hasError && errorMessage && (
        <p className="text-[10px] text-red-500 font-medium leading-tight">
          {errorMessage}
        </p>
      )}

      {!hasError && helperText && (
        <p className="text-[10px] text-slate-400 leading-tight">
          {helperText}
        </p>
      )}
    </div>
  );
}

export default FormSelect;
