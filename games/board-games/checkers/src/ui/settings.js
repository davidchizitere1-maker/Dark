(function(){
  "use strict";

  function $(id){return document.getElementById(id)}

  function load(){
    const s=window.CheckersConfig.settings();
    $("settingsTheme").value=s.theme;
    $("settingsSound").value=s.soundEnabled?"on":"off";
    $("settingsCoordinates").value=s.coordinates?"on":"off";
    $("settingsLegal").value=s.showLegalMoves?"on":"off";
    $("settingsCaptureRule").value=s.captureRule||"open";
  }

  function save(){
    const next=window.CheckersConfig.saveSettings({
      theme:$("settingsTheme").value,
      soundEnabled:$("settingsSound").value==="on",
      coordinates:$("settingsCoordinates").value==="on",
      showLegalMoves:$("settingsLegal").value==="on",
      captureRule:$("settingsCaptureRule").value
    });
    document.body.className=`theme-${next.theme}`;
    window.CheckersUI?.toast?.("Arena settings saved.");
    window.CheckersBoard?.render?.();
  }

  window.CheckersSettings={load,save};
})();
