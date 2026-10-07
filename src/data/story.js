/**
 * Story mode content: comic cutscenes, world-map nodes and hub dialogue.
 * Comic panels: { art: [portrait keys], fx, bg, caption, speaker?, title?, sfx? (big comic lettering), shake? }.
 * Portrait keys are voxel models rendered at runtime (see portraits.js).
 */

const SKY = 'linear-gradient(180deg, #ffb36b 0%, #ff7eb6 55%, #7d5be0 100%)';
const DUSK = 'linear-gradient(180deg, #2a1d5c 0%, #6b2f9e 60%, #e0569f 100%)';
const GREY = 'linear-gradient(180deg, #5b6069 0%, #8d939c 100%)';
const NIGHT = 'linear-gradient(180deg, #0f0b2a 0%, #2a1d5c 70%, #4b34b3 100%)';
const JUNGLE = 'linear-gradient(180deg, #0b2a2a 0%, #145a4f 60%, #2fb58f 100%)';
const STONE = 'linear-gradient(180deg, #3d3a5c 0%, #5a5f8a 60%, #7a7fab 100%)';
const WORKSHOP = 'linear-gradient(180deg, #4b2a1a 0%, #8a5a3b 70%, #c08a57 100%)';
const HARBOR = 'linear-gradient(180deg, #7cc6ff 0%, #b8d8ff 55%, #ffb3c8 100%)';
const STORM = 'linear-gradient(180deg, #2a3358 0%, #4b5a8a 60%, #8d9bb0 100%)';
const WASTES = 'linear-gradient(180deg, #4b4858 0%, #6b6878 55%, #b7bcc8 100%)';
const MEADOW = 'linear-gradient(180deg, #ffb38a 0%, #ffd6a8 45%, #8cdc7a 100%)';
const VAULT = 'linear-gradient(180deg, #0b0d1a 0%, #2a2f4a 55%, #d9dce4 100%)';
const PASTEL = 'linear-gradient(180deg, #2a1d5c 0%, #b48cff 45%, #ffc2e0 75%, #fff3c8 100%)';

export const COMICS = {
  opening: [
    { bg: SKY, fx: 'confetti', set: 'festival', shot: 'wide', cast: ['nova:right', 'cit0@-7,-2,0.4', 'cit2@-4,-3.5,0.3', 'cit4@6,-2,-0.5', 'tom@9,-4,-0.6'], caption: 'Festival morning in Purrville. Nova, the fastest courier on the Hue Line, is late. Again.' },
    { bg: SKY, fx: 'confetti', set: 'festival', shot: 'two', cast: ['grandpa', 'pip'], speaker: 'Grandpa Oolong', caption: '“There you are! Pip, listen to this one. So a fish walks into a bank and asks for a mortgage. And the banker says—”' },
    { bg: DUSK, fx: 'moon', set: 'festival', shot: 'low', mood: 'dusk', cast: ['grandpa:back'], caption: 'Grandpa stopped mid-joke. He was staring at the sky. The moon had risen in broad daylight, and it was glowing.' },
    { bg: DUSK, fx: 'moon', set: 'festival', shot: 'close', mood: 'dusk', cast: ['grandpa'], speaker: 'Grandpa Oolong', caption: '“…Oh, old friend. What have you done?”' },
    { bg: NIGHT, fx: 'stars', set: 'none', shot: 'low', mood: 'night', cast: ['curator'], speaker: 'The Curator', caption: '“Good morning, Kittara. Please remain still. You are being collected.”' },
    { bg: GREY, fx: 'beams', set: 'street', shot: 'wide', grey: true, cast: ['vat@-5,-4', 'drab*4@3,-1', 'beam@-2,-3', 'beam@7,-5', 'cit1:grey@-9,0,0.5', 'cit3:grey@8,1,-0.4'], sfx: 'VWOOOM', shake: true, caption: 'Grey machines dropped from the sky. Wherever their beams swept, color drained away, and cats froze mid-step.' },
    { bg: GREY, fx: 'beams', set: 'street', shot: 'two', grey: true, cast: ['grandpa:grey', 'nova', 'beam@-1.9,0'], caption: 'Grandpa shoved Nova out of a beam. He didn’t get out of the next one.' },
    { bg: GREY, fx: 'beams', set: 'street', shot: 'low', grey: true, cast: ['grandpa:grey:float@-1,-1', 'fizz:up@-1,-1', 'beam@-1,-1', 'nova:back@2,2'], caption: 'Then a drone lifted his statue, gently, like something precious, and carried it up toward the moon.' },
    { bg: WORKSHOP, fx: 'sparkle', set: 'workshop', shot: 'solo', cast: ['nova:right', 'blaster@1.5,0.4'], caption: 'In his workshop: a half-finished blaster with a note taped on. “For emergencies. Or fireworks.”' },
    { bg: WORKSHOP, fx: 'holo', set: 'workshop', shot: 'two', cast: ['grandpa:holo', 'nova'], speaker: 'Grandpa (recording)', caption: '“FILE 1 OF 5. If you’re watching this, kiddo, the moon did something weird. I’m sorry. I should have told you about the moon.”' },
    { bg: SKY, fx: 'confetti', set: 'street', shot: 'low', grey: true, cast: ['nova'], speaker: 'Nova', caption: '“Okay. Emergency.”' },
  ],
  'after-1-1': [
    { bg: SKY, fx: 'confetti', set: 'street', shot: 'wide', cast: ['nova', 'smudge', 'beacon:on@-6,-4', 'cit0@6,-2,-0.5', 'biscuit@8.5,-3,-0.7'], caption: 'The Market Beacon blazed, and a whole district remembered its colors. So did one very confused robot.' },
    { bg: SKY, fx: 'sparkle', set: 'street', shot: 'solo', cast: ['smudge'], speaker: 'Smudge', caption: '“Beep?” (It keeps turning its pink paws over, like it has never seen anything so amazing.)' },
    { bg: WORKSHOP, fx: 'holo', set: 'workshop', shot: 'two', cast: ['grandpa:holo', 'nova', 'smudge@2.9,1'], speaker: 'Grandpa (recording)', caption: '“The workshop runs on Sparks, kiddo. Bring me Sparks from those grey buckets and I’ll build you something nice.”' },
    { bg: NIGHT, fx: 'stars', set: 'none', shot: 'low', mood: 'night', cast: ['curator'], speaker: 'The Curator', caption: '“A unit has stopped reporting. Unit D-7, you are damaged. Please return for repair.”' },
    { bg: NIGHT, fx: 'stars', set: 'street', shot: 'two', mood: 'night', cast: ['nova', 'smudge'], caption: 'Smudge’s eye flickered white for a heartbeat. Then it beeped twice and pressed itself against Nova’s boot.' },
  ],
  'after-1-2': [
    { bg: DUSK, fx: 'beams', set: 'street', shot: 'two', mood: 'dusk', cast: ['mittens', 'nova', 'generator:on@-7,-4', 'generator:on@7,-5'], speaker: 'Conductor Mittens', caption: '“All aboard! The trams are carrying color down every line in town!”' },
    { bg: NIGHT, fx: 'stars', set: 'street', shot: 'close', mood: 'night', cast: ['mittens'], speaker: 'Conductor Mittens', caption: '“Funny thing, courier. Your grandpa used to ride my last tram out to the old launch field. Every Sunday, for years. Then one Sunday he just… stopped.”' },
    { bg: NIGHT, fx: 'stars', set: 'street', shot: 'two', mood: 'night', cast: ['nova', 'smudge'], speaker: 'Nova', caption: '“The launch field? Grandpa is scared of LADDERS.”' },
    { bg: GREY, fx: 'beams', set: 'street', shot: 'threat', grey: true, cast: ['vat', 'nova', 'smudge', 'drab*3@-4,-4'], caption: 'Smudge picked up chatter on the Harvester band: they were gathering in Festival Square. Something there was being collected.' },
  ],
  'after-1-3': [
    { bg: SKY, fx: 'confetti', set: 'festival', shot: 'group', cast: ['tom', 'pip', 'cit0', 'cit4', 'biscuit'], caption: 'The band struck up again. All of Purrville sang along, a little out of tune.' },
    { bg: SKY, fx: 'confetti', set: 'festival', shot: 'close', cast: ['pip'], speaker: 'Pip', caption: '“Mom’s okay! She says thank you. Also that you smell like robot.”' },
    { bg: GREY, fx: 'beams', set: 'street', shot: 'threat', grey: true, cast: ['sweeper', 'nova', 'smudge'], sfx: 'RRRMBLE', shake: true, caption: 'Then the ground shook. Something enormous was rolling down Main Street, sweeping up every color in its path.' },
    { bg: DUSK, fx: null, set: 'street', shot: 'low', mood: 'dusk', cast: ['nova', 'smudge'], speaker: 'Nova', caption: '“A Harvester. A big one. Okay, Smudge. Let’s go clean up.”' },
  ],
  'after-1-4': [
    { bg: SKY, fx: 'confetti', set: 'street', shot: 'wide', cast: ['nova', 'smudge', 'crate@-6,-3', 'crate@5,-2,0.4'], sfx: 'KA-SPLOOSH!', shake: true, caption: 'The Street Sweeper burst like a piñata. Three tanks of stolen color rained back down over Purrville.' },
    { bg: NIGHT, fx: 'moon', set: 'street', shot: 'low', mood: 'night', cast: ['nova:back', 'smudge:back'], caption: 'In the wreck, Smudge found its flight log. Every color it swept, and every cat it carried off, went to the same place: Pale, the moon.' },
    { bg: NIGHT, fx: 'stars', set: 'core', shot: 'threat', cast: ['curator', 'grandpa:grey'], speaker: 'The Curator', caption: '“Exhibit 1 has arrived safely. Welcome home, Keeper. Collection continues.”' },
    { bg: NIGHT, fx: 'moon', set: 'street', shot: 'close', mood: 'night', cast: ['nova'], speaker: 'Nova', caption: '“Keeper? That thing has Grandpa, and it knows his name. …Smudge, I’m going to need a rocket.”' },
    { bg: DUSK, fx: 'sparkle', art: [], title: ['END OF CHAPTER 1', 'Next: The Glowshroom Jungle'], caption: 'Why does the moon know Grandpa? And what did he do every Sunday?' },
  ],
  'chapter-2': [
    { bg: JUNGLE, fx: 'spores', art: [], title: ['CHAPTER 2', 'The Glowshroom Jungle'], caption: 'Somewhere under the glowing trees lies the oldest Prism lab on Kittara. And maybe some answers.' },
    { bg: WORKSHOP, fx: 'holo', set: 'workshop', shot: 'two', cast: ['grandpa:holo', 'nova'], speaker: 'Grandpa (recording)', caption: '“FILE 2 OF 5. A rocket needs pure Chroma, kiddo. Try the old lab under the jungle. You’ll see the murals. Don’t judge us old-timers too hard.”' },
    { bg: GREY, fx: 'beams', set: 'jungle', shot: 'wide', grey: true, cast: ['vat@-2,-4', 'drab*4@3,-1', 'beam@-2,-4'], caption: 'The Harvesters had got there first. The brightest forest on Kittara was going dark, mushroom by mushroom.' },
    { bg: JUNGLE, fx: 'spores', set: 'jungle', shot: 'two', cast: ['nova', 'smudge'], speaker: 'Nova', caption: '“Glowing mushrooms, angry robots and secret messages from my grandpa. Just a normal Tuesday.”' },
  ],
  'after-2-1': [
    { bg: JUNGLE, fx: 'spores', set: 'jungle', shot: 'two', cast: ['fern', 'nova'], speaker: 'Ranger Fern', caption: '“The old lab is past the waterfall. The ruins started glowing the day the moon did. Like they were… answering it.”' },
    { bg: STONE, fx: 'runes', set: 'ruins', shot: 'low', cast: ['nova:back', 'smudge:back'], caption: 'Deeper in, the stones grew older. On one of them someone had carved a cat holding a teacup, a little glass ring, and a single word: KEEPER.' },
  ],
  'after-2-2': [
    { bg: STONE, fx: 'runes', set: 'lab', shot: 'two', cast: ['moss', 'nova'], speaker: 'Professor Moss', caption: '“The lab core still has power. There’s a recording in it. Three hundred years old. Listen…”' },
    { bg: NIGHT, fx: 'stars', set: 'lab', shot: 'low', mood: 'night', cast: ['ring', 'cit2:holo@-4.5,1,0.5', 'cit3:holo@4.5,1,-0.5'], speaker: 'Recording', caption: '“Guardian, hear your one order. Whatever happens, whatever it costs: NEVER LET THE COLOR RUN OUT.”' },
    { bg: STONE, fx: 'runes', set: 'lab', shot: 'close', cast: ['moss'], speaker: 'Professor Moss', caption: '“They sent it to the moon to guard the color. And so it wouldn’t be alone up there, one cat in every generation would visit it. They called that cat the Keeper.”' },
    { bg: STONE, fx: 'runes', set: 'lab', shot: 'close', cast: ['nova'], speaker: 'Nova', caption: '“The Sunday trams. The launch field. Grandpa was the Keeper. He was visiting the MOON.”' },
    { bg: STONE, fx: 'runes', set: 'lab', shot: 'two', cast: ['nova', 'smudge'], speaker: 'Nova', caption: '“And the Curator isn’t stealing the color. It’s saving it. Badly.”' },
    { bg: NIGHT, fx: 'stars', set: 'jungle', shot: 'two', mood: 'night', cast: ['fern', 'nova', 'lantern@0,-3'], speaker: 'Ranger Fern', caption: '“Night’s falling, and the grey ones have snuffed every firefly lantern on the trail. Old Wick will know what to do.”' },
  ],
  'after-2-3': [
    { bg: JUNGLE, fx: 'spores', set: 'jungle', shot: 'group', mood: 'dusk', cast: ['wick', 'nova', 'smudge', 'lantern:on@-5,-3', 'lantern:on@5,-3'], speaker: 'Old Wick', caption: '“Sunrise! Haven’t seen one this pretty in years. Oolong’s grandkit, aren’t you? Same stubborn whiskers.”' },
    { bg: NIGHT, fx: 'stars', set: 'jungle', shot: 'close', cast: ['wick'], speaker: 'Old Wick', caption: '“He helped me light these lanterns once. Said a friend of his liked to watch them from the sky. I thought he was joking.”' },
    { bg: GREY, fx: 'beams', set: 'jungle', shot: 'threat', grey: true, cast: ['whacker', 'nova', 'smudge'], sfx: 'BZZZRRT', shake: true, caption: 'At the heart of the jungle, a Harvester was mowing the Old Grove flat and stuffing its green into a hopper.' },
  ],
  'after-2-4': [
    { bg: JUNGLE, fx: 'spores', set: 'jungle', shot: 'wide', cast: ['nova', 'smudge', 'lantern:on@-6,-3', 'lantern:on@6,-4'], sfx: 'FWOOMPH!', caption: 'The Weed Whacker’s hopper burst, and a flood of stolen green poured back into the Old Grove. The glowshrooms lit up one by one.' },
    { bg: JUNGLE, fx: 'spores', set: 'jungle', shot: 'group', mood: 'dusk', cast: ['fern', 'wick', 'nova'], speaker: 'Ranger Fern', caption: '“The jungle owes you, courier. Whatever you need for that rocket, the rangers have your back.”' },
    { bg: NIGHT, fx: 'stars', set: 'none', shot: 'low', mood: 'night', cast: ['curator'], speaker: 'The Curator', caption: '“Courier Nova. You are breaking my exhibits. Your grandfather never broke anything. He sat. He talked. He brought tea.”' },
    { bg: NIGHT, fx: 'stars', set: 'jungle', shot: 'two', cast: ['nova', 'smudge:left'], speaker: 'Nova', caption: '“How does it know my NAME?” Smudge didn’t beep. It was very busy looking at its feet.' },
    { bg: NIGHT, fx: 'moon', set: 'jungle', shot: 'low', cast: ['smudge:back', 'nova:back'], caption: 'In the wreck, Smudge found a flight log. Every Harvester reported to a harbor in the sky: the Coral Sky Docks.' },
    { bg: JUNGLE, fx: 'spores', art: [], title: ['END OF CHAPTER 2', 'Next: Coral Sky Docks'], caption: 'Airships, sky-whales, and a crate with Grandpa’s name on it.' },
  ],
  'chapter-3': [
    { bg: HARBOR, fx: 'clouds', art: [], title: ['CHAPTER 3', 'The Coral Sky Docks'], caption: 'High above the clouds, the airships of Kittara come home to a floating harbor.' },
    { bg: WORKSHOP, fx: 'holo', set: 'workshop', shot: 'two', cast: ['grandpa:holo', 'nova'], speaker: 'Grandpa (recording)', caption: '“FILE 3 OF 5. Every Sunday for twenty years I flew from the Sky Docks to the moon, kiddo. I left a few toys along the way. Just in case.”' },
    { bg: GREY, fx: 'clouds', set: 'docks', shot: 'wide', grey: true, cam: [0.1, 0.2, 1], cast: ['whaleGrey@-3,-16,1.3', 'stencil*3@4,-3', 'nova:back@0,3', 'smudge@1.6,3'], caption: 'The harbor was grey from mast to mooring. Even the sky-whales that nest under the piers were fading.' },
    { bg: HARBOR, fx: 'clouds', set: 'docks', shot: 'two', cast: ['nova', 'smudge'], speaker: 'Nova', caption: '“Floating docks, flying whales, flat robots. Smudge, whatever you do, don’t look down.”' },
    { bg: HARBOR, fx: 'clouds', set: 'sky', shot: 'high', cast: ['smudge'], sfx: 'BEEEEP!', shake: true, caption: 'Smudge looked down.' },
  ],
  'after-3-1': [
    { bg: HARBOR, fx: 'confetti', set: 'docks', shot: 'two', cast: ['saffron', 'nova'], speaker: 'Captain Saffron', caption: '“The Marmalade flies again! And you’re Oolong’s grandkit. He flew the moon run with my mother, you know. Every Sunday.”' },
    { bg: STORM, fx: 'clouds', set: 'docks', shot: 'close', mood: 'dusk', cast: ['saffron'], speaker: 'Captain Saffron', caption: '“Then your grandma got sick, and he stayed home to look after her. Never flew again. Can’t say I blame him.”' },
    { bg: HARBOR, fx: 'clouds', set: 'docks', shot: 'low', mood: 'dusk', cast: ['nova:back', 'smudge', 'whaleGrey@-8,-16,1.4'], caption: 'Nova was quiet for a while. Then Smudge picked up a sound on the wind: whale song from the old Whale Watch pier. Very sad whale song.' },
  ],
  'after-3-2': [
    { bg: HARBOR, fx: 'clouds', set: 'docks', shot: 'low', cast: ['juno', 'whale:focus@5,-9,-1.2', 'whale@-9,-15,1.6'], speaker: 'Juno', caption: '“They’re singing! Sky-whales herd the rain clouds between the islands. Without color they just… drift.”' },
    { bg: STORM, fx: 'wind', set: 'docks', shot: 'two', mood: 'grey', cast: ['gale', 'nova'], speaker: 'Bosun Gale', caption: '“And with the whales grey, nobody’s herding the weather. Squall’s coming over the cargo deck. Batten down!”' },
  ],
  'after-3-3': [
    { bg: STORM, fx: 'wind', set: 'docks', shot: 'two', mood: 'grey', cast: ['gale', 'smudge'], speaker: 'Bosun Gale', caption: '“Ha! Blew half those tin cans clean off the deck!”' },
    { bg: NIGHT, fx: 'stars', set: 'core', shot: 'solo', cast: ['curator'], speaker: 'The Curator', caption: '“The Keeper stopped coming. Forty-one years, two months and nine days. I counted. Counting is what I do when nobody visits.”' },
    { bg: NIGHT, fx: 'stars', set: 'docks', shot: 'close', mood: 'night', cast: ['nova'], speaker: 'Nova', caption: '“…It’s lonely. The scariest machine on Kittara is lonely.”' },
    { bg: GREY, fx: 'beams', set: 'docks', shot: 'threat', grey: true, cast: ['trawler', 'nova', 'smudge'], caption: 'Out past the moorings, a Harvester airship was trawling the sky, dragging nets of stolen color toward a rocket bay on its deck.' },
    { bg: HARBOR, fx: 'clouds', set: 'docks', shot: 'two', cast: ['nova', 'smudge'], speaker: 'Nova', caption: '“A rocket bay. As in, a rocket. As in, the moon. Smudge, we’re stealing an airship’s lunch.”' },
  ],
  'after-3-4': [
    { bg: HARBOR, fx: 'confetti', set: 'docks', shot: 'wide', cast: ['nova', 'smudge', 'net@-6,-3'], sfx: 'KRA-KOOM!', shake: true, caption: 'The Net Trawler went down in a blaze of paint. Its nets burst, and the stolen color rained back over the harbor.' },
    { bg: HARBOR, fx: 'clouds', set: 'docks', shot: 'wide', cast: ['saffron', 'nova', 'rocket@-7,-10'], speaker: 'Captain Saffron', caption: '“Look what it was hauling! A Greyscale courier rocket, the kind that flies color to the moon. She’s all yours.”' },
    { bg: NIGHT, fx: 'moon', set: 'docks', shot: 'low', mood: 'night', cast: ['smudge', 'rocket@-3,-4'], caption: 'Smudge beeped at the fuel gauge: EMPTY. The rocket ran on pure green Chroma.' },
    { bg: GREY, fx: 'beams', set: 'docks', shot: 'close', mood: 'night', cast: ['nova'], speaker: 'Nova', caption: '“And the only green left is at the cracked Prism Heart, where the Bleach began. Of course it is.”' },
    { bg: STORM, fx: 'stars', art: [], title: ['END OF CHAPTER 3', 'Next: The Static Wastes'], caption: 'A desert of grey glass. Something out there has been waiting for Nova.' },
  ],
  'chapter-4': [
    { bg: WASTES, fx: 'static', art: [], title: ['CHAPTER 4', 'The Static Wastes'], caption: 'Three hundred years ago, the Bleach began here. Nothing has grown since.' },
    { bg: WORKSHOP, fx: 'holo', set: 'workshop', shot: 'two', cast: ['grandpa:holo', 'nova'], speaker: 'Grandpa (recording)', caption: '“FILE 4 OF 5. One more thing, kiddo. The Curator sees through its machines. Every robot eye is a window. Be careful what you let it see.”' },
    { bg: WASTES, fx: 'static', set: 'wastes', shot: 'two', cast: ['nova', 'smudge'], speaker: 'Nova', caption: '“Not you, buddy. You’re pink. Pink doesn’t count.” Smudge’s eye was very, very round.' },
    { bg: HARBOR, fx: 'clouds', set: 'docks', shot: 'two', mood: 'dusk', cast: ['saffron', 'nova'], speaker: 'Captain Saffron', caption: '“This is as close as the Marmalade dares to fly. The static fries every compass on board. Good luck, courier.”' },
    { bg: GREY, fx: 'static', set: 'wastes', shot: 'wide', cast: ['static*3@0,-3', 'nova:back@0,4'], caption: 'The glass hummed. Shapes made of TV noise flickered between the spires, there one moment and gone the next.' },
  ],
  'after-4-1': [
    { bg: MEADOW, fx: 'bloom', set: 'meadow', shot: 'two', cast: ['quartz', 'nova', 'tree@0,-5'], speaker: 'Prospector Quartz', caption: '“Forty years I’ve walked this glass. Forty years! And you just… planted something. And it GREW.”' },
    { bg: WASTES, fx: 'static', set: 'wastes', shot: 'low', cast: ['smudge', 'tower@5,-5'], caption: 'Smudge’s antenna crackled. Somewhere past the dunes, a storm of pure static was building.' },
  ],
  'after-4-2': [
    { bg: WASTES, fx: 'static', set: 'wastes', shot: 'two', cast: ['dot', 'smudge', 'tower:on@-6,-5'], speaker: 'Dot', caption: '“Clean signal across the whole Wastes! Weird thing, though. Your little robot is transmitting. Has been all day.”' },
    { bg: GREY, fx: 'static', set: 'wastes', shot: 'low', mood: 'night', cast: ['smudge', 'beam@0,0'], speaker: 'Dot', sfx: 'KZZT', shake: true, caption: '“Straight up. To the moon.”' },
    { bg: GREY, fx: 'static', set: 'wastes', shot: 'two', cast: ['nova', 'smudge:back'], speaker: 'Nova', caption: '“…Smudge?” For the first time since the market, Smudge didn’t beep at all.' },
    { bg: STONE, fx: 'runes', set: 'mine', shot: 'two', cast: ['moss', 'nova'], speaker: 'Professor Moss', caption: '“Courier! The Chroma mine! Pure green, sealed in geodes since the Bleach. Meet me there. …Is everything all right?”' },
  ],
  'after-4-3': [
    { bg: MEADOW, fx: 'sparkle', set: 'mine', shot: 'wide', cast: ['nova', 'smudge', 'geode@-3,-3', 'geode@3,-3'], caption: 'Five geodes of pure green Chroma, enough to fill the rocket twice over. Neither of them cheered.' },
    { bg: NIGHT, fx: 'holo', set: 'mine', shot: 'two', mood: 'night', cast: ['smudge', 'nova', 'whale:holo:small@-3.5,-3,0.6', 'cit0:holo@3.5,-3,-0.4', 'beacon:holo@0,-5'], speaker: 'Smudge', caption: '“Beep… beep.” It projected pictures into the air: the market, the trams, the whales, the meadow. Everything it had seen. Everything the moon had seen.' },
    { bg: NIGHT, fx: 'stars', set: 'mine', shot: 'two', mood: 'dusk', cast: ['nova', 'smudge'], speaker: 'Nova', caption: '“You didn’t know, did you?” Smudge shook its whole body. Nova picked it up. “Then you’re still my buddy. Okay?”' },
    { bg: GREY, fx: 'static', set: 'heart', shot: 'threat', cast: ['echo', 'nova', 'smudge'], sfx: 'KZZZT', shake: true, caption: 'But the Curator had been watching too, and taking notes. At the Prism Heart something was waiting, made of static and shaped exactly like Nova.' },
    { bg: GREY, fx: 'static', set: 'heart', shot: 'close', cast: ['echo'], speaker: 'Echo', caption: '“kzzt— Hey! Grey bucket! —kzzt— Put the color back! —kzzt— Put the color back! Put the—”' },
  ],
  'after-4-4': [
    { bg: WASTES, fx: 'static', set: 'heart', shot: 'wide', cast: ['nova', 'smudge'], sfx: 'SKRAAACK', shake: true, caption: 'The Echo burst into a thousand flecks of color. The Prism Heart stood cracked and silent in front of Nova.' },
    { bg: WASTES, fx: 'sparkle', set: 'heart', shot: 'solo', cast: ['nova', 'seed@1.4,0.8'], speaker: 'Nova', caption: '“Everyone keeps trying to fill you back up. Maybe that’s not how this works.” She planted a single Color Seed in the crack.' },
    { bg: MEADOW, fx: 'bloom', set: 'meadow', shot: 'wide', cast: ['tree@-5,-3', 'tree@5,-5', 'tree@0,-8', 'nova:back@0,3', 'smudge@1.6,3'], caption: 'The glass bloomed. Grass, flowers and trees spilled across the Wastes in every direction, and the Heart began to glow from within.' },
    { bg: MEADOW, fx: 'bloom', set: 'meadow', shot: 'two', cast: ['nova', 'smudge'], speaker: 'Nova', caption: '“Color isn’t fuel, Smudge. It’s a garden. You don’t keep it in a jar. You plant it.”' },
    { bg: MEADOW, fx: 'bloom', set: 'meadow', shot: 'low', cast: ['smudge:back'], caption: 'Smudge stared at the meadow for a long time, eye wide open. Somewhere far above, someone else was staring too.' },
    { bg: NIGHT, fx: 'moon', set: 'meadow', shot: 'low', mood: 'night', sfx: 'WHOOOSH', cast: ['rocket:launch@0,-6', 'tree@-6,-4', 'quartz:back@3.5,1.5', 'dot:back@5.2,2'], caption: 'That night, with a tank full of green Chroma, the rocket climbed out of the Wastes toward Pale.' },
    { bg: NIGHT, fx: 'stars', art: [], title: ['END OF CHAPTER 4', 'Next: Pale, the Moon Vault'], caption: 'Stolen color in jars, a lonely machine, and a grandpa under glass.' },
  ],
  'chapter-5': [
    { bg: NIGHT, fx: 'stars', art: [], title: ['CHAPTER 5', 'Pale, the Moon Vault'], caption: 'Every color the Harvesters ever took went up, and up, and ended here.' },
    { bg: WORKSHOP, fx: 'holo', set: 'workshop', shot: 'close', mood: 'night', cast: ['grandpa:holo'], speaker: 'Grandpa (recording)', caption: '“FILE 5 OF 5. If you’re going up there, kiddo… tell it I’m sorry. I should have kept visiting. I just got busy being sad.”' },
    { bg: NIGHT, fx: 'stars', set: 'moon', shot: 'wide', cam: [0.1, 0.12, 1], cast: ['rocket@-8,-4', 'nova:back@0,2', 'smudge@1.6,2'], caption: 'The rocket touched down beside a white door the size of a mountain. Carved above it in glass: THE COLLECTION.' },
    { bg: VAULT, fx: 'holo', set: 'vault', shot: 'wide', cast: ['archivist@-3,-2,0.4', 'archivist@4,-3,-0.4'], caption: 'Inside, the halls went on forever. Jars and jars and jars, each one full of a color that used to belong to someone.' },
    { bg: VAULT, fx: 'sparkle', set: 'vault', shot: 'two', cast: ['nova', 'smudge'], speaker: 'Nova', caption: '“Okay, Smudge. Last stop. We give it all back, and we bring Grandpa home.”' },
  ],
  'after-5-1': [
    { bg: VAULT, fx: 'sparkle', set: 'vault', shot: 'two', cast: ['docent', 'nova'], speaker: 'Docent', caption: '“The Gallery is next. That is where the Curator keeps its favorite pieces. Some of them used to walk around.”' },
    { bg: VAULT, fx: 'holo', set: 'gallery', shot: 'close', cast: ['docent'], speaker: 'Docent', caption: '“A new centerpiece arrived this week. EXHIBIT 1: THE KEEPER. The Curator sits beside him and talks. It has not talked in forty-one years.”' },
    { bg: GREY, fx: 'sparkle', set: 'gallery', shot: 'solo', mood: 'night', cast: ['grandpa:grey:raise@0,1', 'pedestal@0,1'], caption: 'Nova thought of Grandpa, frozen under glass with a plaque on his chest, and walked a lot faster.' },
  ],
  'after-5-2': [
    { bg: PASTEL, fx: 'confetti', set: 'vault', shot: 'group', cast: ['cit1', 'cit3', 'nova', 'cit4'], speaker: 'Exhibit', caption: '“We’ll find our way home. You go finish it, courier!”' },
    { bg: VAULT, fx: 'sparkle', set: 'gallery', shot: 'solo', cast: ['pedestal', 'nova:back@1.8,3'], caption: 'At the end of the Gallery stood an empty pedestal. Its plaque read EXHIBIT 1: THE KEEPER (MOVED TO THE CORE). Beside it sat a teacup.' },
    { bg: NIGHT, fx: 'stars', set: 'moon', shot: 'two', cast: ['docent', 'nova', 'mirror@-6,-4'], speaker: 'Docent', caption: '“The old color mirrors on the far side still work. Turn them toward Kittara and the light will carry everything home.”' },
  ],
  'after-5-3': [
    { bg: NIGHT, fx: 'stars', set: 'moon', shot: 'wide', cam: [0.1, 0.12, 1], cast: ['mirror:on@-6,-4', 'mirror:on@0,-6', 'mirror:on@6,-4', 'beam:0@-6,-4', 'beam:2@0,-6', 'beam:4@6,-4', 'nova:back@0,3', 'smudge@1.6,3'], caption: 'Three beams of color crossed the dark between Pale and Kittara. Somewhere down there, a whole planet looked up.' },
    { bg: VAULT, fx: 'stars', set: 'core', shot: 'solo', cast: ['curator', 'pedestal@5,-1', 'grandpa:grey:raise@5,-1,-0.5'], speaker: 'The Curator', caption: '“You are removing the exhibits. Please come to the Vault Core. The Keeper is here. I would like to explain why you are making a mistake.”' },
    { bg: VAULT, fx: 'sparkle', set: 'vault', shot: 'two', cast: ['nova', 'smudge'], speaker: 'Nova', caption: '“It said please. Why is that worse?”' },
  ],
  'boss-1-4': [
    { bg: GREY, fx: 'beams', set: 'street', shot: 'threat', grey: true, cast: ['sweeper', 'nova', 'smudge'], title: ['BOSS · MAIN STREET', 'Street Sweeper'], sfx: 'RRRMBLE', shake: true, caption: 'A Harvester the size of a tram. Three tanks on its back, sloshing with stolen color.' },
    { bg: WORKSHOP, fx: 'holo', set: 'workshop', shot: 'two', cast: ['grandpa:holo', 'nova'], speaker: 'Grandpa (recording)', caption: '“Big machines charge in straight lines, kiddo. Stand in front of something hard, step aside, and let it say hello to the bricks.”' },
  ],
  'boss-2-4': [
    { bg: GREY, fx: 'spores', set: 'jungle', shot: 'threat', grey: true, cast: ['whacker', 'nova', 'smudge'], title: ['BOSS · THE OLD GROVE', 'Weed Whacker'], sfx: 'BZZZRRT', shake: true, caption: 'It walks on four legs, mows down everything that glows, and runs very, very hot.' },
    { bg: JUNGLE, fx: 'spores', set: 'jungle', shot: 'two', mood: 'dusk', cast: ['fern', 'nova'], speaker: 'Ranger Fern', caption: '“When it starts smoking, its shell pops open. That’s your moment, courier. Don’t waste it.”' },
  ],
  'boss-3-4': [
    { bg: STORM, fx: 'wind', set: 'docks', shot: 'threat', grey: true, cast: ['trawler', 'nova', 'smudge'], title: ['BOSS · OPEN SKY', 'Net Trawler'], sfx: 'VRRRRM', shake: true, caption: 'An airship of grey steel, fishing for color with nets the size of houses.' },
    { bg: STORM, fx: 'wind', set: 'docks', shot: 'two', mood: 'grey', cast: ['gale', 'nova'], speaker: 'Bosun Gale', caption: '“Props, courier! Knock out all three propellers and she’ll drop like a stone. And mind those nets!”' },
  ],
  'boss-4-4': [
    { bg: WASTES, fx: 'static', set: 'heart', shot: 'threat', cast: ['echo', 'nova', 'smudge'], title: ['BOSS · THE PRISM HEART', 'The Echo'], sfx: 'KZZZT', shake: true, caption: 'Everything Nova had done, the Curator had watched. Now it had built an answer.' },
    { bg: GREY, fx: 'static', set: 'heart', shot: 'close', cast: ['echo'], speaker: 'Echo', caption: '“kzzt— Okay. Emergency. —kzzt— Okay. Emergency. Okay. Okay. Okay—”' },
  ],
  'boss-5-4': [
    { bg: NIGHT, fx: 'stars', set: 'core', shot: 'threat', cast: ['curator', 'nova', 'smudge'], title: ['FINAL BOSS · THE VAULT CORE', 'The Curator'], sfx: 'HMMMMM', caption: 'Six jars of stolen color circled a ring of white glass. In the middle, an eye opened.' },
    { bg: VAULT, fx: 'stars', set: 'core', shot: 'solo', cast: ['curator', 'pedestal@5,-1', 'grandpa:grey:raise@5,-1,-0.5'], speaker: 'The Curator', caption: '“Courier. Unit D-7. You have come a long way to break things. Please, sit. The Keeper always sat.”' },
  ],
  ending: [
    { bg: PASTEL, fx: 'confetti', set: 'moon', shot: 'low', mood: 'dusk', cast: ['ring:color@0,-5', 'nova:back@0,3', 'smudge@1.6,3'], sfx: 'FWOOOSH', caption: 'The vault opened. A rainbow poured out of the moon and all the way down to Kittara.' },
    { bg: VAULT, fx: 'sparkle', set: 'core', shot: 'low', cast: ['grandpa:grey'], sfx: 'KRAK', shake: true, caption: 'In the core, the glass case around Grandpa cracked, and color rushed back into his fur.' },
    { bg: VAULT, fx: 'confetti', set: 'core', shot: 'close', mood: 'warm', cast: ['grandpa'], speaker: 'Grandpa Oolong', caption: '“—and the banker says, ‘Sorry, pal. You’d be underwater by Tuesday!’ …Huh. Why is everyone crying? Nova? Is that the MOON?”' },
    { bg: VAULT, fx: 'stars', set: 'core', shot: 'two', cast: ['grandpa', 'nova', 'ring@0,-8'], speaker: 'Grandpa Oolong', caption: '“Oh, old friend. I’m sorry. I should have kept coming.” But the Curator didn’t answer. It had gone still, offline, maybe for good.' },
    { bg: SKY, fx: 'confetti', set: 'festival', shot: 'group', cast: ['tom', 'pip', 'biscuit', 'mittens', 'cit0'], caption: 'Back in Purrville, the festival started over right where it had stopped.' },
    { bg: SKY, fx: 'sparkle', set: 'festival', shot: 'low', mood: 'night', cast: ['nova:back', 'smudge:back'], speaker: 'Nova', caption: '“We did it, buddy.” Smudge beeped, and looked up at the grey moon for a long time.' },
    { bg: NIGHT, fx: 'stars', art: [], title: ['THE END', 'Thanks for playing Prism Paw'], caption: 'Something is still missing up there. Find every Color Seed on Kittara, then face the Curator again.' },
  ],
  'ending-true': [
    { bg: PASTEL, fx: 'confetti', set: 'moon', shot: 'low', mood: 'dusk', cast: ['ring:color@0,-5', 'nova:back@0,3', 'smudge@1.6,3'], sfx: 'FWOOOSH', caption: 'The vault opened. A rainbow poured out of the moon and all the way down to Kittara.' },
    { bg: VAULT, fx: 'sparkle', set: 'core', shot: 'low', cast: ['grandpa:grey'], sfx: 'KRAK', shake: true, caption: 'In the core, the glass case around Grandpa cracked, and color rushed back into his fur.' },
    { bg: VAULT, fx: 'confetti', set: 'core', shot: 'close', mood: 'warm', cast: ['grandpa'], speaker: 'Grandpa Oolong', caption: '“—and the banker says, ‘Sorry, pal. You’d be underwater by Tuesday!’ …Huh. Why is everyone crying? Nova? Is that the MOON?”' },
    { bg: VAULT, fx: 'bloom', set: 'vault', shot: 'wide', cast: ['nova', 'smudge', 'tree:small@-5,-2', 'tree:small@5,-3', 'plot@-2,-1', 'plot@2.5,-1'], caption: 'But Nova didn’t leave yet. One by one, she planted every Color Seed she had found, right there on the white marble floor.' },
    { bg: VAULT, fx: 'stars', set: 'core', shot: 'threat', cast: ['ring:color', 'grandpa'], speaker: 'The Curator', caption: '“Keeper. You came back.”' },
    { bg: VAULT, fx: 'stars', set: 'core', shot: 'two', mood: 'warm', cast: ['grandpa', 'nova', 'ring:color@0,-8'], speaker: 'Grandpa Oolong', caption: '“Sorry I’m late, old friend. Forty-one years late. I brought my grandkit. She brought a garden.”' },
    { bg: VAULT, fx: 'stars', set: 'core', shot: 'low', cast: ['ring:color'], speaker: 'The Curator', caption: '“NEVER LET THE COLOR RUN OUT… never… let…” The words flickered, and were rewritten.' },
    { bg: PASTEL, fx: 'bloom', art: ['curatorRing'], title: ['NEW ORDER', 'Help the color grow.'], caption: 'The Curator rebooted as a gardener.' },
    { bg: PASTEL, fx: 'stars', set: 'moon', shot: 'low', mood: 'dusk', cast: ['nova:back', 'smudge'], caption: 'That night Pale glowed in soft pastel colors, a second rainbow in the sky. Smudge beeped.' },
    { bg: PASTEL, fx: 'confetti', set: 'vault', shot: 'two', mood: 'dusk', cast: ['nova', 'smudge'], speaker: 'Nova', caption: '“He says it’s the best exhibit he’s ever seen.”' },
    { bg: SKY, fx: 'confetti', set: 'workshop', shot: 'group', cast: ['grandpa', 'pip', 'nova', 'smudge'], speaker: 'Grandpa Oolong', caption: '“Sunday visits start again, kiddo. Pack the tea. And no, Pip, you can’t drive the rocket.”' },
    { bg: PASTEL, fx: 'bloom', art: [], title: ['THE TRUE END', 'Thanks for playing Prism Paw'], caption: 'You don’t keep color in a jar. You give it away, and it grows back.' },
  ],
};

/** Comics in campaign order, for the title screen's story replay. */
export const STORY_ORDER = [
  ['opening', 'Prologue · Grey Morning'],
  ['after-1-1', '1-1 · Market District'], ['after-1-2', '1-2 · Tram Yards'], ['after-1-3', '1-3 · Festival Square'], ['boss-1-4', 'Boss · Street Sweeper'], ['after-1-4', '1-4 · Street Sweeper'],
  ['chapter-2', 'Chapter 2 · Glowshroom Jungle'],
  ['after-2-1', '2-1 · Spore Trail'], ['after-2-2', '2-2 · The Sunken Lab'], ['after-2-3', '2-3 · Firefly Night'], ['boss-2-4', 'Boss · Weed Whacker'], ['after-2-4', '2-4 · Weed Whacker'],
  ['chapter-3', 'Chapter 3 · Coral Sky Docks'],
  ['after-3-1', '3-1 · Harbor Gate'], ['after-3-2', '3-2 · Whale Watch'], ['after-3-3', '3-3 · Squall Deck'], ['boss-3-4', 'Boss · Net Trawler'], ['after-3-4', '3-4 · Net Trawler'],
  ['chapter-4', 'Chapter 4 · The Static Wastes'],
  ['after-4-1', '4-1 · Glass Dunes'], ['after-4-2', '4-2 · Static Storm'], ['after-4-3', '4-3 · Chroma Mine'], ['boss-4-4', 'Boss · The Echo'], ['after-4-4', '4-4 · The Echo'],
  ['chapter-5', 'Chapter 5 · Pale, the Moon Vault'],
  ['after-5-1', '5-1 · Moon Gate'], ['after-5-2', '5-2 · Gallery of Color'], ['after-5-3', '5-3 · The Far Side'], ['boss-5-4', 'Final Boss · The Curator'],
  ['ending', 'Ending'], ['ending-true', 'True Ending'],
];

/** The four murals of the Sunken Lab (2-2): the story of The Bleach. */
export const MURALS = [
  { bg: STONE, fx: 'runes', art: ['cit2', 'cit4'], mural: true, speaker: 'Ancient mural I', caption: 'Long ago, the cats of Kittara drew color from the Prism Heart. Their cities glowed and their forests sang.' },
  { bg: STONE, fx: 'runes', art: ['cit3'], mural: true, speaker: 'Ancient mural II', caption: 'They wanted more. They drilled deeper and deeper, until the Prism Heart cracked.' },
  { bg: STONE, fx: 'beams', art: ['grandpaFrozen'], mural: true, speaker: 'Ancient mural III', caption: 'The Bleach rolled across the land. Forests turned to grey glass. Whole cities fell silent.' },
  { bg: STONE, fx: 'ring', art: [], mural: true, speaker: 'Ancient mural IV', caption: 'The survivors built a guardian of white glass and gave it one order: NEVER LET THE COLOR RUN OUT. So it would not be lonely, they promised it a Keeper.' },
];

/** Purrville world map nodes, in campaign order. */
const PURRVILLE = [
  { id: 'hub', name: "Grandpa's Workshop", x: 16, y: 72, kind: 'home', brief: 'Shop, upgrades and a cup of milk.' },
  { id: '1-1', name: 'Market District', x: 34, y: 44, brief: 'Find out what happened, destroy the Grey Vats and light the Market Beacon.', comicAfter: 'after-1-1' },
  { id: '1-2', name: 'Tram Yards', x: 60, y: 62, brief: 'Restart the four tram generators so the trams can carry color across town.', comicAfter: 'after-1-2' },
  { id: '1-3', name: 'Festival Square', x: 74, y: 30, brief: 'Thaw the frozen townscats and relight the Festival Beacon.', comicAfter: 'after-1-3' },
  { id: '1-4', name: 'Street Sweeper', x: 90, y: 50, kind: 'boss', brief: 'A Harvester the size of a truck is sweeping up Main Street. Pop the three color tanks on its back.', comicAfter: 'after-1-4' },
];

const JUNGLE_NODES = [
  { id: 'hub', name: "Grandpa's Workshop", x: 10, y: 80, kind: 'home', brief: 'Take the tram home: shop, upgrades and a cup of milk.' },
  { id: '2-1', name: 'Spore Trail', x: 28, y: 58, brief: 'Find Ranger Fern, bounce across the river and pop three Grey Vats.', comicAfter: 'after-2-1' },
  { id: '2-2', name: 'The Sunken Lab', x: 52, y: 36, brief: 'Explore pre-Bleach ruins, read the four murals and relight the Lab Beacon.', comicAfter: 'after-2-2' },
  { id: '2-3', name: 'Firefly Night', x: 72, y: 62, brief: 'The trail after dark. Relight five firefly lanterns and bring the sunrise.', comicAfter: 'after-2-3' },
  { id: '2-4', name: 'Weed Whacker', x: 88, y: 30, kind: 'boss', brief: 'A walking lawnmower is cutting down the Old Grove. Make it overheat, then smash its core.', comicAfter: 'after-2-4' },
];

const DOCKS_NODES = [
  { id: 'hub', name: "Grandpa's Workshop", x: 10, y: 82, kind: 'home', brief: 'Catch the mail airship home: shop, upgrades and a cup of milk.' },
  { id: '3-1', name: 'Harbor Gate', x: 26, y: 60, brief: 'Meet Captain Saffron, find Grandpa’s Ricochet and pop the Grey Vats on the lower piers.', comicAfter: 'after-3-1' },
  { id: '3-2', name: 'Whale Watch', x: 48, y: 30, brief: 'Paint the three greyed sky-whales back to color and pop the Vats.', comicAfter: 'after-3-2' },
  { id: '3-3', name: 'Squall Deck', x: 70, y: 64, brief: 'A storm over the cargo deck. Thaw the dockhands, and let the gusts blow robots overboard.', comicAfter: 'after-3-3' },
  { id: '3-4', name: 'Net Trawler', x: 88, y: 28, kind: 'boss', brief: 'A Harvester airship is trawling the sky for color. Chase it across three ships and shoot down its propellers.', comicAfter: 'after-3-4' },
];

const WASTES_NODES = [
  { id: 'hub', name: "Grandpa's Workshop", x: 10, y: 84, kind: 'home', brief: 'Catch the Marmalade home: shop, upgrades and a cup of milk.' },
  { id: '4-1', name: 'Glass Dunes', x: 24, y: 58, brief: 'Meet the old prospector, find the Seed Mortar and plant three Color Seeds in the glass.', comicAfter: 'after-4-1' },
  { id: '4-2', name: 'Static Storm', x: 46, y: 34, brief: 'Static surges blind the flats. Tune four radio towers to calm the storm.', comicAfter: 'after-4-2' },
  { id: '4-3', name: 'Chroma Mine', x: 68, y: 62, brief: 'Crack five Chroma geodes behind the glass for the rocket\u2019s green fuel.', comicAfter: 'after-4-3' },
  { id: '4-4', name: 'The Echo', x: 88, y: 32, kind: 'boss', brief: 'A static copy of Nova guards the cracked Prism Heart. It fights with whatever you are holding.', comicAfter: 'after-4-4' },
];

const PALE_NODES = [
  { id: 'hub', name: "Grandpa's Workshop", x: 10, y: 84, kind: 'home', brief: 'Fly the rocket home: shop, upgrades and a cup of milk.' },
  { id: '5-1', name: 'Moon Gate', x: 24, y: 58, brief: 'Enter the vault, find the Rainbow Beam and smash six jars of stolen color.', comicAfter: 'after-5-1' },
  { id: '5-2', name: 'Gallery of Color', x: 44, y: 30, brief: 'Free six frozen cats on display, past the sweeping security lasers.', comicAfter: 'after-5-2' },
  { id: '5-3', name: 'The Far Side', x: 68, y: 62, brief: 'Low gravity on the moon\u2019s surface. Aim three color mirrors at Kittara.', comicAfter: 'after-5-3' },
  // the finale: the true ending needs every Color Seed in the campaign
  { id: '5-4', name: 'The Curator', x: 88, y: 32, kind: 'boss', brief: 'The machine that took the color. Smash its collection and reach its core.', comicAfter: (seeds, total) => (seeds >= total ? 'ending-true' : 'ending') },
];

export const WORLDS = [
  { id: 'purrville', name: 'Purrville', nodes: PURRVILLE, opens: '1-1' },
  { id: 'jungle', name: 'Glowshroom Jungle', nodes: JUNGLE_NODES, opens: '2-1' },
  { id: 'docks', name: 'Coral Sky Docks', nodes: DOCKS_NODES, opens: '3-1' },
  { id: 'wastes', name: 'Static Wastes', nodes: WASTES_NODES, opens: '4-1' },
  { id: 'pale', name: 'Pale', nodes: PALE_NODES, opens: '5-1' },
];

/** Every node across worlds (for level lookups). */
export const WORLD = [...PURRVILLE, ...[...JUNGLE_NODES, ...DOCKS_NODES, ...WASTES_NODES, ...PALE_NODES].filter((n) => n.id !== 'hub')];

/** Grandpa hologram greetings, chosen by progress (last matching entry wins). */
export const GRANDPA_LINES = [
  { when: () => true, lines: [['Grandpa (recording)', 'Sparks in, gadgets out. That’s how the workshop works, kiddo.']] },
  { when: (s) => s.cleared['1-2'], lines: [['Grandpa (recording)', 'Festival Square? Take extra sardines. Trust me.']] },
  { when: (s) => s.cleared['1-3'], lines: [['Grandpa (recording)', 'A Street Sweeper? Its tanks are on the back, kiddo. Make it charge into something hard.']] },
  { when: (s) => s.cleared['1-4'], lines: [['Grandpa (recording)', 'The moon, eh? Then you need a rocket, and a rocket needs pure Chroma. Try the old lab in the Glowshroom Jungle.']] },
  { when: (s) => s.cleared['2-1'], lines: [['Grandpa (recording)', 'The Bubble Gun! I built that for bath time. Turns out robots hate baths too.']] },
  { when: (s) => s.cleared['2-2'], lines: [['Grandpa (recording)', 'So now you know about the Bleach. And about me, I suppose. Sundays on the moon, kiddo. Long story.']] },
  { when: (s) => s.cleared['2-3'], lines: [['Grandpa (recording)', 'A walking mower? Its brain is in that glowing ball, kiddo. Let it tire itself out, then let it have it.']] },
  { when: (s) => s.cleared['2-4'], lines: [['Grandpa (recording)', 'Sky Docks next! Bring a scarf. It\u2019s windy up there.']] },
  { when: (s) => s.cleared['3-1'], lines: [['Grandpa (recording)', 'The Ricochet! Bounce it off the containers, kiddo. Angles are free.']] },
  { when: (s) => s.cleared['3-2'], lines: [['Grandpa (recording)', 'Sky-whales singing again\u2026 I proposed to your grandma under a whale song, you know.']] },
  { when: (s) => s.cleared['3-3'], lines: [['Grandpa (recording)', 'An airship Harvester? The engines are always the weak spot. Ask any sky captain.']] },
  { when: (s) => s.cleared['3-4'], lines: [['Grandpa (recording)', 'A rocket! But green Chroma means the Static Wastes. Be careful out there, kiddo.']] },
  { when: (s) => s.cleared['4-1'], lines: [['Grandpa (recording)', 'The Seed Mortar! I built it for my vegetable patch. Your grandma said it was \u201cexcessive.\u201d']] },
  { when: (s) => s.cleared['4-2'], lines: [['Grandpa (recording)', 'Static ghosts? Shoot \u2019em when they\u2019re solid, kiddo. Seeds don\u2019t care either way.']] },
  { when: (s) => s.cleared['4-3'], lines: [['Grandpa (recording)', 'Something at the Heart that looks like you? Then it fights like you. Change it up!']] },
  { when: (s) => s.cleared['4-4'], lines: [['Grandpa (recording)', 'The moon, kiddo. If you see a big glass ring up there\u2026 it isn\u2019t a monster. It\u2019s just been alone too long.']] },
  { when: (s) => s.cleared['5-1'], lines: [['Grandpa (recording)', 'The Rainbow Beam! Never finished it. Apparently YOU did. Don\u2019t point it at the cat.']] },
  { when: (s) => s.cleared['5-3'], lines: [['Grandpa (recording)', 'If that machine is scared, kiddo, shooting won\u2019t fix it. Show it something better.']] },
  { when: (s) => s.cleared['5-4'], lines: [['Grandpa (recording)', 'Recording? Ha! I\u2019m back, kiddo. Recordings don\u2019t eat this many sardines.']] },
];

export const PIP_LINES = [
  { when: () => true, lines: [['Pip', 'Are you gonna save Purrville? Can I hold the blaster? No? Okay.'], ['Pip', 'Tip: Moppers block shots from the front. Walk around them!']] },
  { when: (s) => s.cleared['1-1'], lines: [['Pip', 'Grandpa’s hologram sells Paint Bombs. Press G to throw one. BOOM. Pink everywhere.']] },
  { when: (s) => s.cleared['1-2'], lines: [['Pip', 'My mom is frozen at the festival. Please bring her back, Nova.']] },
  { when: (s) => s.cleared['1-3'], lines: [['Pip', 'Mom says thank you! She made you a sardine pie. It’s… very sardine.'], ['Pip', 'The big sweeper truck is scary. Paint Bombs hit all its tanks at once!']] },
  { when: (s) => s.cleared['1-4'], lines: [['Pip', 'You beat the Street Sweeper! Everyone at school is talking about you!'], ['Pip', 'Is the jungle really glowing? Bring me a mushroom! A small one!']] },
  { when: (s) => s.cleared['2-1'], lines: [['Pip', 'Grey blobs that split in two? Gross. Shoot the little ones fast!']] },
  { when: (s) => s.cleared['2-3'], lines: [['Pip', 'You went in the jungle at NIGHT? I would have screamed. A lot.']] },
  { when: (s) => s.cleared['2-4'], lines: [['Pip', 'Sky-whales are real?! Can you bring me one? A small one!']] },
  { when: (s) => s.cleared['3-1'], lines: [['Pip', 'Flat robots? Like paper? Are they scared of scissors?'], ['Pip', 'Tip: the Ricochet bounces! Shoot the wall next to the robot!']] },
  { when: (s) => s.cleared['3-2'], lines: [['Pip', 'You painted a WHALE. Best. Courier. Ever.']] },
  { when: (s) => s.cleared['3-4'], lines: [['Pip', 'A real rocket?! Can I come? I can sit on Smudge!']] },
  { when: (s) => s.cleared['4-1'], lines: [['Pip', 'You grew a TREE in the scary desert? Can you grow me a candy tree?'], ['Pip', 'Tip: the Seed Mortar flies over glass walls!']] },
  { when: (s) => s.cleared['4-4'], lines: [['Pip', 'There was ANOTHER you?! Was it as cool as you? …No way.']] },
  { when: (s) => s.cleared['5-1'], lines: [['Pip', 'A museum on the MOON? Did you get me a postcard? A small one?']] },
  { when: (s) => s.cleared['5-4'], lines: [['Pip', 'You saved EVERYONE. Mom says you can have the last slice of sardine pie. It\u2019s… still very sardine.'], ['Pip', 'Psst. They say if you find every single Color Seed, the moon does something amazing.']] },
];

export const THAW_LINES = [
  'Brrr! Did I miss the parade?',
  'My tail is still numb!',
  'Is that a pink robot?',
  'Color! I can see color again!',
  'Thank you, courier!',
  'Go get ’em, Nova!',
  'Somebody check on my cake!',
];
