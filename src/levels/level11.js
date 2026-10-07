/**
 * Level 3-3 "Squall Deck": a storm over the cargo deck. Gusts shove everything
 * sideways; robots blown into open hatches or off the edge fall into the clouds.
 * Thaw the frozen dockhands (c) and pop the Vats. Legend: see level9.js.
 */
export const level11 = {
  id: '3-3',
  title: 'Squall Deck',
  place: 'Coral Sky Docks · Cargo Deck',
  theme: 'docks',
  beaconName: 'Storm Beacon',
  map: [
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~S.......###........###.......*...~~',
    '~........###...t....###.....d.....~~',
    '~..N.............................V.~',
    '~.......c.....~~.......B......c....~',
    '~....d........~~...............t...~',
    '~~~.......B.........###............~',
    '~~~...t.............###......~~~...~',
    '~......L.......c.............~~~...~',
    '~.........~~~.......m..............~',
    '~...h.....~~~.............c....h...~',
    '~.....f...........B........t.......~',
    '~...........###..........~~........~',
    '~...V.......###...d......~~.....m..~',
    '~.......t...........L..............~',
    '~...c.........~~~.....t............~',
    '~.............~~~.........WWWWWWWW~~',
    '~~~.....##.............B..W.......~~',
    '~~~..*..##..........d.....W...E...~~',
    '~.........................W.......~~',
    '~..........L.........*....W.......~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  ],
  stages: [{ tasks: ['rescue', 'vats'] }],
  rescueLabel: 'Thaw the frozen dockhands',
  rescueSpeaker: 'Dockhand',
  wind: { first: 7, every: [8, 12], dur: 2.8, force: 8, dirs: [[1, 0], [-1, 0], [0, 1], [1, 0], [0, -1], [-1, 0]] },
  vatPattern: ['drab', 'stencil', 'drab', 'fizz', 'drab', 'mopper'],
  defendPool: ['drab', 'drab', 'drab', 'drab', 'stencil', 'fizz', 'fizz', 'mopper'],
  beaconChargeTime: 30,
  npcs: [
    {
      id: 'gale', name: 'Bosun Gale', model: 'gale',
      lines: [
        ['Bosun Gale', 'Hold onto your goggles, courier! A squall’s rolling in, and those grey tin cans don’t weigh a thing.'],
        ['Bosun Gale', 'When the wind picks up, get behind a container. Robots near an edge or an open hatch? Whoosh. Overboard.'],
        ['Bosun Gale', 'My dockhands got greyed by the hatches. Stand by them a moment to thaw them. And take these, for the rough weather.'],
      ],
      reward: { items: { shield: 1, bomb: 1 } }, rewardText: '+1 Bubble Shield, +1 Paint Bomb',
      after: [['Bosun Gale', 'Watch for “Gust incoming” and the arrow. Get robots between you and the edge!']],
    },
  ],
  lines: {
    intro: [
      ['Nova', 'Is it just me, or is this deck… swaying?'],
      ['Smudge', 'Beep! (it grabs onto Nova’s jacket)'],
    ],
    gust: [['Smudge', 'BEEEP! (wind! hold on!)'], ['Nova', 'Ha! Look at those robots slide!']],
    overboard: [['Nova', 'Bye-bye, tin can! Enjoy the clouds!']],
    rescue_5: [['Nova', 'All the dockhands are thawed!']],
    vats_1: [['Nova', 'One Vat down!']],
    stageClear: [['Nova', 'Dockhands safe, Vats popped. The Storm Beacon is open, southeast!']],
    beaconStart: [['Nova', 'Hold steady, beacon!'], ['Smudge', 'BEEP! (robots AND wind!)']],
    lowHealth: [['Smudge', 'Beep! (H for sardines, B for bubbles!)']],
    beaconDone: [['Nova', 'And the squall blows over.']],
  },
};
