import React from 'react';
import { Sword, Trophy, Coins, Wheat, Crown, ScrollText, History, Users, ArrowRightCircle, Target } from 'lucide-react';
import { DAIMYO_INFO } from '../data/daimyos';
import { getFormattedDate } from '../utils/helpers';

export const StartScreen = ({ onSelectDaimyo }) => (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-8 text-white">
      <h1 className="text-5xl font-bold mb-8 text-yellow-500 flex items-center gap-4">
        <Sword size={48} /> 戦国国盗り絵巻 <Trophy size={48} />
      </h1>
      <p className="mb-6 text-stone-400">大名家を選択して天下統一を目指せ</p>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 overflow-y-auto max-h-[60vh] w-full px-4">
        {Object.keys(DAIMYO_INFO).filter(id => id !== 'Minor').map(id => (
          <button key={id} onClick={() => onSelectDaimyo(id)} className={`p-4 rounded border-2 border-stone-700 hover:border-yellow-500 hover:bg-stone-800 transition-all flex flex-col items-center gap-2 ${DAIMYO_INFO[id].color}`}>
            <span className="font-bold text-lg">{DAIMYO_INFO[id].name}</span>
            <span className="text-xs bg-black/50 px-2 py-1 rounded">難易度: {DAIMYO_INFO[id].difficulty || '普通'}</span>
          </button>
        ))}
      </div>
    </div>
);

export const ResourceBar = ({ stats, turn, isPlayerTurn, shogunId, playerId, coalition }) => (
    <>
        <div className="absolute top-4 left-4 z-10 flex gap-4 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-md p-2 rounded-lg border border-stone-600 shadow-lg flex items-center gap-4 text-white">
                <div className="flex flex-col"><span className="text-xs text-stone-400">資金</span><div className="flex items-center gap-1 text-yellow-400 font-bold font-mono text-xl"><Coins size={18}/> {stats?.gold || 0}</div></div>
                <div className="w-px h-8 bg-stone-600"></div>
                <div className="flex flex-col"><span className="text-xs text-stone-400">兵糧</span><div className="flex items-center gap-1 text-green-400 font-bold font-mono text-xl"><Wheat size={18}/> {stats?.rice || 0}</div></div>
                <div className="w-px h-8 bg-stone-600"></div>
                <div className="flex flex-col"><span className="text-xs text-stone-400">名声</span><div className="flex items-center gap-1 text-purple-400 font-bold font-mono text-xl"><Crown size={18}/> {stats?.fame || 0}</div></div>
                {shogunId === playerId && <div className="ml-2 bg-yellow-600 px-2 py-1 rounded text-xs font-bold text-black border border-yellow-400 animate-pulse">将軍</div>}
            </div>
        </div>
        <div className="absolute top-4 right-4 z-10 flex gap-2 pointer-events-auto">
             <div className="bg-black/60 backdrop-blur-md p-2 rounded-lg border border-stone-600 shadow-lg text-right pointer-events-none text-white">
                <div className="text-xs text-stone-400">{getFormattedDate(turn)}</div>
                <div className={`text-lg font-bold ${isPlayerTurn ? 'text-red-500 animate-pulse' : 'text-stone-300'}`}>{isPlayerTurn ? "【あなたの手番】" : `他国 行動中...`}</div>
            </div>
        </div>
        {coalition && (
            <div className="absolute top-20 left-4 z-10 pointer-events-none animate-fade-in">
                <div className="bg-red-900/80 backdrop-blur-md p-2 rounded-lg border border-red-500 shadow-lg flex items-center gap-2">
                    <Target className="text-red-300" size={20} />
                    <div><div className="text-xs text-red-200 font-bold">対{DAIMYO_INFO[coalition.target]?.name}包囲網</div><div className="text-[10px] text-stone-300">残: {coalition.duration}季</div></div>
                </div>
            </div>
        )}
    </>
);

export const ControlPanel = ({ lastLog, onHistoryClick, onEndTurn, onCancelSelection, isPlayerTurn, hasSelection, onViewBack, viewingRelationId, onDaimyoList }) => (
    <>
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 w-3/4 max-w-2xl pointer-events-auto flex items-center gap-2">
            <div className="flex-1 bg-black/70 text-white px-4 py-2 rounded-full text-center border border-stone-500 shadow-lg text-sm flex items-center justify-center">
                <ScrollText className="inline mr-2 w-4 h-4 text-yellow-400"/> <span className="truncate">{lastLog}</span>
            </div>
            <button onClick={onHistoryClick} className="bg-stone-700 hover:bg-stone-600 text-white p-2 rounded-full border border-stone-500"><History size={20}/></button>
        </div>
        
        <div className="absolute top-4 right-44 z-10">
             <button onClick={onDaimyoList} className="bg-black/60 backdrop-blur-md p-2 rounded-lg border border-stone-600 hover:bg-stone-700 text-stone-300"><Users size={20}/></button>
        </div>

        {viewingRelationId && (
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 pointer-events-auto">
                <button onClick={onViewBack} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold shadow-xl border-2 border-indigo-300 flex items-center gap-2 animate-bounce">自軍視点に戻る</button>
            </div>
        )}

        {isPlayerTurn && !viewingRelationId && <button onClick={onEndTurn} className="absolute bottom-8 right-8 z-20 bg-red-700 hover:bg-red-600 text-white px-6 py-4 rounded-full font-bold shadow-xl border-4 border-stone-800 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95">行動終了 <ArrowRightCircle size={24}/></button>}
        {hasSelection && <button onClick={onCancelSelection} className="absolute bottom-8 left-8 z-20 bg-stone-700 hover:bg-stone-600 text-white px-6 py-4 rounded-full font-bold shadow-xl border-4 border-stone-800 transition-transform hover:scale-105">選択キャンセル</button>}
    </>
);
