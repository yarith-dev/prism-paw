/** The game's DOM: the canvas goes first, then the HUD, touch sticks and the overlay for menus. */
export const MARKUP = `
<div id="hud" class="hidden">
  <div class="top-left">
    <div class="hp"><div class="hp-fill"></div><span class="hp-text">100</span></div>
    <div class="currency">
      <span class="sparks"><i></i><b>0</b></span>
      <span class="seeds"><i></i><b>0/3</b></span>
    </div>
  </div>
  <div class="objectives">
    <div class="level-name"></div>
    <div class="level-place"></div>
    <ul></ul>
  </div>
  <div class="top-right">
    <div class="minimap"><canvas></canvas></div>
    <div class="corner-buttons">
      <button class="map-btn" aria-label="Map">🗺 <small>M</small></button>
      <button class="pause-btn" aria-label="Pause">❚❚</button>
    </div>
  </div>
  <div class="bossbar hidden"><label></label><div class="bar"><div></div></div><div class="tanks"></div></div>
  <div class="charge hidden"><label>BEACON CHARGE</label><div class="bar"><div></div></div></div>
  <div class="channel hidden"><label></label><div class="bar"><div></div></div></div>
  <button class="prompt hidden"></button>
  <div class="bottom-right">
    <div class="items"></div>
    <button class="weapon" aria-label="Swap weapon"><span class="dot"></span><span class="wname"></span><span class="ammo"></span><small class="swap">Q</small></button>
  </div>
  <div class="dialogue hidden"><div class="face"></div><div><div class="who"></div><div class="text"></div></div></div>
  <div class="toast"></div>
</div>
<div id="sticks"></div>
<div id="damage"></div>
<div id="overlay"></div>
`;
