(function(){
  "use strict";
  function init(){
    document.querySelectorAll(".lesson-card").forEach((el,i)=>{
      el.style.animationDelay=`${i*45}ms`;
    });
  }
  window.CheckersTutorial={init};
})();
