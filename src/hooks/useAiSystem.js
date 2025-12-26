// src/hooks/useAiSystem.js
import { DAIMYO_INFO } from '../data/daimyos';
import { COSTS } from '../data/constants';
import { getActionCost } from '../utils/helpers';

export const useAiSystem = ({
    provincesRef,
    daimyoStatsRef,
    alliancesRef,
    ceasefiresRef,
    relations,
    setProvinces,
    updateResource,
    setPendingBattles,
    showLog,
    advanceTurn,
    playerDaimyoId,
    turn,
    isPaused,
    aiSpeed
}) => {

    const processAiTurn = (aiId) => {
        if (isPaused) return;

        let attacksToPlayer = [];

        setProvinces(curr => {
            const next = curr.map(p => ({ ...p }));
            const currentAlliances = alliancesRef.current;
            const currentCeasefires = ceasefiresRef.current;
            const daimyoInfo = DAIMYO_INFO[aiId] || { strategy: 'balanced', targetProvince: null, homeProvinceId: null, name: aiId };
            const strategy = daimyoInfo.strategy || 'balanced';

            const homeProvinceId = daimyoInfo.homeProvinceId;
            const homeProvData = homeProvinceId ? next.find(p => p.id === homeProvinceId) : null;
            const isHomeLost = homeProvData && homeProvData.ownerId !== aiId;

            // 戦略パラメータ
            const params = {
                aggressive: { attackChance: 0.9, recruitThreshold: 400, goldReserve: 50, riceReserve: 50, sendRatio: 0.8 },
                balanced: { attackChance: 0.6, recruitThreshold: 500, goldReserve: 150, riceReserve: 150, sendRatio: 0.6 },
                defensive: { attackChance: 0.3, recruitThreshold: 700, goldReserve: 300, riceReserve: 300, sendRatio: 0.4 },
                ainu: { attackChance: 0.1, recruitThreshold: 800, goldReserve: 500, riceReserve: 500, sendRatio: 0.3 }
            };
            const prm = params[strategy] || params.balanced;

            // AIの各拠点で行動決定
            const myProvinces = next.filter(p => p.ownerId === aiId);
            if (myProvinces.length === 0) return next;

            myProvinces.forEach(p => {
                while (p.actionsLeft > 0) {
                    // ★コスト取得 (季節・制度補正済み)
                    const getCost = (type) => getActionCost(type, COSTS[type], turn, aiId);

                    const neighbors = p.neighbors.map(nid => next.find(x => x.id === nid)).filter(n => n);
                    const enemies = neighbors.filter(n => {
                        if (n.ownerId === aiId) return false;
                        if (currentAlliances[aiId]?.includes(n.ownerId)) return false;
                        if (currentCeasefires[aiId]?.[n.ownerId]) return false;
                        return true;
                    });

                    const isFrontline = enemies.length > 0;
                    
                    // --- 攻撃判定 ---
                    const attackCost = getCost('attack');
                    const attackTroops = Math.floor(p.troops * prm.sendRatio);
                    const carryRice = Math.floor(attackTroops * 0.5);
                    const totalAttackRice = attackCost.rice + carryRice;

                    let target = null;
                    if (isFrontline && p.troops > 300 && p.rice >= totalAttackRice && p.gold >= attackCost.gold) {
                        // ターゲット選定（簡易版: 一番弱い敵）
                        const potentialTargets = enemies.filter(e => e.troops < attackTroops);
                        if (potentialTargets.length > 0) {
                            target = potentialTargets.sort((a, b) => a.troops - b.troops)[0];
                        }
                    }

                    // アイヌの特殊条件
                    if (aiId === 'Ainu' && target) {
                        const rel = relations[aiId]?.[target.ownerId] ?? 50;
                        if (rel > 20) target = null;
                    }

                    if (target && Math.random() < prm.attackChance) {
                        p.gold -= attackCost.gold;
                        p.rice -= totalAttackRice;
                        p.actionsLeft--;

                        if (target.ownerId === playerDaimyoId) {
                            attacksToPlayer.push({
                                attacker: { ...p }, defender: { ...target },
                                attackerAmount: attackTroops, attackerId: aiId, defenderId: target.ownerId
                            });
                            p.troops -= attackTroops;
                        } else {
                            // AI同士の戦闘（簡易解決）
                            let atk = attackTroops;
                            let def = target.troops;
                            p.troops -= atk; 

                            // 損耗計算
                            while(atk > 0 && def > 0) {
                                atk -= Math.floor(def * 0.1);
                                def -= Math.floor(atk * 0.15);
                            }

                            if (def <= 0) {
                                // 勝利
                                const oldOwner = target.ownerId;
                                target.ownerId = aiId; 
                                target.troops = Math.max(1, atk); 
                                target.actionsLeft = 0;
                                target.gold = Math.floor(target.gold * 0.5); // 略奪
                                target.rice = Math.floor(target.rice * 0.5);
                                
                                const daimyoName = DAIMYO_INFO[aiId]?.name || aiId;
                                showLog(`${daimyoName}が${target.name}を制圧！`);
                                updateResource(aiId, 0, 0, 5); // 名声アップ
                                setTimeout(() => updateResource(oldOwner, 0, 0, -5), 0);
                            } else {
                                // 敗北・撤退
                                target.troops = def;
                                p.troops += Math.max(0, Math.floor(atk * 0.5)); // 生還
                            }
                        }
                        continue;
                    }

                    // --- 内政・徴兵 ---
                    const recruitCost = getCost('recruit');
                    const devCost = getCost('develop');
                    
                    // 徴兵
                    if (isFrontline && p.troops < prm.recruitThreshold && p.gold >= recruitCost.gold && p.rice >= recruitCost.rice) {
                        p.gold -= recruitCost.gold; 
                        p.rice -= recruitCost.rice;
                        p.troops += COSTS.recruit.troops;
                        p.actionsLeft--;
                        continue;
                    }

                    // 商業開発
                    if (p.gold >= devCost.gold + prm.goldReserve) {
                        p.gold -= devCost.gold;
                        p.commerce += COSTS.develop.boost;
                        p.actionsLeft--;
                        continue;
                    }

                    // 何もしない
                    p.actionsLeft = 0;
                }
            });

            return next;
        });

        if (attacksToPlayer.length > 0) {
            setPendingBattles(prev => [...prev, ...attacksToPlayer]);
        }

        if (!isPaused) setTimeout(advanceTurn, aiSpeed);
    };

    return { processAiTurn };
};