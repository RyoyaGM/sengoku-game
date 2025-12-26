// src/hooks/useGameLoop.js
import { useState, useEffect } from 'react';
import { DAIMYO_INFO } from '../data/daimyos';
import { HISTORICAL_EVENTS } from '../data/events';
import { getFormattedDate } from '../utils/helpers';

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

        const seasonIndex = (turn - 1) % 4; // 0:春, 1:夏, 2:秋, 3:冬
        const isAutumn = seasonIndex === 2;
        
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

        // --- ダメージリセット用のマップ作成準備 ---
        // 収入計算後に battleDamage をクリアするため、ここでは計算ロジック内で参照する
        
        setProvinces(curr => {
            // アクション回復 & ダメージリセット（収入計算前にダメージ情報は取得したいので、ここではリセット予約）
            // 実際は updateResource で計算するので、ここでは actionsLeft の回復とダメージ情報の消去を行う
            // ただし、updateResourceは非同期ではないが、setProvinces内で行うのは不適切。
            // 先に計算してから setProvinces で消去する流れにする。
            
            // ここでは一旦そのまま返す(actionsLeftのみ更新)、計算は下で行う
            return curr.map(p => ({ ...p, actionsLeft: 3 }));
        });

        // --- 収入計算 & ダメージ適用 ---
        Object.keys(DAIMYO_INFO).forEach(id => {
            const stats = daimyoStatsRef.current[id];
            if (stats && stats.isAlive === false) return;

            const owned = provincesRef.current.filter(p => p.ownerId === id);
            if (owned.length) {
                let totalComm = 0;
                let totalAgri = 0;

                owned.forEach(p => {
                    let comm = p.commerce;
                    let agri = isAutumn ? p.agriculture : 0;

                    // ★戦闘ダメージ適用
                    if (p.battleDamage) {
                        const { commerce: commRate, agriculture: agriRate, seasonCheck, tactic } = p.battleDamage;
                        
                        // 商業: 常に減少
                        const commDmg = Math.floor(comm * commRate);
                        comm -= commDmg;

                        // 農業: 秋のみ減少計算
                        if (isAutumn) {
                            // 夏(1)に攻められた場合、または秋(2)当期に攻められた場合
                            // 要件:「夏に攻められている場合は秋の兵糧収入が激減」
                            if (seasonCheck === 1 || seasonCheck === 2) {
                                const agriDmg = Math.floor(agri * agriRate);
                                agri -= agriDmg;
                                if (id === playerDaimyoId && agriDmg > 0) {
                                    showLog(`${p.name}: 戦火により兵糧収入減 (戦術:${tactic==='siege'?'籠城':'出城'})`);
                                }
                            }
                        }
                    }
                    
                    totalComm += comm;
                    totalAgri += agri;
                });

                const commerceIncome = Math.floor(totalComm * 1.2);
                const agIncome = Math.floor(totalAgri * 2.0);
                updateResource(id, commerceIncome, agIncome);
            }
        });

        // 最後にダメージ情報をクリア
        setProvinces(curr => curr.map(p => ({ ...p, battleDamage: null })));

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