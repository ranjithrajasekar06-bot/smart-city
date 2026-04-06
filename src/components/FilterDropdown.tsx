import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Check } from "lucide-react";

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface FilterDropdownProps {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  placeholder?: string;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  value,
  options,
  onChange,
  icon,
  placeholder = "Select..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-6 py-4 bg-slate-50 border-2 transition-all rounded-2xl font-bold text-slate-700 outline-none ${
          isOpen ? "border-blue-500 bg-white shadow-lg shadow-blue-50" : "border-transparent hover:bg-slate-100"
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-3">
          {icon && <div className="text-slate-400">{icon}</div>}
          <span className={!selectedOption ? "text-slate-400" : "text-slate-900"}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute z-50 w-full mt-3 bg-white border border-slate-100 rounded-2xl shadow-2xl shadow-slate-200 overflow-hidden"
          >
            <div className="max-h-64 overflow-y-auto p-2 custom-scrollbar">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    value === option.value
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                  role="option"
                  aria-selected={value === option.value}
                >
                  <div className="flex items-center space-x-3">
                    {option.icon && <div className={value === option.value ? "text-blue-500" : "text-slate-400"}>{option.icon}</div>}
                    <span>{option.label}</span>
                  </div>
                  {value === option.value && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilterDropdown;
