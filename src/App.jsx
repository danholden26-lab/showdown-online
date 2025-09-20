import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import "./index.css";

const appId = "local-dev";
const initialAuthToken = null;

// Player card deck data with full MLB Showdown mechanics
const playerCardDeck = [
  // Home Team (Red)
  { 
    id: 'h_p_1', 
    name: 'Ace Chapman', 
    type: 'batter',
    handedness: 'right',
    team: 'home',
    stats: { ob: 10, pwr: 9 }, 
    chart: [
      { roll: [1, 4], result: 'out', text: 'Out (GB)', sticker: 'GB' },
      { roll: [5, 7], result: 'walk', text: 'Walk', sticker: 'BB' },
      { roll: [8, 14], result: 'single', text: 'Single', sticker: 'H' },
      { roll: [15, 18], result: 'double', text: 'Double', sticker: 'XBH' },
      { roll: [19, 20], result: 'homerun', text: 'Home Run', sticker: 'HR' },
    ]
  },
  { 
    id: 'h_p_2', 
    name: 'Ohhei Shotani', 
    type: 'batter',
    handedness: 'right',
    team: 'home',
    stats: { ob: 10, pwr: 9 }, 
    chart: [
      { roll: [1, 5], result: 'out', text: 'Out (GB)', sticker: 'GB' },
      { roll: [6, 12], result: 'walk', text: 'Walk', sticker: 'BB' },
      { roll: [13, 16], result: 'single', text: 'Single', sticker: 'H' },
      { roll: [15, 15], result: 'double', text: 'Double', sticker: 'XBH' },
      { roll: [16, 16], result: 'triple', text: 'Triple', sticker: 'XBH' },
      { roll: [17, 20], result: 'homerun', text: 'Home Run', sticker: 'HR' },
    ]
  },
  { 
    id: 'h_p_3',
    name: 'Blake Burton', 
    type: 'batter',
    handedness: 'left',
    team: 'home',
    stats: { ob: 5, pwr: 10 }, 
    chart: [
      { roll: [1, 7], result: 'out', text: 'Out (GB)', sticker: 'GB' },
      { roll: [8, 14], result: 'single', text: 'Single', sticker: 'H' },
      { roll: [15, 17], result: 'double', text: 'Double', sticker: 'XBH' },
      { roll: [18, 20], result: 'homerun', text: 'Home Run', sticker: 'HR' },
    ]
  },
  { 
    id: 'h_p_4',
    name: 'Zarry Bito',
    type: 'pitcher',
    handedness: 'left',
    team: 'home',
    stats: { control: 4, pos: 'SP', ip: 6 },
    chart: [
      { roll: [1, 3], result: 'out', text: 'Out (PU)', sticker: '' },
      { roll: [4, 9], result: 'strikeout', text: 'Out (SO)', sticker: 'K' },
      { roll: [10, 13], result: 'out', text: 'Out (GB)', sticker: '' },
      { roll: [14, 17], result: 'out', text: 'Out (FB)', sticker: '' },
      { roll: [18, 23], result: 'single', text: 'Single', sticker: '' },
      { roll: [24, 30], result: 'homerun', text: 'Home Run', sticker: '' },
    ]
  },
  { 
    id: 'h_p_5', 
    name: 'A-Rod', 
    type: 'batter',
    handedness: 'right',
    team: 'home',
    stats: { ob: 12, pwr: 8 }, 
    chart: [
      { roll: [1, 3], result: 'out', text: 'Out (PU)', sticker: '' },
      { roll: [4, 6], result: 'walk', text: 'Walk', sticker: 'BB' },
      { roll: [7, 13], result: 'single', text: 'Single', sticker: 'H' },
      { roll: [14, 17], result: 'double', text: 'Double', sticker: 'XBH' },
      { roll: [18, 20], result: 'homerun', text: 'Home Run', sticker: 'HR' },
    ]
  },
  
  // Away Team (Blue)
  { 
    id: 'a_p_1', 
    name: 'Mike Trout', 
    type: 'batter',
    handedness: 'right',
    team: 'away',
    stats: { ob: 15, pwr: 12 }, 
    chart: [
      { roll: [1, 5], result: 'out', text: 'Out (GB)', sticker: '' },
      { roll: [6, 12], result: 'walk', text: 'Walk', sticker: 'BB' },
      { roll: [13, 16], result: 'single', text: 'Single', sticker: 'H' },
      { roll: [17, 19], result: 'double', text: 'Double', sticker: 'XBH' },
      { roll: [20, 20], result: 'homerun', text: 'Home Run', sticker: 'HR' },
    ]
  },
  { 
    id: 'a_p_2', 
    name: 'Jacob deGrom', 
    type: 'pitcher',
    handedness: 'right',
    team: 'away',
    stats: { control: 3, pos: 'SP', ip: 8 }, 
    chart: [
      { roll: [1, 2], result: 'out', text: 'Out (FB)', sticker: '' },
      { roll: [3, 8], result: 'strikeout', text: 'Out (SO)', sticker: 'K' },
      { roll: [9, 12], result: 'out', text: 'Out (GB)', sticker: '' },
      { roll: [13, 16], result: 'single', text: 'Single', sticker: '' },
      { roll: [17, 19], result: 'double', text: 'Double', sticker: '' },
      { roll: [20, 20], result: 'homerun', text: 'Home Run', sticker: '' },
    ]
  },
  { 
    id: 'a_p_3', 
    name: 'Ronald Acuna Jr.', 
    type: 'batter',
    handedness: 'right',
    team: 'away',
    stats: { ob: 14, pwr: 11 }, 
    chart: [
      { roll: [1, 4], result: 'out', text: 'Out (GB)', sticker: 'GB' },
      { roll: [5, 8], result: 'walk', text: 'Walk', sticker: 'BB' },
      { roll: [9, 15], result: 'single', text: 'Single', sticker: 'H' },
      { roll: [16, 18], result: 'double', text: 'Double', sticker: 'XBH' },
      { roll: [19, 20], result: 'homerun', text: 'Home Run', sticker: 'HR' },
    ]
  },
  { 
    id: 'a_p_4', 
    name: 'Fernando Tatis Jr.', 
    type: 'batter',
    handedness: 'right',
    team: 'away',
    stats: { ob: 13, pwr: 10 }, 
    chart: [
      { roll: [1, 4], result: 'out', text: 'Out (GB)', sticker: 'GB' },
      { roll: [5, 7], result: 'walk', text: 'Walk', sticker: 'BB' },
      { roll: [8, 14], result: 'single', text: 'Single', sticker: 'H' },
      { roll: [15, 17], result: 'double', text: 'Double', sticker: 'XBH' },
      { roll: [18, 20], result: 'homerun', text: 'Home Run', sticker: 'HR' },
    ]
  },
  { 
    id: 'a_p_5', 
    name: 'Trea Turner', 
    type: 'batter',
    handedness: 'right',
    team: 'away',
    stats: { ob: 12, pwr: 9 }, 
    chart: [
      { roll: [1, 4], result: 'out', text: 'Out (GB)', sticker: 'GB' },
      { roll: [5, 7], result: 'walk', text: 'Walk', sticker: 'BB' },
      { roll: [8, 15], result: 'single', text: 'Single', sticker: 'H' },
      { roll: [16, 18], result: 'double', text: 'Double', sticker: 'XBH' },
      { roll: [19, 20], result: 'triple', text: 'Triple', sticker: 'XBH' },
    ]
  },
];

const App = () => {
  const [game, setGame] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

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

    const homeTeamPitcher = { ...playerCardDeck.find(card => card.team === 'home' && card.type === 'pitcher'), stickers: [] };
    const homeTeamBatters = playerCardDeck.filter(card => card.team === 'home' && card.type === 'batter').map(card => ({...card, stickers: []}));
    const awayTeamPitcher = { ...playerCardDeck.find(card => card.team === 'away' && card.type === 'pitcher'), stickers: [] };
    const awayTeamBatters = playerCardDeck.filter(card => card.team === 'away' && card.type === 'batter').map(card => ({...card, stickers: []}));
    
    const newGame = {
      isSoloGame: true,
      inning: 1,
      outs: 0,
      score: { home: 0, away: 0 },
      bases: { home: [false, false, false], away: [false, false, false] },
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

  const advanceToNextAtBat = () => {
    if (!game) return;

    setGame(prev => ({
      ...prev,
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
    let currentBatter = battingTeam === 'home' 
      ? game.homeTeamBatters[game.currentBatterIndex]
      : game.awayTeamBatters[game.currentBatterIndex];
    let currentPitcher = battingTeam === 'home' ? game.awayTeamPitcher : game.homeTeamPitcher;

    const cardToUse = game.currentAdvantage === 'pitcher' ? currentPitcher : currentBatter;
    const roll2 = Math.floor(Math.random() * 20) + 1;
    const result = getAtBatResult(roll2, cardToUse);
    let logMessage = `${currentBatter.name} rolls a ${roll2} against ${cardToUse.name}'s card (${game.currentAdvantage}'s advantage). Result: ${result.text}`;
    
    let newOuts = game.outs;
    let newScore = { ...game.score };
    let newBases = { ...game.bases };
    let newBatterIndex = game.currentBatterIndex;
    let nextBattingTeam = battingTeam;
    let nextInning = game.inning;

    if (result.type === 'out' || result.type === 'strikeout') {
      newOuts++;
    } else {
      const { bases: updatedBases, score: runs } = updateBases(game.bases[battingTeam], result);
      newBases[battingTeam] = updatedBases;
      newScore[battingTeam] += runs;
    }
    
    const updatedTeamBatters = battingTeam === 'home' ? [...game.homeTeamBatters] : [...game.awayTeamBatters];
    let updatedTeamPitcher = fieldingTeam === 'home' ? { ...game.homeTeamPitcher } : { ...game.awayTeamPitcher };
    
    // Add sticker logic
    if (result.sticker) {
      if (game.currentAdvantage === 'batter') {
        currentBatter = { ...currentBatter, stickers: [...currentBatter.stickers, result.sticker] };
        updatedTeamBatters[game.currentBatterIndex] = currentBatter;
      } else {
        currentPitcher = { ...currentPitcher, stickers: [...currentPitcher.stickers, result.sticker] };
        updatedTeamPitcher = { ...updatedTeamPitcher, stickers: [...(updatedTeamPitcher.stickers || []), result.sticker] };
      }
    }
    
    if (newOuts >= 3) {
      logMessage += ` Inning over! The ${battingTeam} team is done batting.`;
      newOuts = 0;
      newBases[battingTeam] = [false, false, false];
      newBatterIndex = 0;
      nextBattingTeam = fieldingTeam;
      nextInning = game.inning % 1 === 0 ? game.inning + 0.5 : game.inning + 0.5;
    } else {
      newBatterIndex++;
      if (newBatterIndex >= updatedTeamBatters.length) {
        newBatterIndex = 0;
      }
    }

    const updateData = { 
      ...game,
      outs: newOuts, 
      score: newScore,
      bases: newBases,
      battingTeam: nextBattingTeam,
      inning: nextInning,
      currentBatterIndex: newBatterIndex,
      atBatPhase: 'completed',
      lastRoll2: roll2,
      lastResult: result.text,
      gameLog: [...game.gameLog, logMessage]
    };

    if (battingTeam === 'home') {
      updateData.homeTeamBatters = updatedTeamBatters;
      updateData.awayTeamPitcher = updatedTeamPitcher;
    } else {
      updateData.awayTeamBatters = updatedTeamBatters;
      updateData.homeTeamPitcher = updatedTeamPitcher;
    }
    
    setGame(updateData);
  };

  const getAtBatResult = (roll, card) => {
    for (const entry of card.chart) {
      if (roll >= entry.roll[0] && roll <= entry.roll[1]) {
        return { type: entry.result, text: entry.text, sticker: entry.sticker };
      }
    }
    return { type: 'out', text: 'Out', sticker: 'GB' };
  };

  const updateBases = (currentBases, result) => {
    let newBases = [...currentBases];
    let score = 0;
    
    if (result.type === 'walk') {
      if (newBases[0] && newBases[1] && newBases[2]) {
        score++;
      }
      if (newBases[1] && newBases[0]) {
        newBases[2] = true;
      }
      if (newBases[0]) {
        newBases[1] = true;
      }
      newBases[0] = true;
    } else if (result.type === 'single') {
      const nextBases = [false, false, false];
      if (newBases[2]) {
        score++;
      }
      if (newBases[1]) {
        nextBases[2] = true;
      }
      if (newBases[0]) {
        nextBases[1] = true;
      }
      nextBases[0] = true;
      return { bases: nextBases, score };
    } else if (result.type === 'double') {
      if (newBases[2]) { score++; }
      if (newBases[1]) { score++; }
      if (newBases[0]) { newBases[2] = true; }
      newBases[1] = true;
      newBases[0] = false;
    } else if (result.type === 'triple') {
      if (newBases[0]) { score++; }
      if (newBases[1]) { score++; }
      if (newBases[2]) { score++; }
      newBases = [false, false, false];
      newBases[2] = true;
    } else if (result.type === 'homerun') {
      score += (newBases[0] ? 1 : 0) + (newBases[1] ? 1 : 0) + (newBases[2] ? 1 : 0);
      newBases = [false, false, false];
      score++;
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

  const currentBatters = game?.battingTeam === 'home' ? game?.homeTeamBatters : game?.awayTeamBatters;
  const currentBatter = currentBatters?.[game?.currentBatterIndex];
  const currentPitcher = game?.battingTeam === 'home' ? game?.awayTeamPitcher : game?.homeTeamPitcher;
  const isTopInning = game?.battingTeam === 'away';

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
                      <h4 className={`text-lg font-bold mb-2 ${
                        game.lastAdvantage === 'pitcher' ? 'text-green-300' : ''
                      }`}>{currentPitcher.name} (P)</h4>
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="font-semibold text-gray-400">Control:</span>
                        <span className="font-bold text-yellow-300">{currentPitcher.stats.control}</span>
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
                      <h4 className={`text-lg font-bold mb-2 ${
                        game.lastAdvantage === 'batter' ? 'text-red-300' : ''
                      }`}>{currentBatter.name} (B)</h4>
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="font-semibold text-gray-400">On-Base:</span>
                        <span className="font-bold text-green-400">{currentBatter.stats.ob}</span>
                        <span className="font-semibold text-gray-400">Power:</span>
                        <span className="font-bold text-red-400">{currentBatter.stats.pwr}</span>
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
