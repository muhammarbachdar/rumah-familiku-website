// components/property-detail/PropertyTabs.tsx
'use client';

interface PropertyTabsProps {
  tabs: readonly string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabLabels: Record<string, string>;
}

export function PropertyTabs({ tabs, activeTab, setActiveTab, tabLabels }: PropertyTabsProps) {
  return (
    <div className="flex gap-6 border-b border-gray-200 mb-6 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`pb-3 text-sm font-medium whitespace-nowrap transition ${
            activeTab === tab
              ? 'text-brand-green border-b-2 border-brand-green'
              : 'text-gray-500 hover:text-charcoal'
          }`}
        >
          {tabLabels[tab]}
        </button>
      ))}
    </div>
  );
}