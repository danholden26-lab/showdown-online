import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import "./index.css";
import cardData from './cardData.json';

const appId = "local-dev";
const initialAuthToken = null;

const App = () => {
  const [game, setGame] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isStealMode, setIsStealMode] = useState(false);
  const [selectedRunnersForSteal, setSelectedRunnersForSteal] = useState([]);


  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        const anonymousUser = await signInAnonymously(auth);
        setUserId(anonymousUser.user.uid);
      }
      setIsAuthReady(true);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const showInfoModal = (msg) => {
    setModalMessage(msg);
    setShowModal(true);
  };

  const createSoloGame = () => {
    if (!isAuthReady || !userId) {
      showInfoModal("Authentication is not ready. Please wait.");
      return;
    }



    const homeTeamBatters = cardData.homeTeam.batters.map(card => ({...card, stickers: []}));
    const homeTeamPitcher = { ...cardData.homeTeam.pitchers[0], stickers: [] }; // First pitcher
    const awayTeamPitcher = { ...cardData.awayTeam.pitchers[0], stickers: [] }; // First pitcher
    const awayTeamBatters = cardData.awayTeam.batters.map(card => ({...card, stickers: []}));

    const newGame = {
      isSoloGame: true,
      inning: 1,
      outs: 0,
      score: { home: 0, away: 0 },
      bases: { home: [null, null, null], away: [null, null, null], },
      gameLog: [`Solo game started. The Away team is batting first. User: ${userId}`],
      homeTeamBatters: homeTeamBatters,
      awayTeamBatters: awayTeamBatters,
      homeTeamPitcher: homeTeamPitcher,
      awayTeamPitcher: awayTeamPitcher,
      currentBatterIndex: 0,
      battingTeam: 'away',
      status: 'started',
      atBatPhase: 'firstRoll',
      lastRoll1: null,
      lastRoll2: null,
      lastAdvantage: null,
      lastResult: null,
    };

    setGame(newGame);
  };
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    const isPitcherAdvantage = pitcherAdvantageScore > currentBatter.stats.ob;
    const currentAdvantage = isPitcherAdvantage ? 'pitcher' : 'batter';

    const logMessage = `${currentPitcher.name} pitches to ${currentBatter.name}. You roll a ${roll1}. Pitcher's score: ${pitcherAdvantageScore}, Batter's On-Base: ${currentBatter.stats.ob}. It is a ${currentAdvantage}'s advantage!`;

    setGame(prev => ({
      ...prev,
      atBatPhase: 'secondRoll',
      currentAdvantage: currentAdvantage,
      gameLog: [...prev.gameLog, logMessage],
      lastRoll1: roll1,
      lastAdvantage: currentAdvantage,
      lastResult: null,
    }));
  };
  


    // NEW: Function to open the substitution modal
  const handleSubstitutePitcher = () => {
    setIsModalOpen(true);
  };

// New version of the advanceToNextAtBat function
const advanceToNextAtBat = () => {
    if (!game) return;

    const battingTeam = game.battingTeam;
    const fieldingTeam = battingTeam === 'home' ? 'away' : 'home';

    let nextBatterIndex = game.currentBatterIndex;
    let nextBattingTeam = battingTeam;
    let nextInning = game.inning;
    let newOuts = game.outs;
    let newBases = game.bases;

    // Logic to handle end of inning
    if (game.outs >= 3) {
        newOuts = 0;
        nextBatterIndex = 0;
        nextBattingTeam = fieldingTeam;
        
        // This logic handles top and bottom halves of the inning
        if (battingTeam === 'home') {
            nextInning = Math.floor(game.inning) + 1;
        } else {
            nextInning = game.inning + 0.5;
        }

        // Reset the bases for both teams
        newBases = { home: [null, null, null], away: [null, null, null] };

    } else {
        // Normal batter progression
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
        bases: newBases, // Add this line to update the bases
        atBatPhase: 'firstRoll',
        lastRoll1: null,
        lastRoll2: null,
        lastAdvantage: null,
        lastResult: null,
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
    const teamRoster = battingTeam === 'home' ? game.homeTeamBatters : game.awayTeamBatters;

    const effectiveBatterHandedness = currentBatter.handedness === 'switch'
        ? (currentPitcher.handedness === 'right' ? 'left' : 'right')
        : currentBatter.handedness;

    const cardToUse = game.currentAdvantage === 'pitcher' ? currentPitcher : currentBatter;
    const roll2 = Math.floor(Math.random() * 20) + 1;
    const result = getAtBatResult(roll2, cardToUse);
    let logMessage = `${currentBatter.name} rolls a ${roll2} against ${cardToUse.name}'s card (${game.currentAdvantage}'s advantage). Result: ${result.text}`;
    
    // Create a working copy of the bases, correctly
    let newBases = [...game.bases[game.battingTeam]];
    let newOuts = game.outs;
    let newScore = { ...game.score };

    let updatedHomePitcher = { ...game.homeTeamPitcher };
    let updatedAwayPitcher = { ...game.awayTeamPitcher };
    let updatedHomeBatters = [...game.homeTeamBatters];
    let updatedAwayBatters = [...game.awayTeamBatters];

    const handleOuts = (outCount) => {
        newOuts += outCount;
        const pitcherToUpdate = fieldingTeam === 'home' ? updatedHomePitcher : updatedAwayPitcher;
        pitcherToUpdate.stats.outsRecorded += outCount;
        
        const fullInnings = Math.floor(pitcherToUpdate.stats.outsRecorded / 3);
        const remainingOuts = pitcherToUpdate.stats.outsRecorded % 3;
        pitcherToUpdate.stats.currentIP = fullInnings + (remainingOuts / 10);
    };

    // --- NEW: Steal Attempt Resolution ---
    if (selectedRunnersForSteal.length > 0) {
        const isStrikeout = result.text.includes('(SO)');
        const isOut = result.text.includes('(PU)') || result.text.includes('(FB)') || result.text.includes('(GB)');
        const isHit = result.text.includes('(Single)') || result.text.includes('(Double)') || result.text.includes('(Triple)') || result.text.includes('(HR)');

        if (isStrikeout) {
            selectedRunnersForSteal.forEach(baseIndex => {
                const runner = newBases[baseIndex];
                const stealRoll = Math.floor(Math.random() * 20) + 1;

                if (stealRoll <= runner.stats.speed) {
                    logMessage += `${runner.name} successfully steals to ${baseIndex + 2}nd base! (Roll: ${stealRoll})`;
                    newBases[baseIndex] = null;
                    newBases[baseIndex + 1] = runner;
                } else {
                    logMessage += `${runner.name} is caught stealing! (Roll: ${stealRoll})`;
                    newBases[baseIndex] = null;
                    newOuts++;
                }
            });
        } 
        else if (isOut) {
            logMessage += `Runners stay put.`;
        }
        else if (isHit) {
            // No action needed here
        }
        setSelectedRunnersForSteal([]);
    }
    // --- End of new code ---

    // --- Double Play Logic ---
    // --- Updated Ground Ball Logic ---
    // Determine how to update the game state based on the result
    if (result.type === 'strikeout' || result.text.includes('(SO)')) {
        handleOuts(1);
    } 
    else if (result.text.includes('(PU)') || result.text.includes('(FB)')) {
        // Fly balls and pop-ups are simple outs.
        handleOuts(1);
    }
    else if (result.text.includes('(GB)')) {
        // Ground ball logic with or without a runner on first
        if (game.bases[battingTeam][0] && newOuts < 2) {
            // According to your rule, the runner on first is out automatically.
            handleOuts(1);
            newBases[0] = null;
            logMessage += ` The runner on first is out on a ground ball.`;

            // Now, roll to see if the batter is also out.
            const fieldingTeamBatters = fieldingTeam === 'home' ? game.homeTeamBatters : game.awayTeamBatters;
            const infielders = fieldingTeamBatters.filter(player => player.position?.some(p => ['1B', '2B', 'SS', '3B'].includes(p)));
            const totalInfieldFielding = infielders.reduce((sum, player) => sum + (player.fielding || 0), 0);
            const fieldingRoll = Math.floor(Math.random() * 20) + 1;
            const totalFieldingAttempt = fieldingRoll + totalInfieldFielding;
            const batterSpeed = currentBatter.stats?.speed || 15;

            if (totalFieldingAttempt > batterSpeed) {
                handleOuts(1);
                logMessage += ` DOUBLE PLAY! The batter is also out.`;
            } else {
                logMessage += ` FIELDER'S CHOICE! The batter beats the throw to first and is safe.`;
                const { bases: updatedBases, score: runs } = updateBases(newBases, { type: 'walk' }, currentBatter);
                newBases = updatedBases;
                newScore[battingTeam] += runs;
            }
        } else {
            // If no runner on first, the ground ball is a simple out for the batter.
            handleOuts(1);
        }
    }
    else {
        // All other results (walks, singles, etc.) update bases
        const { bases: updatedBases, score: runs } = updateBases(newBases, result, currentBatter);
        newBases = updatedBases;
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
            [game.battingTeam]: newBases,
        },
        atBatPhase: 'completed',
        lastRoll2: roll2,
        lastResult: result.text,
        gameLog: [...prevGame.gameLog, logMessage],
        homeTeamPitcher: updatedHomePitcher,
        awayTeamPitcher: updatedAwayPitcher,
        homeTeamBatters: updatedHomeBatters,
        awayTeamBatters: updatedAwayBatters,
        effectiveHandedness: effectiveBatterHandedness,
    }));
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
      
      // Toggle runner selection
      setSelectedRunnersForSteal(prev =>
          prev.includes(baseIndex)
              ? prev.filter(idx => idx !== baseIndex)
              : [...prev, baseIndex]
      );
  };
  // This function is called by the new "Confirm Steal" button
  const confirmSteal = () => {
      // We are no longer resolving the steal here.
      // Instead, we just reset the UI and prepare the game state.
      setIsStealMode(false);
      
      // The runners have now been "flagged" for a steal attempt.
      // The resolution happens in the next roll.
  };
  const attemptSteal = () => {
      const battingTeam = game.battingTeam;
      const newBases = [...game.bases[game.battingTeam]];
      const newGameLog = [...game.gameLog];
      const newOuts = game.outs;

      selectedRunnersForSteal.forEach(baseIndex => {
          // You'll need to find the correct runner here
          // The previous simple logic of `game.currentBatterIndex - 1` won't work for multiple runners.
          // A better approach would be to track which player is on which base in your state.

          // Placeholder for a simple example
          const stealRoll = Math.floor(Math.random() * 20) + 1;
          const runnerSpeed = 10; // Placeholder for a real stat lookup

          if (stealRoll <= runnerSpeed) {
              // Success
              newGameLog.push(`Runner from ${baseIndex + 1}st/nd/rd base successfully steals! (Roll: ${stealRoll})`);
              // Logic to move the runner from baseIndex to baseIndex + 1
          } else {
              // Caught Stealing
              newGameLog.push(`Runner from ${baseIndex + 1}st/nd/rd base is caught stealing! (Roll: ${stealRoll})`);
              // Logic to remove the runner and add an out
          }
      });

      // Reset UI and state after the attempt
      setIsStealMode(false);
      setSelectedRunnersForSteal([]);

      setGame(prevGame => ({
          ...prevGame,
          bases: {
              ...prevGame.bases,
              [game.battingTeam]: newBases,
          },
          outs: newOuts,
          gameLog: newGameLog,
      }));
  };
  
  const updateBases = (currentBases, result, currentBatter) => {
    let newBases = [...currentBases]; 
    let score = 0;
    
    // Handle Walks (This logic is correct and remains unchanged)
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
    // Handle Singles (This is the section to update)
    else if (result.type === 'single') {
        // A single advances runners by at least two bases, and the batter to first.
        // Score runners from third
        if (newBases[2]) score++;
        
        // Score runners from second
        if (newBases[1]) score++;

        // Advance runners from first to second
        if (newBases[0]) newBases[1] = newBases[0];

        // The batter always goes to first
        newBases[0] = currentBatter;
        
        // Clear the old bases since everyone moved
        newBases[2] = null;
    }
    // Handle Doubles
    else if (result.type === 'double') {
        if (newBases[2]) score++;
        if (newBases[1]) score++;
        if (newBases[0]) newBases[2] = newBases[0];
        newBases[1] = currentBatter;
        newBases[0] = null;
    } 
    // Handle Triples
    else if (result.type === 'triple') {
        if (newBases[0]) score++;
        if (newBases[1]) score++;
        if (newBases[2]) score++;
        newBases = [null, null, null];
        newBases[2] = currentBatter;
    } 
    // Handle Homeruns
    else if (result.type === 'homerun') {
        score += (newBases[0] ? 1 : 0) + (newBases[1] ? 1 : 0) + (newBases[2] ? 1 : 0);
        newBases = [null, null, null];
        score++;
    } else {
        // For all other results (outs), no bases change
    }
    
    return { bases: newBases, score };
};
  

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Loading...</div>;
  }

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <h1 className="text-4xl font-bold mb-4">MLB Showdown</h1>
        <p className="mb-4">Signed in as: {userId}</p>
        <p className="mb-8">Test the core mechanics by playing against yourself!</p>
        <button
          onClick={createSoloGame}
          disabled={!isAuthReady}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
        >
          Start Solo Game
        </button>
      </div>
    );
  }
  // Now that we've returned early if `game` is null,
// it is safe to define these variables here.
  const battingTeam = game.battingTeam;
  const currentPitchingTeamData = battingTeam === 'home'
    ? cardData.awayTeam
    : cardData.homeTeam;

  const currentBatters = game?.battingTeam === 'home' ? game?.homeTeamBatters : game?.awayTeamBatters;
  const currentBatter = currentBatters?.[game?.currentBatterIndex];
  const currentPitcher = game?.battingTeam === 'home' ? game?.awayTeamPitcher : game?.homeTeamPitcher;
  const isTopInning = game?.battingTeam === 'away';

  // Determine the fielding team
  const fieldingTeam = game.battingTeam === 'home' ? game.awayTeamBatters : game.homeTeamBatters;

  // Filter for infielders (1B, 2B, SS, 3B)
  const infielders = fieldingTeam.filter(player => 
    player.position.includes('1B') || 
    player.position.includes('2B') || 
    player.position.includes('SS') || 
    player.position.includes('3B')
  );

  // Sum their fielding values
  const totalInfieldFielding = infielders.reduce((sum, player) => sum + player.fielding, 0);
  
  // Place this code block in your App component's main render logic,
  // right after you define the `currentBatter` variable.

  // Determine the team currently batting
  const currentBattersInLineup = battingTeam === 'home' ? game.homeTeamBatters : game.awayTeamBatters;

  // Calculate the index of the next batter
  let nextBatterIndex = game.currentBatterIndex + 1;

  // Loop back to the start of the lineup if at the end
  if (nextBatterIndex >= currentBattersInLineup.length) {
      nextBatterIndex = 0;
  }

// Get the on-deck batter object
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
      
      <div className="w-full max-w-4xl space-y-8">
        <div className="flex flex-col lg:flex-row lg:space-x-8">
          {/* Left Column: Scoreboard & Game Info */}
          <div className="flex-1 flex flex-col">
            
            {/* Compact Scoreboard Bug - Upper Left */}
            <div className="bg-gray-900 p-2 rounded-lg shadow-lg border border-gray-700 w-36 mb-6">
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
            
            {/* Current At-Bat Section */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 text-center">
              <h3 className="text-lg font-bold mb-2">Current At-Bat</h3>

                {/* Advantage Display */}
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
                {/* NEW BUTTON: Substitute */}
                <div className="flex justify-center mb-4">
                  <button
                    onClick={handleSubstitutePitcher}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full text-sm transition-colors"
                  >
                    Substitute Pitcher
                  </button>
                </div>
                {/* New 'Steal' toggle button */}
                {!isStealMode ? (
                    <button
                        onClick={() => setIsStealMode(true)}
                        disabled={!game?.bases?.[game.battingTeam]?.some(onBase => onBase)}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        🏃‍♂️ Steal Bases
                    </button>
                ) : (
                    <div className="flex flex-col items-center">
                        <button
                            onClick={confirmSteal}
                            disabled={selectedRunnersForSteal.length === 0}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-2"
                        >
                            Confirm Steal ({selectedRunnersForSteal.length})
                        </button>
                        <button
                            onClick={() => { setIsStealMode(false); setSelectedRunnersForSteal([]); }}
                            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-full text-sm transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                )}
                {/* Player Cards Side by Side with Roll Results */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Pitcher Card and Roll */}
                  <div className={`transition-all duration-500 ${
                    game.lastAdvantage === 'pitcher' ? 'ring-4 ring-green-400 ring-opacity-75 shadow-lg shadow-green-400/50' : ''
                  }`}>
                    {currentPitcher && (
                      <div className={`h-60 p-3 rounded-xl shadow-inner border-2 ${currentPitcher.team === 'home' ? 'border-red-600 bg-red-900/20' : 'border-blue-600 bg-blue-900/20'} ${
                        game.lastAdvantage === 'pitcher' ? 'bg-green-900/40 border-green-400' : ''
                      } text-left mb-3 transition-all duration-500`}>
                        <h4 className={`text-md font-bold mb-2 ${
                          game.lastAdvantage === 'pitcher' ? 'text-green-300' : ''
                        }`}>{currentPitcher.name}</h4>
                        <div className="flex justify-between items-center text-sm mb-2">
                          <span className="font-semibold text-gray-400">Control:</span>
                          <span className="font-bold text-yellow-300">{currentPitcher.stats.control}</span>
                        </div>
                        {/* Add this new section for Innings Pitched */}
                        <div className="flex justify-between items-center text-sm mb-2">
                          <span className="font-semibold text-gray-400">IP:</span>
                          <span className={`font-bold ${currentPitcher.stats.currentIP >= currentPitcher.stats.ip ? 'text-red-400' : 'text-blue-300'}`}>
                            {currentPitcher.stats.currentIP.toFixed(1) || 0} / {currentPitcher.stats.ip || 'N/A'}
                          </span>
                        </div>
                        <div className="border-t border-gray-700 my-2"></div>
                        <div className="overflow-y-auto max-h-32">
                          <ul className="text-xs space-y-1">
                            {currentPitcher.chart.map((item, index) => (
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
                    
                    {/* Static Pitcher Roll Area */}
                    <div className={`bg-gray-900 p-3 rounded-lg border-2 border-green-500 text-center transition-all duration-500 ${
                      game.lastAdvantage === 'pitcher' ? 'ring-2 ring-green-400 bg-green-900/30' : ''
                    }`}>
                      <div className="text-sm font-bold text-green-400">PITCHER ROLL</div>
                      <div className="text-2xl font-bold text-yellow-400">
                        {game.lastRoll1 || '-'}
                      </div>
                      <div className="text-xs text-gray-300">
                        {game.lastAdvantage ? `${game.lastAdvantage}'s Advantage` : 'Ready to Roll'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Batter Card and Roll */}
                  <div className={`transition-all duration-500 ${
                    game.lastAdvantage === 'batter' ? 'ring-4 ring-red-400 ring-opacity-75 shadow-lg shadow-red-400/50' : ''
                  }`}>
                    {currentBatter && (
                      <div className={`h-60 p-3 rounded-xl shadow-inner border-2 ${currentBatter.team === 'home' ? 'border-red-600 bg-red-900/20' : 'border-blue-600 bg-blue-900/20'} ${
                        game.lastAdvantage === 'batter' ? 'bg-red-900/40 border-red-400' : ''
                      } text-left mb-3 transition-all duration-500`}>
                        <h4 className={`text-md font-bold mb-2 ${
                          game.lastAdvantage === 'batter' ? 'text-red-300' : ''
                        }`}>{currentBatter.name}</h4>
                        <div className="flex justify-between items-center text-xs mb-2">
                          <span className="font-semibold text-gray-400">On-Base:</span>
                          <span className="font-bold text-green-400">{currentBatter.stats.ob}</span>
                          <span className="font-semibold text-gray-400">Power:</span>
                          <span className="font-bold text-red-400">{currentBatter.stats.pwr}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs mb-2">
                          <span className="font-semibold text-gray-400">Speed:</span>
                          <span className="font-bold text-red-400">{currentBatter.stats.speed}</span>
                        </div>

                        {/* NEW: Add position and fielding fields */}
                        <div className="flex justify-between items-center text-xs mb-2">
                          <span className="font-semibold text-gray-400">Position(s):</span>
                          <span className="font-bold text-yellow-300">{currentBatter.position.join(', ')}</span>
                        </div>
                        <div className="border-t border-gray-700 my-2"></div>
                        <div className="overflow-y-auto max-h-32">
                          <ul className="text-xs space-y-1">
                            {currentBatter.chart.map((item, index) => (
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
                    
                    {/* Static Batter Roll Area */}
                    <div className={`bg-gray-900 p-3 rounded-lg border-2 border-red-500 text-center transition-all duration-500 ${
                      game.lastAdvantage === 'batter' ? 'ring-2 ring-red-400 bg-red-900/30' : ''
                    }`}>
                      <div className="text-sm font-bold text-red-400">BATTER ROLL</div>
                      <div className="text-2xl font-bold text-yellow-400">
                        {game.lastRoll2 || '-'}
                      </div>
                      <div className="text-xs text-gray-300">
                        {game.lastResult || 'Waiting for Roll'}
                      </div>
                    </div>
                  </div>
              </div>
              
              {/* Action Buttons */}
              <div className="mt-8">
                {game.atBatPhase === 'firstRoll' && (
                  <button
                    onClick={rollForAdvantage}
                    disabled={!currentPitcher || !currentBatter}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    🎲 Pitcher Rolls for Advantage
                  </button>
                )}

                {game.atBatPhase === 'secondRoll' && (
                  <button
                    onClick={rollForAtBatResult}
                    disabled={!currentPitcher || !currentBatter}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    🎲 Batter Rolls for Result
                  </button>
                )}

                {game.atBatPhase === 'completed' && (
                  <button
                    onClick={advanceToNextAtBat}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-colors"
                  >
                    ➡️ Next At-Bat
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
                  {currentPitchingTeamData.pitchers
                    .filter(p => p.name !== currentPitcher.name) // This line still uses a potentially undefined currentPitcher
                    .map((pitcher) => (
                      <li
                        key={pitcher.name}
                        onClick={() => {
                          setGame(prevGame => ({
                            ...prevGame,
                            homeTeamPitcher: prevGame.battingTeam === 'away' ? { ...pitcher, stickers: pitcher.stickers || [] } : prevGame.homeTeamPitcher,
                            awayTeamPitcher: prevGame.battingTeam === 'home' ? { ...pitcher, stickers: pitcher.stickers || [] } : prevGame.awayTeamPitcher,
                          }));
                          setIsModalOpen(false);
                        }}
                        className="p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                      >
                        <span className="font-semibold text-white">{pitcher.name}</span>
                        <span className="text-sm text-gray-400 ml-2">(Control: {pitcher.stats.control})</span>
                      </li>
                    ))}
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
          {/* Right Column: Baseball Diamond */}
          <div className="flex-1 flex flex-col items-center">
            
            {/* Bases display with SVG - Bigger */}
            <div className="flex justify-center">
              <svg width="320" height="320" viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg" className="text-gray-600">
                {/* Infield */}
                <polygon points="160,280 280,160 160,40 40,160" fill="#2D4636" />
                
                {/* Bases */}
                <polygon points="160,280 180,260 180,240 140,240 140,260" fill="#D1D5DB" stroke="#D1D5DB" strokeWidth="1" />
                <polygon points="280,160 260,180 240,160 260,140" fill="#D1D5DB" stroke="#D1D5DB" strokeWidth="1" />
                <polygon points="160,40 180,60 160,80 140,60" fill="#D1D5DB" stroke="#D1D5DB" strokeWidth="1" />
                <polygon points="40,160 60,140 80,160 60,180" fill="#D1D5DB" stroke="#D1D5DB" strokeWidth="1" />
                
                {/* Runners */}
                {game.bases?.[game.battingTeam] && game.bases[game.battingTeam].map((onBase, index) => {
                  const baseCoords = [
                    { x: 260, y: 160 },  // First Base
                    { x: 160, y: 60 },   // Second Base
                    { x: 60, y: 160 },  // Third Base
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

                {/* Batter */}
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
            {/* --- NEW: Flex container to hold the stats tiles under the bases --- */}
            <div className="flex justify-center items-center gap-4 mt-6">
                {/* On-Deck Batter Tile */}
                {onDeckBatter && (
                    <div className={`p-2 rounded-xl shadow-inner border-2 ${onDeckBatter.team === 'home' ? 'border-red-600 bg-red-900/20' : 'border-blue-600 bg-blue-900/20'} text-center transition-all duration-500`}>
                        <h4 className="font-bold text-sm mb-1 text-blue-400">On Deck</h4>
                        <p className="text-lg font-semibold text-white">
                            {onDeckBatter.name}
                        </p>
                        <div className="flex justify-between items-center text-xs mt-2">
                            <span className="font-semibold text-gray-400">On-Base:</span>
                            <span className="font-bold text-green-400">{onDeckBatter.stats.ob}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs mt-2">
                            <span className="font-semibold text-gray-400">Hand:</span>
                            <span className="font-bold text-green-400">{onDeckBatter.handedness}</span>
                        </div>
                    </div>
                )}
                {/* Infield Fielding Sum */}
                <div className="bg-gray-800 h-24 p-2 rounded-xl border-2 border-green-500 text-center transition-all duration-500">
                    <h4 className="font-bold text-sm mb-1 text-blue-400">Infield Fielding Sum</h4>
                    <p className="text-2xl font-extrabold text-white mt-2">{totalInfieldFielding}</p>
                </div>
            </div>
            {/* Last Play Result */}
            <div className="text-center mt-6">
              <div className="text-lg font-bold text-blue-400">
                {game.lastResult ? `Last Play: ${game.lastResult}` : 'Game in Progress'}
              </div>
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

        {/* New Game Button */}
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
