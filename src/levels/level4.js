/**
 * Level 1-4 "Main Street Showdown": the Street Sweeper boss. X marks where it parks.
 * Crate clusters (B) give cover and stop its charge cold. Legend: see level1.js.
 */
export const level4 = {
  id: '1-4',
  title: 'Main Street Showdown',
  place: 'Purrville · Main Street',
  theme: 'street',
  introComic: 'boss-1-4',
  boss: 'sweeper',
  bossTitle: 'Street Sweeper popped!',
  bossWin: 'The Street Sweeper is scrap, and Main Street is colorful again.',
  map: [
    '##############################',
    '#S...........h..............*#',
    '#..L......................L..#',
    '#....BB..............BB......#',
    '#............................#',
    '#............................#',
    '#..........L......L..........#',
    '#.....h..................h...#',
    '#....B.........X.........B...#',
    '#............................#',
    '#............................#',
    '#..........L......L..........#',
    '#............................#',
    '#............................#',
    '#....BB..............BB......#',
    '#..L......................L..#',
    '#*............h.............*#',
    '##############################',
  ],
  stages: [{ tasks: ['boss'] }],
  lines: {
    intro: [
      ['Nova', 'Main Street. Quiet. Too quiet.'],
      ['Smudge', 'BEEEP! BEEP! (it hides behind Nova)'],
    ],
    bossIntro: [
      ['Nova', "That's not a street sweeper. That's a street sweeper."],
      ['Smudge', 'Beep-boop! (three tanks on its back — full of stolen color!)'],
      ['Nova', "Get behind it, pop the tanks. Lure it into crates when it charges."],
    ],
    tank_1: [['Nova', "One tank down! It's spitting goo now, careful!"]],
    tank_2: [['Smudge', 'Beep! (it is calling for backup!)'], ['Nova', 'Last tank! Keep moving!']],
    stunned: [['Smudge', 'Beep-beep! (it is dizzy — get behind it!)']],
    bossDown: [['Nova', 'And THAT is how you sweep the streets.']],
    lowHealth: [['Smudge', 'Beep! (H for sardines, B for bubbles!)']],
  },
};
