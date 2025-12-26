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
    setPendingBattles // ★追加: 戦闘発生のために必要
}) => {

    const checkAndConsumeCost = (province, baseCost, actionType) => {
        const realCost = getActionCost(actionType, baseCost, turn, playerDaimyoId);
        if (province.gold < realCost.gold || province.rice < realCost.rice) {
            showLog(`資金または兵糧が不足しています (必要: 金${realCost.gold}/米${realCost.rice})`);
            return null;
        }
        return {
            gold: province.gold - realCost.gold,
            rice: province.rice - realCost.rice,
            actionCost: realCost.action
        };
    };

    const handleDomesticAction = (type, pid) => {
        const p = provinces.find(pr => pr.id === pid);
        if (p.actionsLeft < 1 && COSTS[type].action > 0) {
            showLog("行動力が不足しています。");
            return;
        }

        const costResult = checkAndConsumeCost(p, COSTS[type], type);
        if (!costResult && COSTS[type].action > 0) return; 

        setProvinces(prev => prev.map(pr => {
            if (pr.id === pid) {
                let updates = { 
                    ...pr, 
                    actionsLeft: pr.actionsLeft - (COSTS[type].action || 0),
                    gold: costResult ? costResult.gold : pr.gold,
                    rice: costResult ? costResult.rice : pr.rice
                };

                if (type === 'develop') updates.commerce += COSTS.develop.boost;
                if (type === 'cultivate') updates.agriculture += COSTS.cultivate.boost;
                if (type === 'pacify') updates.loyalty = Math.min(100, pr.loyalty + COSTS.pacify.boost);
                if (type === 'fortify') updates.defense = Math.min(100, pr.defense + COSTS.fortify.boost);
                if (type === 'market') {
                    if (updates.rice >= 100) {
                         updates.rice -= 100;
                         updates.gold += 80;
                         showLog("市場で兵糧を売却しました。");
                    } else {
                        showLog("売るための兵糧が足りません。");
                        return pr;
                    }
                }
                return updates;
            }
            return pr;
        }));
        
        if (type !== 'market') showLog(`${DAIMYO_INFO[playerDaimyoId].name}: 内政(${type})を実行しました。`);
    };

    const handleMilitaryAction = (type, pid) => {
        const p = provinces.find(pr => pr.id === pid);
        if (p.actionsLeft < 1) {
            showLog("行動力が不足しています。");
            return;
        }

        const daimyo = DAIMYO_INFO[playerDaimyoId];
        const system = daimyo?.militarySystem || 'standard';
        const season = getSeason(turn);
        const isBusySeason = season === 'summer' || season === 'autumn';

        // --- 強制徴兵 ---
        if (type === 'forced_recruit') {
            setProvinces(prev => prev.map(pr => {
                if (pr.id === pid) {
                    return {
                        ...pr,
                        troops: pr.troops + 400,
                        loyalty: Math.max(0, pr.loyalty - 20),
                        agriculture: Math.max(0, pr.agriculture - 15),
                        actionsLeft: pr.actionsLeft - 1
                    };
                }
                return pr;
            }));
            showLog("【強制徴兵】領民を無理やり連行しました。民忠と農業が激減しました！");
            return;
        }

        // --- 通常徴兵 ---
        if (type === 'recruit') {
            const capacity = getTroopCapacity(p);
            if (p.troops >= capacity) {
                showLog(`これ以上徴兵できません(軍役上限:${capacity})。内政を行ってください。`);
                return;
            }

            const costResult = checkAndConsumeCost(p, COSTS.recruit, type);
            if (!costResult) return;

            let agriPenalty = 5;
            if (system === 'separated') agriPenalty = 0; 
            if (system === 'ichiryo') agriPenalty = 2;

            setProvinces(prev => prev.map(pr => {
                if (pr.id === pid) {
                    return {
                        ...pr,
                        gold: costResult.gold,
                        rice: costResult.rice,
                        troops: pr.troops + COSTS.recruit.troops,
                        agriculture: Math.max(0, pr.agriculture - agriPenalty),
                        actionsLeft: pr.actionsLeft - 1
                    };
                }
                return pr;
            }));
            showLog(`徴兵を実行。兵数+${COSTS.recruit.troops} (農業-${agriPenalty})`);
            return;
        }

        // --- 移動・攻撃 (兵糧携行チェック) ---
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

        // 訓練
        if (type === 'train') {
            const costResult = checkAndConsumeCost(p, COSTS.train, type);
            if (!costResult) return;
            setProvinces(prev => prev.map(pr => {
                if (pr.id === pid) {
                    return { ...pr, gold: costResult.gold, rice: costResult.rice, training: Math.min(100, pr.training + 5), actionsLeft: pr.actionsLeft - 1 };
                }
                return pr;
            }));
            showLog("訓練を行いました。");
        }
    };

    const handleTroopAction = (amount) => {
        const { type, sourceId, targetId } = modalState.data;
        const src = provinces.find(p => p.id === sourceId);
        
        // 兵糧携行ロジック
        const carryRice = Math.floor(amount * 0.5); 
        const baseActionCost = COSTS[type];
        const realCost = getActionCost(type, baseActionCost, turn, playerDaimyoId);
        const totalRiceNeeded = realCost.rice + carryRice;

        if (src.gold < realCost.gold || src.rice < totalRiceNeeded) {
            showLog(`軍資金または兵糧が不足しています (必要: 金${realCost.gold}/米${totalRiceNeeded} 内携行${carryRice})`);
            setModalState({ type: null });
            return;
        }

        // 一領具足ペナルティ
        const daimyo = DAIMYO_INFO[playerDaimyoId];
        const system = daimyo?.militarySystem || 'standard';
        const season = getSeason(turn);
        const isBusySeason = season === 'summer' || season === 'autumn';
        let agriDamage = 0;

        if (system === 'ichiryo' && isBusySeason) {
            agriDamage = Math.floor(src.agriculture * 0.3);
            showLog("農繁期の動員により農業生産力が激減しました！");
        }

        setProvinces(prev => prev.map(p => {
            if (p.id === sourceId) {
                return {
                    ...p,
                    gold: p.gold - realCost.gold,
                    rice: p.rice - totalRiceNeeded,
                    troops: p.troops - amount,
                    agriculture: Math.max(0, p.agriculture - agriDamage),
                    actionsLeft: p.actionsLeft - 1
                };
            }
            if (type === 'transport' && p.id === targetId) {
                return { ...p, troops: p.troops + amount };
            }
            return p;
        }));

        setModalState({ type: null });
        setAttackSourceId(null);
        setTransportSourceId(null);

        if (type === 'attack') {
            const defender = provinces.find(p => p.id === targetId);
             setPendingBattles(prev => [...prev, {
                attacker: { ...src, troops: amount }, 
                defender: defender,
                attackerAmount: amount,
                attackerId: src.ownerId,
                defenderId: defender.ownerId
            }]);
        } else {
            showLog(`${amount}の兵を輸送しました。(携行兵糧:${carryRice})`);
        }
    };

    const handleDiplomacy = (type, targetId) => {
       showLog("外交機能は拠点リソース化に伴い調整中です。");
    };
    
    const executeBetrayal = (targetDaimyoId, sourceId) => {
        setAlliances(prev => {
            const next = { ...prev };
            if (next[playerDaimyoId]) next[playerDaimyoId] = next[playerDaimyoId].filter(id => id !== targetDaimyoId);
            if (next[targetDaimyoId]) next[targetDaimyoId] = next[targetDaimyoId].filter(id => id !== playerDaimyoId);
            return next;
        });
        updateResource(playerDaimyoId, 0, 0, -50); 
        setAttackSourceId(sourceId);
        showLog("同盟を破棄しました！名声が低下しました。");
        setModalState({ type: null });
    };

    return { 
        handleDomesticAction, 
        handleMilitaryAction, 
        handleDiplomacy, 
        handleTroopAction,
        executeBetrayal
    };
};