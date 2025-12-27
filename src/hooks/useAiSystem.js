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

                    // A. 資金調達 (市場: 米を売る)
                    if (p.gold < 50 && p.rice >= 200) {
                        p.rice -= 100;
                        p.gold += 80;
                    }

                    // B. 兵糧調達 (交易: 米を買う)
                    if (p.rice < 100 && p.gold >= 300) {
                        p.gold -= 100;
                        p.rice += 80;
                        p.actionsLeft--; 
                        continue; 
                    }

                    const neighbors = p.neighbors.map(nid => next.find(x => x.id === nid)).filter(n => n);
                    const enemies = neighbors.filter(n => {
                        if (n.ownerId === aiId) return false;
                        if (currentAlliances[aiId]?.includes(n.ownerId)) return false;
                        if (currentCeasefires[aiId]?.[n.ownerId]) return false;
                        return true;
                    });

                    const isFrontline = enemies.length > 0;

                    // ==========================================================================================
                    // 【修正点1】 輸送ロジックの改善 (前線でも余裕があれば輸送可能に)
                    // ==========================================================================================
                    
                    // 維持すべき兵数(keepTroops)を計算
                    let keepTroops = 500; // 後方(安全地帯)のデフォルト

                    if (isFrontline) {
                        // 隣接する敵の中で、最も兵数が多い国を探す
                        const maxEnemyTroops = Math.max(...enemies.map(e => e.troops), 0);
                        // 最大兵数の7割をキープ (ただし、敵が弱すぎる場合でも事故防止のため最低1500は確保)
                        keepTroops = Math.max(1500, Math.floor(maxEnemyTroops * 0.7));
                    }

                    if (!isConfused && p.troops > keepTroops) {
                        const transportCost = getCost('move');
                        
                        if (transportCost && p.gold >= transportCost.gold && p.rice >= transportCost.rice) {
                            const allyNeighbors = neighbors.filter(n => n.ownerId === aiId);
                            
                            if (allyNeighbors.length > 0) {
                                // 輸送先候補の評価
                                const targetCandidates = allyNeighbors.map(targetProv => {
                                    const targetNeighbors = targetProv.neighbors
                                        .map(nid => next.find(x => x.id === nid))
                                        .filter(n => n);
                                    
                                    const isTargetFrontline = targetNeighbors.some(tn => {
                                        if (tn.ownerId === aiId) return false;
                                        if (currentAlliances[aiId]?.includes(tn.ownerId)) return false;
                                        if (currentCeasefires[aiId]?.[tn.ownerId]) return false;
                                        return true; 
                                    });

                                    return {
                                        ...targetProv,
                                        isFrontline: isTargetFrontline,
                                        // 前線なら高スコア、さらに兵が少ないほど優先
                                        score: (isTargetFrontline ? 10000 : 0) - targetProv.troops 
                                    };
                                });

                                // スコアが高い順（前線 ＞ 安全地帯）にソート
                                targetCandidates.sort((a, b) => b.score - a.score);
                                const bestTarget = targetCandidates[0];
                                const target = allyNeighbors.find(t => t.id === bestTarget.id);

                                // 輸送実行判定: ターゲットが前線、またはターゲットの兵が極端に少ない場合
                                if (bestTarget.isFrontline || bestTarget.troops < 500) {
                                    const surplusTroops = p.troops - keepTroops;
                                    const sendTroops = Math.floor(surplusTroops * 0.5);
                                    const carryRice = Math.floor(sendTroops * 0.5); 
                                    const totalRice = transportCost.rice + carryRice;

                                    if (sendTroops > 100 && p.rice >= totalRice) {
                                        p.gold -= transportCost.gold;
                                        p.rice -= totalRice;
                                        p.troops -= sendTroops;
                                        p.actionsLeft--;

                                        target.troops += sendTroops;
                                        target.rice += carryRice;
                                        
                                        continue;
                                    }
                                }
                            }
                        }
                    }
                    
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
                            // 対プレイヤー戦は保留リストに追加（BattleSystemで処理）
                            attacksToPlayer.push({
                                attacker: { ...p }, defender: { ...target },
                                attackerAmount: attackTroops, attackerId: aiId, defenderId: target.ownerId
                            });
                            p.troops -= attackTroops;
                        } else {
                            // ==========================================================================================
                            // 【修正点2】 対AI戦闘計算 (防御側有利に修正)
                            // ==========================================================================================
                            
                            let atk = attackTroops;
                            let def = target.troops;
                            p.troops -= atk; 

                            // 防御側の「地形・城郭ボーナス」 (defense 100につき20%)
                            const defenseBonus = (target.defense || 0) / 500;

                            // 籠城するかどうかの判定 (劣勢、または堅城なら籠城)
                            const isSiege = (def < atk) || (target.defense >= 80);

                            // ダメージ係数の設定
                            // 防御側被害: 籠城なら大きく軽減、そうでなくても基本は攻撃側より低く
                            let defDamageRate = isSiege ? Math.max(0.01, 0.05 - defenseBonus) : 0.08;
                            
                            // 攻撃側被害: 籠城相手だと反撃ダメージ大
                            let atkDamageRate = isSiege ? 0.10 + (defenseBonus * 1.5) : 0.10;

                            while(atk > 0 && def > 0) {
                                // ランダム要素（0.8 ~ 1.2倍）
                                const atkLoss = Math.floor(def * atkDamageRate * (0.8 + Math.random() * 0.4));
                                const defLoss = Math.floor(atk * defDamageRate * (0.8 + Math.random() * 0.4));
                            
                                atk -= atkLoss;
                                def -= defLoss;
                                
                                if (atkLoss <= 0 && defLoss <= 0) break;
                            }

                            if (def <= 0) {
                                // 制圧成功
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
                                // 防衛成功
                                target.troops = def;
                                p.troops += Math.max(0, Math.floor(atk * 0.5)); // 敗残兵の一部帰還
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

                    const surplusGold = Math.max(0, p.gold - prm.goldReserve);
                    const MAX_AI_INVEST = 50; 

                    // 2. 商業開発
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

                    // 3. 農業開発
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

                    // 4. 防御強化
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