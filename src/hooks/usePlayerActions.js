// src/hooks/usePlayerActions.js
import { DAIMYO_INFO } from '../data/daimyos';
import { COSTS } from '../data/constants';
import { getSeason, getTroopCapacity, getActionCost } from '../utils/helpers';

export const usePlayerActions = ({
    provinces,
    setProvinces,
    daimyoStats,
    setDaimyoStats,
    alliances,
    setAlliances,
    relations,
    playerDaimyoId,
    turn,
    updateResource,
    showLog,
    setModalState,
    setAttackSourceId,
    setTransportSourceId,
    selectedProvinceId,
    modalState,
    setPendingBattles,
    setRelations
}) => {

    const calculateDynamicCost = (province, baseCost, actionType) => {
        // 固定のインフレコストは廃止し、季節補正のみ計算
        const seasonWeightedCost = getActionCost(actionType, baseCost, turn, playerDaimyoId);
        return {
            ...seasonWeightedCost,
            gold: seasonWeightedCost.gold,
            baseActionCost: seasonWeightedCost.action 
        };
    };

    const handleDomesticAction = (type, pid) => {
        const p = provinces.find(pr => pr.id === pid);
        if (!p) return;
        if (p.actionsLeft < 1 && COSTS[type] && COSTS[type].action > 0) {
            showLog("行動力が不足しています。");
            return;
        }

        // 投資系コマンドはモーダルを開く
        if (type === 'develop' || type === 'cultivate') {
            // ★変更点: 1回あたりの投資上限を設定（例: 100）
            // これにより、資金が大量にあっても少しずつしか開発できなくなります
            const INVEST_CAP = 100; 
            
            setModalState({ 
                type: 'investment', 
                data: { 
                    type, 
                    pid, 
                    maxGold: Math.min(p.gold, INVEST_CAP), 
                    maxRice: Math.min(p.rice, INVEST_CAP) 
                } 
            });
            return;
        }

        const realCost = calculateDynamicCost(p, COSTS[type], type);
        
        if (p.gold < realCost.gold || p.rice < realCost.rice) {
            showLog(`資金または兵糧が不足しています (必要: 金${realCost.gold}/米${realCost.rice})`);
            return;
        }

        setProvinces(prev => prev.map(pr => {
            if (pr.id === pid) {
                let updates = { 
                    ...pr, 
                    actionsLeft: pr.actionsLeft - (COSTS[type].action || 0),
                    gold: pr.gold - realCost.gold,
                    rice: pr.rice - realCost.rice
                };

                if (type === 'pacify') updates.loyalty = Math.min(100, pr.loyalty + COSTS.pacify.boost);
                if (type === 'fortify') updates.defense = Math.min(200, pr.defense + COSTS.fortify.boost);
                if (type === 'market') {
                    // 簡易実行（本来はMarketModal推奨だが、ここではアクションとして処理）
                    if (updates.rice >= 100) {
                         updates.rice -= 100;
                         updates.gold += 80;
                         showLog("市場で兵糧を売却しました。");
                    } else {
                        showLog("売るための兵糧が足りません。");
                        return pr;
                    }
                } else if (type === 'trade') {
                    if (updates.gold >= 100) {
                        updates.gold -= 100;
                        updates.rice += 80;
                        showLog("商人から兵糧を購入しました。");
                    } else {
                        showLog("購入資金が足りません。");
                        return pr;
                    }
                }
                return updates;
            }
            return pr;
        }));
        
        if (type !== 'market' && type !== 'trade') {
            showLog(`${DAIMYO_INFO[playerDaimyoId].name}: 内政(${type})を実行。金${realCost.gold}消費。`);
        }
    };

    const handleInvestment = (goldAmount, riceAmount) => {
        const { type, pid } = modalState.data;
        const p = provinces.find(pr => pr.id === pid);

        if (!p || p.actionsLeft < 1) {
            showLog("行動力が不足しています。");
            setModalState({ type: null });
            return;
        }

        const totalInvest = goldAmount + riceAmount;
        const boost = Math.floor(totalInvest / 10);

        if (boost <= 0) {
            showLog("投資額が少なすぎます。効果がありません。");
            setModalState({ type: null });
            return;
        }

        setProvinces(prev => prev.map(pr => {
            if (pr.id === pid) {
                let updates = {
                    ...pr,
                    gold: pr.gold - goldAmount,
                    rice: pr.rice - riceAmount,
                    actionsLeft: pr.actionsLeft - 1
                };

                if (type === 'develop') {
                    updates.commerceDev = Math.min(100, (pr.commerceDev || 0) + boost);
                } else if (type === 'cultivate') {
                    updates.agriDev = Math.min(100, (pr.agriDev || 0) + boost);
                }
                return updates;
            }
            return pr;
        }));

        showLog(`${DAIMYO_INFO[playerDaimyoId].name}: ${type==='develop'?'商業':'農業'}に投資(金${goldAmount}/米${riceAmount})。効果+${boost}`);
        setModalState({ type: null });
    };

    const handleMilitaryAction = (type, pid) => {
        const p = provinces.find(pr => pr.id === pid);
        if (!p) return;
        if (p.actionsLeft < 1) {
            showLog("行動力が不足しています。");
            return;
        }

        const daimyo = DAIMYO_INFO[playerDaimyoId];
        const system = daimyo?.militarySystem || 'standard';
        const season = getSeason(turn);
        const isBusySeason = season === 'summer' || season === 'autumn';

        const realCost = calculateDynamicCost(p, COSTS[type] || { gold: 0, rice: 0, action: 1 }, type);

        if (type === 'forced_recruit') {
            setProvinces(prev => prev.map(pr => {
                if (pr.id === pid) {
                    return {
                        ...pr,
                        troops: pr.troops + 400,
                        loyalty: Math.max(0, pr.loyalty - 20),
                        agriDev: Math.max(0, (pr.agriDev || 0) - 15),
                        actionsLeft: pr.actionsLeft - 1
                    };
                }
                return pr;
            }));
            showLog("【強制徴兵】領民を無理やり連行しました。民忠と農業が激減しました！");
            return;
        }

        if (p.gold < realCost.gold || p.rice < realCost.rice) {
            showLog(`軍資金または兵糧が不足しています。`);
            return;
        }

        if (type === 'recruit') {
            const capacity = getTroopCapacity(p);
            if (p.troops >= capacity) {
                showLog(`これ以上徴兵できません(軍役上限:${capacity})。`);
                return;
            }

            let agriPenalty = 5;
            if (system === 'separated') agriPenalty = 0; 
            if (system === 'ichiryo') agriPenalty = 2;

            setProvinces(prev => prev.map(pr => {
                if (pr.id === pid) {
                    return {
                        ...pr,
                        gold: pr.gold - realCost.gold,
                        rice: pr.rice - realCost.rice,
                        troops: pr.troops + COSTS.recruit.troops,
                        agriDev: Math.max(0, (pr.agriDev || 0) - agriPenalty),
                        actionsLeft: pr.actionsLeft - 1
                    };
                }
                return pr;
            }));
            showLog(`徴兵を実行。兵数+${COSTS.recruit.troops}`);
            return;
        }

        if (type === 'attack' || type === 'move') {
            if (system === 'ichiryo' && isBusySeason) {
                const confirmMsg = "【警告】一領具足：農繁期に軍を動かすと、領内の農業が荒廃します。実行しますか？";
                if (!window.confirm(confirmMsg)) return;
            }

            if (type === 'attack') setAttackSourceId(pid);
            else setTransportSourceId(pid);
            
            showLog(type === 'attack' ? "攻撃目標を選択してください。" : "移動先を選択してください。");
            return;
        }

        if (type === 'train') {
            setProvinces(prev => prev.map(pr => {
                if (pr.id === pid) {
                    return { 
                        ...pr, 
                        gold: pr.gold - realCost.gold, 
                        rice: pr.rice - realCost.rice, 
                        training: Math.min(100, pr.training + 5), 
                        actionsLeft: pr.actionsLeft - 1 
                    };
                }
                return pr;
            }));
            showLog("訓練を行いました。");
        }
    };

    const handleTroopAction = (input, ceasefires) => {
        let amount = 0;
        let goldAmount = 0;
        let riceAmount = 0;

        if (typeof input === 'object') {
            amount = input.troops || 0;
            goldAmount = input.gold || 0;
            riceAmount = input.rice || 0;
        } else {
            amount = input;
        }

        const { type, sourceId, targetId } = modalState.data;
        const src = provinces.find(p => p.id === sourceId);
        const tgt = provinces.find(p => p.id === targetId);
        
        const carryRice = Math.floor(amount * 0.5); 
        const baseActionCost = COSTS[type];
        const realCost = calculateDynamicCost(src, baseActionCost, type);
        
        const totalRiceNeeded = realCost.rice + carryRice + riceAmount;
        const totalGoldNeeded = realCost.gold + goldAmount;

        if (src.gold < totalGoldNeeded || src.rice < totalRiceNeeded) {
            showLog(`軍資金または兵糧が不足しています。`);
            setModalState({ type: null });
            return;
        }

        if (type === 'attack') {
            const isAllied = alliances[playerDaimyoId]?.includes(tgt.ownerId);
            const isCeasefire = (ceasefires || {})[playerDaimyoId]?.[tgt.ownerId] > 0;
            
            if (isAllied || isCeasefire) {
                setModalState({ 
                    type: 'betrayal_warning', 
                    data: { 
                        targetDaimyoId: tgt.ownerId, 
                        sourceId: sourceId, 
                        targetProvinceId: targetId,
                        amount: amount,
                        isCeasefire: isCeasefire 
                    } 
                });
                return;
            }
        }

        const daimyo = DAIMYO_INFO[playerDaimyoId];
        const system = daimyo?.militarySystem || 'standard';
        const season = getSeason(turn);
        const isBusySeason = season === 'summer' || season === 'autumn';
        let agriDamage = 0;

        if (system === 'ichiryo' && isBusySeason) {
            agriDamage = Math.floor((src.agriDev || 0) * 0.3);
            showLog("農繁期の動員により農業生産力が激減しました！");
        }

        setProvinces(prev => prev.map(p => {
            if (p.id === sourceId) {
                return {
                    ...p,
                    gold: p.gold - totalGoldNeeded,
                    rice: p.rice - totalRiceNeeded,
                    troops: p.troops - amount,
                    agriDev: Math.max(0, (p.agriDev || 0) - agriDamage),
                    actionsLeft: p.actionsLeft - 1
                };
            }
            if (type === 'transport' && p.id === targetId) {
                return { 
                    ...p, 
                    troops: p.troops + amount,
                    gold: p.gold + goldAmount,
                    rice: p.rice + riceAmount
                };
            }
            return p;
        }));

        setModalState({ type: null });
        setAttackSourceId(null);
        setTransportSourceId(null);

        if (type === 'attack') {
             setPendingBattles(prev => [...prev, {
                attacker: { ...src, troops: amount }, 
                defender: tgt,
                attackerAmount: amount,
                attackerId: src.ownerId,
                defenderId: tgt.ownerId
            }]);
        } else {
            showLog(`輸送を実行しました。`);
        }
    };

    const handleDiplomacy = (type, targetId) => {
       showLog("外交はマップメニューから相手勢力を選択して行ってください。");
    };
    
    const executeBetrayal = (targetDaimyoId, sourceId, targetProvinceId, amount, isCeasefireBroken) => {
        setAlliances(prev => {
            const next = { ...prev };
            if (next[playerDaimyoId]) next[playerDaimyoId] = next[playerDaimyoId].filter(id => id !== targetDaimyoId);
            if (next[targetDaimyoId]) next[targetDaimyoId] = next[targetDaimyoId].filter(id => id !== playerDaimyoId);
            return next;
        });

        setDaimyoStats(prev => ({
            ...prev,
            [playerDaimyoId]: {
                ...prev[playerDaimyoId],
                fame: Math.max(0, (prev[playerDaimyoId].fame || 0) - 100),
                diplomacyPenalty: 20, 
                ceasefirePenalty: isCeasefireBroken ? 40 : prev[playerDaimyoId].ceasefirePenalty
            }
        }));

        setRelations(prev => {
            const next = { ...prev };
            const myRels = { ...(next[playerDaimyoId] || {}) };
            if (targetDaimyoId) myRels[targetDaimyoId] = 0;
            next[playerDaimyoId] = myRels;
            return next;
        });

        setProvinces(prev => prev.map(p => {
            if (p.ownerId === playerDaimyoId) {
                return { ...p, loyalty: Math.max(0, p.loyalty - 10) };
            }
            return p;
        }));
        
        showLog("【信義喪失】同盟/停戦を破棄して攻撃しました！");
        setModalState({ type: null });

        const src = provinces.find(p => p.id === sourceId);
        const tgt = provinces.find(p => p.id === targetProvinceId);
        const carryRice = Math.floor(amount * 0.5); 
        const realCost = calculateDynamicCost(src, COSTS.attack, 'attack');
        const totalRiceNeeded = realCost.rice + carryRice;

        setProvinces(prev => prev.map(p => {
            if (p.id === sourceId) {
                return {
                    ...p,
                    gold: p.gold - realCost.gold,
                    rice: p.rice - totalRiceNeeded,
                    troops: p.troops - amount,
                    actionsLeft: p.actionsLeft - 1
                };
            }
            return p;
        }));

        setPendingBattles(prev => [...prev, {
            attacker: { ...src, troops: amount }, 
            defender: tgt,
            attackerAmount: amount,
            attackerId: src.ownerId,
            defenderId: tgt.ownerId
        }]);
    };

    return { 
        handleDomesticAction, 
        handleMilitaryAction, 
        handleDiplomacy, 
        handleTroopAction,
        handleInvestment, 
        executeBetrayal
    };
};