/**
 * Level 4-1 "Glass Dunes": the Static Wastes, where the Bleach began. Extra legend for World 4:
 *   ~  static rift (blocks walking, not shots)   :  glass bridge    G  glass pane (shoot it to break it)
 *   Y  seed plot (plant a Color Seed)             A  radio tower     O  Chroma geode (shoot to crack)
 *   n  Static (TV-noise ghost)                    I  the Prism Heart
 *   #  glass spires   B  glass boulder   P  glass tree   R  old drill rig
 * Rest of the legend: see level1.js / level9.js.
 */
export const level13 = {
  id: '4-1',
  title: 'Glass Dunes',
  place: 'The Static Wastes · Glass Dunes',
  theme: 'wastes',
  beaconName: 'Dune Beacon',
  introComic: 'chapter-4',
  map: [
    '####################################',
    '#S.....#####.......~~.......####..*#',
    '#...w..#####.......~~...n...####...#',
    '#..N...............::.............V#',
    '#.........B........~~.......B......#',
    '#....P.......Y.....~~..............#',
    '####.........n.....~~.....d....#####',
    '#..........#####...~~...#####......#',
    '#...d......#####...~~...#####..Y...#',
    '#..................::..............#',
    '#....R.......h.....~~.....n....P...#',
    '#~~~~~~~GG~~~~~~~~~~~~~~~::~~~~~~~~#',
    '#..................................#',
    '#..n.....B.......t........B....n...#',
    '#...........#####.....#####........#',
    '#....Y......#####..V..#####........#',
    '#......d.....................P.....#',
    '#..*.....n........#####......#WWWWW#',
    '#........P........#####......#.....#',
    '#....L.......d...............#..E..#',
    '#.........................*..#.....#',
    '####################################',
  ],
  stages: [{ tasks: ['talk'] }, { tasks: ['blooms', 'vats'] }],
  talkTarget: 'quartz',
  talkLabel: 'Find the old prospector in the dunes',
  vatPattern: ['static', 'drab', 'stencil', 'drab', 'static', 'fizz'],
  defendPool: ['drab', 'drab', 'drab', 'static', 'static', 'stencil', 'fizz', 'mopper'],
  beaconChargeTime: 30,
  weaponCase: 'mortar',
  npcs: [
    {
      id: 'quartz', name: 'Prospector Quartz', model: 'quartz',
      lines: [
        ['Prospector Quartz', 'Well, I’ll be. Color! Walking around on two legs! Haven’t seen that out here in forty years.'],
        ['Prospector Quartz', 'Nothing grows in the Wastes. Folks say the Bleach left the ground dead. Me, I think it’s just waiting for somebody to try.'],
        ['Prospector Quartz', 'There’s a crate out here with your grandpa’s name on it. Seed Mortar, he called it. Lob seeds at the glass and see what happens.'],
        ['Prospector Quartz', 'And them old seed plots by the drill rigs? Plant a Color Seed in each. Go on. Humor an old cat.'],
      ],
      reward: { items: { sardine: 2 }, sparks: 25 }, rewardText: '+2 Sardine Tins, +25 Sparks',
      after: [['Prospector Quartz', 'The noisy ghosts blink in and out. Shoot ’em when they’re solid, or lob a seed on ’em.']],
    },
  ],
  lines: {
    intro: [
      ['Nova', 'So this is where the Bleach started. Everything’s glass. Even the trees.'],
      ['Smudge', 'Bzzt… beep? (its eye flickers with static)'],
    ],
    blooms_1: [['Nova', 'It grew! A tree, in the Wastes! And it feels… warm.'], ['Smudge', 'Beep! (stand under it to heal!)']],
    blooms_3: [['Nova', 'Three trees. The glass is listening.']],
    vats_1: [['Nova', 'One Vat down!']],
    stageClear: [['Nova', 'Seeds planted, Vats popped. The Dune Beacon is open, southeast!']],
    beaconStart: [['Nova', 'Come on, light up the desert!'], ['Smudge', 'BEEP! (static ghosts everywhere!)']],
    lowHealth: [['Smudge', 'Beep! (H for sardines, B for bubbles!)']],
    beaconDone: [['Nova', 'Grass. Real grass. In the Static Wastes.']],
  },
};
