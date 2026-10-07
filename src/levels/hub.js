/** Grandpa's Workshop: the walkable hub between missions. Legend: see level1.js. */
export const hub = {
  id: 'hub',
  title: "Grandpa's Workshop",
  place: 'Purrville · Oolong Street',
  theme: 'indoor',
  colorful: true,
  wallHeight: 7,
  hub: true,
  map: [
    '##################',
    '#KK.....#........#',
    '#.......#...T....#',
    '#...N...#........#',
    '#................#',
    '#.......#.....N..#',
    '####.####.....B..#',
    '#.....C.#........#',
    '#..S....#..P.....#',
    '#................#',
    '#......K.........#',
    '########D#########',
  ],
  rugs: [
    { x: 2, y: 2, w: 5, h: 3, colors: ['#ff4f6d', '#ffd23f', '#7ef0c8'] },
    { x: 10, y: 1, w: 6, h: 4, colors: ['#62a8ff', '#c6a8ff', '#ff8fb1'] },
    { x: 2, y: 7, w: 5, h: 3, colors: ['#7ef0c8', '#ff9a3d', '#ffe27a'] },
  ],
  npcs: [
    { id: 'grandpa', name: 'Grandpa (hologram)', model: 'grandpa', holo: true, action: 'shop' },
    { id: 'pip', name: 'Pip', model: 'pip', action: 'pip' },
  ],
};
