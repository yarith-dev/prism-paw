/**
 * Level 2-3 "Firefly Night": the jungle after dark. Nova carries a small light;
 * robots show only as glowing eyes. Relight five firefly lanterns (F) and pop the
 * Vats, then the beacon wave brings the sunrise. Legend: see level5.js / level1.js.
 */
export const level7 = {
  id: '2-3',
  title: 'Firefly Night',
  place: 'Glowshroom Jungle · Night Trail',
  theme: 'jungle',
  dark: true,
  beaconName: 'Dawn Beacon',
  map: [
    '####################################',
    '#S......#####......F.....#####...*.#',
    '#.......#####............#####.....#',
    '#..N.........z.......d.............#',
    '#.....P.........~~~~.........P..V..#',
    '#.F.............~~~~...............#',
    '####...........M~~~~M..........#####',
    '#.........f.....~~~~.....m.........#',
    '#.....#####.....~~~~.....#####..F..#',
    '#.....#####.....::::.....#####.....#',
    '#..h........z...~~~~.......z.......#',
    '#.....P.........~~~~.........P.....#',
    '#...............~~~~...............#',
    '#####.....F....M~~~~M....V....######',
    '#...............~~~~...............#',
    '#..*.....d......~~~~......f......*.#',
    '#......#####....~~~~....#####......#',
    '#..L...#####....::::....#####WWWWWW#',
    '#...........................#..E...#',
    '#....F......m...............#......#',
    '#...........................#......#',
    '####################################',
  ],
  stages: [{ tasks: ['lanterns', 'vats'] }],
  vatPattern: ['smear', 'drab', 'drab', 'fizz', 'smear', 'mopper'],
  beaconChargeTime: 30,
  npcs: [
    {
      id: 'wick', name: 'Old Wick', model: 'wick',
      lines: [
        ['Old Wick', 'Shh! The grey ones hunt by night. They put out every firefly lantern on the trail.'],
        ['Old Wick', 'Stand by a lantern and the fireflies will come home to it. Light all five and the dawn will find us.'],
        ['Old Wick', "Take these. A light in the dark is a fine thing, but a Paint Bomb is finer."],
      ],
      reward: { items: { bomb: 2, shield: 1 } }, rewardText: '+2 Paint Bombs, +1 Bubble Shield',
      after: [['Old Wick', 'Watch for glowing eyes in the dark. Each pair is a robot.']],
    },
  ],
  lines: {
    intro: [
      ['Nova', "Okay, it's dark. Really dark. Smudge, stay close."],
      ['Smudge', 'Beep… (its eye glows a little brighter)'],
    ],
    lanterns_1: [['Nova', 'One lantern lit. The fireflies came right back!']],
    lanterns_3: [['Smudge', 'Beep-beep! (two more, it thinks)']],
    lanterns_5: [['Nova', 'All five lanterns are glowing!']],
    vats_1: [['Nova', 'One Vat down in the dark!']],
    stageClear: [['Nova', 'Lanterns lit, Vats popped. The Dawn Beacon is open, southeast!']],
    beaconStart: [['Nova', "Come on, sunrise. We've been waiting all night."], ['Smudge', 'BEEP! (so many eyes…)']],
    lowHealth: [['Smudge', 'Beep! (H for sardines, B for bubbles!)']],
    beaconDone: [['Nova', 'Good morning, jungle.']],
  },
};
