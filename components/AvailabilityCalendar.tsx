'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { id as idLocale, enUS as enLocale } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { toLocalDateStr } from '@/lib/utils/date';



interface AvailabilityCalendarProps {
  bookedDates: string[];
  mode: 'view' | 'select-range' | 'select-dates';
  onSelectRange?: (start: Date, end: Date) => void;
  onSelectDates?: (dates: Date[]) => void;
  selectedDates?: Date[];
  locale?: 'id' | 'en';
}

export function AvailabilityCalendar({
  bookedDates,
  mode,
  onSelectRange,
  onSelectDates,
  selectedDates = [],
  locale = 'id',
}: AvailabilityCalendarProps) {
  const [range, setRange] = useState<DateRange | undefined>(undefined);

  const dateFnsLocale = locale === 'id' ? idLocale : enLocale;

  const bookedSet = new Set(bookedDates);

  const modifiers = {
    booked: (date: Date) => {
      const dateStr = toLocalDateStr(date);
      return bookedSet.has(dateStr);
    },
  };

  const modifiersClassNames = {
    booked: 'bg-rose-100 text-rose-400 hover:bg-rose-100 cursor-not-allowed',
  };

  // Handler untuk mode select-range (react-day-picker v10)
  const handleRangeSelect = (range: DateRange | undefined) => {
    setRange(range);
    if (range?.from && range?.to && onSelectRange) {
      onSelectRange(range.from, range.to);
    }
  };

  // Handler untuk mode select-dates (toggle)
  const handleDateSelect = (date: Date | undefined) => {
    if (!date || mode !== 'select-dates') return;

    const dateStr = toLocalDateStr(date);
    if (bookedSet.has(dateStr)) return;

    if (onSelectDates) {
      const isSelected = selectedDates.some(
        (d) => toLocalDateStr(d) === dateStr
      );
      if (isSelected) {
        onSelectDates(
          selectedDates.filter(
            (d) => toLocalDateStr(d) !== dateStr
          )
        );
      } else {
        onSelectDates([...selectedDates, date]);
      }
    }
  };

  const isDateSelected = (date: Date) => {
    return selectedDates.some(
      (d) => toLocalDateStr(d) === toLocalDateStr(date)
    );
  };

  // Mode read-only (view) — pakai mode="single" dan disable interaction
  if (mode === 'view') {
    return (
      <Calendar
        mode="single"
        selected={undefined}
        onSelect={() => {}}
        locale={dateFnsLocale}
        modifiers={modifiers}
        modifiersClassNames={modifiersClassNames}
        className="rounded-2xl border border-gray-200 shadow-md bg-white p-4"
        disabled={{ before: new Date() }}
      />
    );
  }

  // Mode select-range — pakai mode="range"
  if (mode === 'select-range') {
    return (
      <div>
        <Calendar
          mode="range"
          selected={range}
          onSelect={handleRangeSelect}
          locale={dateFnsLocale}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          className="rounded-md border"
          disabled={{ before: new Date() }}
        />
        {range?.from && range?.to && (
          <div className="mt-2 text-sm text-gray-600">
            Dipilih: {range.from.toLocaleDateString('id-ID')} -{' '}
            {range.to.toLocaleDateString('id-ID')}
          </div>
        )}
        {range?.from && !range?.to && (
          <div className="mt-2 text-sm text-gray-600">
            Klik tanggal akhir untuk menyelesaikan range.
          </div>
        )}
      </div>
    );
  }

  // Mode select-dates (manual toggle) — pakai mode="single" tapi kita handle sendiri selection-nya
  return (
    <div>
      <Calendar
        mode="single"
        selected={undefined}
        onSelect={handleDateSelect}
        locale={dateFnsLocale}
        modifiers={{
          ...modifiers,
          selected: (date: Date) => isDateSelected(date),
        }}
        modifiersClassNames={{
          ...modifiersClassNames,
          selected: 'bg-brand-green text-white hover:bg-green-hover',
        }}
        className="rounded-md border"
        disabled={{ before: new Date() }}
      />
      {selectedDates.length > 0 && (
        <div className="mt-2 text-sm text-gray-600">
          {selectedDates.length} tanggal dipilih.
        </div>
      )}
    </div>
  );
}