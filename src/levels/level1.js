/**
 * Map legend (all levels):
 *   #  building / wall      .  street / floor       =  rail track (walkable)
 *   B  crate                L  lamp post            Q  festival stall      P  planter tree
 *   W  Greyscale barrier (opens when the stage objectives are done)
 *   S  Nova start           s  the lone Drab that becomes Smudge
 *   V  Grey Vat (spawner)   E  Color Beacon         g  tram generator      c  frozen citizen
 *   N  named NPC (in order of level.npcs)           *  hidden Color Seed
 *   d  Drab   m  Mopper   f  Fizz      h  sardine tin      w  weapon case
 *   Hub only:  K  workbench   T  map table   D  door
 */
export const level1 = {
  id: '1-1',
  title: 'Grey Morning',
  place: 'Purrville · Market District',
  theme: 'street',
  beaconName: 'Market Beacon',
  map: [
    '####################################',
    '#......#######.........#######....*#',
    '#..S...#######...d.....#######..f..#',
    '#......#######.........#######.....#',
    '#.......#####.....B.....#####......#',
    '#....L.....s.......L...........V...#',
    '#.N.........B......................#',
    '#####......######.....######....####',
    '#####......######.....######....####',
    '#..........######..V..######.......#',
    '#...d......######.....######...m...#',
    '#.....L...............L............#',
    '#.................h...............*#',
    '#...B.......B..........B...........#',
    '######.....#######.....######.....##',
    '######.....#######.....######.....##',
    '#....w.....#######.....######......#',
    '#..........................WWWWWWWW#',
    '#....V.........f.....d.....W.......#',
    '#..L..............L........W....E..#',
    '#.*........................W.......#',
    '####################################',
  ],
  stages: [{ tasks: ['smudge'] }, { tasks: ['vats'] }],
  vatPattern: ['drab', 'drab', 'drab', 'fizz', 'drab', 'drab', 'mopper'],
  beaconChargeTime: 25,
  weaponCase: 'splatter',
  npcs: [
    {
      id: 'biscuit', name: 'Mrs. Biscuit', model: 'biscuit',
      lines: [
        ['Mrs. Biscuit', 'Nova! Thank whiskers. Those grey buckets sucked the color right out of my croissants!'],
        ['Mrs. Biscuit', "Here, take these sardine tins. Your grandpa's orders: keep the courier fed."],
      ],
      reward: { items: { sardine: 2 } }, rewardText: '+2 Sardine Tins',
      after: [['Mrs. Biscuit', 'Press H to eat a sardine tin when you get hurt, dear.']],
    },
  ],
  lines: {
    intro: [
      ['Nova', 'They took Grandpa. Up. To the MOON. …Okay. Okay. Emergency.'],
      ['Nova', "Something's rattling down the street. Let's see who turned my town grey."],
    ],
    spotSmudge: [['Nova', 'Hey! Grey bucket! Put the color back!']],
    smudgeJoins: [
      ['Smudge', 'Beep? …Bee-beep!'],
      ['Nova', "Whoa. You're… pink now. And not trying to vacuum me?"],
      ['Smudge', 'Beep beep-boop! Boop!'],
      ['Nova', '"Big grey tanks are making more of you." Got it. Let\'s pop them.'],
    ],
    vats_1: [['Nova', 'One tank down!']],
    vats_2: [['Smudge', 'Beep-beep!'], ['Nova', 'Two! One more somewhere south.']],
    stageClear: [
      ['Nova', "That's all of them. The barrier's dropping!"],
      ['Smudge', 'Boop! Beep! (it points at the Market Beacon)'],
    ],
    beaconStart: [
      ['Nova', 'Smudge, can you wake it up?'],
      ['Smudge', 'Boop… beep… beeeep…'],
      ['Nova', "It's charging, and here they come. Hold the line!"],
    ],
    lowHealth: [['Smudge', 'Beep! Beep! (it mimes eating a sardine — press H)']],
    beaconDone: [['Nova', 'There it is…']],
  },
};
