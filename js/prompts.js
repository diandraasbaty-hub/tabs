/* TABS — prompt banks.
   WILDCARDS is the third tab. One per day, same for everyone, chosen from
   the date so it can't drift between devices. Keep them short enough to
   answer in one line and mix the silly with the real. US English only. */

const WILDCARDS = [
  "one thing I need",
  "something I'm avoiding",
  "a small win",
  "the last thing that made me laugh",
  "an unpopular opinion",
  "something I'd do if nobody was watching",
  "what I'd spend $40 on right now",
  "a thing I'm weirdly proud of",
  "what I keep re-reading",
  "something I'm dreading",
  "the pettiest thing bothering me",
  "who I owe a text",
  "the best thing I ate this week",
  "a song stuck in my head",
  "something I want to quit",
  "what I'd do with a free Tuesday",
  "a compliment I got and didn't believe",
  "the tab I refuse to close",
  "something I'm pretending is fine",
  "what I'd tell 16-year-old me",
  "a thing I want to be talked into",
  "the last photo I took",
  "something I've been putting off for a month",
  "who I'd call if it all went sideways",
  "an opinion I've changed",
  "what I want more of",
  "the dumbest thing I googled today",
  "a place I want to be right now",
  "something I'm secretly excited about",
  "the hardest part of today",
  "what nobody knows I'm working on",
  "a thing I need permission to stop doing",
  "the best advice I ignored",
  "something I'd buy twice",
  "who deserves a thank you",
  "a habit I'm trying to build",
  "the thing I keep rehearsing in my head",
  "what would make tomorrow easier",
  "something that surprised me",
  "the last time I felt proud",
  "a fear I'd like to retire",
  "what I'm reading, watching, or scrolling",
  "something I want to say out loud",
  "the smallest thing that made today better",
  "a promise I made myself",
  "what I'd do with one extra hour",
  "someone I miss",
  "the thing I'd fix with a magic wand",
  "what I'm rooting for",
  "a rule I'm breaking this week",
  "something I'm curious about",
  "the last kind thing someone did",
  "what's taking up the most space in my head",
  "a thing I want to start on Monday",
  "something I'm ready to let go of",
  "what I'd want in my hotel room tonight",
  "the part of today I'd repeat",
  "an excuse I'm tired of using",
  "who I want to be more like",
  "something worth celebrating",
  "the last time I laughed until I cried",
  "a question I can't stop asking"
];

/* Rotating placeholder examples so the empty field never feels blank. */
const EXAMPLES = {
  thought: [
    "why do hotel showers have seventeen settings",
    "I think about that one email from 2019 daily",
    "grocery stores should have a nap aisle",
    "nobody knows what a shallot actually is",
    "the ocean is a soup and we swim in it"
  ],
  doing: [
    "three calls and a thing I forgot to book",
    "laundry, allegedly",
    "pretending to answer emails",
    "driving somewhere I don't want to go",
    "one more meeting and then I'm free"
  ],
  wild: [
    "someone to tell me the deck looks fine",
    "a nap and zero notifications",
    "an honest answer, not a nice one"
  ]
};

const MOODS = ["\u{1F4AD}", "\u{1F62E}‍\u{1F4A8}", "\u{1F979}", "\u{1F929}", "\u{1FAE0}", "\u{1F602}"];
