// src/hooks/useAiSystem.js
import { DAIMYO_INFO } from '../data/daimyos';
import { COSTS } from '../data/constants';
import { getRiceMarketPrice } from '../utils/helpers';

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

            const currentStats = daimyoStatsRef.current;
            const currentAlliances = alliancesRef.current;
            const currentCeasefires = ceasefiresRef.current;

            let { gold, rice, fame } = currentStats[aiId] || { gold: 0, rice: 0, fame: 0 };
            const originalGold = gold;
            const originalRice = rice;
            const originalFame = fame;

            const daimyoInfo = DAIMYO_INFO[aiId] || { strategy: 'balanced', targetProvince: null, homeProvinceId: null, name: aiId };
            const strategy = daimyoInfo.strategy || 'balanced';

            const targetProvinceId = currentStats[aiId]?.targetOverride || daimyoInfo.targetProvince;

            const homeProvinceId = daimyoInfo.homeProvinceId;

            const params = {
                aggressive: { attackChance: 0.9, recruitThreshold: 400, goldReserve: 50, riceReserve: 50, sendRatio: 0.8, winThreshold: 1.1 },
                balanced: { attackChance: 0.6, recruitThreshold: 500, goldReserve: 200, riceReserve: 200, sendRatio: 0.6, winThreshold: 1.3 },
                defensive: { attackChance: 0.3, recruitThreshold: 700, goldReserve: 500, riceReserve: 500, sendRatio: 0.4, winThreshold: 1.5 },
                ainu: { attackChance: 0.1, recruitThreshold: 800, goldReserve: 1000, riceReserve: 1000, sendRatio: 0.3, winThreshold: 2.0 }
            };
            const prm = params[strategy] || params.balanced;

            const marketPrice = getRiceMarketPrice(turn);
            if (gold > prm.goldReserve * 1.5 && rice < prm.riceReserve) {
                const buyAmount = 200;
                const cost = Math.floor(buyAmount * marketPrice * 1.2);
                if (gold > cost + prm.goldReserve) { gold -= cost; rice += buyAmount; }
            }
            else if (rice > prm.riceReserve * 1.5 && gold < prm.goldReserve) {
                const sellAmount = 200;
                const gain = Math.floor(sellAmount * marketPrice * 0.8);
                rice -= sellAmount; gold += gain;
            }

            const myProvinces = next.filter(p => p.ownerId === aiId);
            if (myProvinces.length === 0) return next;

            const hasTarget = targetProvinceId && myProvinces.some(p => p.id === targetProvinceId);
            const targetProvData = targetProvinceId ? next.find(p => p.id === targetProvinceId) : null;

            const homeProvData = homeProvinceId ? next.find(p => p.id === homeProvinceId) : null;
            const isHomeLost = homeProvData && homeProvData.ownerId !== aiId;

            myProvinces.forEach(p => {
                while (p.actionsLeft > 0) {
                    const isMyHome = homeProvinceId && p.id === homeProvinceId;
                    const localRecruitThreshold = isMyHome ? prm.recruitThreshold * 1.5 : prm.recruitThreshold;
                    const localDefenseThreshold = isMyHome ? 80 : 60;

                    const neighbors = p.neighbors.map(nid => next.find(x => x.id === nid)).filter(n => n);

                    const enemies = neighbors.filter(n => {
                        if (n.ownerId === aiId) return false;
                        if (currentAlliances[aiId]?.includes(n.ownerId)) return false;
                        if (currentCeasefires[aiId]?.[n.ownerId]) return false;

                        // ★歴史的停戦 (Turn 3-9)
                        if (turn >= 3 && turn < 9) {
                            if ((aiId === 'Oda' && n.ownerId === 'Tokugawa') || (aiId === 'Tokugawa' && n.ownerId === 'Oda')) {
                                return false;
                            }
                        }

                        return true;
                    });

                    const isFrontline = enemies.length > 0;

                    const currentLoyalty = p.loyalty || 50;
                    const currentTraining = p.training || 50;

                    if (!isFrontline && p.troops > 300 && gold >= COSTS.move.gold && rice >= COSTS.move.rice) {
                        const allyNeighbors = neighbors.filter(n => n.ownerId === aiId);
                        let dest = null;
                        if (allyNeighbors.length > 0) {
                            const frontlineAlly = allyNeighbors.find(an => {
                                const anNeighbors = an.neighbors.map(nid => next.find(x => x.id === nid));
                                return anNeighbors.some(ann =>
                                    ann.ownerId !== aiId &&
                                    !currentAlliances[aiId]?.includes(ann.ownerId)
                                );
                            });
                            if (frontlineAlly) dest = frontlineAlly;
                            else if (targetProvData) {
                                dest = allyNeighbors.sort((a, b) => {
                                    const dA = Math.sqrt((a.cx - targetProvData.cx) ** 2 + (a.cy - targetProvData.cy) ** 2);
                                    const dB = Math.sqrt((b.cx - targetProvData.cx) ** 2 + (b.cy - targetProvData.cy) ** 2);
                                    return dA - dB;
                                })[0];
                            } else dest = allyNeighbors[Math.floor(Math.random() * allyNeighbors.length)];
                        }
                        if (dest) {
                            const amount = p.troops - 100;
                            p.troops -= amount;
                            dest.troops += amount;
                            dest.troops += amount;
                            gold -= COSTS.move.gold;
                            rice -= COSTS.move.rice;
                            p.actionsLeft--;
                            continue;
                        }
                    }

                    if (currentLoyalty < 50 && gold >= COSTS.pacify.gold && rice >= COSTS.pacify.rice) {
                        gold -= COSTS.pacify.gold; rice -= COSTS.pacify.rice;
                        p.loyalty = Math.min(100, currentLoyalty + COSTS.pacify.boost);
                        p.actionsLeft--; continue;
                    }
                    if (isFrontline && p.defense < localDefenseThreshold && gold >= COSTS.fortify.gold) {
                        gold -= COSTS.fortify.gold; p.defense += COSTS.fortify.boost;
                        p.actionsLeft--; continue;
                    }
                    if (currentTraining < 70 && gold >= COSTS.train.gold * 2) {
                        gold -= COSTS.train.gold; p.training = Math.min(100, currentTraining + COSTS.train.boost);
                        p.actionsLeft--; continue;
                    }

                    const attackTroops = Math.floor(p.troops * prm.sendRatio);
                    let target = null;
                    let canAttack = true;

                    if (attackTroops > 100 && rice >= COSTS.attack.rice + prm.riceReserve) {
                        if (isHomeLost) {
                            const homeTarget = enemies.find(e => e.id === homeProvinceId);
                            if (homeTarget && homeTarget.troops < attackTroops * 1.2) target = homeTarget;
                        }
                        if (!target) {
                            if (targetProvinceId && !hasTarget && targetProvData) {
                                const directTarget = enemies.find(e => e.id === targetProvinceId);
                                if (directTarget && directTarget.troops < attackTroops * prm.winThreshold) target = directTarget;
                                else {
                                    let bestDist = Infinity;
                                    enemies.forEach(e => {
                                        const dist = Math.sqrt(Math.pow(e.cx - targetProvData.cx, 2) + Math.pow(e.cy - targetProvData.cy, 2));
                                        if (dist < bestDist && e.troops < attackTroops * prm.winThreshold) { bestDist = dist; target = e; }
                                    });
                                }
                            }
                            if (!target) {
                                const potentialTargets = enemies.filter(e => e.troops < attackTroops * prm.winThreshold);
                                if (potentialTargets.length > 0) target = potentialTargets.sort((a, b) => a.troops - b.troops)[0];
                            }
                        }
                    }

                    const isEmergency = isFrontline && p.troops < 300;
                    if (isEmergency && gold >= COSTS.recruit.gold && rice >= COSTS.recruit.rice) {
                        gold -= COSTS.recruit.gold; rice -= COSTS.recruit.rice;
                        p.troops += COSTS.recruit.troops;
                        p.loyalty = Math.max(0, (p.loyalty || 50) - 5);
                        p.actionsLeft--; continue;
                    }

                    if (aiId === 'Ainu' && target) {
                        const rel = relations[aiId]?.[target.ownerId] ?? 50;
                        if (rel > 20) canAttack = false;
                    }

                    const isReconquest = target && target.id === homeProvinceId;
                    const finalAttackChance = isReconquest ? 1.0 : prm.attackChance;

                    if (target && canAttack && Math.random() < finalAttackChance) {
                        rice -= COSTS.attack.rice;
                        p.actionsLeft--;

                        if (target.ownerId === playerDaimyoId) {
                            attacksToPlayer.push({
                                attacker: { ...p }, defender: { ...target },
                                attackerAmount: attackTroops, attackerId: aiId, defenderId: target.ownerId
                            });
                            p.troops -= attackTroops;
                        } else {
                            let atk = attackTroops; p.troops -= atk; let def = target.troops;
                            for (let r = 0; r < 10; r++) { if (atk <= 0 || def <= 0) break; atk -= Math.floor(def * 0.1); def -= Math.floor(atk * 0.15); }
                            if (def <= 0) {
                                const oldOwner = target.ownerId;
                                target.ownerId = aiId; target.troops = Math.max(1, atk); target.actionsLeft = 0;
                                const daimyoName = DAIMYO_INFO[aiId]?.name || aiId;
                                showLog(`${daimyoName}が${target.name}を制圧！`);
                                fame += 5;
                                setTimeout(() => updateResource(oldOwner, 0, 0, -5), 0);
                                p.actionsLeft = 0; continue;
                            } else {
                                target.troops = def; p.troops += Math.floor(atk * 0.5);
                                if (atk <= 0) { fame -= 5; setTimeout(() => updateResource(target.ownerId, 0, 0, 5), 0); }
                                else { fame -= 5; setTimeout(() => updateResource(target.ownerId, 0, 0, 5), 0); }
                            }
                        }
                        continue;
                    }

                    if (isFrontline && p.troops < localRecruitThreshold && gold >= COSTS.recruit.gold + prm.goldReserve && rice >= COSTS.recruit.rice + prm.riceReserve) {
                        gold -= COSTS.recruit.gold; rice -= COSTS.recruit.rice;
                        p.troops += COSTS.recruit.troops;
                        p.loyalty = Math.max(0, (p.loyalty || 50) - 5);
                        p.actionsLeft--;
                    } else if (gold >= COSTS.develop.gold + prm.goldReserve) {
                        if (Math.random() > 0.5) { gold -= COSTS.develop.gold; p.commerce += COSTS.develop.boost; }
                        else if (gold >= COSTS.cultivate.gold && rice >= COSTS.cultivate.rice + prm.riceReserve) { gold -= COSTS.cultivate.gold; rice -= COSTS.cultivate.rice; p.agriculture += COSTS.cultivate.boost; }
                        p.actionsLeft--;
                    } else if (gold > 5000) {
                        const donateAmount = 500; gold -= donateAmount; fame += Math.floor(donateAmount / 100); p.actionsLeft--;
                    } else {
                        p.actionsLeft = 0;
                    }
                }
            });

            setTimeout(() => updateResource(aiId, gold - originalGold, rice - originalRice, fame - originalFame), 0);
            return next;
        });

        if (attacksToPlayer.length > 0) {
            setPendingBattles(prev => [...prev, ...attacksToPlayer]);
        }

        if (!isPaused) setTimeout(advanceTurn, aiSpeed);
    };

    return { processAiTurn };
};
