// src/hooks/useGameLoop.js
import { useState, useEffect } from 'react';
import { DAIMYO_INFO } from '../data/daimyos';
import { getFormattedDate, getSeason } from '../utils/helpers';

// ★修正: startYear と scenarioEvents を受け取る
export const useGameLoop = ({
    provincesRef,
    daimyoStatsRef,
    setDaimyoStats,
    setProvinces,
    setCeasefires,
    coalition,
    setCoalition,
    playerDaimyoId,
    updateResource,
    setModalState,
    aiSpeed,
    isPaused,
    setSelectedProvinceId,
    setAttackSourceId,
    setTransportSourceId,
    setLogs,
    setLastLog,
    startYear = 1560,
    scenarioEvents = [] 
}) => {
    const [turn, setTurn] = useState(1);
    const [gameState, setGameState] = useState('playing');
    const [turnOrder, setTurnOrder] = useState([]);
    const [currentTurnIndex, setCurrentTurnIndex] = useState(-1);
    const [isPlayerTurn, setIsPlayerTurn] = useState(false);

    const showLog = (text) => {
        setLastLog(text);
        setLogs(prev => {
            // ★修正: startYearを使って日付整形
            const newLogs = [...prev, `${getFormattedDate(turn, startYear)}: ${text}`];
            if (newLogs.length > 100) return newLogs.slice(newLogs.length - 100);
            return newLogs;
        });
    };

    const advanceTurn = () => {
        setSelectedProvinceId(null);
        setAttackSourceId(null);
        setTransportSourceId(null);
        setCurrentTurnIndex(prev => prev + 1);
    };

    const checkElimination = () => {
        setDaimyoStats(prev => {
            let hasChange = false;
            const next = { ...prev };
            Object.keys(next).forEach(id => {
                if (id === 'Minor') return;
                const hasLand = provincesRef.current.some(p => p.ownerId === id);
                if (!hasLand && next[id].isAlive !== false) {
                    next[id] = { ...next[id], isAlive: false };
                    hasChange = true;
                }
            });
            return hasChange ? next : prev;
        });
    };

    const determineTurnOrder = () => {
        const active = Object.keys(DAIMYO_INFO).filter(id => {
            if (id === 'Minor') return false;
            const stats = daimyoStatsRef.current[id];
            return stats?.isAlive !== false;
        });
        active.sort((a, b) => (daimyoStatsRef.current[b]?.fame || 0) - (daimyoStatsRef.current[a]?.fame || 0));
        setTurnOrder(active);
        setCurrentTurnIndex(0);
    };

    const startNewSeason = () => {
        checkElimination();

        const season = getSeason(turn);
        const isAutumn = season === 'autumn';
        
        setCeasefires(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(k => Object.keys(next[k]).forEach(t => { if (next[k][t] > 0) next[k][t]--; }));
            return next;
        });

        if (coalition) {
            if (coalition.duration <= 1) {
                setCoalition(null);
                showLog("包囲網が解散しました。");
            } else {
                setCoalition(prev => ({ ...prev, duration: prev.duration - 1 }));
            }
        }

        // --- ペナルティ期間の更新 ---
        setDaimyoStats(prev => {
            const next = { ...prev };
            let changed = false;
            Object.keys(next).forEach(id => {
                const stats = next[id];
                if (stats.diplomacyPenalty > 0) {
                    stats.diplomacyPenalty--;
                    changed = true;
                    if (stats.diplomacyPenalty === 0 && id === playerDaimyoId) {
                        showLog("外交への信頼が多少回復しました。");
                    }
                }
                if (stats.ceasefirePenalty > 0) {
                    stats.ceasefirePenalty--;
                    changed = true;
                }
                if (stats.confusionTurns > 0) {
                    stats.confusionTurns--;
                    changed = true;
                    if (stats.confusionTurns === 0 && id === playerDaimyoId) {
                        showLog("家の混乱が収まり、軍事行動が可能になりました。");
                    }
                }
            });
            return changed ? next : prev;
        });

        // --- 収入・維持費計算 ---
        setProvinces(curr => curr.map(p => {
            const daimyoId = p.ownerId;
            const daimyo = DAIMYO_INFO[daimyoId];
            const system = daimyo?.militarySystem || 'standard';

            const pop = p.population || 10000;
            const urb = p.urbanization || 0.1;
            const commDev = p.commerceDev || 10;
            const agriDev = p.agriDev || 20;
            const baseAgri = p.baseAgri || 1.0;

            const urbanPop = pop * urb;
            const ruralPop = pop * (1 - urb);

            let currentCommDev = commDev;
            let currentAgriDev = agriDev;

            if (p.battleDamage) {
                const { commerce: commDmgRate, agriculture: agriDmgRate, seasonCheck } = p.battleDamage;
                currentCommDev = Math.max(0, Math.floor(currentCommDev * commDmgRate));
                
                if (isAutumn && (seasonCheck === 1 || seasonCheck === 2)) {
                    const damage = Math.floor(currentAgriDev * (1 - agriDmgRate));
                    currentAgriDev = Math.max(0, currentAgriDev - damage);
                    if (damage > 0 && daimyoId === playerDaimyoId) {
                        showLog(`${p.name}: 戦火により農地が荒廃しました。`);
                    }
                }
            }

            const TAX_RATE = 0.015;
            const commIncome = Math.floor(urbanPop * (currentCommDev / 100) * TAX_RATE);

            const HARVEST_RATE = 0.02;
            const agIncome = isAutumn ? Math.floor(ruralPop * (currentAgriDev / 100) * baseAgri * HARVEST_RATE) : 0;

            let goldMaint = 0;
            let riceMaint = 0;
            
            if (system === 'separated') {
                goldMaint = Math.floor(p.troops * 0.1);
                riceMaint = Math.floor(p.troops * 0.1);
            } else if (system === 'ichiryo') {
                goldMaint = 0;
                riceMaint = Math.floor(p.troops * 0.02);
            } else {
                goldMaint = 0;
                riceMaint = Math.floor(p.troops * 0.1);
            }

            let newGold = (p.gold || 0) + commIncome - goldMaint;
            let newRice = (p.rice || 0) + agIncome - riceMaint;
            let newTroops = p.troops;

            if (newRice < 0) {
                const deserters = Math.min(newTroops, Math.abs(newRice) * 2);
                newTroops -= deserters;
                newRice = 0;
                if (deserters > 0 && daimyoId === playerDaimyoId) {
                    showLog(`${p.name}: 兵糧不足により${deserters}の兵が逃亡！`);
                }
            }
            
            if (newGold < 0) {
                newGold = 0;
            }

            return { 
                ...p, 
                gold: newGold,
                rice: newRice,
                troops: newTroops,
                commerceDev: currentCommDev,
                agriDev: currentAgriDev,
                actionsLeft: 3,
                battleDamage: null 
            };
        }));

        if (!isPaused) setTimeout(determineTurnOrder, aiSpeed);
    };

    useEffect(() => {
        checkElimination();
        if (!playerDaimyoId || playerDaimyoId === 'SPECTATOR') return;
        const stats = daimyoStatsRef.current;
        const playerStats = stats[playerDaimyoId];
        const playerCount = provincesRef.current.filter(p => p.ownerId === playerDaimyoId).length;
        if (playerCount === provincesRef.current.length) {
            setGameState('won');
        } else if ((playerStats && playerStats.isAlive === false) || (playerCount === 0 && turn > 0)) {
            setGameState('lost');
        }
    }, [provincesRef.current, daimyoStatsRef.current, playerDaimyoId]);

    useEffect(() => {
        if (playerDaimyoId && turnOrder.length === 0) startNewSeason();
    }, [playerDaimyoId]);

    useEffect(() => {
        if (turn > 1) {
            showLog(`${getFormattedDate(turn, startYear)}になりました。`);
            // ★修正: scenarioEvents からイベントを検索
            const occurredEvent = scenarioEvents.find(e => e.trigger(turn, provincesRef.current, daimyoStatsRef.current));
            if (occurredEvent) {
                setModalState({ type: 'historical_event', data: occurredEvent });
            } else {
                startNewSeason();
            }
        }
    }, [turn]);

    return {
        turn,
        setTurn,
        gameState,
        turnOrder,
        currentTurnIndex,
        isPlayerTurn,
        setIsPlayerTurn,
        advanceTurn,
        startNewSeason,
        showLog
    };
};