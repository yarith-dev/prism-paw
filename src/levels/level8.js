/**
 * Level 2-4 "The Mown Grove": the Weed Whacker boss in a jungle clearing.
 * Stumps (B) and glowshroom trees (P) give cover. Legend: see level5.js / level1.js.
 */
export const level8 = {
  id: '2-4',
  title: 'The Mown Grove',
  place: 'Glowshroom Jungle · The Old Grove',
  theme: 'jungle',
  introComic: 'boss-2-4',
  boss: 'whacker',
  bossTitle: 'Weed Whacker whacked!',
  bossWin: 'The Old Grove is glowing again, and its stolen green is back where it belongs.',
  map: [
    '##############################',
    '#S...........h..............*#',
    '#..P......................P..#',
    '#.....B................B.....#',
    '#............................#',
    '#.........P........P.........#',
    '#............................#',
    '#............................#',
    '#..B...........X.........B...#',
    '#............................#',
    '#............................#',
    '#.........P........P.........#',
    '#............................#',
    '#.....B................B.....#',
    '#..P......................P..#',
    '#*............h.............*#',
    '##############################',
  ],
  stages: [{ tasks: ['boss'] }],
  lines: {
    intro: [
      ['Nova', 'The Old Grove… or what is left of it. Everything is cut flat.'],
      ['Smudge', 'Beep. (something big is humming)'],
    ],
    bossIntro: [
      ['Nova', 'A giant lawnmower with legs. Of course.'],
      ['Smudge', 'Beep-boop! (its core is armored, but it overheats after it attacks!)'],
      ['Nova', 'When it spins, hug it or run. When it smokes, shoot the glowing core!'],
    ],
    overheat: [['Smudge', 'BEEP! (the shell is open, shoot the core now!)']],
    phase_1: [['Nova', 'Cracked it! Uh oh, it brought friends.']],
    phase_2: [['Smudge', 'Beep-beep! (one more third!)'], ['Nova', 'Shoot the brambles if they box you in!']],
    bossDown: [['Nova', 'Grass grows back. You don’t.']],
    lowHealth: [['Smudge', 'Beep! (H for sardines, B for bubbles!)']],
  },
};
