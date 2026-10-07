/**
 * Level 2-1 "Spore Trail": the Glowshroom Jungle. A river splits the map; bounce
 * mushrooms (M) launch Nova across it, and one Grey Vat sits on an island only
 * reachable by bouncing. Extra legend for World 2:
 *   ~  river (blocks walking, not shots)   :  wooden bridge   M  bounce mushroom
 *   z  Smear (splitting blob)              R  rune pillar     U  ancient mural
 * Rest of the legend: see level1.js.
 */
export const level5 = {
  id: '2-1',
  title: 'Spore Trail',
  place: 'Glowshroom Jungle · River Crossing',
  theme: 'jungle',
  beaconName: 'Spore Beacon',
  introComic: 'chapter-2',
  map: [
    '####################################',
    '#S....w.####....~~~~....####......*#',
    '#.......####..z.~~~~....####..f....#',
    '#..N...........M~~~~M..............#',
    '#...........B...~~~~...........V...#',
    '#....P.........#~~~~#.....P........#',
    '#..............#~~~~#..............#',
    '####....d......#~..~#......m...#####',
    '####...........M~..~M.......########',
    '#...h..........#~VM~#..............#',
    '#..............#~.*~#......f.......#',
    '#....P.........#~..~#.....P........#',
    '#..............#~~~~#..............#',
    '#####.....z....#~~~~#....d....######',
    '#..*...........#~~~~#..........V...#',
    '#.....B........M~~~~M.....B........#',
    '#...............::::...............#',
    '#....f..........~~~~.......m.......#',
    '#..P.......#####~~~~#####...#WWWWWW#',
    '#...............~~~~........#..E...#',
    '#.L.............~~~~..L.....#......#',
    '####################################',
  ],
  stages: [{ tasks: ['talk'] }, { tasks: ['vats'] }],
  talkTarget: 'fern',
  talkLabel: 'Find Ranger Fern at the trailhead',
  vatPattern: ['drab', 'smear', 'drab', 'fizz', 'smear', 'drab', 'mopper'],
  beaconChargeTime: 28,
  weaponCase: 'bubble',
  npcs: [
    {
      id: 'fern', name: 'Ranger Fern', model: 'fern',
      lines: [
        ['Ranger Fern', "A courier, all the way out here? The Greyscale got here first. The glowshrooms are going dark."],
        ['Ranger Fern', 'See the fat orange mushrooms? Run onto one and it’ll fling you across the river. That’s how we rangers get around.'],
        ['Ranger Fern', 'There are three Grey Vats in my forest. One is on the island. Take these, and good luck.'],
      ],
      reward: { items: { sardine: 2 }, sparks: 20 }, rewardText: '+2 Sardine Tins, +20 Sparks',
      after: [['Ranger Fern', 'Run straight onto a bounce mushroom. It throws you the way you are running.']],
    },
  ],
  lines: {
    intro: [
      ['Nova', 'The Glowshroom Jungle. It used to glow so bright you could read at midnight.'],
      ['Smudge', 'Beep… (it shivers at the grey mushrooms)'],
    ],
    vats_1: [['Nova', 'One Vat down. The jungle is already brighter.']],
    vats_2: [['Smudge', 'Beep-boop! (one more!)']],
    stageClear: [['Nova', 'All three Vats popped! The Spore Beacon is open, southeast.']],
    beaconStart: [['Nova', 'Spore Beacon, wake up!'], ['Smudge', 'BEEP! (blobs incoming!)']],
    lowHealth: [['Smudge', 'Beep! (H for sardines!)']],
    beaconDone: [['Nova', 'Look at it glow…']],
  },
};
