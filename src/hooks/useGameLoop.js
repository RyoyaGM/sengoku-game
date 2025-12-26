// src/hooks/useGameLoop.js
import { useState, useEffect } from 'react';
import { DAIMYO_INFO } from '../data/daimyos';
import { HISTORICAL_EVENTS } from '../data/events';
import { getFormattedDate, getSeason } from '../utils/helpers';

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
    setLastLog
}) => {
    const [turn, setTurn] = useState(1);
    const [gameState, setGameState] = useState('playing');
    const [turnOrder, setTurnOrder] = useState([]);
    const [currentTurnIndex, setCurrentTurnIndex] = useState(-1);
    const [isPlayerTurn, setIsPlayerTurn] = useState(false);

    const showLog = (text) => {
        setLastLog(text);
        setLogs(prev => {
            const newLogs = [...prev, `${getFormattedDate(turn)}: ${text}`];
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
                // 外交全般禁止カウント
                if (stats.diplomacyPenalty > 0) {
                    stats.diplomacyPenalty--;
                    changed = true;
                    if (stats.diplomacyPenalty === 0 && id === playerDaimyoId) {
                        showLog("外交への信頼が多少回復しました。交渉が可能になります。");
                    }
                }
                // 停戦交渉禁止カウント
                if (stats.ceasefirePenalty > 0) {
                    stats.ceasefirePenalty--;
                    changed = true;
                }
                // ★追加: 混乱（攻撃禁止）カウント
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

        // --- 収入・維持費計算 (拠点独立採算) ---
        setProvinces(curr => curr.map(p => {
            const daimyoId = p.ownerId;
            const daimyo = DAIMYO_INFO[daimyoId];
            const system = daimyo?.militarySystem || 'standard';

            let comm = p.commerce;
            let agri = isAutumn ? p.agriculture : 0;

            // 戦闘ダメージ適用
            if (p.battleDamage) {
                const { commerce: commRate, agriculture: agriRate, seasonCheck, tactic } = p.battleDamage;
                const commDmg = Math.floor(comm * commRate);
                comm -= commDmg;
                if (isAutumn) {
                     // 夏(1)または秋(2)に攻められた場合
                    if (seasonCheck === 1 || seasonCheck === 2) {
                        const agriDmg = Math.floor(agri * agriRate);
                        agri -= agriDmg;
                        if (daimyoId === playerDaimyoId && agriDmg > 0) {
                            showLog(`${p.name}: 戦火により兵糧収入減`);
                        }
                    }
                }
            }

            const commIncome = Math.floor(comm * 1.2);
            const agIncome = Math.floor(agri * 2.0);

            // ★維持費計算 (軍事制度による分岐)
            let goldMaint = 0;
            let riceMaint = 0;
            
            if (system === 'separated') {
                // 兵農分離: 金がかかる
                goldMaint = Math.floor(p.troops * 0.5);
                riceMaint = Math.floor(p.troops * 0.05);
            } else if (system === 'ichiryo') {
                // 一領具足: ほぼタダ
                goldMaint = 0;
                riceMaint = Math.floor(p.troops * 0.02);
            } else {
                // 標準
                goldMaint = 0;
                riceMaint = Math.floor(p.troops * 0.1);
            }

            let newGold = (p.gold || 0) + commIncome - goldMaint;
            let newRice = (p.rice || 0) + agIncome - riceMaint;
            let newTroops = p.troops;

            // 兵糧不足処理
            if (newRice < 0) {
                const deserters = Math.min(newTroops, Math.abs(newRice) * 2);
                newTroops -= deserters;
                newRice = 0;
                if (deserters > 0 && daimyoId === playerDaimyoId) {
                    showLog(`${p.name}: 兵糧不足により${deserters}の兵が逃亡！`);
                }
            }
            
            // 資金不足処理
            if (newGold < 0) {
                newGold = 0;
            }

            return { 
                ...p, 
                gold: newGold,
                rice: newRice,
                troops: newTroops,
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
            showLog(`${getFormattedDate(turn)}になりました。`);
            const occurredEvent = HISTORICAL_EVENTS.find(e => e.trigger(turn, provincesRef.current, daimyoStatsRef.current));
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