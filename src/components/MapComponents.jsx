// src/components/MapComponents.jsx
import React from 'react';
import { Shield, Sword, Users, X, Info, Hammer, Coins, Wheat } from 'lucide-react'; // アイコン追加
import { DAIMYO_INFO } from '../data/daimyos';

export const GameMap = ({ 
    provinces, viewingRelationId, playerDaimyoId, alliances, ceasefires, coalition,
    selectedProvinceId, attackSourceId, transportSourceId, onSelectProvince, isEditMode, onProvinceDragStart,
    iconSize = 40 // デフォルト値
}) => {
    if (!provinces) return <div className="text-white">Loading Map...</div>;

    const getRelationColor = (pid) => {
        const prov = provinces.find(p => p.id === pid);
        if (!prov) return 'fill-stone-700';
        
        const owner = prov.ownerId;
        const info = DAIMYO_INFO[owner];
        
        // 勢力関係表示モード
        if (viewingRelationId) {
            if (owner === viewingRelationId) return 'fill-blue-600';
            // 同盟・停戦・戦争判定など（簡易実装）
            // const rel = relations[viewingRelationId]?.[owner] || 50; ...
            // ここではシンプルに大名カラーを薄く表示するか、グレーにする
            if (!info) return 'fill-stone-700';
            // 簡易的に元の色を返す（本来は関係度で色分け）
        }

        if (!info) return 'fill-stone-700';
        // Tailwindのクラス名から色コードへの変換は複雑なので、
        // ここではCSSクラスをそのまま返す設計にする必要があるが、
        // SVGのfill属性にはクラスが効かない場合があるため、styleで指定するか、
        // 事前に定義されたカラーマップを使うのが一般的。
        // 今回は既存実装に合わせてclassNameで色を指定する方針と推測されるが、
        // もしfill属性が必要なら以下のようなマッピングが必要。
        const colorMap = {
            'bg-purple-700': '#7e22ce', 'bg-red-700': '#b91c1c', 'bg-blue-700': '#1d4ed8',
            'bg-green-700': '#15803d', 'bg-yellow-600': '#ca8a04', 'bg-orange-700': '#c2410c',
            'bg-cyan-700': '#0e7490', 'bg-indigo-700': '#4338ca', 'bg-pink-700': '#be185d',
            'bg-stone-500': '#78716c', 'bg-teal-700': '#0f766e', 'bg-lime-700': '#4d7c0f'
        };
        return colorMap[info.color] || '#44403c';
    };

    return (
        <svg className="w-full h-full overflow-visible">
            <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>
            
            {/* 経路の線 (SEA_ROUTESなどがあればここに描画) */}
            
            {/* プロヴィンス（拠点）の描画 */}
            {provinces.map(p => {
                const isSelected = p.id === selectedProvinceId;
                const isAttackSource = p.id === attackSourceId;
                const isTransportSource = p.id === transportSourceId;
                const isTargetable = attackSourceId && p.neighbors.includes(attackSourceId) && p.ownerId !== provinces.find(pr=>pr.id===attackSourceId).ownerId;
                const isTransportTarget = transportSourceId && p.neighbors.includes(transportSourceId) && p.ownerId === provinces.find(pr=>pr.id===transportSourceId).ownerId;
                
                const ownerInfo = DAIMYO_INFO[p.ownerId];
                const baseColor = ownerInfo ? (
                    {'bg-purple-700':'#9333ea','bg-red-700':'#dc2626','bg-blue-700':'#2563eb','bg-green-700':'#16a34a','bg-yellow-600':'#eab308','bg-orange-700':'#ea580c','bg-cyan-700':'#0891b2','bg-indigo-700':'#4f46e5','bg-pink-700':'#db2777','bg-stone-500':'#78716c','bg-teal-700':'#0d9488','bg-lime-700':'#65a30d'}[ownerInfo.color] || '#57534e'
                ) : '#44403c';

                return (
                    <g 
                        key={p.id} 
                        transform={`translate(${p.cx}, ${p.cy})`}
                        onClick={() => onSelectProvince(p.id, isTargetable, isTransportTarget)}
                        className={`${isTargetable || isTransportTarget ? 'cursor-pointer' : 'cursor-default'} transition-all duration-200`}
                        onMouseDown={(e) => {
                            if (isEditMode) {
                                e.stopPropagation();
                                onProvinceDragStart(p.id);
                            }
                        }}
                    >
                        {/* 選択時のハイライト円 */}
                        {isSelected && <circle r={iconSize * 0.8} fill="none" stroke="white" strokeWidth="2" className="animate-ping opacity-75" />}
                        {(isAttackSource || isTransportSource) && <circle r={iconSize * 0.8} fill="none" stroke="yellow" strokeWidth="3" strokeDasharray="4 2" className="animate-spin-slow" />}
                        
                        {/* メインの円（拠点） */}
                        <circle 
                            r={iconSize / 2} 
                            fill={baseColor} 
                            stroke={isSelected ? "white" : "black"} 
                            strokeWidth={isSelected ? 3 : 1}
                            className={`transition-all duration-300 ${isTargetable ? 'animate-pulse stroke-red-500 stroke-2' : ''}`}
                            style={{ filter: isSelected ? 'url(#glow)' : 'none' }}
                        />
                        
                        {/* 家紋や文字の表示（簡易） */}
                        <text 
                            y={iconSize * 0.8} 
                            textAnchor="middle" 
                            fill="white" 
                            className="text-xs font-bold pointer-events-none drop-shadow-md select-none"
                            style={{ fontSize: iconSize * 0.4 }}
                        >
                            {p.name}
                        </text>
                        
                        {/* 兵数バー */}
                        <rect x={-iconSize/2} y={-iconSize * 0.8} width={iconSize} height={4} fill="#333" rx="1" />
                        <rect x={-iconSize/2} y={-iconSize * 0.8} width={Math.min(iconSize, iconSize * (p.troops / 5000))} height={4} fill={p.troops < 1000 ? "#ef4444" : "#22c55e"} rx="1" />
                    </g>
                );
            })}
        </svg>
    );
};

export const ProvincePopup = ({ 
    selectedProvince, daimyoStats, playerDaimyoId, isPlayerTurn, viewingRelationId,
    shogunId, alliances, ceasefires, coalition, onClose, onAction, isEditMode
}) => {
    if (!selectedProvince) return null;

    const ownerStats = daimyoStats[selectedProvince.ownerId];
    const isOwner = selectedProvince.ownerId === playerDaimyoId;
    
    // 内政コマンドの共通ボタンコンポーネント
    const ActionButton = ({ type, label, icon: Icon, color, disabled, cost }) => (
        <button 
            onClick={() => onAction(type, selectedProvince.id)}
            disabled={disabled}
            className={`
                flex flex-col items-center justify-center p-3 rounded-lg border transition-all
                ${disabled 
                    ? 'bg-stone-800 border-stone-700 text-stone-600 cursor-not-allowed' 
                    : `${color} text-white hover:scale-105 hover:shadow-lg active:scale-95`
                }
            `}
        >
            <Icon size={20} className="mb-1"/>
            <span className="text-xs font-bold">{label}</span>
            {cost && <span className="text-[10px] opacity-80 mt-1">金{cost.gold}</span>}
        </button>
    );

    return (
        <div className="absolute top-20 right-6 w-80 bg-stone-900/95 text-stone-100 border-2 border-stone-600 rounded-xl shadow-2xl p-4 backdrop-blur-md animate-slide-in z-30 max-h-[80vh] overflow-y-auto custom-scrollbar">
            {/* ヘッダー */}
            <div className="flex justify-between items-start mb-4 border-b border-stone-700 pb-2">
                <div>
                    <h2 className="text-xl font-bold font-serif flex items-center gap-2">
                        {selectedProvince.name}
                        {isEditMode && <span className="text-xs bg-yellow-600 px-1 rounded">編</span>}
                    </h2>
                    <div className="text-sm text-stone-400 flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${DAIMYO_INFO[selectedProvince.ownerId]?.color}`}></span>
                        {DAIMYO_INFO[selectedProvince.ownerId]?.name}家 支配
                    </div>
                </div>
                <button onClick={onClose} className="text-stone-400 hover:text-white bg-stone-800 rounded-full p-1"><X size={16}/></button>
            </div>

            {/* 基本情報 */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="bg-stone-800 p-2 rounded border border-stone-700">
                    <div className="text-stone-400 text-xs mb-1 flex items-center gap-1"><Users size={12}/> 兵力</div>
                    <div className="font-mono font-bold text-lg">{selectedProvince.troops}</div>
                </div>
                <div className="bg-stone-800 p-2 rounded border border-stone-700">
                    <div className="text-stone-400 text-xs mb-1 flex items-center gap-1"><Shield size={12}/> 防御度</div>
                    <div className="font-mono font-bold text-lg">{selectedProvince.defense}</div>
                </div>
                <div className="bg-stone-800 p-2 rounded border border-stone-700">
                    <div className="text-stone-400 text-xs mb-1">商業</div>
                    <div className="font-mono font-bold text-blue-300">{selectedProvince.commerceDev}</div>
                </div>
                <div className="bg-stone-800 p-2 rounded border border-stone-700">
                    <div className="text-stone-400 text-xs mb-1">農業</div>
                    <div className="font-mono font-bold text-green-300">{selectedProvince.agriDev}</div>
                </div>
                {/* ★追加: 資金と兵糧の表示 */}
                <div className="bg-stone-800 p-2 rounded border border-stone-700">
                    <div className="text-stone-400 text-xs mb-1 flex items-center gap-1"><Coins size={12}/> 拠点資金</div>
                    <div className="font-mono font-bold text-yellow-400">{selectedProvince.gold}</div>
                </div>
                <div className="bg-stone-800 p-2 rounded border border-stone-700">
                    <div className="text-stone-400 text-xs mb-1 flex items-center gap-1"><Wheat size={12}/> 拠点兵糧</div>
                    <div className="font-mono font-bold text-green-400">{selectedProvince.rice}</div>
                </div>
            </div>

            {/* コマンドメニュー (プレイヤー所有かつ自手番のみ) */}
            {isOwner && isPlayerTurn && !isEditMode && (
                <div className="space-y-3">
                    <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">軍事</div>
                    <div className="grid grid-cols-3 gap-2">
                        <ActionButton type="move" label="移動/輸送" icon={Users} color="bg-blue-800 border-blue-600" />
                        <ActionButton type="attack" label="出陣" icon={Sword} color="bg-red-800 border-red-600" />
                        <ActionButton type="recruit" label="徴兵" icon={Users} color="bg-stone-700 border-stone-600" cost={{gold:50}} />
                    </div>
                    
                    <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mt-2">内政</div>
                    <div className="grid grid-cols-3 gap-2">
                        <ActionButton type="develop" label="商業投資" icon={Coins} color="bg-indigo-800 border-indigo-600" />
                        <ActionButton type="cultivate" label="農業投資" icon={Wheat} color="bg-green-800 border-green-600" />
                        <ActionButton type="fortify" label="普請" icon={Hammer} color="bg-orange-800 border-orange-600" cost={{gold:100}} />
                    </div>
                </div>
            )}
            
            {/* 編集モード時のデバッグ/操作パネル */}
            {isEditMode && (
                <div className="mt-4 p-2 bg-stone-800 rounded border border-yellow-700">
                    <div className="text-yellow-500 text-xs font-bold mb-2">編集モード</div>
                    <label className="block text-xs mb-1">所有者変更</label>
                    <select 
                        value={selectedProvince.ownerId} 
                        onChange={(e) => onAction('change_owner', selectedProvince.id, e.target.value)}
                        className="w-full bg-stone-900 border border-stone-600 rounded p-1 text-xs mb-2"
                    >
                        {Object.keys(DAIMYO_INFO).map(id => (
                            <option key={id} value={id}>{DAIMYO_INFO[id].name}</option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
};