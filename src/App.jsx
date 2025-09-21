const rollForAtBatResult = () => {
    if (!game) return;
    
    //const battingTeam = game.battingTeam;
    //const fieldingTeam = battingTeam === 'home' ? 'away' : 'home';
    //let currentBatter = battingTeam === 'home' 
    //  ? game.homeTeamBatters[game.currentBatterIndex]
    //  : game.awayTeamBatters[game.currentBatterIndex];
    //let currentPitcher = battingTeam === 'home' ? game.awayTeamPitcher : game.homeTeamPitcher;

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

    // --- UPDATED DOUBLE PLAY LOGIC ---
    if (result.type === 'single' && game.bases[battingTeam][0] && newOuts < 2) {
      const fieldingTeamBatters = battingTeam === 'home' ? game.awayTeamBatters : game.homeTeamBatters;
      const infielders = fieldingTeamBatters.filter(player => 
          player.position.includes('1B') || 
          player.position.includes('2B') || 
          player.position.includes('SS') || 
          player.position.includes('3B')
      );
      const totalInfieldFielding = infielders.reduce((sum, player) => sum + (player.fielding || 0), 0);
      const doublePlayRoll = Math.floor(Math.random() * 20) + 1;

      if (doublePlayRoll > totalInfieldFielding) {
        // Successful Double Play
        newOuts += 2;
        logMessage += ` Double Play! The infield rolls a ${doublePlayRoll} against their fielding sum of ${totalInfieldFielding}. It's a double play! Two outs.`;

        // Correctly advance runners
        const currentBases = newBases[battingTeam];
        let scoreOnDP = 0;
        const basesAfterDP = [false, false, false];

        if (currentBases[2]) {
          scoreOnDP++; // Runner on 3rd scores
          logMessage += ` Runner on third scores.`;
        }
        if (currentBases[1]) {
          basesAfterDP[2] = true; // Runner on 2nd advances to 3rd
          logMessage += ` Runner on second advances to third.`;
        }

        newBases[battingTeam] = basesAfterDP;
        newScore[battingTeam] += scoreOnDP;

      } else {
        // Failed Double Play, treat as a normal single
        const { bases: updatedBases, score: runs } = updateBases(game.bases[battingTeam], result);
        newBases[battingTeam] = updatedBases;
        newScore[battingTeam] += runs;
        logMessage += ` The fielding team attempts a double play but fails with a roll of ${doublePlayRoll} against their fielding sum of ${totalInfieldFielding}. A normal single occurs.`;
      }
    if (result.type === 'out' || result.type === 'strikeout') {
      newOuts++;
    } else {
      const { bases: updatedBases, score: runs } = updateBases(game.bases[battingTeam], result);
      newBases[battingTeam] = updatedBases;
      newScore[battingTeam] += runs;
    }
    
    const updatedTeamBatters = battingTeam === 'home' ? [...game.homeTeamBatters] : [...game.awayTeamBatters];
    let updatedTeamPitcher = fieldingTeam === 'home' ? { ...game.homeTeamPitcher } : { ...game.awayTeamPitcher };
    // Create copies of the player objects to be potentially updated
    let updatedHomePitcher = { ...game.homeTeamPitcher };
    let updatedAwayPitcher = { ...game.awayTeamPitcher };
    let updatedHomeBatters = [...game.homeTeamBatters];
    let updatedAwayBatters = [...game.awayTeamBatters];

    // Add sticker logic
    if (result.sticker) {
      if (game.currentAdvantage === 'batter') {
        const updatedBatter = {
          ...currentBatter,
          stickers: [...(currentBatter.stickers || []), result.sticker]
        };
        // Update the correct batter in the batters array
        if (battingTeam === 'home') {
          updatedHomeBatters[game.currentBatterIndex] = updatedBatter;
        } else {
          updatedAwayBatters[game.currentBatterIndex] = updatedBatter;
        }
      } else {
        // Update the correct pitcher
        if (battingTeam === 'home') {
          updatedAwayPitcher = {
            ...currentPitcher,
            stickers: [...(currentPitcher.stickers || []), result.sticker]
          };
        } else {
          updatedHomePitcher = {
            ...currentPitcher,
            stickers: [...(currentPitcher.stickers || []), result.sticker]
          };
        }
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
    
    // Consolidate all updates into a single setGame call
    setGame(prevGame => ({
      ...prevGame,
      outs: newOuts,
      score: newScore,
      bases: newBases,
      battingTeam: nextBattingTeam,
      inning: nextInning,
      currentBatterIndex: newBatterIndex,
      atBatPhase: 'completed',
      lastRoll2: roll2,
      lastResult: result.text,
      gameLog: [...prevGame.gameLog, logMessage],
      
      // Update the state with the new player objects
      homeTeamPitcher: updatedHomePitcher,
      awayTeamPitcher: updatedAwayPitcher,
      homeTeamBatters: updatedHomeBatters,
      awayTeamBatters: updatedAwayBatters,
    }));
  };
