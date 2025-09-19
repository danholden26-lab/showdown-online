import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection, query, where, addDoc, getDoc, getDocs, updateDoc } from 'firebase/firestore';

// Player Card Data for both teams
const teams = {
  home: {
    name: 'Home Team',
    color: 'red',
    pitchers: [
      { 
        id: 'h_p_1',
        name: 'Zarry Bito',
        type: 'pitcher',
        handedness: 'left',
        stats: { control: 4, pos: 'SP', ip: 6 },
        chart: [
          { roll: [1, 3], result: 'out', text: 'Out (PU)', sticker: '' },
          { roll: [4, 9], result: 'strikeout', text: 'Out (SO)', sticker: 'K' },
          { roll: [10, 13], result: 'out', text: 'Out (GB)', sticker: '' },
          { roll: [14, 17], result: 'out', text: 'Out (FB)', sticker: '' },
          { roll: [18, 23], result: 'single', text: 'Single', sticker: 'H' },
          { roll: [24, 30], result: 'homerun', text: 'Home Run', sticker: 'XBH' },
        ]
      },
      { 
        id: 'h_p_2',
        name: 'Trey Vancini',
        type: 'pitcher',
        handedness: 'right',
        stats: { control: 5, pos: 'RP', ip: 2 },
        chart: [
          { roll: [1, 5], result: 'strikeout', text: 'Out (SO)', sticker: 'K' },
          { roll: [6, 12], result: 'out', text: 'Out (FB)', sticker: '' },
          { roll: [13, 17], result: 'out', text: 'Out (GB)', sticker: '' },
          { roll: [18, 20], result: 'single', text: 'Single', sticker: 'H' },
          { roll: [21, 30], result: 'homerun', text: 'Home Run', sticker: 'XBH' },
        ]
      }
    ],
    batters: [
      { 
        id: 'h_b_1', 
        name: 'Ace Chapman', 
        type: 'batter',
        handedness: 'right',
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
        id: 'h_b_2',
        name: 'Blake Burton', 
        type: 'batter',
        handedness: 'left',
        stats: { ob: 5, pwr: 10 }, 
        chart: [
          { roll: [1, 7], result: 'out', text: 'Out (GB)', sticker: 'GB' },
          { roll: [8, 14], result: 'single', text: 'Single', sticker: 'H' },
          { roll: [15, 17], result: 'double', text: 'Double', sticker: 'XBH' },
          { roll: [18, 20], result: 'homerun', text: 'Home Run', sticker: 'HR' },
        ]
      },
      { 
        id: 'h_b_3',
        name: 'Ohhei Shotani', 
        type: 'batter',
        handedness: 'right',
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
        id: 'h_b_4',
        name: 'Jeter Darrison',
        type: 'batter',
        handedness: 'switch',
        stats: {
          right: { ob: 8, pwr: 11 },
          left: { ob: 12, pwr: 8 }
        },
        chart: [
          { roll: [1, 5], result: 'out', text: 'Out (FB)', sticker: 'FB' },
          { roll: [6, 12], result: 'walk', text: 'Walk', sticker: 'BB' },
          { roll: [13, 16], result: 'single', text: 'Single', sticker: 'H' },
          { roll: [17, 18], result: 'double', text: 'Double', sticker: 'XBH' },
          { roll: [19, 20], result: 'homerun', text: 'Home Run', sticker: 'HR' },
        ]
      }
    ]
  },
  away: {
    name: 'Away Team',
    color: 'blue',
    pitchers: [
      {
        id: 'a_p_1',
        name: 'Max Scherzer',
        type: 'pitcher',
        handedness: 'right',
        stats: { control: 5, pos: 'SP', ip: 7 },
        chart: [
          { roll: [1, 5], result: 'strikeout', text: 'Out (SO)', sticker: 'K' },
          { roll: [6, 10], result: 'out', text: 'Out (PU)', sticker: '' },
          { roll: [11, 14], result: 'out', text: 'Out (GB)', sticker: '' },
          { roll: [15, 17], result: 'single', text: 'Single', sticker: 'H' },
          { roll: [18, 20], result: 'homerun', text: 'Home Run', sticker: 'XBH' },
        ]
      },
      {
        id: 'a_p_2',
        name: 'Clayton Kershaw',
        type: 'pitcher',
        handedness: 'left',
        stats: { control: 6, pos: 'RP', ip: 3 },
        chart: [
          { roll: [1, 8], result: 'strikeout', text: 'Out (SO)', sticker: 'K' },
          { roll: [9, 13], result: 'out', text: 'Out (PU)', sticker: '' },
          { roll: [14, 16], result: 'out', text: 'Out (GB)', sticker: '' },
          { roll: [17, 19], result: 'single', text: 'Single', sticker: 'H' },
          { roll: [20, 30], result: 'homerun', text: 'Home Run', sticker: 'XBH' },
        ]
      }
    ],
    batters: [
      {
        id: 'a_b_1',
        name: 'Mike Trout',
        type: 'batter',
        handedness: 'right',
        stats: { ob: 11, pwr: 10 },
        chart: [
          { roll: [1, 3], result: 'out', text: 'Out (FB)', sticker: 'FB' },
          { roll: [4, 6], result: 'walk', text: 'Walk', sticker: 'BB' },
          { roll: [7, 15], result: 'single', text: 'Single', sticker: 'H' },
          { roll: [16, 18], result: 'double', text: 'Double', sticker: 'XBH' },
          { roll: [19, 20], result: 'homerun', text: 'Home Run', sticker: 'HR' },
        ]
      },
      {
        id: 'a_b_2',
        name: 'Mookie Betts',
        type: 'batter',
        handedness: 'right',
        stats: { ob: 12, pwr: 9 },
        chart: [
          { roll: [1, 2], result: 'out', text: 'Out (GB)', sticker: 'GB' },
          { roll: [3, 10], result: 'walk', text: 'Walk', sticker: 'BB' },
          { roll: [11, 15], result: 'single', text: 'Single', sticker: 'H' },
          { roll: [16, 18], result: 'double', text: 'Double', sticker: 'XBH' },
          { roll: [19, 20], result: 'homerun', text: 'Home Run', sticker: 'HR' },
        ]
      },
      {
        id: 'a_b_3',
        name: 'Ronald Acuña Jr.',
        type: 'batter',
        handedness: 'right',
        stats: { ob: 9, pwr: 12 },
        chart: [
          { roll: [1, 4], result: 'out', text: 'Out (FB)', sticker: 'FB' },
          { roll: [5, 10], result: 'single', text: 'Single', sticker: 'H' },
          { roll: [11, 15], result: 'walk', text: 'Walk', sticker: 'BB' },
          { roll: [16, 17], result: 'double', text: 'Double', sticker: 'XBH' },
          { roll: [18, 20], result: 'homerun', text: 'Home Run', sticker: 'HR' },
        ]
      },
      {
        id: 'a_b_4',
        name: 'Bryce Harper',
        type: 'batter',
        handedness: 'left',
        stats: { ob: 10, pwr: 11 },
        chart: [
          { roll: [1, 5], result: 'out', text: 'Out (GB)', sticker: 'GB' },
          { roll: [6, 11], result: 'walk', text: 'Walk', sticker: 'BB' },
          { roll: [12, 16], result: 'single', text: 'Single', sticker: 'H' },
          { roll: [17, 18], result: 'double', text: 'Double', sticker: 'XBH' },
          { roll: [19, 20], result: 'homerun', text: 'Home Run', sticker: 'HR' },
        ]
      }
    ]
  }
};

// Global variables provided by the environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Player Card Component
const PlayerCard = ({ player, isPitcher, stickers, effectiveHandedness, teamColor, inningsPitched, onSubstituteClick }) => {
  if (!player) return null;

  const cardBgColor = teamColor === 'red' ? 'bg-red-700' : 'bg-blue-700';
  const cardBorderColor = teamColor === 'red' ? 'border-red-600' : 'border-blue-600';
  const handednessDisplay = player.handedness === 'switch' ? 'Switch Hitter' : `${player.handedness}-handed`;
  const displayedStats = isPitcher ? player.stats : player.handedness === 'switch' ? player.stats[effectiveHandedness] : player.stats;
  
  // Calculate effective control
  let effectiveControl = displayedStats.control;
  if (isPitcher && inningsPitched > player.stats.ip) {
      effectiveControl = Math.max(1, effectiveControl - (inningsPitched - player.stats.ip));
  }

  return (
    <div className={`${cardBgColor} p-4 rounded-xl shadow-lg border ${cardBorderColor} w-full relative`}>
      <div className="text-center mb-2">
        <h4 className="text-xl font-bold">{player.name}</h4>
        <p className="text-sm text-gray-200 capitalize">{player.type}</p>
        <p className="text-sm text-gray-200 capitalize">{handednessDisplay}</p>
      </div>
      <div className="flex justify-around text-center mb-4">
        {isPitcher ? (
          <div className="flex flex-col items-center">
            <p className="text-2xl font-bold text-yellow-300">{effectiveControl}</p>
            <p className="text-sm text-gray-200">Control</p>
            <p className="text-xs text-gray-300">(IP: {inningsPitched}/{player.stats.ip})</p>
            <button onClick={onSubstituteClick} className="mt-2 bg-gray-600 hover:bg-gray-700 text-white text-xs font-bold py-1 px-3 rounded-full">
              Substitute
            </button>
          </div>
        ) : (
          <>
            <div>
              <p className="text-2xl font-bold text-blue-300">{displayedStats.ob}</p>
              <p className="text-sm text-gray-200">On-Base</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-300">{displayedStats.pwr}</p>
              <p className="text-sm text-gray-200">Power</p>
            </div>
          </>
        )}
      </div>
      <div className="space-y-1">
        <h5 className="text-sm font-semibold mb-1">Chart</h5>
        {player.chart.map((entry, index) => (
          <div key={index} className="flex items-center justify-between bg-gray-600 p-2 rounded-lg">
            <span className="text-xs font-mono">{entry.roll[0]}-{entry.roll[1]}</span>
            <span className="text-sm font-medium">{entry.text}</span>
            {entry.sticker && (
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-gray-800 text-gray-300">{entry.sticker}</span>
            )}
          </div>
        ))}
      </div>
      {/* Display Stickers */}
      {stickers && stickers.length > 0 && (
        <div className="absolute top-2 right-2 flex flex-wrap gap-1">
          {stickers.map((sticker, index) => (
            <span key={index} className="bg-blue-500 text-white text-xs font-bold rounded-full px-2 py-1 shadow">
              {sticker}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// Main App Component
const App = () => {
  const [user, setUser] = useState(null);
  const [game, setGame] = useState(null);
  const [gameId, setGameId] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [diceRollValue, setDiceRollValue] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [availablePitchers, setAvailablePitchers] = useState([]);

  // Firestore path constants
  const gamesCollectionPath = `/artifacts/${appId}/public/data/games`;

  const baseCoordinates = [
    { x: 250, y: 150 },  // First Base
    { x: 150, y: 25 },   // Second Base
    { x: 50, y: 150 },  // Third Base
  ];
  const batterBoxCoordinates = {
    right: { x: 100, y: 250 },
    left: { x: 200, y: 250 }
  };

  // Auth Effect: Sign in and set up listener
  useEffect(() => {
    const authSetup = async () => {
      try {
        if (initialAuthToken) {
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Firebase Auth Error:", error);
        setMessage("Failed to authenticate. Please try again.");
      }
    };

    authSetup();

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Firestore Effect: Listen for game state changes
  useEffect(() => {
    if (!gameId || !user) return;

    const gameDocRef = doc(db, gamesCollectionPath, gameId);
    const unsubscribeSnapshot = onSnapshot(gameDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const gameData = snapshot.data();
        setGame(gameData);
      } else {
        setGame(null);
      }
    }, (error) => {
      console.error("Firestore Snapshot Error:", error);
      setMessage("Failed to fetch game data. Please try again.");
    });

    return () => unsubscribeSnapshot();
  }, [gameId, user]);
  
  const showInfoModal = (msg) => {
    setModalMessage(msg);
    setShowModal(true);
  };
  
  const createSoloGame = async () => {
    if (!user) {
      showInfoModal("Authentication is not ready. Please wait.");
      return;
    }

    setLoading(true);
    try {
      const newGameDocRef = doc(collection(db, gamesCollectionPath));
      
      const allPlayers = [
        ...teams.home.batters, ...teams.home.pitchers, 
        ...teams.away.batters, ...teams.away.pitchers
      ];
      const initialStickers = {};
      allPlayers.forEach(card => initialStickers[card.id] = []);
      
      const initialInningScores = { home: {}, away: {} };
      for (let i = 1; i <= 9; i++) {
        initialInningScores.home[i.toString()] = 0;
        initialInningScores.away[i.toString()] = 0;
      }
      
      await setDoc(newGameDocRef, {
        player1Id: user.uid,
        player2Id: user.uid,
        isSoloGame: true,
        turn: user.uid,
        inning: 1,
        inningHalf: 'top',
        outs: 0,
        homeScore: 0,
        awayScore: 0,
        bases: [false, false, false],
        gameLog: [`Solo game started. It's the top of the 1st inning. Away Team is batting.`],
        homeBattingLineup: teams.home.batters,
        awayBattingLineup: teams.away.batters,
        homePitcher: teams.home.pitchers[0],
        awayPitcher: teams.away.pitchers[0],
        pitcherIP: {
          home: 0,
          away: 0,
        },
        currentBatterIndexHome: 0,
        currentBatterIndexAway: 0,
        stickers: initialStickers,
        status: 'started',
        atBatPhase: 'firstRoll',
        inningScores: initialInningScores
      });

      setGameId(newGameDocRef.id);
    } catch (error) {
      console.error("Error creating solo game:", error);
      setMessage("Failed to create solo game. " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const rollDice = (callback) => {
    setIsRolling(true);
    let counter = 0;
    const interval = setInterval(() => {
      setDiceRollValue(Math.floor(Math.random() * 20) + 1);
      counter++;
      if (counter > 10) { // Roll for about 1 second
        clearInterval(interval);
        const finalRoll = Math.floor(Math.random() * 20) + 1;
        setDiceRollValue(finalRoll);
        setIsRolling(false);
        callback(finalRoll);
      }
    }, 100);
  };

  const rollForAdvantage = async () => {
    if (!user || !game || isRolling) return;
    
    rollDice(async (roll1) => {
      const isSoloTurn = game.isSoloGame;
      if (!isSoloTurn) {
          showInfoModal("This game is for solo play only. Please create a new solo game.");
          return;
      }
      
      const currentBatter = game.inningHalf === 'top' ? game.awayBattingLineup[game.currentBatterIndexAway] : game.homeBattingLineup[game.currentBatterIndexHome];
      const currentPitcher = game.inningHalf === 'top' ? game.homePitcher : game.awayPitcher;
      
      if (!currentBatter || !currentPitcher) {
        showInfoModal("Please select a pitcher and batter to continue.");
        return;
      }
  
      let batterOB = currentBatter.stats.ob;
      let effectiveHandedness = currentBatter.handedness;
      if (currentBatter.handedness === 'switch') {
          effectiveHandedness = currentPitcher.handedness === 'left' ? 'right' : 'left';
          batterOB = currentBatter.stats[effectiveHandedness].ob;
      }
      
      // Implement pitcher fatigue logic
      let effectiveControl = currentPitcher.stats.control;
      const pitcherIP = game.inningHalf === 'top' ? game.pitcherIP.home : game.pitcherIP.away;
      if (pitcherIP > currentPitcher.stats.ip) {
        effectiveControl = Math.max(1, effectiveControl - (pitcherIP - currentPitcher.stats.ip));
      }
      
      const pitcherAdvantageScore = roll1 + effectiveControl;
      const isPitcherAdvantage = pitcherAdvantageScore > batterOB;
      const currentAdvantage = isPitcherAdvantage ? 'pitcher' : 'batter';
  
      const logMessage = `${currentPitcher.name} pitches to ${currentBatter.name}. You roll a ${roll1}. Pitcher's score: ${pitcherAdvantageScore}, Batter's On-Base: ${batterOB}. It is a ${currentAdvantage}'s advantage!`;
  
      await updateDoc(doc(db, gamesCollectionPath, gameId), {
        atBatPhase: 'secondRoll',
        currentAdvantage: currentAdvantage,
        gameLog: [...game.gameLog, logMessage],
        effectiveHandedness: effectiveHandedness,
        roll1: roll1,
        roll2: null, 
        atBatResultText: null, 
        pitcherAdvantageScore: pitcherAdvantageScore,
        batterOB: batterOB
      });
    });
  };

  const rollForAtBatResult = async () => {
    if (!user || !game || isRolling) return;

    rollDice(async (roll2) => {
      const isSoloTurn = game.isSoloGame;
      
      if (!isSoloTurn) {
        showInfoModal("This game is for solo play only. Please create a new solo game.");
        return;
      }
      
      const currentBatter = game.inningHalf === 'top' ? game.awayBattingLineup[game.currentBatterIndexAway] : game.homeBattingLineup[game.currentBatterIndexHome];
      const currentPitcher = game.inningHalf === 'top' ? game.homePitcher : game.awayPitcher;
      const cardToUse = game.currentAdvantage === 'pitcher' ? currentPitcher : currentBatter;
  
      const result = getAtBatResult(roll2, cardToUse);
      let logMessage = `${currentBatter.name} rolls a ${roll2}. Result: ${result.text}`;
      
      const newOuts = game.outs + (result.type === 'out' || result.type === 'strikeout' ? 1 : 0);
      const { bases: newBases, score: runScore } = updateBases(game.bases, result);
      
      const newInningScores = { ...game.inningScores };
      if (game.inningHalf === 'top') {
        newInningScores.away[game.inning] += runScore;
      } else {
        newInningScores.home[game.inning] += runScore;
      }
  
      // Handle stickers
      const updatedStickers = { ...game.stickers };
      const offensiveResults = ['single', 'double', 'triple', 'homerun', 'walk'];
      const defensiveResults = ['out', 'strikeout'];
      
      if (result.sticker) {
        let stickerPlayerId = null;
        if (offensiveResults.includes(result.type)) {
          stickerPlayerId = currentBatter.id;
        } else if (defensiveResults.includes(result.type)) {
          stickerPlayerId = currentPitcher.id;
        }
      
        if (stickerPlayerId) {
          if (!updatedStickers[stickerPlayerId]) {
            updatedStickers[stickerPlayerId] = [];
          }
          updatedStickers[stickerPlayerId].push(result.sticker);
        }
      }
  
      const nextBatterIndexHome = (game.currentBatterIndexHome + 1) % game.homeBattingLineup.length;
      const nextBatterIndexAway = (game.currentBatterIndexAway + 1) % game.awayBattingLineup.length;
      
      const updatedGame = { 
          ...game, 
          bases: newBases, 
          outs: newOuts, 
          homeScore: Object.values(newInningScores.home).reduce((sum, current) => sum + current, 0),
          awayScore: Object.values(newInningScores.away).reduce((sum, current) => sum + current, 0),
          currentBatterIndexHome: game.inningHalf === 'bottom' && newOuts < 3 ? nextBatterIndexHome : game.currentBatterIndexHome,
          currentBatterIndexAway: game.inningHalf === 'top' && newOuts < 3 ? nextBatterIndexAway : game.currentBatterIndexAway,
          stickers: updatedStickers,
          inningScores: newInningScores
      };
  
      if (newOuts >= 3) {
        logMessage += ` The inning has ended with 3 outs.`;
        
        const newPitcherIP = { ...game.pitcherIP };
        if (game.inningHalf === 'top') {
          updatedGame.inningHalf = 'bottom';
          newPitcherIP.home += 1; // Increment IP for the home pitcher
          logMessage += ` It's now the bottom of the ${game.inning} inning.`;
        } else {
          updatedGame.inningHalf = 'top';
          updatedGame.inning = updatedGame.inning + 1;
          newPitcherIP.away += 1; // Increment IP for the away pitcher
          logMessage += ` It's now the top of the ${updatedGame.inning} inning.`;
        }
        updatedGame.outs = 0;
        updatedGame.bases = [false, false, false];
        updatedGame.pitcherIP = newPitcherIP;
      }
      
      await updateDoc(doc(db, gamesCollectionPath, gameId), {
        ...updatedGame,
        gameLog: [...game.gameLog, logMessage],
        atBatPhase: 'firstRoll',
        roll2: roll2,
        atBatResultText: result.text
      });
    });
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
    let score = 0;
    let bases = [...currentBases];
  
    if (result.type === 'walk') {
      if (bases[0] && bases[1] && bases[2]) {
        score++; // Bases loaded, force home a run
      }
      if (bases[1] && bases[0]) {
        bases[2] = true; // Runner on 2nd moves to 3rd
      }
      if (bases[0]) {
        bases[1] = true; // Runner on 1st moves to 2nd
      }
      bases[0] = true; // Batter goes to first
    } else if (result.type === 'single') {
      const runnersWhoScore = bases.filter((onBase, index) => onBase && index === 2).length;
      score += runnersWhoScore;
  
      const newBases = [true, false, false]; // Batter is on first
  
      if (bases[0]) {
        newBases[1] = true; // Runner on first goes to second
      }
      if (bases[1]) {
        newBases[2] = true; // Runner on second goes to third
      }
      bases = newBases;
    } else if (result.type === 'double') {
      score += bases[2] ? 1 : 0;
      score += bases[1] ? 1 : 0;
      if (bases[0]) { bases[2] = true; }
      bases[1] = true;
      bases[0] = false;
    } else if (result.type === 'triple') {
      score += bases[2] ? 1 : 0;
      score += bases[1] ? 1 : 0;
      score += bases[0] ? 1 : 0;
      bases[2] = true;
      bases[1] = false;
      bases[0] = false;
    } else if (result.type === 'homerun') {
      score++;
      score += bases[0] ? 1 : 0;
      score += bases[1] ? 1 : 0;
      score += bases[2] ? 1 : 0;
      bases = [false, false, false];
    }
  
    return { bases, score };
  };

  const handleSubstitutePitcher = (newPitcher) => {
    const isHomePitcher = game.inningHalf === 'top';
    const newPitcherIP = { ...game.pitcherIP };
    newPitcherIP[isHomePitcher ? 'home' : 'away'] = 0;
    
    const newGameData = {
      ...game,
      homePitcher: isHomePitcher ? newPitcher : game.homePitcher,
      awayPitcher: isHomePitcher ? game.awayPitcher : newPitcher,
      pitcherIP: newPitcherIP,
      gameLog: [...game.gameLog, `${isHomePitcher ? teams.home.name : teams.away.name} substitutes their pitcher. ${newPitcher.name} is now pitching.`]
    };
    
    updateDoc(doc(db, gamesCollectionPath, gameId), newGameData);
    setShowSubModal(false);
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="text-xl font-medium">Loading...</div>
    </div>;
  }

  const currentBatter = game?.inningHalf === 'top' ? game?.awayBattingLineup?.[game?.currentBatterIndexAway] : game?.homeBattingLineup?.[game?.currentBatterIndexHome];
  const currentPitcher = game?.inningHalf === 'top' ? game?.homePitcher : game?.awayPitcher;
  const currentBatterStickers = currentBatter && game?.stickers?.[currentBatter.id];
  const currentPitcherStickers = currentPitcher && game?.stickers?.[currentPitcher.id];
  const currentEffectiveHandedness = game?.effectiveHandedness || (currentBatter ? currentBatter.handedness : null);
  const isGameOver = game?.status === 'gameOver';
  const inningOver = game?.outs >= 3;
  
  const getTeamColor = (isHomeTeam) => isHomeTeam ? teams.home.color : teams.away.color;
  const battingTeamColor = getTeamColor(game?.inningHalf === 'bottom');
  const fieldingTeamColor = getTeamColor(game?.inningHalf === 'top');
  const battingTeamBaseColor = battingTeamColor === 'red' ? '#dc2626' : '#3b82f6';
  const currentPitcherIP = game?.inningHalf === 'top' ? game?.pitcherIP.home : game?.pitcherIP.away;
  const fieldingTeamPitchers = fieldingTeamColor === 'red' ? teams.home.pitchers : teams.away.pitchers;
  const pitchingTeamName = fieldingTeamColor === 'red' ? teams.home.name : teams.away.name;
  const pitchingTeamId = fieldingTeamColor === 'red' ? 'home' : 'away';

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-inter p-4 flex flex-col items-center">
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

      {showSubModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">Choose a New Pitcher</h3>
            <div className="space-y-4">
              {fieldingTeamPitchers.filter(p => p.id !== currentPitcher.id).map(pitcher => (
                <div key={pitcher.id} className="flex justify-between items-center bg-gray-700 p-4 rounded-lg">
                  <div>
                    <p className="text-lg font-bold">{pitcher.name}</p>
                    <p className="text-sm text-gray-400">Control: {pitcher.stats.control}, IP: {pitcher.stats.ip}</p>
                  </div>
                  <button
                    onClick={() => handleSubstitutePitcher(pitcher)}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowSubModal(false)}
              className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!gameId && (
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">MLB Showdown</h1>
          <p className="mb-8">Test the core mechanics by playing against yourself!</p>
          <div className="flex justify-center">
            <button
              onClick={createSoloGame}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Start Solo Game
            </button>
          </div>
        </div>
      )}

      {gameId && game && (
        <div className="w-full max-w-4xl space-y-8">
          
          {/* Main game board container with scoreboard and at-bat section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
            
            {/* Left Column: Game State */}
            <div className="flex flex-col items-center justify-center text-center p-4">
              <h2 className="text-2xl font-bold">Inning: {game.inningHalf === 'top' ? 'Top' : 'Bottom'} of {game.inning}</h2>
              <p className="text-sm text-gray-400">Outs: {game.outs}</p>
              {/* Scoreboard Grid */}
              <div className="text-center font-bold text-sm bg-gray-700 p-2 rounded-lg overflow-x-auto w-full max-w-md mt-4">
                  <div className="inline-grid grid-flow-col gap-x-2 w-full text-left">
                      <span className="font-semibold px-2 min-w-[3rem]">Team</span>
                      {Object.keys(game.inningScores.away).map(inning => (
                          <span key={`inning-header-${inning}`} className="font-semibold text-center px-2">{inning}</span>
                      ))}
                      <span className="font-semibold text-center px-2">T</span>
                  </div>
                  <div className="inline-grid grid-flow-col gap-x-2 w-full text-left mt-1">
                      <span className="font-semibold px-2 min-w-[3rem] text-xs">Away</span>
                      {Object.keys(game.inningScores.away).map(inning => (
                          <span key={`away-score-${inning}`} className="text-center px-2">{game.inningScores.away[inning]}</span>
                      ))}
                      <span className="text-center px-2">{game.awayScore}</span>
                  </div>
                  <div className="inline-grid grid-flow-col gap-x-2 w-full text-left mt-1">
                      <span className="font-semibold px-2 min-w-[3rem] text-xs">Home</span>
                      {Object.keys(game.inningScores.home).map(inning => (
                          <span key={`home-score-${inning}`} className="text-center px-2">{game.inningScores.home[inning]}</span>
                      ))}
                      <span className="text-center px-2">{game.homeScore}</span>
                  </div>
              </div>
            </div>

            {/* Middle Column: Baserunning */}
            <div className="flex flex-col items-center justify-center p-4">
              <h3 className="text-lg font-bold mb-2">Baserunning</h3>
              <div className="flex justify-center my-4">
                <svg width="325" height="325" viewBox="0 0 325 325" xmlns="http://www.w3.org/2000/svg" className="text-gray-600">
                  {/* Infield */}
                  <polygon points="150,275 275,150 150,25 25,150" fill="#2D4636" />
                  
                  {/* Bases */}
                  <polygon points="150,275 175,250 175,225 125,225 125,250" fill={!game.bases[0] && !game.bases[1] && !game.bases[2] ? '#FFFFFF' : '#D1D5DB'} stroke="#D1D5DB" strokeWidth="5" />
                  <polygon points="275,150 250,175 225,150 250,125" fill={game.bases[0] ? '#FFFFFF' : '#D1D5DB'} stroke="#D1D5DB" strokeWidth="5" />
                  <polygon points="150,25 175,50 150,75 125,50" fill={game.bases[1] ? '#FFFFFF' : '#D1D5DB'} stroke="#D1D5DB" strokeWidth="5" />
                  <polygon points="25,150 50,125 75,150 50,175" fill={game.bases[2] ? '#FFFFFF' : '#D1D5DB'} stroke="#D1D5DB" strokeWidth="5" />
                  
                  {/* Runners */}
                  {game.bases && game.bases.map((onBase, index) => 
                    onBase ? (
                      <circle 
                        key={index}
                        cx={baseCoordinates[index].x} 
                        cy={baseCoordinates[index].y} 
                        r="15" 
                        fill={battingTeamBaseColor}
                      />
                    ) : null
                  )}

                  {/* Batter */}
                  {currentBatter && (
                    <circle 
                      cx={currentEffectiveHandedness === 'right' ? batterBoxCoordinates.right.x : batterBoxCoordinates.left.x} 
                      cy={batterBoxCoordinates.right.y} 
                      r="15" 
                      fill={battingTeamBaseColor} 
                    />
                  )}
                </svg>
              </div>
            </div>

            {/* Right Column: At-Bat and Controls */}
            <div className="flex flex-col items-center justify-center text-center p-4">
              <h3 className="text-lg font-bold mb-2">Current At-Bat</h3>
              <div className="w-full text-center my-2">
                <div className="text-4xl font-bold text-yellow-300">
                  {isRolling ? diceRollValue : game?.roll1 || game?.roll2 || '--'}
                </div>
                <p className="text-sm text-gray-400">
                  {game?.roll1 && game.atBatPhase === 'secondRoll' && !game?.roll2 ? 'Advantage Roll' :
                   game?.roll2 ? 'Result Roll' : 'Roll Value'}
                </p>
              </div>
              <div className="w-full text-center h-8">
                {game.currentAdvantage && (
                  <p className="text-sm mt-1">Advantage to: <span className={`font-bold capitalize ${game.currentAdvantage === 'pitcher' ? 'text-green-400' : 'text-red-400'}`}>{game.currentAdvantage}</span></p>
                )}
                {game.atBatResultText && (
                  <p className="text-sm mt-1">Outcome: <span className="font-bold">{game.atBatResultText}</span></p>
                )}
              </div>
              
              <div className="mt-4 h-[75px]">
                {game.atBatPhase === 'firstRoll' && !inningOver && (
                  <button
                    onClick={rollForAdvantage}
                    disabled={!currentPitcher || !currentBatter || isRolling}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Roll for Advantage
                  </button>
                )}
    
                {game.atBatPhase === 'secondRoll' && !inningOver && (
                  <button
                    onClick={rollForAtBatResult}
                    disabled={!currentPitcher || !currentBatter || isRolling}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Roll for Result
                  </button>
                )}
                
                {inningOver && (
                  <button
                    onClick={() => {
                      let newInningHalf = game.inningHalf === 'top' ? 'bottom' : 'top';
                      let newInning = game.inningHalf === 'top' ? game.inning : game.inning + 1;
                      let logMessage = game.inningHalf === 'top' ? `--- Inning change. It's now the bottom of the ${game.inning} inning. ---` : `--- New inning. It's now the top of the ${newInning} inning. ---`;
                      
                      updateDoc(doc(db, gamesCollectionPath, gameId), {
                        outs: 0,
                        bases: [false, false, false],
                        inningHalf: newInningHalf,
                        inning: newInning,
                        gameLog: [...game.gameLog, logMessage],
                      });
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-colors"
                  >
                    {game.inningHalf === 'top' ? 'Start Bottom of Inning' : `Start Top of Inning ${game.inning + 1}`}
                  </button>
                )}

                {isGameOver && (
                  <div className="text-2xl font-bold text-center">Game Over!</div>
                )}
              </div>
            </div>
          </div>
          
          {/* Player Cards and Game Log Side-by-Side */}
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/2">
                <PlayerCard 
                  player={currentPitcher} 
                  isPitcher={true} 
                  stickers={currentPitcherStickers} 
                  teamColor={fieldingTeamColor} 
                  inningsPitched={currentPitcherIP} 
                  onSubstituteClick={() => setShowSubModal(true)}
                />
            </div>
            <div className="w-full md:w-1/2">
                <PlayerCard player={currentBatter} isPitcher={false} stickers={currentBatterStickers} effectiveHandedness={currentEffectiveHandedness} teamColor={battingTeamColor} />
            </div>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
            <h3 className="text-lg font-bold mb-4">Game Log</h3>
            <div className="bg-gray-900 p-4 rounded-lg h-64 overflow-y-scroll text-sm border border-gray-700 flex flex-col-reverse">
              {game.gameLog?.slice().reverse().map((log, index) => (
                <p key={index} className="mb-1">{log}</p>
              ))}
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
};

export default App;
