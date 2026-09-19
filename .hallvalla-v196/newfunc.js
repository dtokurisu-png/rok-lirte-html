  async function startPvpBotFallback({force=false}={}){
    if(pvpBotFallbackInFlight||!randomMatchSearching||activeRole!==1||!activeCode)return false;
    if(busy&&!force)return false;
    const myUid=String(auth?.currentUser?.uid||activeOwnerUid||"");
    const waitingCode=normalizeCode(activeCode||"");
    if(!myUid||waitingCode.length!==8)return false;
    const league=randomLeagueSnapshot||await resolveMyRandomLeague();
    const leagueKey=String(league?.key||"stone");
    const ownQueueRef=ref(db,`${RANDOM_QUEUE_PATH}/${myUid}`);
    pvpBotFallbackInFlight=true;
    let selfClaimed=false;
    let botCode="";
    let botPublicRef=null;
    let botPrivateRef=null;
    try{
      const existingOwnSnap=await withTimeout(get(ownQueueRef),`Validar cola propia antes del BOT ${waitingCode}`,5000);
      const existingOwn=existingOwnSnap.exists()?(existingOwnSnap.val()||{}):null;
      if(existingOwn&&String(existingOwn.claimedBy||"")&&String(existingOwn.claimedBy||"")!==myUid){
        setMatchmakingSearchText("RIVAL HUMANO DETECTADO...");
        return false;
      }
      if(!existingOwn||String(existingOwn.uid||"")!==myUid||String(existingOwn.leagueKey||"")!==leagueKey){
        await withTimeout(set(ownQueueRef,{
          uid:myUid,code:waitingCode,createdAt:randomOwnCreatedAt||Date.now(),
          name:getProfileNameSafe(1),level:getProfileLevelSafe(),leagueKey,
          leagueName:String(league?.name||"Piedra"),pvpPoints:Number(league?.points||0),claimedBy:"",claimedAt:0
        }),`Reparar cola propia antes del BOT ${waitingCode}`,5000);
      }else if(String(existingOwn.claimedBy||"")===myUid&&Date.now()-Number(existingOwn.claimedAt||0)>8000){
        await withTimeout(update(ownQueueRef,{claimedBy:"",claimedAt:0}),`Liberar claim BOT obsoleto ${waitingCode}`,4000);
      }

      const claimAt=Date.now();
      const claim=await withTimeout(runTransaction(ownQueueRef,current=>{
        if(!current||String(current.uid||"")!==myUid)return;
        if(String(current.leagueKey||"")!==leagueKey)return;
        if(String(current.claimedBy||""))return;
        return Object.assign({},current,{claimedBy:myUid,claimedAt:claimAt});
      }),`Reservar fallback BOT ${waitingCode}`,6000);
      if(!claim?.committed)return false;
      selfClaimed=true;

      const waitingPublicRef=ref(db,`games/${waitingCode}/public`);
      const waitingSnap=await withTimeout(get(waitingPublicRef),`Confirmar sala antes del BOT ${waitingCode}`,5000);
      if(!waitingSnap.exists())return false;
      const waiting=waitingSnap.val()||{};
      if(String(waiting?.playerSlots?.player1Uid||"")!==myUid||String(waiting?.phase||"")!=="waiting"||String(waiting?.playerSlots?.player2Uid||""))return false;

      if(typeof globalThis.hvEnsureFeature==="function")await globalThis.hvEnsureFeature("pve");
      const botMakeLeader=(typeof makeLeader==="function")?makeLeader:globalThis.makeLeader;
      if(typeof botMakeLeader!=="function")throw new Error("El motor de HallValla no está listo para crear el BOT PvP.");

      const waitingPrivateRef=ref(db,`games/${waitingCode}/private/player1`);
      const ownSnap=await withTimeout(get(waitingPrivateRef),`Leer mazo privado antes del BOT ${waitingCode}`,5000);
      if(!ownSnap.exists())throw new Error("No se encontró el mazo privado del jugador.");
      const ownPayload=ownSnap.val()||{};
      if(!validateOwnPrivateSnapshot(ownPayload,myUid,1))throw new Error("El mazo privado del jugador dejó de ser válido.");

      for(let attempt=0;attempt<4;attempt++){
        const candidate=makeCode(8);
        const snap=await withTimeout(get(ref(db,`games/${candidate}/public`)),`Validar código BOT ${candidate}`,4000);
        if(!snap.exists()){botCode=candidate;break;}
      }
      if(botCode.length!==8)throw new Error("No se pudo reservar un código para el BOT PvP.");

      const humanBuilt=buildRealPrivateState6e(ownPayload,botCode,1);
      const human=humanBuilt.enginePrivate;
      const botLevel=Math.max(1,Math.min(15,Math.floor(Number(human.leaderLevel)||1)));
      const profile=selectPvpBotProfile(botLevel,leagueKey);
      if(!PVP_BOT_ALLOWED_LEADERS.includes(profile.leaderType))throw new Error(`Líder BOT no permitido: ${profile.leaderType}.`);
      const botDeck=buildPvpBotDeck(profile,league);
      const botUid=getPvpBotUid(profile,leagueKey);
      const botName=getPvpBotPublicName(profile);
      const botAbility=botLevel>=5?String((typeof getLeaderDefaultLevel5Ability==="function"&&getLeaderDefaultLevel5Ability(profile.leaderType))||""):"";
      const allBotCards=botDeck.keys.map(key=>buildRealCard6e(key,2,profile.leaderType));
      const botArsenal=[...allBotCards].sort((a,b)=>(effectiveCardCost(a,2)-effectiveCardCost(b,2))||String(a?.name||"").localeCompare(String(b?.name||"")));
      const botDraw={deck:[],hand:botArsenal};
      const rows=typeof ROWS!=="undefined"?Number(ROWS):7;
      const cols=typeof COLS!=="undefined"?Number(COLS):5;
      let units=[
        botMakeLeader(1,Math.floor(cols/2),rows-1,human.leaderType,human.leaderLevel,human.leaderAbility),
        botMakeLeader(2,Math.floor(cols/2),0,profile.leaderType,botLevel,botAbility)
      ];
      const p1Leader=units.find(u=>u?.owner===1&&u?.leader);
      const p2Leader=units.find(u=>u?.owner===2&&u?.leader);
      const duelLimit=typeof DUEL_TIME_LIMIT_MS!=="undefined"?Number(DUEL_TIME_LIMIT_MS):600000;
      const clockVersion=typeof CLOCK_RULESET_VERSION!=="undefined"?CLOCK_RULESET_VERSION:1;
      const rarityCap=pvpBotRarityLabel(botDeck.policy.maxRarity);
      const publicShowcase={1:buildPublicShowcase(ownPayload),2:{leaderType:profile.leaderType,principalKeys:[]}};
      const pub={
        schema:"hallvalla-pvp-bot-v1",code:botCode,boardRows:rows,boardCols:cols,mode:"adventure",entryMode:"random",
        pvpBotMatch:true,pvpBotProfileId:profile.id,pvpBotLevel:botLevel,pvpBotMasteryRank:botLevel,pvpBotLeagueKey:leagueKey,pvpBotLeagueName:String(league?.name||"Piedra"),
        pvpBotStyle:String(profile.style||"balanced"),pvpBotRarityCap:rarityCap,pvpBotRarityCounts:botDeck.rarityCounts,
        adventureBattleTitle:`PvP · Liga ${String(league?.name||"Piedra")}`,adventureEnemyName:botName,
        adventureAdaptiveCampaign:false,adventureAdaptiveLearning:false,adventureAdaptiveMage:false,
        adventureAiLevel:typeof ADVENTURE_AI_BEST_SKILL_LEVEL!=="undefined"?ADVENTURE_AI_BEST_SKILL_LEVEL:5,
        adventureAiDrawBonus:0,adventureAiHonorBonus:0,
        adventureAiStyle:`BOT PvP · ${String(profile.style||"balanced")} · Liga ${String(league?.name||"Piedra")}`,
        adventureEnemyUnitMasteryRank:botLevel,realtimeExperimental:true,
        adventurePrincipalKeys:{1:[],2:[]},principalSlots:{1:0,2:0},pvpPrincipalKeys:{1:[],2:[]},
        adventureAiState:{deck:[],hand:botDraw.hand,honor:(typeof HALLVALLA_RT_CFG!=="undefined"?HALLVALLA_RT_CFG.initialMana:2),maxHonor:(typeof HALLVALLA_RT_CFG!=="undefined"?HALLVALLA_RT_CFG.initialMana:2),lastTurnStarted:"RT",skipFirstTurnDraw:true,principalSlots:0,principalKeys:[],principalKey:""},
        createdAt:Date.now(),currentPlayer:0,turn:1,phase:"active",turnPhase:"realtime",turnKey:"RT-1",turnStartedAt:serverTimestamp(),
        clockRulesetVersion:clockVersion,playerClockMs:{1:duelLimit,2:duelLimit},
        playerSlots:{player1Uid:myUid,player2Uid:botUid},
        playerNames:{1:getProfileNameSafe(1),2:botName},playerLevels:{1:getProfileLevelSafe(),2:botLevel},
        playerShowcase:publicShowcase,playerPrepared:{1:true,2:true},lobbyReady:{1:true,2:true},
        playerLeaders:{1:human.leaderType,2:profile.leaderType},playerLeaderLevels:{1:Number(human.leaderLevel||1),2:botLevel},playerLeaderAbilities:{1:String(human.leaderAbility||""),2:botAbility},
        settings:buildDefaultRules(),matchSettings:{timerEnabled:false,stakeMode:"none",goldAmount:500,cardEntryFee:500,economyState:"not_required"},
        playerStats:{
          1:{hp:Number(p1Leader?.hp||0),honor:(typeof HALLVALLA_RT_CFG!=="undefined"?HALLVALLA_RT_CFG.initialMana:2),maxHonor:(typeof HALLVALLA_RT_CFG!=="undefined"?HALLVALLA_RT_CFG.initialMana:2),deck:0,hand:human.hand.length,hasHiddenUnits:countHiddenKeys6e([...normalizeFirebaseArray(humanBuilt.combat6c?.deckKeys),...normalizeFirebaseArray(humanBuilt.combat6c?.handKeys)])>0},
          2:{hp:Number(p2Leader?.hp||0),honor:(typeof HALLVALLA_RT_CFG!=="undefined"?HALLVALLA_RT_CFG.initialMana:2),maxHonor:(typeof HALLVALLA_RT_CFG!=="undefined"?HALLVALLA_RT_CFG.initialMana:2),deck:0,hand:botDraw.hand.length,hasHiddenUnits:countHiddenKeys6e(botDraw.hand.map(card=>card?.key||""))>0}
        },
        erictoGraveyard:[],moralePressure:{1:0,2:0},units,battleEnded:false,winner:0,loser:0,
        log:[`PvP de Liga ${String(league?.name||"Piedra")}: ${botName} cubre la plaza mientras no hay otro jugador disponible.`,`El resultado cuenta para tus puntos PvP; el BOT no ocupa puestos del ranking.`].slice(0,18)
      };
      const privatePayload={...ownPayload,
        combat6c:humanBuilt.combat6c,
        engine6e:{schema:"hallvalla-pvp-bot-private-v1",ready:true,preparedAt:Date.now()},
        leaderType:human.leaderType,leaderLevel:human.leaderLevel,leaderAbility:human.leaderAbility,
        deck:[],hand:human.hand,honor:(typeof HALLVALLA_RT_CFG!=="undefined"?HALLVALLA_RT_CFG.initialMana:2),maxHonor:(typeof HALLVALLA_RT_CFG!=="undefined"?HALLVALLA_RT_CFG.initialMana:2),lastTurnStarted:"RT",skipFirstTurnDraw:true,
        principalSlots:0,principalKeys:[],principalKey:"",ownerUid:myUid
      };

      const finalWaitingSnap=await withTimeout(get(waitingPublicRef),`Revalidar plaza humana antes del BOT ${waitingCode}`,4000);
      const finalWaiting=finalWaitingSnap.exists()?(finalWaitingSnap.val()||{}):null;
      if(!finalWaiting||String(finalWaiting?.playerSlots?.player1Uid||"")!==myUid||String(finalWaiting?.phase||"")!=="waiting"||String(finalWaiting?.playerSlots?.player2Uid||""))return false;

      botPublicRef=ref(db,`games/${botCode}/public`);
      botPrivateRef=ref(db,`games/${botCode}/private/player1`);
      setMatchmakingSearchText("RIVAL BOT ENCONTRADO");
      await withTimeout(set(botPublicRef,pub),`Crear duelo BOT PvP ${botCode}`,7000);
      await withTimeout(set(botPrivateRef,privatePayload),`Preparar privado BOT PvP ${botCode}`,6000);
      const confirm=await withTimeout(get(botPublicRef),`Confirmar duelo BOT PvP ${botCode}`,5000);
      if(!confirm.exists()||confirm.val()?.pvpBotMatch!==true||String(confirm.val()?.playerSlots?.player2Uid||"")!==botUid)throw new Error("Firebase no confirmó el duelo contra BOT.");

      clearRandomMatchTimer();
      randomMatchSearching=false;
      pvpBotFallbackAttempts=0;
      try{await randomQueueDisconnect?.cancel?.();}catch(_){ }
      randomQueueDisconnect=null;
      try{await remove(ownQueueRef);}catch(_){ }
      detachRoomListener();detachOwnPrivateListener();
      try{await remove(waitingPublicRef);}catch(_){ }
      try{await removeOwnPrivateBranch(waitingCode,1,myUid);}catch(_){ }

      activeCode=botCode;activeOwnerUid=myUid;activeRole=1;
      activePvpBotProfile={...profile,leagueKey,leagueName:String(league?.name||"Piedra"),botUid,rarityCap};
      roomCache=confirm.val()||pub;
      randomLeagueSnapshot=league;
      renderRandomMatchmakingUi({playerShowcase:publicShowcase,playerSlots:pub.playerSlots});
      $("onlineLobby")?.classList.add("hidden");
      $("mainMenu")?.classList.add("hidden");
      if(typeof enterGame!=="function")throw new Error("El motor real no expuso enterGame().");
      enterGame(botCode,1);
      mark(`BOT PvP listo · ${botName} · Liga ${String(league?.name||"Piedra")}.`);
      return true;
    }catch(error){
      console.error(`[HallValla][${STEP}] Fallback BOT PvP falló:`,error);
      setMatchmakingSearchText("BOT NO INICIÓ · REINTENTANDO");
      setText("pvpRoomMessage","Rival BOT no inició: "+String(error?.message||error)+". Reintentando...");
      if(botPrivateRef){try{await remove(botPrivateRef);}catch(_){ }}
      if(botPublicRef){try{await remove(botPublicRef);}catch(_){ }}
      if(selfClaimed&&randomMatchSearching){
        try{await runTransaction(ownQueueRef,current=>{
          if(!current||String(current.uid||"")!==myUid||String(current.claimedBy||"")!==myUid)return;
          return Object.assign({},current,{claimedBy:"",claimedAt:0});
        });}catch(_){ }
      }
      mark(`No se pudo iniciar BOT PvP: ${error?.message||error}`);
      return false;
    }finally{
      pvpBotFallbackInFlight=false;
      syncLocalButtons();
    }
  }
