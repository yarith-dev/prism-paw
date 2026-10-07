/**
 * Level 3-1 "Harbor Gate": the Coral Sky Docks. Three piers float over open sky.
 * Extra legend for World 3:
 *   ~  open sky (blocks walking, not shots)   :  gangplank   M  updraft vent
 *   t  Stencil (flat robot that charges)      #  cargo containers
 *   P  ship mast    R  cargo crane    B  crates / paint barrels
 * Rest of the legend: see level1.js / level5.js.
 */
export const level9 = {
  id: '3-1',
  title: 'Harbor Gate',
  place: 'Coral Sky Docks · Lower Pier',
  theme: 'docks',
  beaconName: 'Harbor Beacon',
  introComic: 'chapter-3',
  map: [
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~S.....###~~~...##.....~~~....###.*~',
    '~...w..###~~~...##..t..~~~....###..~',
    '~..N.....M~~~M........M~~~M....f...~',
    '~......B..~~~.....V....~~~.........~',
    '~...L.....~~~..........~~~...B...V.~',
    '~.........:::....BB....:::.........~',
    '~##..d....:::..........:::..t......~',
    '~##.......~~~..P....P..~~~......###~',
    '~.....t...~~~..........~~~...d..###~',
    '~......h..~~~...R..R...~~~.........~',
    '~........M~~~M........M~~~M...f....~',
    '~..B..m...~~~.t........~~~.........~',
    '~.........:::....d.....:::.......t.~',
    '~...*.....:::..........:::.........~',
    '~.........~~~...B..V...~~~..m......~',
    '~###......~~~......t...~~~WWWWWWWWW~',
    '~###..L...~~~...L....L.~~~.........~',
    '~......f..~~~..........~~~....E....~',
    '~.........~~~...h......~~~.........~',
    '~.........~~~*.........~~~.........~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  ],
  stages: [{ tasks: ['talk'] }, { tasks: ['vats'] }],
  talkTarget: 'saffron',
  talkLabel: 'Find Captain Saffron on the west pier',
  vatPattern: ['stencil', 'drab', 'drab', 'fizz', 'stencil', 'mopper'],
  defendPool: ['drab', 'drab', 'drab', 'drab', 'stencil', 'stencil', 'fizz', 'fizz', 'mopper'],
  beaconChargeTime: 28,
  weaponCase: 'ricochet',
  npcs: [
    {
      id: 'saffron', name: 'Captain Saffron', model: 'saffron',
      lines: [
        ['Captain Saffron', 'A courier, all the way up here? Ha! The grey ones took the whole harbor overnight.'],
        ['Captain Saffron', "That crate by the berth has sat in the harbormaster’s shed for forty years, addressed to “Oolong.” Your grandpa’s, I’d wager."],
        ['Captain Saffron', 'Mind the gaps. There’s nothing under them but clouds. Take the gangplanks, or run onto a vent and let the updraft carry you.'],
        ['Captain Saffron', 'Three Grey Vats on these piers. Pop them and my ship, the Marmalade, flies again.'],
      ],
      reward: { items: { sardine: 1, bomb: 1 }, sparks: 25 }, rewardText: '+1 Sardine Tin, +1 Paint Bomb, +25 Sparks',
      after: [['Captain Saffron', 'Flat robots hide edge-on. When one stops and paints a red line at you, get off the line!']],
    },
  ],
  lines: {
    intro: [
      ['Nova', 'The Coral Sky Docks. Whoa. There is a LOT of sky under this floor.'],
      ['Smudge', 'Beep! (it hovers a little higher than usual)'],
    ],
    stencil: [['Smudge', 'BEEP! (red line! the flat one is going to charge, step aside!)']],
    vats_1: [['Nova', 'One Vat down! The harbor is waking up.']],
    vats_2: [['Smudge', 'Beep-boop! (one more on the piers!)']],
    stageClear: [['Nova', 'All three Vats popped! The Harbor Beacon is open on the east pier.']],
    beaconStart: [['Nova', 'Harbor Beacon, light up!'], ['Smudge', 'BEEP! (flat ones! lots of flat ones!)']],
    lowHealth: [['Smudge', 'Beep! (H for sardines, B for bubbles!)']],
    beaconDone: [['Nova', 'Look at that. Coral, gold and sky blue.']],
  },
};
