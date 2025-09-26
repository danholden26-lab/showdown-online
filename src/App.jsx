import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import "./index.css";
import Notes from "./notes";
import Login from "./Login";
import { signOut } from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { 
  loadUserTeam, 
  loadTeamFromFirestore, 
  createDemoTeam,
  loadAllPlayers 
} from "./utils/loadTeam";

const appId = "local-dev";
const initialAuthToken = null;

const App = () => {
  const [game, setGame] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isStealMode, setIsStealMode] = useState(false);
  const [selectedRunnersForSteal, setSelectedRunnersForSteal] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        setUserName(user.displayName);
      } else {
        setUserId(null);
        setUserName(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const showInfoModal = (msg) => {
    setModalMessage(msg);
    setShowModal(true);
  };

  const capitalizeFirstLetter = (string) => {
    if (!string) {
      return '';
    }
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const createSoloGame = async () => {
    if (!userId) {
      showInfoModal("Authentication is not ready. Please wait.");
      return;
    }

    try {
      // Load user's team from Firestore
      let userTeam = await loadUserTeam(userId, "RedSox04");
      
      // If no user team exists, create a demo team
      if (!userTeam) {
        console.log("No saved team found, creating demo team...");
        userTeam = await createDemoTeam(9, 5); // 9 batters, 5 pitchers
        
        if (!userTeam.batters.length || !userTeam.pitchers.length) {
          showInfoModal("Unable to load or create a team. Please check your data.");
          return;
        }
      }

      // Load opponent team (try specific team first, fallback to demo)
      let opponentTeam = await loadTeamFromFirestore("home");
      
      if (!opponentTeam) {
        console.log("No opponent team found, creating demo opponent...");
        opponentTeam = await loadUserTeam(userId, "demoTeam");
      }

      // Validate teams have required players
      if (!userTeam.batters.length || !userTeam.pitchers.length) {
        showInfoModal("User team is missing batters or pitchers.");
        return;
      }
      
      if (!opponentTeam.batters.length || !opponentTeam.pitchers.length) {
        showInfoModal("Opponent team is missing batters or pitchers.");
        return;
      }

      // Prepare teams for game (add stickers array and team property)
      const homeTeamBatters = userTeam.batters.map(card => ({ 
        ...card, 
        stickers: [],
        team: "home"
      }));
      
      const homeTeamPitcher = { 
        ...userTeam.pitchers[0], 
        stickers: [],
        team: "home"
      };

      const awayTeamBatters = opponentTeam.batters.map(card => ({ 
        ...card, 
        stickers: [],
        //team: "away"
      }));
      
      const awayTeamPitcher = { 
        ...opponentTeam.pitchers[0], 
        stickers: [],
        //team: "away"
      };

      // Create new game object
      const newGame = {
        isSoloGame: true,
        inning: 1,
        outs: 0,
        score: { home: 0, away: 0 },
        bases: { home: [null, null, null], away: [null, null, null] },
        gameLog: [`Solo game started. The Away team is batting first. User: ${userId}`],
        homeTeamBatters,
        awayTeamBatters,
        homeTeamPitcher,
        awayTeamPitcher,
        currentBatterIndex: 0,
        battingTeam: 'away',
        status: 'started',
        atBatPhase: 'firstRoll',
        lastRoll1: null,
        lastRoll2: null,
        lastAdvantage: null,
        lastResult: null,
        lastResulttext: null,
      };

      setGame(newGame);
      console.log("Game started successfully!", newGame);
      
    } catch (error) {
      console.error("Error starting solo game:", error);
      showInfoModal("Error starting game. Please try again.");
    }
  };

  const rollForAdvantage = () => {
    if (!game) return;
    
    const battingTeam = game.battingTeam;
    const currentBatter = battingTeam === 'home' 
      ? game.homeTeamBatters[game.currentBatterIndex]
      : game.awayTeamBatters[game.currentBatterIndex];
    const currentPitcher = battingTeam === 'home' ? game.awayTeamPitcher : game.homeTeamPitcher;

    if (!currentBatter || !currentPitcher) {
      showInfoModal("Please select a pitcher and batter to continue.");
      return;
    }
    
    const roll1 = Math.floor(Math.random() * 20) + 1;
    const pitcherAdvantageScore = roll1 + currentPitcher.stats.control;
    
    // Fix: Use the correct property name for batter's on-base
    const batterOnBase = currentBatter.stats.onbase || currentBatter.stats.ob || 0;
    const isPitcherAdvantage = pitcherAdvantageScore > batterOnBase;
    const currentAdvantage = isPitcherAdvantage ? 'pitcher' : 'batter';

    const logMessage = `${currentPitcher.name} pitches to ${currentBatter.name}. You roll a ${roll1}. Pitcher's score: ${pitcherAdvantageScore}, Batter's On-Base: ${batterOnBase}. It is a ${currentAdvantage}'s advantage!`;

    setGame(prev => ({
      ...prev,
      atBatPhase: 'secondRoll',
      currentAdvantage: currentAdvantage,
      gameLog: [...prev.gameLog, logMessage],
      lastRoll1: roll1,
      lastAdvantage: currentAdvantage,
      lastResult: null,
      lastResulttext: null,
    }));
  };

  const handleSubstitutePitcher = () => {
    setIsModalOpen(true);
  };

  const advanceToNextAtBat = () => {
    if (!game) return;

    const battingTeam = game.battingTeam;
    const fieldingTeam = battingTeam === 'home' ? 'away' : 'home';

    let nextBatterIndex = game.currentBatterIndex;
    let nextBattingTeam = battingTeam;
    let nextInning = game.inning;
    let newOuts = game.outs;
    let newBases = game.bases;

    if (game.outs >= 3) {
        newOuts = 0;
        nextBatterIndex = 0;
        nextBattingTeam = fieldingTeam;
        
        if (battingTeam === 'home') {
            nextInning = Math.floor(game.inning) + 1;
        } else {
            nextInning = game.inning + 0.5;
        }

        newBases = { home: [null, null, null], away: [null, null, null] };
    } else {
        nextBatterIndex++;
        const currentBatters = battingTeam === 'home' ? game.homeTeamBatters : game.awayTeamBatters;
        if (nextBatterIndex >= currentBatters.length) {
            nextBatterIndex = 0;
        }
    }

    setGame(prev => ({
        ...prev,
        outs: newOuts,
        inning: nextInning,
        currentBatterIndex: nextBatterIndex,
        battingTeam: nextBattingTeam,
        bases: newBases,
        atBatPhase: 'firstRoll',
        lastRoll1: null,
        lastRoll2: null,
        lastAdvantage: null,
        lastResult: null,
        lastResulttext: null,
    }));
  };

  const rollForAtBatResult = () => {
    if (!game) return;
    
    const battingTeam = game.battingTeam;
    const fieldingTeam = battingTeam === 'home' ? 'away' : 'home';
    const currentBatter = battingTeam === 'home' 
        ? game.homeTeamBatters[game.currentBatterIndex]
        : game.awayTeamBatters[game.currentBatterIndex];
    const currentPitcher = battingTeam === 'home' ? game.awayTeamPitcher : game.homeTeamPitcher;
    
    const effectiveBatterHandedness = currentBatter.handedness === 'switch'
        ? (currentPitcher.handedness === 'right' ? 'left' : 'right')
        : currentBatter.handedness;

    const cardToUse = game.currentAdvantage === 'pitcher' ? currentPitcher : currentBatter;
    const roll2 = Math.floor(Math.random() * 20) + 1;
    const result = getAtBatResult(roll2, cardToUse);
    let logMessage = `${currentBatter.name} rolls a ${roll2} against ${cardToUse.name}'s card (${game.currentAdvantage}'s advantage). Result: ${result.text}`;
    const playLogEntry = `${currentBatter.name} rolls a ${roll2} against ${currentPitcher.name}. Result: ${result.text}`;

    let workingBases = [...game.bases[game.battingTeam]];
    let newOuts = game.outs;
    let newScore = { ...game.score };
    let runs = 0;
    let updatedHomePitcher = { ...game.homeTeamPitcher };
    let updatedAwayPitcher = { ...game.awayTeamPitcher };
    let updatedHomeBatters = [...game.homeTeamBatters];
    let updatedAwayBatters = [...game.awayTeamBatters];
    
    const lastPlay = {
        batterOutcome: result,
        roll: roll2,
        cardUsed: cardToUse,
        runners: [],
        fieldingAttempt: null,
        runsScored: 0,
    };

    const handleOuts = (outCount) => {
        newOuts += outCount;
        const pitcherToUpdate = fieldingTeam === 'home' ? updatedHomePitcher : updatedAwayPitcher;
        pitcherToUpdate.stats.outsRecorded += outCount;
        
        const fullInnings = Math.floor(pitcherToUpdate.stats.outsRecorded / 3);
        const remainingOuts = pitcherToUpdate.stats.outsRecorded % 3;
        pitcherToUpdate.stats.currentIP = fullInnings + (remainingOuts / 10);
    };

    if (selectedRunnersForSteal.length > 0) {
        const isStrikeout = result.text.includes('(SO)');
        const isGroundBall = result.text.includes('(GB)');
        const isOtherOut = result.text.includes('(PU)') || result.text.includes('(FB)');
        const isHit = result.text.includes('(Single)') || result.text.includes('(Double)') || result.text.includes('(Triple)') || result.text.includes('(HR)');

        if (isStrikeout) {
            selectedRunnersForSteal.forEach(baseIndex => {
                const runner = workingBases[baseIndex];
                const stealRoll = Math.floor(Math.random() * 20) + 1;
                const runnerSpeed = runner.stats.speed || runner.stats.spd || 15;

                if (stealRoll <= runnerSpeed) {
                  lastPlay.runners.push({
                    name: runner.name,
                    startbase: getBaseName(baseIndex),
                    endBase: getBaseName(baseIndex + 1),
                    outcome: 'safe',
                    event: 'steal',
                  });
                  workingBases[baseIndex] = null;
                  workingBases[baseIndex + 1] = runner;
                } else {
                  lastPlay.runners.push({
                    name: runner.name,
                    startBase: getBaseName(baseIndex),
                    outcome: 'out',
                    event: 'caughtStealing',
                  });
                  workingBases[baseIndex] = null;
                  newOuts++;
                }
            });
        } 
        else if (isOtherOut) {
            logMessage += ` Runners stay put.`;
        }
        setSelectedRunnersForSteal([]);
    }

    if (result.type === 'strikeout' || result.text.includes('(SO)')) {
        handleOuts(1);
    } 
    else if (result.text.includes('(PU)') || result.text.includes('(FB)')) {
        handleOuts(1);
    }
    else if (result.text.includes('(GB)')) {
        if (game.bases[battingTeam][0] && newOuts < 2) {
            const runnerOnFirst = workingBases[0];
            handleOuts(1);
            workingBases[0] = null;
            logMessage += ` The runner on first is out on a ground ball.`;

            const fieldingTeamBatters = fieldingTeam === 'home' ? game.homeTeamBatters : game.awayTeamBatters;
            const infielders = fieldingTeamBatters.filter(player => 
                player.stats.positions && player.stats.positions.some(p => ['1B', '2B', 'SS', '3B'].includes(p.position))
            );
            const totalInfieldFielding = infielders.reduce((sum, player) => sum + (player.fielding || 0), 0);
            const fieldingRoll = Math.floor(Math.random() * 20) + 1;
            const totalFieldingAttempt = fieldingRoll + totalInfieldFielding;
            const batterSpeed = currentBatter.stats?.speed || 15;

            if (totalFieldingAttempt > batterSpeed) {
                lastPlay.fieldingAttempt = {
                  type: 'doublePlay',
                  successful: true,
                  roll: fieldingRoll,
                };
                lastPlay.runners.push({ 
                    name: runnerOnFirst.name,
                    startBase: getBaseName(0),
                    endBase: getBaseName(1),
                    outcome: 'out',
                });
                lastPlay.runsScored = 0; 
                logMessage += ` DOUBLE PLAY! The batter is also out.`;
                handleOuts(1);
            } else {
                lastPlay.fieldingAttempt = {
                  type: 'doublePlay',
                  successful: false,
                };
                lastPlay.runners.push({
                    name: runnerOnFirst.name,
                    startBase: getBaseName(0),
                    endBase: getBaseName(1),
                    outcome: 'out',
                });

                logMessage += ` FIELDER'S CHOICE! The batter beats the throw to first and is safe.`;
                const { bases: updatedBases, score: newRuns } = updateBases(workingBases, { type: 'walk' }, currentBatter);
                workingBases = updatedBases;
                runs = newRuns;
                newScore[battingTeam] += runs;
                lastPlay.runners.push({
                    name: currentBatter.name,
                    startBase: 3,
                    endBase: 0,
                    outcome: 'safe'
                });
            }
        } else {
            handleOuts(1);
        }
    }
    else {
        const { bases: resultBases, score: resultScore } = updateBases(workingBases, result, currentBatter);
        workingBases = resultBases;
        runs = resultScore;
        newScore[battingTeam] += runs;
    }
    
    if (result.sticker) {
        const updatedPlayer = {
            ...(game.currentAdvantage === 'batter' ? currentBatter : currentPitcher),
            stickers: [...((game.currentAdvantage === 'batter' ? currentBatter : currentPitcher).stickers || []), result.sticker]
        };
        if (game.currentAdvantage === 'batter') {
            if (battingTeam === 'home') {
                updatedHomeBatters[game.currentBatterIndex] = updatedPlayer;
            } else {
                updatedAwayBatters[game.currentBatterIndex] = updatedPlayer;
            }
        } else {
            if (battingTeam === 'home') {
                updatedAwayPitcher = updatedPlayer;
            } else {
                updatedHomePitcher = updatedPlayer;
            }
        }
    }

    setGame(prevGame => ({
        ...prevGame,
        outs: newOuts,
        score: newScore,
        bases: {
            ...prevGame.bases,
            [game.battingTeam]: workingBases,
        },
        atBatPhase: 'completed',
        lastRoll2: roll2,
        lastResult: playLogEntry,
        gameLog: [...prevGame.gameLog, logMessage],
        homeTeamPitcher: updatedHomePitcher,
        awayTeamPitcher: updatedAwayPitcher,
        homeTeamBatters: updatedHomeBatters,
        awayTeamBatters: updatedAwayBatters,
        effectiveHandedness: effectiveBatterHandedness,
        lastResulttext: result.text,
        lastPlay: lastPlay,
    }));
  };

  const getBaseName = (index) => {
      switch (index) {
          case 0: return 'first';
          case 1: return 'second';
          case 2: return 'third';
          case 3: return 'home';
          default: return '';
      }
  };

  const getRunnerDetails = (runners) => {
    if (!runners || runners.length === 0) {
      return "";
    }

    const details = runners.map(runner => {
      if (runner.event === 'steal') {
        return `${runner.name} successfully steals ${runner.endBase}!`;
      }
      if (runner.outcome === 'out') {
        return `${runner.name} is out at ${runner.endBase}!`;
      }
      return "";
    });

    return details.join(" ");
  };

  const getAtBatResult = (roll, card) => {
    for (const entry of card.chart) {
      if (roll >= entry.roll[0] && roll <= entry.roll[1]) {
        return { type: entry.result, text: entry.text, sticker: entry.sticker };
      }
    }
    return { type: 'out', text: 'Out', sticker: 'GB' };
  };

  const handleRunnerSelection = (baseIndex) => {
      if (!isStealMode) return;
      
      setSelectedRunnersForSteal(prev =>
          prev.includes(baseIndex)
              ? prev.filter(idx => idx !== baseIndex)
              : [...prev, baseIndex]
      );
  };

  const confirmSteal = () => {
      setIsStealMode(false);
  };

  const updateBases = (currentBases, result, currentBatter) => {
    let newBases = [...currentBases]; 
    let score = 0;
    
    if (result.type === 'walk') {
        const hasRunnerOnFirst = newBases[0];
        const hasRunnerOnSecond = newBases[1];
        const hasRunnerOnThird = newBases[2];
        
        if (hasRunnerOnFirst && hasRunnerOnSecond && hasRunnerOnThird) {
            score++;
        }
        
        if (hasRunnerOnSecond && hasRunnerOnFirst) {
            newBases[2] = newBases[1];
        }
        
        if (hasRunnerOnFirst) {
            newBases[1] = newBases[0];
        }
        
        newBases[0] = currentBatter;
    } 
    else if (result.type === 'single') {
        if (newBases[2]) score++;
        if (newBases[1]) score++;
        if (newBases[0]) newBases[1] = newBases[0];
        newBases[0] = currentBatter;
        newBases[2] = null;
    }
    else if (result.type === 'double') {
        if (newBases[2]) score++;
        if (newBases[1]) score++;
        if (newBases[0]) newBases[2] = newBases[0];
        newBases[1] = currentBatter;
        newBases[0] = null;
    } 
    else if (result.type === 'triple') {
        if (newBases[0]) score++;
        if (newBases[1]) score++;
        if (newBases[2]) score++;
        newBases = [null, null, null];
        newBases[2] = currentBatter;
    } 
    else if (result.type === 'homerun') {
        score += (newBases[0] ? 1 : 0) + (newBases[1] ? 1 : 0) + (newBases[2] ? 1 : 0);
        newBases = [null, null, null];
        score++;
    }
    
    return { bases: newBases, score };
  };

  const getPlayDetails = (lastPlay) => {
    if (!lastPlay) {
      return null;
    }

    const { batterOutcome } = lastPlay;
    let details = [];

    details.push(`Result: ${batterOutcome.text}`);
    return details.join(' ');
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setGame(null);
    } catch (err) {
      console.error("Sign-Out error:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <p>Loading authentication...</p>
      </div>
    );
  }

  if (!userId) {
    return <Login />;
  }

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <h1 className="text-4xl font-bold mb-4">MLB Showdown</h1>
        <p className="mb-4">Signed in as: {userName || userId}</p>
        <p className="mb-8">Test the core mechanics by playing against yourself!</p>
        <button
          onClick={createSoloGame}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          Start Solo Game
        </button>
        <button 
          onClick={handleSignOut}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-full text-xs mt-4"
        >
          Sign Out
        </button>
      </div>
    );
  }

  // Game state variables
  const battingTeam = game.battingTeam;
  const currentBatters = game?.battingTeam === 'home' ? game?.homeTeamBatters : game?.awayTeamBatters;
  const currentBatter = currentBatters?.[game?.currentBatterIndex];
  const currentPitcher = game?.battingTeam === 'home' ? game?.awayTeamPitcher : game?.homeTeamPitcher;
  const isTopInning = game?.battingTeam === 'away';
  const fieldingTeam = game.battingTeam === 'home' ? game.awayTeamBatters : game.homeTeamBatters;
  
  const infielders = fieldingTeam.filter(player => 
    player.stats.positions && player.stats.positions.some(p => ['1B', '2B', 'SS', '3B'].includes(p.position))
  );
  const totalInfieldFielding = infielders.reduce((sum, player) => sum + (player.fielding || 0), 0);
  
  const currentBattersInLineup = battingTeam === 'home' ? game.homeTeamBatters : game.awayTeamBatters;
  let nextBatterIndex = game.currentBatterIndex + 1;
  if (nextBatterIndex >= currentBattersInLineup.length) {
    nextBatterIndex = 0;
  }
  const onDeckBatter = currentBattersInLineup[nextBatterIndex];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 flex flex-col items-center">
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700 max-w-sm w-full">
            <p className="text-lg text-center mb-4">{modalMessage}</p>
            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <button 
        onClick={handleSignOut}
        className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-full text-xs self-end mb-4"
      >
        Sign Out
      </button>
      
      <div className="w-full max-w-4xl space-y-8">
        <div className="flex flex-col lg:flex-row lg:space-x-8">
          <div className="flex-1 flex flex-col">
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 text-center">
              <h3 className="text-lg font-bold mb-2">Current At-Bat</h3>

              <div className="mb-6">
                {game.lastAdvantage ? (
                  <div className={`text-2xl font-bold py-2 px-4 rounded-lg ${
                    game.lastAdvantage === 'pitcher' ? 'text-green-300 bg-green-900/30' : 'text-red-300 bg-red-900/30'
                  }`}>
                    {game.lastAdvantage.toUpperCase()}'S ADVANTAGE
                  </div>
                ) : (
                  <div className="text-xl font-bold text-gray-400 py-2">
                    WAITING FOR ADVANTAGE
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-1">
                <div className="mb-1 px-1">
                  <button
                    onClick={handleSubstitutePitcher}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full text-sm transition-colors"
                  >
                    Substitute Pitcher
                  </button>
                </div>
                
                <div className="justify-between mb-1 px-1">
                  {!isStealMode ? (
                    <button
                      onClick={() => setIsStealMode(true)}
                      disabled={!game?.bases?.[game.battingTeam]?.some(onBase => onBase)}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Steal Bases
                    </button>
                  ) : (
                    <div className="flex flex-row items-center gap-1">
                      <button
                        onClick={confirmSteal}
                        disabled={selectedRunnersForSteal.length === 0}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-1 rounded-full text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Confirm Steal ({selectedRunnersForSteal.length})
                      </button>
                    
                      <button
                        onClick={() => { setIsStealMode(false); setSelectedRunnersForSteal([]); }}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-full text-sm transition-colors"
                      >
                        X
                      </button>
                    </div>
                  )}
                </div>
              </div>
           
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className={`transition-all duration-500 ${
                  game.lastAdvantage === 'pitcher' ? `ring-4 ring-opacity-75 shadow-lg ${currentPitcher.team === 'home' ? 'ring-red-400 shadow-red-400/50' : 'ring-blue-400 shadow-blue-400/50'}` : ''
                }`}>
                  {currentPitcher && (
                    <div className={`h-60 p-3 rounded-xl shadow-inner border-2 ${currentPitcher.team === 'home' ? 'border-red-600 bg-red-900/20' : 'border-blue-600 bg-blue-900/20'} ${
                      game.lastAdvantage === 'pitcher' ? `${currentPitcher.team === 'home' ? 'bg-red-900/40 border-red-400' : 'bg-blue-900/40 border-blue-400'}` : ''
                    } text-left mb-3 transition-all duration-500`}>
                      <h4 className={`text-md font-bold mb-2 ${
                        game.lastAdvantage === 'pitcher' ? `${currentPitcher.team === 'home' ? 'text-red-300' : 'text-blue-300'}` : ''
                      }`}>{currentPitcher.name}</h4>
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="font-semibold text-gray-400">Control:</span>
                        <span className="font-bold text-yellow-300">{currentPitcher.stats.control}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="font-semibold text-gray-400">IP:</span>
                        <span className={`font-bold ${currentPitcher.stats.currentIP >= currentPitcher.stats.ip ? 'text-red-400' : 'text-blue-300'}`}>
                          {currentPitcher.stats.currentIP?.toFixed(1) || 0} / {currentPitcher.stats.ip || 'N/A'}
                        </span>
                      </div>
                      <div className="border-t border-gray-700 my-2"></div>
                      <div className="overflow-y-auto max-h-32">
                        <ul className="text-xs space-y-1">
                          {currentPitcher.chart?.map((item, index) => (
                            <li key={index} className="flex justify-between">
                              <span className="text-gray-400">{item.roll[0]}-{item.roll[1]}:</span>
                              <span className="font-semibold text-gray-200">{item.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {currentPitcher.stickers && currentPitcher.stickers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {currentPitcher.stickers.map((sticker, index) => (
                            <span key={index} className="px-1 py-0.5 bg-gray-500 rounded text-white text-xs font-bold">{sticker}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className={`
                      p-3 rounded-lg border-2 text-center transition-all duration-500
                      ${game.lastAdvantage === 'pitcher' ? `${currentPitcher.team === 'home' ? 'ring-2 ring-red-400 bg-red-900/30' : 'ring-2 ring-blue-400 bg-blue-900/30'}` : ''}
                      ${currentPitcher.team === 'home' ? 'bg-red-900/20 border-red-600' : 'bg-blue-900/20 border-blue-600'}
                      `}>
                    <div className={`text-sm font-bold ${currentPitcher.team === 'home' ? 'text-red-400' : 'text-blue-400'}`}>PITCHER ROLL</div>
                    <div className="text-2xl font-bold text-yellow-400">
                      {game.lastRoll1 || '-'}
                    </div>
                    <div className="text-xs text-gray-300">
                      {game.lastAdvantage ? `${capitalizeFirstLetter(game.lastAdvantage)}'s Advantage` : 'Ready to Roll'}
                    </div>
                  </div>
                </div>
                
                <div className={`transition-all duration-500 ${
                  game.lastAdvantage === 'batter' ? `ring-4 ring-opacity-75 shadow-lg ${currentBatter.team === 'home' ? 'ring-red-400 shadow-red-400/50' : 'ring-blue-400 shadow-blue-400/50'}` : ''
                }`}>
                  {currentBatter && (
                    <div className={`h-60 p-3 rounded-xl shadow-inner border-2 ${currentBatter.team === 'home' ? 'border-red-600 bg-red-900/20' : 'border-blue-600 bg-blue-900/20'} ${
                      game.lastAdvantage === 'batter' ? `${currentBatter.team === 'home' ? 'bg-red-900/40 border-red-400' : 'bg-blue-900/40 border-blue-400'}` : ''
                    } text-left mb-3 transition-all duration-500`}>
                      <h4 className={`text-md font-bold mb-2 ${
                        game.lastAdvantage === 'batter' ? `${currentBatter.team === 'home' ? 'text-red-300' : 'text-blue-300'}` : ''
                      }`}>{currentBatter.name}</h4>
                      <div className="flex justify-between items-center text-xs mb-2">
                        <span className="font-semibold text-gray-400">On-Base:</span>
                        <span className="font-bold text-green-400">{currentBatter.stats.onbase || currentBatter.stats.ob || 'N/A'}</span>
                        <span className="font-semibold text-gray-400">Speed:</span>
                        <span className="font-bold text-red-400">{currentBatter.stats.speed || 'N/A'}</span>
                      </div>

                      <div className="flex justify-between items-center text-xs mb-2">
                        <span className="font-semibold text-gray-400">Position(s):</span>
                        <span className="font-bold text-yellow-300">
                          {currentBatter.stats.positions ? 
                            currentBatter.stats.positions.map(p => `${p.position}+${p.rating}`).join(', ') : 
                            'N/A'
                          }
                        </span>
                      </div>
                      <div className="border-t border-gray-700 my-2"></div>
                      <div className="overflow-y-auto max-h-32">
                        <ul className="text-xs space-y-1">
                          {currentBatter.chart?.map((item, index) => (
                            <li key={index} className="flex justify-between">
                              <span className="text-gray-400">{item.roll[0]}-{item.roll[1]}:</span>
                              <span className="font-semibold text-gray-200">{item.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {currentBatter.stickers && currentBatter.stickers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {currentBatter.stickers.map((sticker, index) => (
                            <span key={index} className="px-1 py-0.5 bg-gray-500 rounded text-white text-xs font-bold">{sticker}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className={`
                    p-3 rounded-lg border-2 text-center transition-all duration-500 
                    ${game.lastAdvantage === 'batter' ? `${currentBatter.team === 'home' ? 'ring-2 ring-red-400 bg-red-900/30' : 'ring-2 ring-blue-400 bg-blue-900/30'}` : ''}
                    ${currentBatter.team === 'home' ? 'bg-red-900/20 border-red-600' : 'bg-blue-900/20 border-blue-600'}
                  `}>
                    <div className={`text-sm font-bold ${currentBatter.team === 'home' ? 'text-red-400' : 'text-blue-400'}`}>BATTER ROLL</div>
                    <div className="text-2xl font-bold text-yellow-400">
                      {game.lastRoll2 || '-'}
                    </div>
                    <div className="text-xs text-gray-300">
                      {game.lastResulttext ? `${game.lastResulttext}` : 'Ready to Roll'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                {game.atBatPhase === 'firstRoll' && (
                  <button
                    onClick={rollForAdvantage}
                    disabled={!currentPitcher || !currentBatter}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Pitcher Rolls for Advantage
                  </button>
                )}

                {game.atBatPhase === 'secondRoll' && (
                  <button
                    onClick={rollForAtBatResult}
                    disabled={!currentPitcher || !currentBatter}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Batter Rolls for Result
                  </button>
                )}

                {game.atBatPhase === 'completed' && (
                  <button
                    onClick={advanceToNextAtBat}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-colors"
                  >
                    Next At-Bat
                  </button>
                )}
              </div>
            </div>
          </div>

          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
              <div className="bg-gray-800 p-6 rounded-lg w-96 shadow-xl border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">Choose a Pitcher</h3>
                <ul className="space-y-2 max-h-64 overflow-y-auto">
                  <li className="p-3 bg-gray-700 rounded-lg text-center">
                    <span className="text-gray-400">No substitutes available yet</span>
                  </li>
                </ul>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col">
            <div className="grid grid-cols-2 gap-1">
              <div className="bg-gray-900 p-1 rounded-lg shadow-lg border border-gray-700 w-36 mb-6">
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-blue-400 font-bold">Away</span>
                    <span className="text-white font-bold">{game.score.away}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-400 font-bold">Home</span>
                    <span className="text-white font-bold">{game.score.home}</span>
                  </div>
                  <div className="border-t border-gray-700 pt-1">
                    <div className="flex justify-between items-center">
                      <span className={`font-bold text-xs ${isTopInning ? 'text-blue-400' : 'text-red-400'}`}>
                        {isTopInning ? 'Top' : 'Bot'} {Math.floor(game.inning)}
                      </span>
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-400 text-xs">Outs</span>
                        <div className="flex space-x-0.5">
                          {[...Array(2)].map((_, i) => (
                            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < game.outs ? 'bg-red-500' : 'bg-gray-600'}`}></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-800 p-1 rounded-lg shadow-lg border-2 border-green-500 text-center transition-all duration-500 w-36 mb-6">
                  <h4 className="font-bold text-xs mb-1 text-blue-400">Infield Fielding Sum</h4>
                  <p className="text-2xl font-extrabold text-white mt-1">{totalInfieldFielding}</p>
              </div>
            </div>                

            <div className="flex justify-center">
              <svg width="320" height="320" viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg" className="text-gray-600">
                <polygon points="160,280 280,160 160,40 40,160" fill="#2D4636" />
                
                <polygon points="160,280 180,260 180,240 140,240 140,260" fill="#D1D5DB" stroke="#D1D5DB" strokeWidth="1" />
                <polygon points="280,160 260,180 240,160 260,140" fill="#D1D5DB" stroke="#D1D5DB" strokeWidth="1" />
                <polygon points="160,40 180,60 160,80 140,60" fill="#D1D5DB" stroke="#D1D5DB" strokeWidth="1" />
                <polygon points="40,160 60,140 80,160 60,180" fill="#D1D5DB" stroke="#D1D5DB" strokeWidth="1" />
                
                {game.bases?.[game.battingTeam] && game.bases[game.battingTeam].map((onBase, index) => {
                  const baseCoords = [
                    { x: 260, y: 160 },
                    { x: 160, y: 60 },
                    { x: 60, y: 160 },
                  ];
                  return onBase ? (
                      <circle 
                          key={index}
                          cx={baseCoords[index].x} 
                          cy={baseCoords[index].y} 
                          r="15" 
                          fill={game.battingTeam === 'home' ? '#FF2305' : '#2344FF'} 
                          className={`cursor-pointer transition-transform duration-200 ${
                              isStealMode ? ' hover:stroke-yellow-400 hover:stroke-2' : ''
                          } ${
                              selectedRunnersForSteal.includes(index) ? 'stroke-yellow-400 stroke-2' : ''
                          }`}
                          onClick={() => handleRunnerSelection(index)}
                      />
                  ) : null
                })}

                {currentBatter && (
                  <circle 
                    cx={currentBatter.handedness === 'right' ? 120 : 200} 
                    cy={260} 
                    r="15" 
                    fill={game.battingTeam === 'home' ? '#FF2305' : '#2344FF'} 
                  />
                )}
              </svg>
            </div>

            <div className="flex justify-center items-center gap-4 mt-6">
                {onDeckBatter && (
                    <div className={`p-2 rounded-xl shadow-inner border-2 ${onDeckBatter.team === 'home' ? 'border-red-600 bg-red-900/20' : 'border-blue-600 bg-blue-900/20'} text-center transition-all duration-500`}>
                        <h4 className="font-bold text-sm mb-1 text-blue-400">On Deck</h4>
                        <p className="text-lg font-semibold text-white">
                            {onDeckBatter.name}
                        </p>
                        <div className="flex justify-between items-center text-xs mt-2">
                            <span className="font-semibold text-gray-400">On-Base:</span>
                            <span className="font-bold text-green-400">{onDeckBatter.stats.onbase || onDeckBatter.stats.ob || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs mt-2">
                            <span className="font-semibold text-gray-400">Hand:</span>
                            <span className="font-bold text-green-400">{onDeckBatter.handedness}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="text-center mt-6">
            {game.lastPlay ? (
              <div className="bg-gray-800 p-4 rounded-xl shadow-inner border-2 border-gray-700">
                <h3 className="text-sm font-bold text-gray-400 mb-2">Last Play</h3>
                <div className="text-md text-white font-semibold leading-relaxed">
                  <p>
                    <span className="font-bold text-red-400">Batter Result:</span> {game.lastPlay.batterOutcome?.text}
                  </p>
                  {game.lastPlay.runners && game.lastPlay.runners.length > 0 && (
                    <p className="mt-2">
                      <span className="font-bold text-blue-400">Runner(s):</span> {getRunnerDetails(game.lastPlay.runners)}
                    </p>
                  )}
                  {game.lastPlay.fieldingAttempt && game.lastPlay.fieldingAttempt.type === 'doublePlay' && (
                      <p className="mt-2">
                        <span className="font-bold text-green-400">Fielding:</span>{' '}
                        {game.lastPlay.fieldingAttempt.successful ? (
                          'Double play attempted and successful!'
                        ) : (
                          'FIELDER\'S CHOICE! The batter beats the throw to first and is safe.'
                        )}
                      </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-lg font-bold text-blue-400">
                Game in Progress
              </div>
            )}
            </div> 
          </div>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <h3 className="text-lg font-bold mb-4">Game Log</h3>
          <div className="bg-gray-900 p-4 rounded-lg h-64 overflow-y-scroll text-sm border border-gray-700">
            {game.gameLog?.map((log, index) => (
              <p key={index} className="mb-1">{log}</p>
            ))}
          </div>
        </div>
        <Notes/>
        <div className="text-center">
          <button
            onClick={createSoloGame}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Start New Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
