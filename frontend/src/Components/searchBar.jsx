import { Search, Bell } from 'lucide-react';

function SearchBar() {
  return (
    <div className="w-full flex items-center justify-between gap-4  sticky top-0 ">
      
      <div className="w-full max-w-112.5 relative group">
        <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-[#facc15] transition-colors">
          <Search size={16} />
        </span>
        <input 
          type="text" 
          placeholder="Search items, tools, components..." 
          className="w-full bg-[#121115] border border-zinc-800/80 focus:border-[#facc15] text-white text-xs pl-10 pr-4 py-2 rounded-lg outline-none transition-all placeholder-zinc-600"
        />
      </div>
      <div className="relative p-2 rounded-lg cursor-pointer hover:bg-zinc-900 transition-colors shrink-0">
        <Bell size={18} className="text-[#facc15]" />
        
        <span className="absolute top-1 right-1.5 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center scale-90 border border-[#0a0a0a]">
          2
        </span>
      </div>
    </div>
  );
}
export default SearchBar;