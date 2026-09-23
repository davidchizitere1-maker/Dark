(function(){
  "use strict";

  const TABLE="checkers_rooms";
  const SUPABASE_URL="https://igavamrvcjtpulawjgzh.supabase.co";
  const SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnYXZhbXJ2Y2p0cHVsYXdqZ3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNDk0NTEsImV4cCI6MjEwMjcyNTQ1MX0.Zl_FAW7oLnGMggGo3H-Tb5nYUxNVnfZtdzzVfpccYBk";

  if(typeof window.registerSteeneSupabaseCredentials==="function"){
    window.registerSteeneSupabaseCredentials(SUPABASE_URL,SUPABASE_ANON_KEY);
  }

  let channel=null,roomId=null,playerColor=null,onState=null,onStatus=null;

  function client(){return window.steeneClient||null}
  function status(message){
    onStatus?.(message);
    const el=document.getElementById("onlineStatus");
    if(el)el.textContent=message;
  }
  function requireClient(){
    const c=client();
    if(!c){status("Online play needs an authenticated STEENE session.");return null}
    return c;
  }
  function roomCode(){return Math.random().toString(36).slice(2,8).toUpperCase()}

  async function createRoom({color,state,onState:stateHandler,onStatus:statusHandler}){
    const c=requireClient();if(!c)return null;
    disconnect();
    onState=stateHandler||null;onStatus=statusHandler||null;
    const user=window.steeneUser?.id;
    if(!user){status("Sign in to STEENE before creating an online room.");return null}
    const code=roomCode();
    const row={
      room_code:code,game:"checkers",status:"waiting",
      host_user_id:user,
      red_user_id:color==="red"?user:null,
      black_user_id:color==="black"?user:null,
      state
    };
    const {data,error}=await c.from(TABLE).insert(row).select("id,room_code").single();
    if(error){status(error.message);return null}
    roomId=data.id;playerColor=color;
    subscribe();
    status(`Room ${code} created. Waiting for an opponent.`);
    return data;
  }

  async function joinRoom(code,{color,state,onState:stateHandler,onStatus:statusHandler}){
    const c=requireClient();if(!c)return null;
    disconnect();
    onState=stateHandler||null;onStatus=statusHandler||null;
    const user=window.steeneUser?.id;
    if(!user){status("Sign in to STEENE before joining an online room.");return null}

    const {data,error}=await c.from(TABLE).select("*").eq("room_code",code.toUpperCase()).eq("game","checkers").maybeSingle();
    if(error||!data){status(error?.message||"Room not found.");return null}

    let nextColor=color;
    if(data.red_user_id===user)nextColor="red";
    else if(data.black_user_id===user)nextColor="black";
    else if(!data.red_user_id)nextColor="red";
    else if(!data.black_user_id)nextColor="black";
    else{status("Room is full.");return null}

    const patch={
      status:"playing",
      red_user_id:nextColor==="red"?user:data.red_user_id,
      black_user_id:nextColor==="black"?user:data.black_user_id
    };

    const {data:updated,error:updateError}=await c.from(TABLE).update(patch).eq("id",data.id).select("*").single();
    if(updateError){status(updateError.message);return null}

    roomId=updated.id;playerColor=nextColor;
    subscribe();
    onState?.(updated.state);
    status(`Connected as ${nextColor}.`);
    return updated;
  }

  function subscribe(){
    const c=client();if(!c||!roomId)return;
    channel=c.channel(`checkers-room-${roomId}`)
      .on("postgres_changes",{
        event:"UPDATE",schema:"public",table:TABLE,filter:`id=eq.${roomId}`
      },payload=>{
        const row=payload.new;
        if(row.state)onState?.(row.state);
        if(row.status==="finished")status("The room has finished.");
      })
      .subscribe();
  }

  async function publishState(payload){
    const c=client();
    if(!c||!roomId)return;
    const patch={state:payload.state,status:payload.status||"playing",updated_at:new Date().toISOString()};
    await c.from(TABLE).update(patch).eq("id",roomId);
  }

  function disconnect(){
    const c=client();
    if(c&&channel)c.removeChannel(channel);
    channel=null;roomId=null;playerColor=null;
  }

  window.CheckersOnline={
    createRoom,joinRoom,publishState,disconnect,
    setHandlers({onState:stateHandler,onStatus:statusHandler}={}){
      onState=stateHandler||null;onStatus=statusHandler||null;
    },
    get room(){return roomId},
    get color(){return playerColor}
  };
})();
