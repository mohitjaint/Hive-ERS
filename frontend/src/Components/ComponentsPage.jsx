import { useState } from 'react';
import { Search } from 'lucide-react';

const componentsData = [
  {
    id: 1,
    name: "Soldering Iron Kit",
    description: "Temperature controlled soldering station with accessories",
    image: null,
    available: 8,
    status: "AVAILABLE",
  },
  {
    id: 2,
    name: "Digital Multimeter",
    description: "Auto-ranging multimeter for voltage, current, resistance measurement",
    image: null,
    available: 15,
    status: "AVAILABLE",
  },
  {
    id: 3,
    name: "Oscilloscope",
    description: "Digital storage oscilloscope, 100MHz bandwidth",
    image: null,
    available: 4,
    status: "LIMITED",
  },
  {
    id: 4,
    name: "3D Printer",
    description: "FDM 3D printer with 220x220x250mm build volume",
    image: null,
    available: 3,
    status: "LIMITED",
  },
  {
    id: 5,
    name: "Wire Stripper",
    description: "Automatic wire stripping tool for various gauges",
    image: null,
    available: 12,
    status: "AVAILABLE",
  },
  {
    id: 6,
    name: "Power Supply",
    description: "Adjustable DC bench power supply, 0-30V, 0-10A",
    image: null,
    available: 10,
    status: "AVAILABLE",
  },
  {
    id: 7,
    name: "esp32",
    description: "Low-cost, low-power system-on-chip (SoC) with integrated Wi-Fi and Bluetooth",
    image: null,
    available: 15,
    status: "AVAILABLE",
  },
  {
    id: 8,
    name: "L298N motor driver",
    description: "Dual H-Bridge motor driver for controlling DC motors and stepper motors",
    image: null,
    available: 8,
    status: "AVAILABLE",
  },
];

function StatusBadge({ status }) {
  const isAvailable = status === "AVAILABLE";
  return (
    <span className={`rounded px-2 py-1 text-[10px] font-bold tracking-wider font-mono ${
      isAvailable
        ? "bg-[#064E3B] text-[#34D399]"
        : "bg-[#78350F] text-[#F59E0B]"
    }`}>
      {status}
    </span>
  );
}

function ComponentCard({ component }) {
  return (
    <div className='flex flex-col rounded-xl border border-gold/30 bg-surface p-4 transition-colors hover:border-gold/70'>
      <img src={component.image || "https://via.placeholder.com/150"} alt={component.name} className='h-44 w-full rounded-lg object-cover' />

      <h3 className='mt-4 text-lg font-semibold text-[#f9fafb]'>{component.name}</h3>

      <p className='mt-1 text-sm leading-relaxed text-[#9ca3af]'>{component.description}</p>

      <div className='font-mono flex items-center justify-between mt-3'>
        <span className='text-[#9ca3af] text-xs'>
          Available: {component.available}
        </span>
        <StatusBadge status={component.status} />
      </div>

      <button className='mt-4 w-full rounded-lg bg-gold py-2.5 text-sm font-semibold text-[#0A0E17] transition-opacity hover:opacity-90'>Borrow</button>
    </div>
  );
}

function ComponentPage() {
  const [query, setQuery] = useState("");

  const filteredComponents = componentsData.filter((comp) =>
    comp.name.toLowerCase().includes(query.toLowerCase()) ||
    comp.description.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <main className="flex-1 overflow-y-auto bg-bg px-4 py-6 md:px-8">
      <h1 className="text-2xl font-bold text-white">Components</h1>
      <p className="mt-1 text-sm text-[#9CA3AF]">
        Browse available Components
      </p>

      {/* Local Component Filter */}
      <div className="mt-5 flex max-w-md items-center rounded-md border border-[#5c462b] bg-[#16120e] px-3 py-2">
        <Search size={16} className="mr-2.5 shrink-0 text-[#a69580]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter components..."
          className="w-full border-none bg-transparent text-sm text-white outline-none placeholder:text-[#a69580]/80"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredComponents.map((component) => (
          <ComponentCard key={component.id} component={component} />
        ))}
      </div>

      {filteredComponents.length === 0 && (
        <p className="mt-10 text-center text-sm text-[#9CA3AF]">
          No Components found matching your search.
        </p>
      )}
    </main>
  );
}

export default ComponentPage;