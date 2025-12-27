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

            const daimyoStats = daimyoStatsRef.current[aiId];
            const isConfused = daimyoStats && daimyoStats.confusionTurns > 0;

            // 戦略パラメータ
            const params = {
                aggressive: { attackChance: 0.9, recruitThreshold: 400, goldReserve: 50, riceReserve: 50, sendRatio: 0.8 },
                balanced: { attackChance: 0.6, recruitThreshold: 500, goldReserve: 150, riceReserve: 150, sendRatio: 0.6 },
                defensive: { attackChance: 0.3, recruitThreshold: 700, goldReserve: 300, riceReserve: 300, sendRatio: 0.4 },
                ainu: { attackChance: 0.1, recruitThreshold: 800, goldReserve: 500, riceReserve: 500, sendRatio: 0.3 }
            };
            const prm = params[strategy] || params.balanced;

            const myProvinces = next.filter(p => p.ownerId === aiId);
            if (myProvinces.length === 0) return next;

            myProvinces.forEach(p => {
                while (p.actionsLeft > 0) {
                    const getCost = (type) => getActionCost(type, COSTS[type], turn, aiId);

                    // ★追加: 資金・兵糧のやりくりロジック
                    
                    // A. 資金調達 (市場: 米を売る)
                    // 攻撃(約20金)や徴兵(約30金)に必要な最低限の金(50)がない場合、兵糧を売って金を確保する
                    // 市場コマンド(COSTS.market)は action:0 なので行動力を消費せず実行
                    if (p.gold < 50 && p.rice >= 200) {
                        p.rice -= 100; // 米100を消費
                        p.gold += 80;  // 金80を獲得
                        // 行動力を消費しないため、continueせずにそのまま次の判定へ進む（このターンで即座に行動可能）
                    }

                    // B. 兵糧調達 (交易: 米を買う)
                    // 攻撃(約80米)に必要な兵糧がないが、金には余裕がある場合
                    // 交易コマンド(COSTS.trade)は action:1 なので行動力を消費する
                    if (p.rice < 100 && p.gold >= 300) {
                        p.gold -= 100;
                        p.rice += 80;
                        p.actionsLeft--; // 行動力を消費
                        continue; // 次の行動へ
                    }

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
                    if (!isConfused && isFrontline && p.troops > 300 && p.rice >= totalAttackRice && p.gold >= attackCost.gold) {
                        const potentialTargets = enemies.filter(e => e.troops < attackTroops);
                        if (potentialTargets.length > 0) {
                            target = potentialTargets.sort((a, b) => a.troops - b.troops)[0];
                        }
                    }

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
                            let atk = attackTroops;
                            let def = target.troops;
                            p.troops -= atk; 

                            while(atk > 0 && def > 0) {
                                atk -= Math.floor(def * 0.1);
                                def -= Math.floor(atk * 0.15);
                            }

                            if (def <= 0) {
                                const oldOwner = target.ownerId;
                                target.ownerId = aiId; 
                                target.troops = Math.max(1, atk); 
                                target.actionsLeft = 0;
                                target.gold = Math.floor(target.gold * 0.5);
                                target.rice = Math.floor(target.rice * 0.5);
                                
                                const daimyoName = DAIMYO_INFO[aiId]?.name || aiId;
                                showLog(`${daimyoName}が${target.name}を制圧！`);
                                updateResource(aiId, 0, 0, 5);
                                setTimeout(() => updateResource(oldOwner, 0, 0, -5), 0);
                            } else {
                                target.troops = def;
                                p.troops += Math.max(0, Math.floor(atk * 0.5));
                            }
                        }
                        continue;
                    }

                    // --- 内政・徴兵・資金活用 ---
                    const recruitCost = getCost('recruit');
                    
                    // 1. 徴兵 (最優先)
                    if (isFrontline && p.troops < prm.recruitThreshold && p.gold >= recruitCost.gold && p.rice >= recruitCost.rice) {
                        p.gold -= recruitCost.gold; 
                        p.rice -= recruitCost.rice;
                        p.troops += COSTS.recruit.troops;
                        p.actionsLeft--;
                        continue;
                    }

                    // AIによる動的投資（確率と上限で抑制）
                    const surplusGold = Math.max(0, p.gold - prm.goldReserve);
                    const MAX_AI_INVEST = 50; 

                    // 2. 商業開発 (確率 30% で実行)
                    if ((p.commerceDev || 0) < 100 && surplusGold > 50 && Math.random() < 0.3) {
                        let investAmount = Math.floor(surplusGold * 0.2);
                        investAmount = Math.min(investAmount, MAX_AI_INVEST);

                        const boost = Math.floor(investAmount / 10);
                        if (boost > 0) {
                            p.gold -= investAmount;
                            p.commerceDev = Math.min(100, (p.commerceDev || 0) + boost);
                            p.actionsLeft--;
                            continue;
                        }
                    }

                    // 3. 農業開発 (確率 30% で実行)
                    if ((p.agriDev || 0) < 100 && surplusGold > 50 && Math.random() < 0.3) {
                        let investAmount = Math.floor(surplusGold * 0.2);
                        investAmount = Math.min(investAmount, MAX_AI_INVEST);

                        const boost = Math.floor(investAmount / 10);
                        if (boost > 0) {
                            p.gold -= investAmount;
                            p.agriDev = Math.min(100, (p.agriDev || 0) + boost);
                            p.actionsLeft--;
                            continue;
                        }
                    }

                    // 4. 防御強化など (確率 20% で実行)
                    if (p.gold > 1000 && Math.random() < 0.2) {
                        p.gold -= 100;
                        p.rice += 80;
                        if (p.defense < 150) {
                            p.gold -= 50; 
                            p.defense += 5;
                        }
                        p.actionsLeft--;
                        continue;
                    }

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