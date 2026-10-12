import tubeGlass from '../assets/tube.png';

interface TubeProps {
  colors: string[];
  isSelected: boolean;
  onClick: () => void;
  isComplete: boolean;
  blind?: boolean;
}

export const Tube = ({ colors, isSelected, onClick, isComplete, blind }: TubeProps) => {
  return (
    <div 
      onClick={onClick}
      className={`relative w-16 h-64 mx-1 cursor-pointer transition-all duration-300 ${isSelected ? '-translate-y-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]' : ''}`}
    >
      {isSelected && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce text-yellow-300 text-2xl z-30 drop-shadow-md">▼</div>
      )}

      <img src={tubeGlass} alt="Tubo" className="absolute inset-0 w-full h-full object-fill z-20 pointer-events-none" />

      <div className="absolute bottom-[16px] left-[8px] right-[8px] top-[24px] flex flex-col-reverse z-10 overflow-hidden rounded-b-[22px]">
        {colors.map((color, index) => {
          const isRock = color === 'ROCK';
          const isTopColor = index === colors.length - 1;
          const isHidden = blind && !isTopColor && !isRock;

          if (isRock) {
            return (
              <div key={index} className="w-full h-1/4 bg-slate-700 border-2 border-slate-800 flex items-center justify-center">
                <div className="w-4 h-4 bg-slate-800 rounded-full opacity-50"></div>
              </div>
            );
          }

          if (isHidden) {
            return (
              <div key={index} className="w-full h-1/4 bg-slate-900 border-t border-slate-700 flex items-center justify-center text-slate-500 font-bold text-xs">
                ?
              </div>
            );
          }

          return (
            <div 
              key={index}
              className="w-full h-1/4 transition-all duration-500 ease-in-out"
              style={{ backgroundColor: color, borderTop: '2px solid rgba(255,255,255,0.4)', boxShadow: 'inset 0 -10px 10px -10px rgba(0,0,0,0.3)' }}
            />
          );
        })}
      </div>

      {isComplete && <div className="absolute inset-0 bg-yellow-400/40 blur-md rounded-full z-30 animate-pulse pointer-events-none"></div>}
    </div>
  );
};