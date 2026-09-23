(function(){
  "use strict";

  const titles={home:"Home",play:"Match Forge",game:"Live Match",tutorial:"Academy",profile:"Profile",settings:"Settings"};

  function go(screen){
    document.querySelectorAll(".screen").forEach(el=>el.classList.toggle("active",el.id===screen));
    document.querySelectorAll(".nav-item").forEach(el=>el.classList.toggle("active",el.dataset.screen===screen));
    const title=document.getElementById("pageTitle");if(title)title.textContent=titles[screen]||"Checkers";
    if(screen==="home")window.CheckersUI?.refreshAll?.();
    if(screen==="profile")window.CheckersProfile?.render?.();
    if(screen==="settings")window.CheckersSettings?.load?.();
    if(screen==="tutorial")window.CheckersTutorial?.init?.();
    if(screen==="game")window.CheckersBoard?.render?.();
  }

  function init(){
    document.querySelectorAll(".nav-item").forEach(item=>item.addEventListener("click",()=>go(item.dataset.screen)));
    window.CheckersNavigation={go};
    go("home");
  }

  window.addEventListener("DOMContentLoaded",init);
})();
