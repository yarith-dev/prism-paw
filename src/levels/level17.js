/**
 * Level 5-1 "Moon Gate": Pale, the moon vault. A museum of stolen color. Extra legend for World 5:
 *   J  jar of stolen color (smash it: the room around it gets its color back)
 *   a  Archivist (steals ammo)    Z  security laser    k  color mirror (5-3)
 *   ~  window onto space / deep crater    H  Nova's rocket
 *   #  museum wall (moon rock on the far side)   R  column   P  statue (antenna outside)   B  display case
 * Rest of the legend: see level1.js / level13.js.
 */
export const level17 = {
  id: '5-1',
  title: 'Moon Gate',
  place: 'Pale · The Entrance Hall',
  theme: 'vault',
  beaconName: 'Gate Beacon',
  introComic: 'chapter-5',
  map: [
    '####################################',
    '#....H.....####.......####....J..*.#',
    '#.S........####...J...####.........#',
    '#...N..............................#',
    '#.w.....R.....R.....R.....R....a...#',
    '#..................................#',
    '#######.....#######..#######...#####',
    '#....P......#..~~.#..#.....#.......#',
    '#..J...d....#..~~.#..#..V..#...d...#',
    '#...........#.....#..#.....#....J..#',
    '#....B.........a...............B...#',
    '#.......h..........................#',
    '#.....R...#####.......#####...R....#',
    '#.........#~~~#...P...#.f.#........#',
    '#...V.....#~~~#.......#...#....J...#',
    '#.........##.##...J...##.##........#',
    '#..d...............a.......P.......#',
    '#######..........#...#...#WWWWWWWWW#',
    '#....*...........#...#...#.........#',
    '#..B.......L.....#.*.#...#....E....#',
    '#................#.f.#...#.........#',
    '####################################',
  ],
  stages: [{ tasks: ['talk'] }, { tasks: ['jars', 'vats'] }],
  talkTarget: 'docent',
  talkLabel: 'Talk to the little robot by the rocket',
  vatPattern: ['drab', 'archivist', 'drab', 'fizz', 'stencil', 'drab'],
  defendPool: ['drab', 'drab', 'drab', 'archivist', 'fizz', 'stencil', 'mopper'],
  beaconChargeTime: 32,
  weaponCase: 'beam',
  npcs: [
    {
      id: 'docent', name: 'Docent', model: 'docent',
      lines: [
        ['Docent', 'Oh! A visitor! Welcome, welcome to the Collection. It has been… let me check… forty-one years since the last visitor.'],
        ['Docent', 'I was the guide here, before the Curator decided the exhibits needed guarding more than they needed looking at.'],
        ['Docent', 'The jars hold color taken from Kittara. Strictly speaking, you should not smash them. Strictly speaking, I hope you do.'],
        ['Docent', 'Mister Oolong left this crate here, long ago. He said a courier might come for it someday. It hums. Please take it, it is upsetting the statues.'],
      ],
      reward: { items: { sardine: 2, shield: 1 } }, rewardText: '+2 Sardine Tins, +1 Bubble Shield',
      after: [['Docent', 'Mind the Archivists. They will take your paint and put it in a jar. Pop them and they must give it back. Museum rules.']],
    },
  ],
  lines: {
    intro: [
      ['Nova', 'We made it. Pale. It’s… a museum?'],
      ['Smudge', 'Beep… (it hides behind Nova’s leg)'],
    ],
    stolen: [['Nova', 'Hey! That’s MY paint!'], ['Smudge', 'BEEP! (chase it! pop the jar!)']],
    jars_1: [['Nova', 'Look! The color went right back into the room!']],
    jars_3: [['Smudge', 'Beep-beep! (halfway! it is getting pretty in here)']],
    jars_6: [['Nova', 'Every jar in the hall is smashed.']],
    vats_1: [['Nova', 'One Vat down!']],
    stageClear: [['Nova', 'Jars smashed, Vats popped. The Gate Beacon is open, southeast!']],
    beaconStart: [['Nova', 'Light up, Gate Beacon! Show the moon some color!'], ['Smudge', 'BEEP! (guards! lots of guards!)']],
    lowHealth: [['Smudge', 'Beep! (H for sardines, B for bubbles!)']],
    beaconDone: [['Nova', 'One hall down. The rest of the vault is next.']],
  },
};
