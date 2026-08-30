export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 shadow-sm">
      <div className="flex items-center gap-2">
        {/* OpenNLP brand colour strip */}
        <div className="flex gap-0.5 rounded overflow-hidden">
          {['#832778','#BE2043','#E56b28','#F59523'].map(c => (
            <div key={c} style={{ background: c }} className="w-2 h-7" />
          ))}
        </div>
        <span className="text-lg font-bold text-gray-800">OpenNLP</span>
        <span className="text-lg font-light text-gray-500">UI</span>
      </div>
    </header>
  )
}
