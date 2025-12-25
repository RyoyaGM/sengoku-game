import React, { useState, useEffect, useRef, useMemo } from 'react';

import { Sword, Shield, ScrollText, RefreshCw, Trophy, Skull, Coins, Wheat, Hammer, Sprout, ArrowRightCircle, ZoomIn, ZoomOut, Move, BrickWall, Ship, Crown, Handshake, MessageCircle, Users, XCircle, Star, Scale, HeartHandshake, Scroll, Gift, Dumbbell, Smile, Flag, Hourglass, History, Activity, Map as MapIcon, ChevronRight, Target, Eye, Landmark, Zap } from 'lucide-react';
// --- 作成したデータファイルをインポート ---
import { DAIMYO_INFO, TITLES, COURT_RANKS, HISTORICAL_FAME } from './data/daimyos';
import { PROVINCE_DATA_BASE, SEA_ROUTES } from './data/provinces';
import { COSTS } from './data/constants';
import { getFormattedDate, getRiceMarketPrice, getDistance } from './utils/helpers';
import { 
  INITIAL_RESOURCES, 
  INITIAL_ALLIANCES, 
  INITIAL_CEASEFIRES, 
  INITIAL_RELATIONS, 
  INITIAL_PROVINCES 
} from './utils/initializers';

// --- UI コンポーネント ---



const StartScreen = ({ onSelectDaimyo }) => (

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



const IncomingRequestModal = ({ request, onAccept, onReject }) => {

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



const LogHistoryModal = ({ logs, onClose }) => (

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



const MarketModal = ({ currentGold, currentRice, price, onTrade, onClose }) => {

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



const TitlesModal = ({ daimyoStats, provinces, daimyoId, onClose, onApply, onApplyRank }) => {

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



const DonateModal = ({ currentGold, shogunName, isShogun, onConfirm, onCancel }) => {

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



const TradeModal = ({ onConfirm, onCancel }) => (

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



const NegotiationScene = ({ targetDaimyoId, targetDaimyo, isAllied, onConfirm, onCancel }) => (

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



const DaimyoListModal = ({ provinces, daimyoStats, alliances, ceasefires, relations, onClose, playerDaimyoId, coalition, onViewOnMap }) => {

  const activeDaimyos = Object.keys(DAIMYO_INFO).filter(id => id !== 'Minor').map(id => {

    const count = provinces.filter(p => p.ownerId === id).length;

    const stats = daimyoStats[id];

    return { id, ...DAIMYO_INFO[id], count, stats };

  }).sort((a,b) => b.stats.fame - a.stats.fame);



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



const TroopSelector = ({ maxTroops, onConfirm, onCancel, type }) => {

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



const BattleScene = ({ battleData, onFinish }) => {

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



// --- サブコンポーネント (マップ・ポップアップ・HUD) ---



const GameMap = ({ provinces, viewingRelationId, playerDaimyoId, alliances, ceasefires, coalition, selectedProvinceId, attackSourceId, transportSourceId, onSelectProvince }) => {

    // 視点ID決定

    const currentViewId = viewingRelationId || playerDaimyoId;



    return (

        <svg viewBox="0 0 4000 2400" className="w-[4000px] h-[2400px] select-none overflow-visible">

            {/* 接続線 */}

            {provinces.map(p => p.neighbors.map(nid => {

                const n = provinces.find(neighbor => neighbor.id === nid);

                if (!n || p.id > n.id) return null;

                const isSeaRoute = SEA_ROUTES.some(pair => (pair[0]===p.id && pair[1]===n.id) || (pair[1]===p.id && pair[0]===n.id));

                return <line key={`${p.id}-${n.id}`} x1={p.cx} y1={p.cy} x2={n.cx} y2={n.cy} stroke={isSeaRoute ? "#0ea5e9" : "white"} strokeWidth={isSeaRoute ? "2" : "1"} strokeDasharray={isSeaRoute ? "6,4" : "3,3"} opacity={isSeaRoute ? "0.6" : "0.3"} />;

            }))}

            

            {/* 国（ノード） */}

            {provinces.map((p) => {

                const daimyo = DAIMYO_INFO[p.ownerId] || { fill: '#6b7280' };

                const isSelected = selectedProvinceId === p.id;

                

                let strokeColor = "#fff"; 

                let strokeWidth = "1";

                let radius = 24;



                // 関係性による色分け

                if (currentViewId && p.ownerId !== currentViewId && p.ownerId !== 'Minor') {

                    const isAllied = alliances[currentViewId]?.includes(p.ownerId);

                    const isCeasefire = ceasefires[currentViewId]?.[p.ownerId] > 0;

                    const isCoalitionMember = coalition?.members.includes(p.ownerId);

                    const amICoalitionMember = coalition?.members.includes(currentViewId);



                    if (isAllied) { strokeColor = "#3b82f6"; strokeWidth = "3"; }

                    else if (isCoalitionMember && amICoalitionMember) { strokeColor = "#facc15"; strokeWidth = "3"; }

                    else if (isCeasefire) { strokeColor = "#22c55e"; strokeWidth = "3"; }

                    else if (coalition?.target === p.ownerId && amICoalitionMember) { strokeColor = "#ef4444"; strokeWidth = "3"; }

                }



                // 選択・ターゲット状態

                const isTargetable = attackSourceId && provinces.find(pr => pr.id === attackSourceId)?.neighbors.includes(p.id) && p.ownerId !== playerDaimyoId;

                const isTransportTarget = transportSourceId && provinces.find(pr => pr.id === transportSourceId)?.neighbors.includes(p.id) && p.ownerId === playerDaimyoId;



                if (isSelected || attackSourceId === p.id || transportSourceId === p.id) { strokeColor = "#facc15"; strokeWidth = "4"; radius = 28; }

                else if (isTargetable) { strokeColor = "#ef4444"; strokeWidth = "4"; }

                else if (isTransportTarget) { strokeColor = "#3b82f6"; strokeWidth = "4"; }



                return (

                    <g key={p.id} onClick={() => onSelectProvince(p.id, isTargetable, isTransportTarget)} className="cursor-pointer transition-all duration-300">

                        <circle cx={p.cx} cy={p.cy} r={radius} fill={daimyo.fill} stroke={strokeColor} strokeWidth={strokeWidth} className={(isTargetable || isTransportTarget) ? 'animate-pulse' : ''} />

                        <text x={p.cx + (p.labelOffset?.x || 0)} y={p.cy + (p.labelOffset?.y || 0) - 8} textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" className="pointer-events-none drop-shadow-md" style={{ textShadow: '0px 0px 3px rgba(0,0,0,0.8)' }}>{p.name}</text>

                        <g transform={`translate(${p.cx-15}, ${p.cy+5})`} className="pointer-events-none"><rect x="0" y="0" width="30" height="18" rx="4" fill="rgba(0,0,0,0.5)" /><text x="15" y="13" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">{p.troops}</text></g>

                        {p.loyalty < 30 && <text x={p.cx + 20} y={p.cy - 20} className="animate-bounce" fontSize="16">🔥</text>}

                        {isTargetable && <text x={p.cx} y={p.cy} textAnchor="middle" dominantBaseline="central" fontSize="28" fill="white" fontWeight="bold" className="animate-pulse pointer-events-none">攻</text>}

                        {isTransportTarget && <text x={p.cx} y={p.cy} textAnchor="middle" dominantBaseline="central" fontSize="28" fill="white" fontWeight="bold" className="animate-pulse pointer-events-none">輸</text>}

                        {coalition?.target === p.ownerId && <text x={p.cx} y={p.cy-30} className="animate-pulse" fontSize="20">🎯</text>}

                    </g>

                );

            })}

        </svg>

    );

};



const ProvincePopup = ({ selectedProvince, daimyoStats, playerDaimyoId, isPlayerTurn, viewingRelationId, shogunId, alliances, ceasefires, coalition, onClose, onAction }) => {

    if (!selectedProvince) return null;

    const p = selectedProvince;

    const isOwned = p.ownerId === playerDaimyoId;

    const daimyo = DAIMYO_INFO[p.ownerId] || { name: '不明', color: 'bg-gray-500' };

    const stats = daimyoStats[p.ownerId];

    const [tab, setTab] = useState('military');



    const canInteract = !viewingRelationId && isPlayerTurn;

    const isAllied = alliances[playerDaimyoId]?.includes(p.ownerId);

    const isCeasefire = ceasefires[playerDaimyoId]?.[p.ownerId] > 0;



    // APバッジコンポーネント

    const CostBadge = ({ ap = 1 }) => (

        ap > 0 ? <span className="absolute top-0 right-0 bg-yellow-600 text-black text-[9px] px-1 rounded-bl-md font-bold flex items-center">⚡{ap}</span> : null

    );



    return (

        <div className="fixed top-[100px] left-[20px] z-30 w-80 bg-stone-800/95 text-white p-4 rounded-lg border border-stone-500 shadow-2xl backdrop-blur-sm animate-fade-in max-h-[calc(100vh-120px)] overflow-y-auto" onMouseDown={e => e.stopPropagation()}>

            <div className="flex justify-between items-center border-b border-stone-600 pb-2 mb-2">

                <div>

                    <span className="font-bold text-lg">{p.name}</span>

                    <span className={`ml-2 text-xs ${daimyo.color} px-2 py-0.5 rounded text-white`}>{daimyo.name}</span>

                    {isAllied && <span className="ml-1 text-xs bg-blue-600 px-1 rounded">同盟</span>}

                    {isCeasefire && <span className="ml-1 text-xs bg-green-700 px-1 rounded">停戦</span>}

                    {shogunId === p.ownerId && <span className="ml-1 text-xs bg-yellow-600 px-1 rounded">将軍</span>}

                </div>

                <button onClick={onClose} className="text-stone-400 hover:text-white">✕</button>

            </div>

            

            {/* 情報表示 */}

            <div className="grid grid-cols-3 gap-1 mb-2 text-xs bg-black/30 p-2 rounded">

                <div className="flex items-center gap-1 text-yellow-300"><Coins size={10}/>{stats.gold}</div>

                <div className="flex items-center gap-1 text-green-300"><Wheat size={10}/>{stats.rice}</div>

                <div className="flex items-center gap-1 text-purple-300"><Crown size={10}/>{stats.fame}</div>

            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-4">

                <div>兵数: {p.troops}</div><div>防御: {p.defense}</div>

                <div>訓練: {p.training}</div><div>民忠: {p.loyalty}</div>

                <div>商業: {p.commerce}</div><div>石高: {p.agriculture}</div>

                <div className="col-span-2">行動力: {p.actionsLeft}/3</div>

            </div>



            {/* アクションボタン */}

            {canInteract ? (

                isOwned ? (

                    <div>

                        <div className="flex border-b border-stone-600 mb-2">

                             {['military', 'domestic', 'fame'].map(t => (

                                 <button key={t} onClick={() => setTab(t)} className={`flex-1 py-1 text-xs font-bold ${tab===t ? 'bg-stone-600 text-white' : 'text-stone-400'}`}>

                                     {t==='military'?'軍事':t==='domestic'?'内政':'名声'}

                                 </button>

                             ))}

                        </div>

                        <div className="grid grid-cols-2 gap-2">

                            {tab === 'military' && (

                                <>

                                <button onClick={() => onAction('attack', p.id)} className="cmd-btn relative col-span-2 bg-red-900/50 border-red-700 text-red-100">出陣 <span className="text-[10px] ml-1">({COSTS.attack.gold}/{COSTS.attack.rice})</span><CostBadge/></button>

                                <button onClick={() => onAction('transport', p.id)} className="cmd-btn relative col-span-2 bg-blue-900/50 border-blue-700 text-blue-100">輸送 <span className="text-[10px] ml-1">({COSTS.move.gold}/{COSTS.move.rice})</span><CostBadge/></button>

                                <button onClick={() => onAction('recruit', p.id)} className="cmd-btn relative bg-blue-900/50 border-blue-700 text-blue-100">徴兵 <span className="text-[10px] ml-1">({COSTS.recruit.gold}/{COSTS.recruit.rice})</span><CostBadge/></button>

                                <button onClick={() => onAction('train', p.id)} className="cmd-btn relative bg-orange-900/50 border-orange-700 text-orange-100">訓練 <span className="text-[10px] ml-1">({COSTS.train.gold})</span><CostBadge/></button>

                                <button onClick={() => onAction('fortify', p.id)} className="cmd-btn relative bg-stone-700 border-stone-500 text-stone-100 col-span-2">普請 <span className="text-[10px] ml-1">({COSTS.fortify.gold})</span><CostBadge/></button>

                                </>

                            )}

                            {tab === 'domestic' && (

                                <>

                                <button onClick={() => onAction('develop', p.id)} className="cmd-btn relative bg-yellow-900/50 border-yellow-700 text-yellow-100">商業 <span className="text-[10px] ml-1">({COSTS.develop.gold})</span><CostBadge/></button>

                                <button onClick={() => onAction('cultivate', p.id)} className="cmd-btn relative bg-green-900/50 border-green-700 text-green-100">開墾 <span className="text-[10px] ml-1">({COSTS.cultivate.gold}/{COSTS.cultivate.rice})</span><CostBadge/></button>

                                <button onClick={() => onAction('pacify', p.id)} className="cmd-btn relative bg-pink-900/50 border-pink-700 text-pink-100 col-span-2">施し <span className="text-[10px] ml-1">({COSTS.pacify.gold}/{COSTS.pacify.rice})</span><CostBadge/></button>

                                <button onClick={() => onAction('market', p.id)} className="cmd-btn relative bg-orange-700 border-orange-500 text-white col-span-2">楽市楽座 <span className="text-[9px] ml-1 opacity-80">(FREE)</span></button>

                                <button onClick={() => onAction('trade', p.id)} className="cmd-btn relative bg-teal-800 border-teal-500 text-white col-span-2">貿易 <span className="text-[10px] ml-1">({COSTS.trade.gold})</span><CostBadge/></button>

                                </>

                            )}

                            {tab === 'fame' && (

                                <>

                                <button onClick={() => onAction('donate', p.id)} className="cmd-btn relative bg-purple-900/60 border-purple-600 text-purple-100 col-span-2 py-3">献金<CostBadge/></button>

                                <button onClick={() => onAction('titles', p.id)} className="cmd-btn relative bg-yellow-600 border-yellow-300 text-black font-bold col-span-2 py-3">役職・官位 <span className="text-[9px] opacity-70 block font-normal">(確認無料/申請時消費)</span></button>

                                </>

                            )}

                        </div>

                    </div>

                ) : (

                    <div className="grid grid-cols-1 gap-2">

                        {!isAllied && !isCeasefire && <button onClick={() => onAction('alliance', p.id)} className="cmd-btn relative bg-indigo-700 border-indigo-500 text-white h-10">同盟申請 <span className="text-[10px] ml-1">(500)</span><CostBadge/></button>}

                        {!isCeasefire && <button onClick={() => onAction('negotiate', p.id)} className="cmd-btn relative bg-pink-800 border-pink-500 text-white h-10">{isAllied ? '外交' : '交渉'}<CostBadge/></button>}

                        {isCeasefire && <div className="text-center text-green-300 bg-green-900/30 border border-green-700 p-2 rounded">停戦中</div>}

                    </div>

                )

            ) : (

                <div className="text-center p-4 bg-stone-900/50 rounded text-stone-400">操作不可</div>

            )}

        </div>

    );

};



const ResourceBar = ({ stats, turn, isPlayerTurn, shogunId, playerId, coalition }) => (

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



const ControlPanel = ({ lastLog, onHistoryClick, onEndTurn, onCancelSelection, isPlayerTurn, hasSelection, onViewBack, viewingRelationId, onDaimyoList }) => (

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





// --- Main App Component ---



const App = () => {

  // 1. State Definitions

  const [provinces, setProvinces] = useState(INITIAL_PROVINCES);

  const [daimyoStats, setDaimyoStats] = useState(INITIAL_RESOURCES);

  const [alliances, setAlliances] = useState(INITIAL_ALLIANCES);

  const [ceasefires, setCeasefires] = useState(INITIAL_CEASEFIRES);

  const [relations, setRelations] = useState(INITIAL_RELATIONS);

  const [coalition, setCoalition] = useState(null);

  

  const [shogunId, setShogunId] = useState('Ashikaga'); 

  const [playerDaimyoId, setPlayerDaimyoId] = useState(null); 

  const [turn, setTurn] = useState(1);

  const [gameState, setGameState] = useState('playing'); 



  // UI State

  const [selectedProvinceId, setSelectedProvinceId] = useState(null);

  const [attackSourceId, setAttackSourceId] = useState(null);

  const [transportSourceId, setTransportSourceId] = useState(null);

  const [viewingRelationId, setViewingRelationId] = useState(null);

  const [mapTransform, setMapTransform] = useState({ x: 0, y: 0, scale: 0.6 });

  const [isDragging, setIsDragging] = useState(false);

  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });



  // Modal State

  const [modalState, setModalState] = useState({ type: null, data: null }); // 'donate', 'trade', 'market', 'negotiate', 'titles', 'list', 'battle', 'troop', 'request', 'history'

  const [logs, setLogs] = useState([]);

  const [lastLog, setLastLog] = useState('大名を選択して天下統一を目指せ。');



  // Turn Logic State

  const [turnOrder, setTurnOrder] = useState([]);

  const [currentTurnIndex, setCurrentTurnIndex] = useState(-1);

  const [isPlayerTurn, setIsPlayerTurn] = useState(false);

  const provincesRef = useRef(provinces);



  // 2. Effects

  useEffect(() => { provincesRef.current = provinces; }, [provinces]);



  useEffect(() => {

    if (!playerDaimyoId) return;

    const playerCount = provinces.filter(p => p.ownerId === playerDaimyoId).length;

    if (playerCount === provinces.length) setGameState('won');

    else if (playerCount === 0) setGameState('lost');

  }, [provinces, playerDaimyoId]);



  useEffect(() => { if (playerDaimyoId && turnOrder.length === 0) startNewSeason(); }, [playerDaimyoId]);

  

  useEffect(() => {

      if (turn > 1) { showLog(`${getFormattedDate(turn)}になりました。`); startNewSeason(); }

  }, [turn]);



  useEffect(() => {

      if (turnOrder.length === 0 || currentTurnIndex === -1) return;

      if (currentTurnIndex >= turnOrder.length) { setTurn(t => t + 1); return; }

      const currentDaimyo = turnOrder[currentTurnIndex];

      // 滅亡済みチェック

      if (!provinces.some(p => p.ownerId === currentDaimyo)) { advanceTurn(); return; }

      

      if (currentDaimyo === playerDaimyoId) {

          setIsPlayerTurn(true); showLog(`我が軍の手番です。`);

      } else {

          setIsPlayerTurn(false); setTimeout(() => processAiTurn(currentDaimyo), 800);

      }

  }, [currentTurnIndex, turnOrder]);



  // 3. Helper Logic

  const showLog = (text) => { setLastLog(text); setLogs(prev => [...prev, `${getFormattedDate(turn)}: ${text}`]); };

  

  const updateResource = (id, g, r, f=0, d=0) => {

      setDaimyoStats(prev => ({...prev, [id]: { ...prev[id], gold: Math.max(0,(prev[id].gold||0)+g), rice: Math.max(0,(prev[id].rice||0)+r), fame: Math.max(0,(prev[id].fame||0)+f) }}));

  };

  const updateRelation = (target, diff) => setRelations(prev => ({...prev, [playerDaimyoId]: {...(prev[playerDaimyoId]||{}), [target]: Math.min(100, Math.max(0, (prev[playerDaimyoId]?.[target]||50)+diff))}}));

  const consumeAction = (pid) => setProvinces(prev => prev.map(p => p.id === pid ? { ...p, actionsLeft: Math.max(0, p.actionsLeft - 1) } : p));



  const startNewSeason = () => {

      const isAutumn = (turn - 1) % 4 === 2;

      setCeasefires(prev => {

          const next = { ...prev };

          Object.keys(next).forEach(k => Object.keys(next[k]).forEach(t => { if(next[k][t]>0) next[k][t]--; }));

          return next;

      });

      if (coalition) {

          if (coalition.duration <= 1) { setCoalition(null); showLog("包囲網が解散しました。"); }

          else setCoalition(prev => ({...prev, duration: prev.duration - 1}));

      }

      setProvinces(curr => curr.map(p => ({...p, actionsLeft: 3})));

      Object.keys(DAIMYO_INFO).forEach(id => {

          const owned = provincesRef.current.filter(p => p.ownerId === id);

          // 内政収入

          if (owned.length) {

              const commerceIncome = owned.reduce((s,p)=>s+p.commerce,0);

              const agIncome = isAutumn ? owned.reduce((s,p)=>s+p.agriculture,0)*2 : 0;

              updateResource(id, commerceIncome, agIncome);

          }

      });

      setTimeout(determineTurnOrder, 500);

  };



  const determineTurnOrder = () => {

      const active = Object.keys(DAIMYO_INFO).filter(id => id !== 'Minor' && provincesRef.current.some(p => p.ownerId === id));

      active.sort((a,b) => (daimyoStats[b]?.fame||0) - (daimyoStats[a]?.fame||0));

      setTurnOrder(active); setCurrentTurnIndex(0);

  };



  const advanceTurn = () => { setSelectedProvinceId(null); setAttackSourceId(null); setTransportSourceId(null); setCurrentTurnIndex(prev => prev + 1); };



// src/App.jsx 内の processAiTurn 関数を置換

// src/App.jsx

  const processAiTurn = (aiId) => {
      setProvinces(curr => {
          const next = curr.map(p => ({...p}));
          let { gold, rice, fame } = daimyoStats[aiId] || { gold:0, rice:0, fame: 0 };
          const originalGold = gold;
          const originalRice = rice;
          const originalFame = fame;
          
          // 戦略設定の取得 (デフォルトはbalanced)
          const strategy = DAIMYO_INFO[aiId]?.strategy || 'balanced';
          
          // 戦略別パラメータ定義
          const params = {
              aggressive: { attackChance: 0.8, attackThreshold: 300, recruitThreshold: 400, saveRice: false },
              balanced:   { attackChance: 0.5, attackThreshold: 500, recruitThreshold: 500, saveRice: false },
              defensive:  { attackChance: 0.2, attackThreshold: 800, recruitThreshold: 700, saveRice: true }
          };
          const prm = params[strategy];

          // 1. 市場介入 (戦略により傾向を変える)
          const marketPrice = getRiceMarketPrice(turn);
          if (gold > 1000 && rice < 300) {
              const buyAmount = 200;
              const cost = Math.floor(buyAmount * marketPrice * 1.2);
              if (gold > cost) { gold -= cost; rice += buyAmount; }
          } else if (rice > 1500 && gold < 300 && !prm.saveRice) {
              // 守勢AIは米を売りにくい（兵糧攻め対策）
              const sellAmount = 300;
              const gain = Math.floor(sellAmount * marketPrice * 0.8);
              rice -= sellAmount; gold += gain;
          }

          const myProvinces = next.filter(p => p.ownerId === aiId);
          
          myProvinces.forEach(p => {
              while (p.actionsLeft > 0) {
                  const neighbors = p.neighbors.map(nid => next.find(x => x.id === nid)).filter(n => n);
                  const enemies = neighbors.filter(n => n.ownerId !== aiId && !alliances[aiId]?.includes(n.ownerId));
                  // 弱敵を探す (好戦的AIは多少兵数差があっても攻める)
                  const weakEnemy = enemies.find(e => e.troops < p.troops * (strategy === 'aggressive' ? 0.9 : 0.6)); 
                  const isFrontline = enemies.length > 0;

                  // A. 軍事行動 (攻撃)
                  // 兵糧と兵数が十分で、かつ確率判定に成功すれば攻撃
                  if (weakEnemy && rice >= COSTS.attack.rice && p.troops > prm.attackThreshold && Math.random() < prm.attackChance) {
                      rice -= COSTS.attack.rice;
                      p.actionsLeft--;
                      
                      let atk = Math.floor(p.troops * 0.6); 
                      p.troops -= atk;
                      let def = weakEnemy.troops;
                      
                      for(let r=0; r<10; r++) {
                          if(atk<=0 || def<=0) break;
                          atk -= Math.floor(def * 0.1); 
                          def -= Math.floor(atk * 0.15); 
                      }

                      if (def <= 0) {
                          weakEnemy.ownerId = aiId;
                          weakEnemy.troops = Math.max(1, atk);
                          weakEnemy.actionsLeft = 0;
                          showLog(`${DAIMYO_INFO[aiId].name}が${weakEnemy.name}を制圧！`);
                          continue; 
                      } else {
                          weakEnemy.troops = def;
                          p.troops += Math.floor(atk * 0.5); 
                      }
                  }

                  // B. 軍事増強 (徴兵)
                  else if (isFrontline && p.troops < prm.recruitThreshold && gold >= COSTS.recruit.gold && rice >= COSTS.recruit.rice) {
                      gold -= COSTS.recruit.gold;
                      rice -= COSTS.recruit.rice;
                      p.troops += COSTS.recruit.troops;
                      p.actionsLeft--;
                  }

                  // C. 防御 (普請)
                  // 守勢AIは防御度を高めようとする
                  else if (isFrontline && p.defense < (strategy === 'defensive' ? 80 : 40) && gold >= COSTS.fortify.gold) {
                      gold -= COSTS.fortify.gold;
                      p.defense += COSTS.fortify.boost;
                      p.actionsLeft--;
                  }

                  // D. 内政
                  else if (gold >= COSTS.develop.gold) {
                      if (Math.random() > 0.5) {
                          gold -= COSTS.develop.gold;
                          p.commerce += COSTS.develop.boost;
                      } else if (gold >= COSTS.cultivate.gold && rice >= COSTS.cultivate.rice) {
                          gold -= COSTS.cultivate.gold;
                          rice -= COSTS.cultivate.rice;
                          p.agriculture += COSTS.cultivate.boost;
                      }
                      p.actionsLeft--;
                  }
                  
                  // E. 名声 (献金)
                  else if (gold > 3000) {
                      const donateAmount = 500;
                      gold -= donateAmount;
                      fame += Math.floor(donateAmount / 100);
                      p.actionsLeft--;
                  }

                  else {
                      p.actionsLeft = 0;
                  }
              }
          });

          setTimeout(() => updateResource(aiId, gold - originalGold, rice - originalRice, fame - originalFame), 0);
          return next;
      });
      setTimeout(advanceTurn, 800);
  };


  // 4. Action Handlers (Categorized)

  

  const handleWheel = (e) => {

    const scaleAmount = -e.deltaY * 0.001;

    const newScale = Math.min(Math.max(0.2, mapTransform.scale + scaleAmount), 3);

    const ratio = newScale / mapTransform.scale;

    const newX = e.clientX - (e.clientX - mapTransform.x) * ratio;

    const newY = e.clientY - (e.clientY - mapTransform.y) * ratio;

    setMapTransform({ x: newX, y: newY, scale: newScale });

  };



  // Domestic Actions

  const handleDomesticAction = (type, pid) => {

      const p = provinces.find(x => x.id === pid);

      // 即時実行系のアクションのみ、ここで行動力をチェックして消費

      const isImmediate = ['develop', 'cultivate', 'pacify', 'fortify'].includes(type);

      

      if (isImmediate) {

          if (p.actionsLeft <= 0) return showLog("行動力不足");

          const cost = COSTS[type];

          const stats = daimyoStats[playerDaimyoId];

          if (stats.gold < cost.gold || stats.rice < cost.rice) return showLog("資源不足");



          updateResource(playerDaimyoId, -cost.gold, -cost.rice);

          consumeAction(pid);



          if (type === 'develop') { setProvinces(prev => prev.map(pr => pr.id === pid ? {...pr, commerce: pr.commerce + cost.boost} : pr)); showLog("商業開発完了"); }

          if (type === 'cultivate') { setProvinces(prev => prev.map(pr => pr.id === pid ? {...pr, agriculture: pr.agriculture + cost.boost} : pr)); showLog("開墾完了"); }

          if (type === 'pacify') { setProvinces(prev => prev.map(pr => pr.id === pid ? {...pr, loyalty: Math.min(100, pr.loyalty + cost.boost)} : pr)); showLog("施しを行いました"); }

          if (type === 'fortify') { setProvinces(prev => prev.map(pr => pr.id === pid ? {...pr, defense: pr.defense + cost.boost} : pr)); showLog("普請完了"); }

      } else {

          

          if (type === 'market') setModalState({ type: 'market', data: { pid } });

          if (type === 'trade') setModalState({ type: 'trade', data: { pid } });

          if (type === 'donate') setModalState({ type: 'donate', data: { pid } });

          if (type === 'titles') setModalState({ type: 'titles', data: { pid } });

      }

  };



  // Military Actions

  const handleMilitaryAction = (type, pid) => {

      const p = provinces.find(x => x.id === pid);

      if (p.actionsLeft <= 0) return showLog("行動力不足");

      

      if (type === 'train') {

          if (daimyoStats[playerDaimyoId].gold < COSTS.train.gold) return showLog("金不足");

          updateResource(playerDaimyoId, -COSTS.train.gold, 0);

          setProvinces(prev => prev.map(pr => pr.id === pid ? {...pr, training: Math.min(100, pr.training + COSTS.train.boost)} : pr));

          consumeAction(pid); showLog("訓練完了");

      }

      if (type === 'recruit') {

           const c = COSTS.recruit;

           if (daimyoStats[playerDaimyoId].gold < c.gold || daimyoStats[playerDaimyoId].rice < c.rice) return showLog("資源不足");

           updateResource(playerDaimyoId, -c.gold, -c.rice);

           setProvinces(prev => prev.map(pr => pr.id === pid ? {...pr, troops: pr.troops + c.troops, loyalty: pr.loyalty - 5} : pr));

           consumeAction(pid); showLog("徴兵完了");

      }

      if (type === 'attack') { setAttackSourceId(pid); setTransportSourceId(null); setSelectedProvinceId(null); showLog("攻撃目標を選択してください"); }

      if (type === 'transport') { setTransportSourceId(pid); setAttackSourceId(null); setSelectedProvinceId(null); showLog("輸送先を選択してください"); }

  };



  const handleTroopAction = (amount) => {

      const { type, sourceId, targetId } = modalState.data;

      setModalState({ type: null });

      const src = provinces.find(p => p.id === sourceId);

      const tgt = provinces.find(p => p.id === targetId);



      if (type === 'transport') {

          updateResource(playerDaimyoId, -COSTS.move.gold, -COSTS.move.rice);

          setProvinces(prev => prev.map(p => {

              if (p.id === sourceId) return {...p, troops: p.troops - amount, actionsLeft: Math.max(0, p.actionsLeft-1)};

              if (p.id === targetId) return {...p, troops: p.troops + amount};

              return p;

          }));

          showLog("輸送完了");

      } else if (type === 'attack') {

          updateResource(playerDaimyoId, -COSTS.attack.gold, -COSTS.attack.rice);

          setProvinces(prev => prev.map(p => p.id === sourceId ? {...p, troops: p.troops - amount, actionsLeft: Math.max(0, p.actionsLeft-1)} : p));

          setModalState({ type: 'battle', data: { attacker: src, defender: tgt, attackerAmount: amount } });

      }

      setAttackSourceId(null); setTransportSourceId(null);

  };



  // Diplomatic & Map Interaction

  const handleMapSelect = (pid, isTargetable, isTransportTarget) => {

      if (isDragging) return;

      if (isTargetable || isTransportTarget) {

          const type = isTargetable ? 'attack' : 'transport';

          const srcId = isTargetable ? attackSourceId : transportSourceId;

          const src = provinces.find(p => p.id === srcId);

          setModalState({ type: 'troop', data: { type, sourceId: srcId, targetId: pid, maxTroops: src.troops } });

      } else {

          if (!attackSourceId && !transportSourceId) setSelectedProvinceId(pid === selectedProvinceId ? null : pid);

      }

  };



const handleDiplomacy = (type, targetDaimyoId) => {
      const p = provinces.find(x => x.id === selectedProvinceId);
      if (p && p.actionsLeft <= 0) return showLog("行動力不足"); 

      if (type === 'alliance') {
         // 修正箇所: ここで targetDaimyoId をそのまま使います（以前はprovinces.findして未定義になっていました）
         const cost = 500;
         if (daimyoStats[playerDaimyoId].gold < cost) return showLog("金不足");
         
         updateResource(playerDaimyoId, -cost, 0);
         setAlliances(prev => ({
             ...prev, 
             [playerDaimyoId]: [...(prev[playerDaimyoId] || []), targetDaimyoId], 
             [targetDaimyoId]: [...(prev[targetDaimyoId] || []), playerDaimyoId]
         }));
         showLog("同盟締結"); 
         consumeAction(selectedProvinceId);
      }
      if (type === 'negotiate') {
          setModalState({ type: 'negotiate', data: { targetId: targetDaimyoId, provinceId: selectedProvinceId } });
      }
  };


  // 5. Render

  if (!playerDaimyoId) return <StartScreen onSelectDaimyo={setPlayerDaimyoId} />;



  return (

    <div className="relative w-full h-screen overflow-hidden font-sans select-none text-stone-100 flex flex-col items-center justify-center bg-[#0f172a]">

        {/* 背景 */}

        <div className="absolute inset-0 z-0 bg-sky-900" style={{ backgroundImage: `radial-gradient(circle at 100% 50%, transparent 20%, rgba(255,255,255,0.03) 21%, transparent 22%), radial-gradient(circle at 0% 50%, transparent 20%, rgba(255,255,255,0.03) 21%, transparent 22%), radial-gradient(circle at 50% 50%, transparent 50%, rgba(0,0,0,0.2) 100%)`, backgroundSize: '100px 100px' }}><div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)' }}></div></div>



        {/* HUD */}

        <ResourceBar stats={daimyoStats[playerDaimyoId]} turn={turn} isPlayerTurn={isPlayerTurn} shogunId={shogunId} playerId={playerDaimyoId} coalition={coalition} />



        {/* メインマップ */}

        <div className="relative z-0 w-full h-full overflow-hidden cursor-move" 

             onMouseDown={(e) => { setDragStartPos({x:e.clientX, y:e.clientY}); setIsDragging(false); }}

             onMouseMove={(e) => { if(e.buttons===1 && (Math.abs(e.clientX-dragStartPos.x)>5 || Math.abs(e.clientY-dragStartPos.y)>5)) { setIsDragging(true); setMapTransform(p => ({...p, x:p.x+e.movementX, y:p.y+e.movementY})); } }}

             onWheel={handleWheel}>

            <div style={{ transform: `translate(${mapTransform.x}px, ${mapTransform.y}px) scale(${mapTransform.scale})` }} className="absolute origin-top-left transition-transform duration-75">

                <GameMap 

                    provinces={provinces} viewingRelationId={viewingRelationId} playerDaimyoId={playerDaimyoId}

                    alliances={alliances} ceasefires={ceasefires} coalition={coalition}

                    selectedProvinceId={selectedProvinceId} attackSourceId={attackSourceId} transportSourceId={transportSourceId}

                    onSelectProvince={handleMapSelect}

                />

            </div>

        </div>



        {/* コントロール & ポップアップ */}

        <ProvincePopup 

            selectedProvince={selectedProvinceId ? provinces.find(p => p.id === selectedProvinceId) : null}

            daimyoStats={daimyoStats} playerDaimyoId={playerDaimyoId} isPlayerTurn={isPlayerTurn} viewingRelationId={viewingRelationId}

            shogunId={shogunId} alliances={alliances} ceasefires={ceasefires} coalition={coalition}

            onClose={() => setSelectedProvinceId(null)}

            onAction={(type, pid) => {

                if (['develop','cultivate','pacify','fortify','market','trade','donate','titles'].includes(type)) handleDomesticAction(type, pid);

                else if (['attack','transport','recruit','train'].includes(type)) handleMilitaryAction(type, pid);

                else handleDiplomacy(type, provinces.find(p=>p.id===pid).ownerId);

            }}

        />



        <ControlPanel 

            lastLog={lastLog} onHistoryClick={() => setModalState({type:'history'})} 

            onEndTurn={() => { setIsPlayerTurn(false); advanceTurn(); }} 

            onCancelSelection={() => { setAttackSourceId(null); setTransportSourceId(null); }}

            isPlayerTurn={isPlayerTurn} hasSelection={attackSourceId || transportSourceId}

            onViewBack={() => setViewingRelationId(null)} viewingRelationId={viewingRelationId}

            onDaimyoList={() => setModalState({type: 'list'})}

        />



        {/* モーダル表示制御 */}

        {modalState.type === 'history' && <LogHistoryModal logs={logs} onClose={() => setModalState({type: null})} />}

        {modalState.type === 'list' && <DaimyoListModal provinces={provinces} daimyoStats={daimyoStats} alliances={alliances} ceasefires={ceasefires} relations={relations} playerDaimyoId={playerDaimyoId} coalition={coalition} onClose={() => setModalState({type: null})} onViewOnMap={(id) => { setViewingRelationId(id); setModalState({type:null}); }} />}

        {modalState.type === 'battle' && <BattleScene battleData={modalState.data} onFinish={(res) => {

             const { attacker, defender, attackerAmount } = modalState.data;

             const { attackerRemaining, defenderRemaining } = res;



             // 兵力回復計算

             const atkLost = attackerAmount - attackerRemaining;

             const atkRecovered = Math.floor(atkLost * 0.3);

             const atkReturning = attackerRemaining + atkRecovered;



             const defLost = defender.troops - defenderRemaining;

             const defRecovered = Math.floor(defLost * 0.3);

             const defFinal = defenderRemaining + defRecovered;



             setProvinces(prev => prev.map(p => {

                 // 防衛国処理

                 if (p.id === defender.id) {

                     if (defenderRemaining <= 0) {

                         return { ...p, ownerId: attacker.ownerId, troops: attackerRemaining, actionsLeft: 0, loyalty: 30, defense: Math.max(0, p.defense - 20) };

                     } else {

                         return { ...p, troops: defFinal };

                     }

                 }

                 // 攻撃元国処理

                 if (p.id === attacker.id) {

                     if (defenderRemaining <= 0) {

                         // 勝利時：出陣兵は戻らないが、回復分は戻る（あるいは占領地にいくが、ここではシンプルに元に戻す）

                         return { ...p, troops: p.troops + atkRecovered, actionsLeft: 0 };

                     } else {

                         // 敗北/引き分け時：残存兵+回復分が戻る

                         return { ...p, troops: p.troops + atkReturning, actionsLeft: 0 };

                     }

                 }

                 return p;

             }));

             

             if (defenderRemaining <= 0) {

                 showLog(`${DAIMYO_INFO[attacker.ownerId].name}軍が${defender.name}を制圧！`);

             } else if (attackerRemaining <= 0) {

                 showLog(`${DAIMYO_INFO[attacker.ownerId].name}軍、${defender.name}攻略に失敗。`);

             } else {

                 showLog(`${DAIMYO_INFO[attacker.ownerId].name}軍、${defender.name}を攻めきれず撤退（引き分け）。`);

             }

             setModalState({ type: null }); 

        }} />}

        {modalState.type === 'troop' && <TroopSelector maxTroops={modalState.data.maxTroops} type={modalState.data.type} onConfirm={handleTroopAction} onCancel={() => setModalState({type: null})} />}

        

        {modalState.type === 'negotiate' && <NegotiationScene targetDaimyoId={modalState.data.targetId} targetDaimyo={DAIMYO_INFO[modalState.data.targetId]} isAllied={alliances[playerDaimyoId]?.includes(modalState.data.targetId)} onConfirm={(t) => {

            const p = provinces.find(x => x.id === modalState.data.provinceId);

            if (p.actionsLeft <= 0) { showLog("行動力不足"); return; }

            consumeAction(modalState.data.provinceId); // 実行時に消費

            

            if(t==='gift') { updateResource(playerDaimyoId, -COSTS.gift.gold, 0); updateRelation(modalState.data.targetId, 10); showLog("贈答を行いました"); }

            if(t==='ceasefire') { updateResource(playerDaimyoId, -300, 0); setCeasefires(prev => ({...prev, [playerDaimyoId]: {...prev[playerDaimyoId], [modalState.data.targetId]: 5}})); showLog("停戦成立"); }

            if(t==='threaten') { showLog("脅迫しました..."); updateRelation(modalState.data.targetId, -20); }

            if(t==='surrender') { showLog("勧告しました..."); }

            if(t==='request_aid') { showLog("援助を要請しました"); }

            if(t==='break_alliance') { showLog("同盟を破棄しました"); setAlliances(prev => ({...prev, [playerDaimyoId]: prev[playerDaimyoId].filter(id => id !== modalState.data.targetId), [modalState.data.targetId]: prev[modalState.data.targetId].filter(id => id !== playerDaimyoId)})); }

            

            setModalState({type:null});

        }} onCancel={() => setModalState({type: null})} />}

        

        {modalState.type === 'market' && <MarketModal currentGold={daimyoStats[playerDaimyoId].gold} currentRice={daimyoStats[playerDaimyoId].rice} price={getRiceMarketPrice(turn)} onClose={() => setModalState({type:null})} onTrade={(m, a, c) => {

            // 楽市楽座は消費なし

            updateResource(playerDaimyoId, m==='buy'?-c:c, m==='buy'?a:-a); setModalState({type:null}); showLog("取引完了");

        }} />}

        

        {modalState.type === 'titles' && <TitlesModal daimyoStats={daimyoStats} provinces={provinces} daimyoId={playerDaimyoId} onClose={() => setModalState({type:null})} onApply={(t) => {

            const p = provinces.find(x => x.id === modalState.data.pid);

            if (p.actionsLeft <= 0) { showLog("行動力不足"); return; }

            consumeAction(modalState.data.pid); // 申請時に消費

            

            updateResource(playerDaimyoId, -COSTS.title_app.gold, 0, t.fameBonus);

            setDaimyoStats(prev => ({...prev, [playerDaimyoId]: {...prev[playerDaimyoId], titles: [...prev[playerDaimyoId].titles, t.name]}}));

            setModalState({type:null}); showLog("役職就任");

        }} onApplyRank={(r) => {

            const p = provinces.find(x => x.id === modalState.data.pid);

            if (p.actionsLeft <= 0) { showLog("行動力不足"); return; }

            consumeAction(modalState.data.pid); // 申請時に消費



            updateResource(playerDaimyoId, -COSTS.rank_app.gold, 0, r.fameBonus);

            setDaimyoStats(prev => ({...prev, [playerDaimyoId]: {...prev[playerDaimyoId], rank: r.name}}));

            setModalState({type:null}); showLog("官位叙任");

        }} />}

        

        {modalState.type === 'donate' && <DonateModal currentGold={daimyoStats[playerDaimyoId].gold} shogunName={DAIMYO_INFO[shogunId]?.name} isShogun={playerDaimyoId===shogunId} onCancel={() => setModalState({type:null})} onConfirm={(tgt, amt, fame) => {

            const p = provinces.find(x => x.id === modalState.data.pid);

            if (p.actionsLeft <= 0) { showLog("行動力不足"); return; }

            consumeAction(modalState.data.pid); // 実行時に消費



            updateResource(playerDaimyoId, -amt, 0, fame); setModalState({type:null}); showLog("献金完了");

        }} />}

        

        {modalState.type === 'trade' && <TradeModal onCancel={() => setModalState({type:null})} onConfirm={(t) => {

            const p = provinces.find(x => x.id === modalState.data.pid);

            if (p.actionsLeft <= 0) { showLog("行動力不足"); return; }

            consumeAction(modalState.data.pid); // 実行時に消費



            updateResource(playerDaimyoId, -COSTS.trade.gold, 0); setModalState({type:null}); showLog("貿易完了");

        }} />}



        {/* ゲームオーバー画面 */}

        {gameState !== 'playing' && (

            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50">

                <div className="text-center animate-bounce mb-6">

                    {gameState === 'won' ? <><Trophy size={80} className="text-yellow-400 mx-auto mb-4" /><h2 className="text-5xl font-bold text-yellow-400">天下統一！</h2></> : <><Skull size={80} className="text-gray-500 mx-auto mb-4" /><h2 className="text-5xl font-bold text-gray-400">落城...</h2></>}

                </div>

                <button onClick={() => window.location.reload()} className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-xl flex items-center gap-3"><RefreshCw size={24} /> 再挑戦</button>

            </div>

        )}



        <style>{`.cmd-btn { @apply flex items-center justify-center gap-1 py-2 px-1 rounded border shadow-sm transition-all active:translate-y-0.5 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed; } .animate-fade-in { animation: fadeIn 0.3s ease-out; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>

    </div>

  );

};



export default App;
