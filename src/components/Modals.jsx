import React, { useState, useEffect } from 'react';
import { MessageCircle, History, XCircle, Scale, Crown, Zap, Landmark, Ship, Star, Handshake, Users, Sword, Shield, RefreshCw, Trophy, Skull } from 'lucide-react';
import { DAIMYO_INFO, TITLES, COURT_RANKS } from '../data/daimyos';
import { COSTS } from '../data/constants';

export const IncomingRequestModal = ({ request, onAccept, onReject }) => {
  if (!request || !request.sourceId) return null; 
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-stone-800 text-white p-6 rounded-xl border border-stone-500 shadow-2xl w-full max-w-md animate-bounce-in">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-yellow-400"><MessageCircle size={24} /> {DAIMYO_INFO[request.sourceId].name}家からの使者</h3>
        <p className="mb-6 text-lg">
          {request.type === 'alliance' && "同盟を求めています。受諾しますか？"}
          {request.type === 'ceasefire' && "停戦(5期間)を求めています。金300を持参しました。"}
          {request.type === 'threaten' && "資金の提供を要求しています。「断れば攻め込む」とのことです..."}
        </p>
        <div className="flex gap-4">
          <button onClick={onReject} className="flex-1 py-3 rounded bg-red-800 hover:bg-red-700 font-bold">拒否</button>
          <button onClick={onAccept} className="flex-1 py-3 rounded bg-blue-800 hover:bg-blue-700 font-bold">受諾</button>
        </div>
      </div>
    </div>
  );
};

export const LogHistoryModal = ({ logs, onClose }) => (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-stone-800 w-full max-w-2xl max-h-[80vh] flex flex-col rounded-xl border border-stone-500 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-stone-600 flex justify-between items-center bg-stone-900">
                <h3 className="text-lg font-bold flex items-center gap-2"><History size={20}/> 履歴</h3>
                <button onClick={onClose} className="p-1 hover:bg-stone-700 rounded"><XCircle size={20}/></button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2 flex-1 font-mono text-sm bg-stone-900/50">
                {logs.length === 0 && <div className="text-stone-500 text-center">履歴はありません</div>}
                {[...logs].reverse().map((log, i) => <div key={i} className="border-b border-stone-700/50 pb-1 text-stone-300"><span className="text-stone-500 mr-2">[{logs.length - i}]</span> {log}</div>)}
            </div>
        </div>
    </div>
);

export const MarketModal = ({ currentGold, currentRice, price, onTrade, onClose }) => {
  const buyPrice = Math.floor(price * 1.2 * 10) / 10;
  const sellPrice = Math.floor(price * 0.8 * 10) / 10;
  const [mode, setMode] = useState('buy'); 
  const [amount, setAmount] = useState(100);
  const maxBuy = Math.floor(currentGold / buyPrice);
  const maxSell = currentRice;
  const maxVal = mode === 'buy' ? Math.max(10, maxBuy) : Math.max(10, maxSell);
  const currentVal = Math.min(amount, maxVal);
  const cost = Math.floor(currentVal * buyPrice);
  const gain = Math.floor(currentVal * sellPrice);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-stone-800 text-white p-6 rounded-xl border border-teal-500 shadow-2xl w-full max-w-sm">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-teal-400"><Scale size={24} /> 楽市楽座 <span className="text-xs bg-stone-700 px-2 py-1 rounded text-white ml-2 border border-stone-500">AP消費なし</span></h3>
        <div className="flex gap-2 mb-4">
          <button onClick={() => { setMode('buy'); setAmount(100); }} className={`flex-1 py-2 rounded border ${mode === 'buy' ? 'bg-teal-700 border-teal-400' : 'bg-stone-700 border-stone-600'}`}>購入 (単価:{buyPrice})</button>
          <button onClick={() => { setMode('sell'); setAmount(100); }} className={`flex-1 py-2 rounded border ${mode === 'sell' ? 'bg-orange-700 border-orange-400' : 'bg-stone-700 border-stone-600'}`}>売却 (単価:{sellPrice})</button>
        </div>
        <div className="text-center mb-4"><div className="text-4xl font-mono font-bold mb-2">{currentVal} <span className="text-sm">石</span></div><div className="text-sm text-stone-300">{mode === 'buy' ? `費用: ${cost}金` : `売上: ${gain}金`}</div></div>
        <input type="range" min="10" max={maxVal} step="10" value={currentVal} onChange={(e) => setAmount(parseInt(e.target.value))} className="w-full h-2 bg-stone-600 rounded-lg appearance-none cursor-pointer mb-6 accent-teal-500" />
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-2 rounded bg-stone-600 font-bold">やめる</button>
          <button onClick={() => onTrade(mode, currentVal, mode === 'buy' ? cost : gain)} disabled={(mode === 'buy' && currentGold < cost) || (mode === 'sell' && currentRice < currentVal)} className="flex-1 py-2 rounded font-bold bg-teal-600 hover:bg-teal-500 text-white disabled:opacity-50">取引実行</button>
        </div>
      </div>
    </div>
  );
};

export const TitlesModal = ({ daimyoStats, provinces, daimyoId, onClose, onApply, onApplyRank }) => {
    const [tab, setTab] = useState('titles');
    const myStats = daimyoStats[daimyoId];
    const myOwnedProvinces = provinces.filter(p => p.ownerId === daimyoId).map(p => p.id);
    const existingTitles = Object.values(daimyoStats).flatMap(s => s.titles || []);
    const relevantDonation = provinces.some(p => p.ownerId === 'Ashikaga') ? myStats.donatedShogunate : myStats.donatedImperial;
    
    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
             <div className="bg-stone-900 text-white p-6 rounded-xl border border-yellow-600 shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="flex items-center gap-4 mb-4 border-b border-stone-700 pb-2">
                    <button onClick={() => setTab('titles')} className={`text-2xl font-bold flex items-center gap-2 ${tab==='titles' ? 'text-yellow-500' : 'text-stone-500'}`}><Crown size={32}/> 役職 <span className="text-xs font-normal text-stone-400">(確認のみ: AP消費なし)</span></button>
                    <button onClick={() => setTab('ranks')} className={`text-2xl font-bold flex items-center gap-2 ${tab==='ranks' ? 'text-purple-500' : 'text-stone-500'}`}><Landmark size={32}/> 官位</button>
                </div>
                <div className="overflow-y-auto flex-1 pr-2 space-y-2">
                    {tab === 'titles' && TITLES.map(title => {
                        if (title.id === 'ryukyu_king') return null;
                        const canApply = !myStats.titles.includes(title.name) && !existingTitles.includes(title.name) && myOwnedProvinces.length >= title.reqProvinces && relevantDonation >= title.reqDonation && myStats.gold >= COSTS.title_app.gold;
                        return (
                            <div key={title.id} className="p-4 rounded border border-stone-600 bg-stone-800 flex justify-between items-center">
                                <div><div className="text-lg font-bold text-yellow-200">{title.name}</div><div className="text-xs text-stone-400">必要国:{title.reqProvinces} 献金:{title.reqDonation}</div></div>
                                {myStats.titles.includes(title.name) ? <span className="text-yellow-500">就任中</span> : <button onClick={() => onApply(title)} disabled={!canApply} className="px-4 py-2 rounded bg-yellow-600 disabled:opacity-50 text-black font-bold flex items-center gap-1">申請 <Zap size={12}/> 1</button>}
                            </div>
                        );
                    })}
                    {tab === 'ranks' && COURT_RANKS.map(rank => {
                         const canApply = myOwnedProvinces.length >= rank.reqProvinces && myStats.donatedImperial >= rank.reqDonation && myStats.gold >= COSTS.rank_app.gold && myStats.rank !== rank.name;
                         return (
                             <div key={rank.id} className="p-4 rounded border border-stone-600 bg-stone-800 flex justify-between items-center">
                                 <div><div className="text-lg font-bold text-purple-200">{rank.name}</div><div className="text-xs text-stone-400">必要国:{rank.reqProvinces} 献金:{rank.reqDonation}</div></div>
                                 {myStats.rank === rank.name ? <span className="text-purple-500">叙任中</span> : <button onClick={() => onApplyRank(rank)} disabled={!canApply} className="px-4 py-2 rounded bg-purple-600 disabled:opacity-50 text-white font-bold flex items-center gap-1">申請 <Zap size={12}/> 1</button>}
                             </div>
                         );
                    })}
                </div>
                <div className="mt-6 flex justify-end"><button onClick={onClose} className="px-6 py-2 bg-stone-700 hover:bg-stone-600 rounded text-white font-bold">閉じる</button></div>
             </div>
        </div>
    );
};

export const DonateModal = ({ currentGold, shogunName, isShogun, onConfirm, onCancel }) => {
  const [amount, setAmount] = useState(100);
  const [target, setTarget] = useState('imperial'); 
  const fameGain = target === 'imperial' ? Math.floor(amount / 100) : Math.floor(amount / 200);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-stone-800 text-white p-6 rounded-xl border border-purple-500 shadow-2xl w-full max-w-sm">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-purple-400"><Crown size={24} /> 献金</h3>
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTarget('imperial')} className={`flex-1 py-2 rounded border ${target === 'imperial' ? 'bg-purple-700 border-purple-400' : 'bg-stone-700 border-stone-600'}`}>朝廷</button>
          {!isShogun && <button onClick={() => setTarget('shogunate')} className={`flex-1 py-2 rounded border ${target === 'shogunate' ? 'bg-yellow-700 border-yellow-400' : 'bg-stone-700 border-stone-600'}`}>幕府</button>}
        </div>
        <div className="text-center mb-4"><div className="text-4xl font-mono font-bold mb-2 text-yellow-400">{amount}金</div><div className="text-sm text-stone-300">名声期待値: +{fameGain}</div></div>
        <input type="range" min="100" max={Math.max(100, currentGold)} step="100" value={amount} onChange={(e) => setAmount(parseInt(e.target.value))} className="w-full h-2 bg-stone-600 rounded-lg appearance-none cursor-pointer mb-6 accent-purple-500" />
        <div className="flex gap-4"><button onClick={onCancel} className="flex-1 py-2 rounded bg-stone-600 font-bold">やめる</button><button onClick={() => onConfirm(target, amount, fameGain)} disabled={currentGold < amount} className="flex-1 py-2 rounded font-bold bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50 flex items-center justify-center gap-1">献上実行 <Zap size={14} className="text-yellow-400"/> 1</button></div>
      </div>
    </div>
  );
};

export const TradeModal = ({ onConfirm, onCancel }) => (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-stone-800 text-white p-6 rounded-xl border border-teal-500 shadow-2xl w-full max-w-md">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-teal-400"><Ship size={24} /> 交易選択</h3>
        <div className="space-y-4">
            <button onClick={() => onConfirm('nanban')} className="w-full p-4 rounded bg-stone-700 hover:bg-teal-900 border border-stone-500 hover:border-teal-400 transition-all flex flex-col gap-1 relative group">
                <span className="font-bold text-lg flex items-center gap-2 text-teal-200"><Star size={18}/> 南蛮貿易</span>
                <span className="text-xs text-stone-300">ハイリスク・ハイリターン。鉄砲入手や巨万の富を得る可能性があるが、一揆のリスクも。</span>
                <div className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded text-xs flex items-center gap-1 border border-stone-500"><Zap size={10} className="text-yellow-400"/> 実行消費: 1</div>
            </button>
            <button onClick={() => onConfirm('domestic')} className="w-full p-4 rounded bg-stone-700 hover:bg-blue-900 border border-stone-500 hover:border-blue-400 transition-all flex flex-col gap-1 relative group">
                <span className="font-bold text-lg flex items-center gap-2 text-blue-200"><Handshake size={18}/> 近隣交易</span>
                <span className="text-xs text-stone-300">ローリスク。書物(名声)や安定した利益を得やすい。</span>
                <div className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded text-xs flex items-center gap-1 border border-stone-500"><Zap size={10} className="text-yellow-400"/> 実行消費: 1</div>
            </button>
        </div>
        <button onClick={onCancel} className="mt-6 w-full py-2 rounded bg-stone-600 hover:bg-stone-500 font-bold">やめる</button>
      </div>
    </div>
);

export const NegotiationScene = ({ targetDaimyoId, targetDaimyo, isAllied, onConfirm, onCancel }) => (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 animate-fade-in">
        <div className="flex flex-col items-center mb-8 z-10">
            <div className={`w-32 h-32 rounded-full ${targetDaimyo.color} flex items-center justify-center border-4 border-white shadow-lg mb-4`}><span className="text-4xl font-bold text-white">{targetDaimyo.name[0]}</span></div>
            <h2 className="text-3xl font-bold text-white mb-2">{targetDaimyo.name}家</h2>
        </div>
        <div className="w-full max-w-2xl bg-stone-900 border-2 border-stone-600 rounded-xl p-6 shadow-2xl z-10">
            <div className="text-right text-xs mb-2 text-stone-400">※実行時に行動力を1消費します</div>
            <div className="grid grid-cols-2 gap-4">
                {isAllied ? (
                    <><button onClick={() => onConfirm('request_aid')} className="p-3 bg-indigo-900/50 hover:bg-indigo-800 border border-indigo-500 rounded text-white font-bold flex justify-between items-center">援助要請 <span className="flex items-center gap-1 text-xs bg-black/30 px-2 rounded"><Zap size={10}/>1</span></button><button onClick={() => onConfirm('break_alliance')} className="p-3 bg-red-900/50 hover:bg-red-800 border border-red-500 rounded text-white font-bold flex justify-between items-center">同盟破棄 <span className="flex items-center gap-1 text-xs bg-black/30 px-2 rounded"><Zap size={10}/>1</span></button></>
                ) : (
                    <>
                        <button onClick={() => onConfirm('gift')} className="p-3 bg-pink-900/50 hover:bg-pink-800 border border-pink-500 rounded text-white font-bold flex justify-between items-center"><div>贈答 <span className="text-xs font-normal">(金{COSTS.gift.gold})</span></div> <span className="flex items-center gap-1 text-xs bg-black/30 px-2 rounded"><Zap size={10}/>1</span></button>
                        <button onClick={() => onConfirm('ceasefire')} className="p-3 bg-green-900/50 hover:bg-green-800 border border-green-500 rounded text-white font-bold flex justify-between items-center"><div>停戦協定 <span className="text-xs font-normal">(金300)</span></div> <span className="flex items-center gap-1 text-xs bg-black/30 px-2 rounded"><Zap size={10}/>1</span></button>
                        <button onClick={() => onConfirm('threaten')} className="p-3 bg-red-900/50 hover:bg-red-800 border border-red-500 rounded text-white font-bold flex justify-between items-center">脅迫 <span className="flex items-center gap-1 text-xs bg-black/30 px-2 rounded"><Zap size={10}/>1</span></button>
                        <button onClick={() => onConfirm('surrender')} className="p-3 bg-orange-900/50 hover:bg-orange-800 border border-orange-500 rounded text-white font-bold flex justify-between items-center">降伏勧告 <span className="flex items-center gap-1 text-xs bg-black/30 px-2 rounded"><Zap size={10}/>1</span></button>
                    </>
                )}
            </div>
            <div className="mt-6 flex justify-center"><button onClick={onCancel} className="px-8 py-2 bg-stone-700 hover:bg-stone-600 text-white rounded font-bold">戻る (消費なし)</button></div>
        </div>
    </div>
);

// ▼ 修正: データの存在チェックを追加してクラッシュを防ぐ
export const DaimyoListModal = ({ provinces, daimyoStats, alliances, ceasefires, relations, onClose, playerDaimyoId, coalition, onViewOnMap }) => {
  const activeDaimyos = Object.keys(DAIMYO_INFO)
    .filter(id => id !== 'Minor')
    .map(id => {
      const count = provinces.filter(p => p.ownerId === id).length;
      const stats = daimyoStats[id];
      return { id, ...DAIMYO_INFO[id], count, stats };
    })
    .filter(d => d.stats) // statsが存在するものだけフィルタリング
    .sort((a,b) => (b.stats?.fame || 0) - (a.stats?.fame || 0));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-stone-800 text-white p-6 rounded-xl border border-stone-600 shadow-2xl w-full max-w-6xl h-3/4 flex flex-col">
        <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold flex items-center gap-2"><Users size={24} /> 勢力一覧</h3><button onClick={onClose}><XCircle size={24}/></button></div>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-stone-400 uppercase bg-stone-700 sticky top-0"><tr><th className="p-2">大名</th><th className="p-2">名声</th><th className="p-2">国数</th><th className="p-2">金</th><th className="p-2">兵糧</th><th className="p-2">役職・官位</th><th className="p-2">関係</th><th className="p-2">地図</th></tr></thead>
            <tbody>
              {activeDaimyos.map((d) => (
                <tr key={d.id} className="border-b border-stone-700 hover:bg-stone-700/50">
                  <td className="p-2 flex items-center gap-2"><span className={`w-3 h-3 rounded-full ${d.color}`}></span>{d.name}</td>
                  <td className="p-2 font-mono text-purple-300">{d.stats.fame}</td><td className="p-2 font-mono">{d.count}</td><td className="p-2 font-mono text-yellow-300">{d.stats.gold}</td><td className="p-2 font-mono text-green-300">{d.stats.rice}</td>
                  <td className="p-2 text-xs">
                     {d.stats.titles.map(t=><div key={t} className="bg-yellow-900/50 text-yellow-200 px-1 rounded border border-yellow-700 inline-block mr-1">{t}</div>)}
                     {d.stats.rank && <div className="bg-purple-900/50 text-purple-200 px-1 rounded border border-purple-700 inline-block">{d.stats.rank}</div>}
                  </td>
                  <td className="p-2">{d.id === playerDaimyoId ? '-' : relations[playerDaimyoId][d.id]}</td>
                  <td className="p-2"><button onClick={() => onViewOnMap(d.id)} className="p-1 bg-stone-600 rounded"><Eye size={14}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const TroopSelector = ({ maxTroops, onConfirm, onCancel, type }) => {
  const [amount, setAmount] = useState(Math.floor(maxTroops / 2));
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-stone-800 text-white p-6 rounded-xl border border-stone-600 shadow-2xl w-full max-w-sm">
        <h3 className="text-xl font-bold mb-4">{type === 'attack' ? '出陣' : '輸送'}兵数</h3>
        <div className="text-center mb-6 text-4xl font-mono font-bold text-yellow-400">{amount}</div>
        <input type="range" min="1" max={maxTroops-1} value={amount} onChange={(e) => setAmount(parseInt(e.target.value))} className="w-full h-2 bg-stone-600 rounded-lg appearance-none cursor-pointer mb-6" />
        <div className="flex gap-4"><button onClick={onCancel} className="flex-1 py-2 bg-stone-600 rounded">キャンセル</button><button onClick={() => onConfirm(amount)} className="flex-1 py-2 bg-blue-600 rounded font-bold">決定 (消費:1AP)</button></div>
      </div>
    </div>
  );
};

export const BattleScene = ({ battleData, onFinish }) => {
  const [logs, setLogs] = useState(["合戦開始！"]);
  const [atkTroops, setAtkTroops] = useState(battleData?.attackerAmount || 0);
  const [defTroops, setDefTroops] = useState(battleData?.defender?.troops || 0);
  const [phase, setPhase] = useState('fighting');
  const [round, setRound] = useState(0);
  
  const attackerDaimyo = DAIMYO_INFO[battleData.attacker.ownerId];
  const defenderDaimyo = DAIMYO_INFO[battleData.defender.ownerId];

  useEffect(() => {
    if (phase !== 'fighting') return;
    const timer = setTimeout(() => {
        if (atkTroops <= 0 || defTroops <= 0 || round >= 10) {
            setPhase('result');
            if (atkTroops <= 0) setLogs(prev => [...prev, "攻撃軍 敗走！"]);
            else if (defTroops <= 0) setLogs(prev => [...prev, "防衛軍 壊滅！"]);
            else setLogs(prev => [...prev, "日没！ 引き分け（痛み分け）"]);
        } else {
            setRound(r => r + 1);
            // 簡易戦闘ロジック
            const dmgA = Math.floor(atkTroops * 0.15 * (0.8 + Math.random() * 0.4));
            const dmgD = Math.floor(defTroops * 0.15 * (0.8 + Math.random() * 0.4));
            setAtkTroops(prev => Math.max(0, prev - dmgD));
            setDefTroops(prev => Math.max(0, prev - dmgA));
            setLogs(prev => [...prev, `第${round + 1}合: 攻${dmgA} / 防${dmgD}`]);
        }
    }, 1000);
    return () => clearTimeout(timer);
  }, [atkTroops, defTroops, phase, round]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 text-white flex flex-col items-center justify-center p-4 animate-fade-in">
        <div className="flex justify-between w-full max-w-4xl items-center mb-8">
            <div className="flex flex-col items-center">
                <div className={`w-24 h-24 rounded-full ${attackerDaimyo.color} flex items-center justify-center border-4 border-white shadow-[0_0_20px_rgba(255,0,0,0.5)] mb-2 relative`}>
                    <span className="text-3xl font-bold">{attackerDaimyo.name[0]}</span>
                    <div className="absolute -bottom-2 bg-red-700 px-2 rounded-full text-xs font-bold border border-red-400">攻撃軍</div>
                </div>
                <div className="text-xl font-bold mb-1">{attackerDaimyo.name}家</div>
                <div className="text-4xl font-mono font-bold text-red-400 flex items-center gap-2"><Sword size={32}/> {atkTroops}</div>
            </div>

            <div className="flex flex-col items-center justify-center">
                 <div className="text-6xl font-black italic text-yellow-500 mb-2">VS</div>
                 <div className="text-xl font-bold text-stone-400">Round {round}/10</div>
            </div>

            <div className="flex flex-col items-center">
                <div className={`w-24 h-24 rounded-full ${defenderDaimyo.color} flex items-center justify-center border-4 border-white shadow-[0_0_20px_rgba(0,0,255,0.5)] mb-2 relative`}>
                    <span className="text-3xl font-bold">{defenderDaimyo.name[0]}</span>
                    <div className="absolute -bottom-2 bg-blue-700 px-2 rounded-full text-xs font-bold border border-blue-400">防衛軍</div>
                </div>
                <div className="text-xl font-bold mb-1">{defenderDaimyo.name}家</div>
                <div className="text-4xl font-mono font-bold text-blue-400 flex items-center gap-2"><Shield size={32}/> {defTroops}</div>
            </div>
        </div>

        <div className="w-full max-w-2xl bg-stone-900/80 border border-stone-600 rounded-lg h-48 overflow-y-auto p-4 mb-6 font-mono text-sm">
            {logs.slice().reverse().map((l, i) => (
                <div key={i} className={`mb-1 ${l.includes('勝利') ? 'text-yellow-400 font-bold text-lg' : 'text-stone-300'}`}>{l}</div>
            ))}
        </div>
        {phase === 'result' && <button onClick={() => onFinish({ attackerRemaining: atkTroops, defenderRemaining: defTroops })} className="px-10 py-4 bg-yellow-600 text-black text-xl font-bold rounded-full animate-pulse shadow-lg hover:scale-105 transition-transform">結果を確認</button>}
    </div>
  );
};

export const GameOverScreen = ({ gameState, onRestart }) => (
    <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
        <div className="text-center animate-bounce mb-6">
            {gameState === 'won' ? <><Trophy size={80} className="text-yellow-400 mx-auto mb-4" /><h2 className="text-5xl font-bold text-yellow-400">天下統一！</h2></> : <><Skull size={80} className="text-gray-500 mx-auto mb-4" /><h2 className="text-5xl font-bold text-gray-400">落城...</h2></>}
        </div>
        <button onClick={onRestart} className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-xl flex items-center gap-3"><RefreshCw size={24} /> 再挑戦</button>
    </div>
);