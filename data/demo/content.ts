import type { GlossaryEntry } from "@/lib/data/types";

/**
 * Hand-written sample chapters so the whole product can be explored before any
 * database or AI key is configured. Each chapter is an excerpt of the opening of
 * the book (public domain), with Light / Modern / Contemporary renderings
 * aligned paragraph for paragraph.
 */
export type DemoChapter = {
  title: string;
  original: string[];
  levels: { 1: string[]; 2: string[]; 3: string[] };
  glossary: GlossaryEntry[];
};

export const demoContent: Record<string, DemoChapter> = {
  "pride-and-prejudice": {
    title: "Chapter 1",
    original: [
      "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",
      "However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.",
      "“My dear Mr. Bennet,” said his lady to him one day, “have you heard that Netherfield Park is let at last?”",
      "Mr. Bennet replied that he had not.",
    ],
    levels: {
      1: [
        "It is a truth everyone accepts that a single man with a good fortune must be looking for a wife.",
        "However little is known about such a man's feelings or intentions when he first arrives in a neighbourhood, this idea is so firmly fixed in the minds of the families around him that he is regarded as the rightful property of one of their daughters.",
        "“My dear Mr. Bennet,” his wife said to him one day, “have you heard that Netherfield Park has finally been rented?”",
        "Mr. Bennet replied that he had not.",
      ],
      2: [
        "Everyone knows that a wealthy single man must be looking for a wife.",
        "We may know nothing about what he wants when he moves to town, but the neighbours are so sure of this one fact that they treat him as if he already belongs to one of their daughters.",
        "“My dear Mr. Bennet,” his wife said one day, “have you heard? Netherfield Park has finally been rented.”",
        "Mr. Bennet said he hadn't.",
      ],
      3: [
        "Everybody knows a rich, single guy has to be shopping for a wife.",
        "Nobody has any clue what he actually wants when he rolls into town, but the local families don't care. They've already decided he's going to marry one of their daughters.",
        "“Mr. Bennet,” his wife said one day, “did you hear? Someone finally rented Netherfield Park!”",
        "Mr. Bennet had not.",
      ],
    },
    glossary: [
      { term: "let", definition: "Rented out to a tenant.", modernEquiv: "rented" },
      {
        term: "in want of",
        definition: "Lacking, or needing something.",
        modernEquiv: "needs",
      },
    ],
  },

  "alices-adventures-in-wonderland": {
    title: "Chapter 1: Down the Rabbit-Hole",
    original: [
      "Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, “and what is the use of a book,” thought Alice “without pictures or conversations?”",
      "So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.",
    ],
    levels: {
      1: [
        "Alice was getting very tired of sitting beside her sister on the riverbank with nothing to do. Once or twice she had peeked at the book her sister was reading, but it had no pictures or conversations in it. “And what is the use of a book,” thought Alice, “without pictures or conversations?”",
        "So she was wondering, as well as she could, since the hot day made her feel sleepy and slow, whether making a daisy chain was worth the effort of getting up to pick the daisies, when suddenly a White Rabbit with pink eyes ran close by her.",
      ],
      2: [
        "Alice was bored. She was sitting on the bank next to her sister with nothing to do, and the book her sister was reading had no pictures or dialogue. “What's the point of a book,” she thought, “without pictures or conversations?”",
        "The heat made her sleepy and a bit dull, and she was trying to decide whether a daisy chain was worth getting up to pick the flowers, when a White Rabbit with pink eyes suddenly ran past her.",
      ],
      3: [
        "Alice was SO bored. She was stuck on the riverbank next to her sister, who was deep in a book with no pictures and no dialogue. “What even is the point of a book like that?” she thought.",
        "It was a hot, drowsy day and her brain was mush. She was wondering if a daisy chain was worth standing up for when, out of nowhere, a White Rabbit with pink eyes dashed right past her.",
      ],
    },
    glossary: [
      {
        term: "daisy-chain",
        definition: "A string of daisies threaded together to make a garland.",
        modernEquiv: "daisy chain",
      },
    ],
  },

  frankenstein: {
    title: "Letter 1",
    original: [
      "You will rejoice to hear that no disaster has accompanied the commencement of an enterprise which you have regarded with such evil forebodings. I arrived here yesterday, and my first task is to assure my dear sister of my welfare and increasing confidence in the success of my undertaking.",
    ],
    levels: {
      1: [
        "You will be glad to hear that no disaster has marked the beginning of an undertaking you viewed with such dark misgivings. I arrived here yesterday, and my first task is to assure my dear sister that I am well and growing more confident of success.",
      ],
      2: [
        "You'll be relieved to hear that nothing has gone wrong at the start of this expedition, which you were so worried about. I arrived yesterday, and the first thing I want to do is tell my dear sister that I'm well and increasingly sure this will work.",
      ],
      3: [
        "Good news: nothing has gone wrong yet! I know you were convinced this whole trip was doomed. I got here yesterday and wanted to tell you straight away that I'm fine, and I'm feeling more and more confident about it.",
      ],
    },
    glossary: [
      {
        term: "forebodings",
        definition: "A feeling that something bad is going to happen.",
        modernEquiv: "bad feelings",
      },
    ],
  },

  dracula: {
    title: "Chapter 1: Jonathan Harker's Journal",
    original: [
      "3 May. Bistritz.—Left Munich at 8:35 P. M., on 1st May, arriving at Vienna early next morning; should have arrived at 6:46, but train was an hour late. Buda-Pesth seems a wonderful place, from the glimpse which I got of it from the train and the little I could walk through the streets.",
    ],
    levels: {
      1: [
        "3 May. Bistritz. I left Munich at 8:35 p.m. on 1 May and reached Vienna early the next morning. We should have arrived at 6:46, but the train was an hour late. Budapest seems a wonderful place, judging by the glimpse I had from the train and the little I could walk through its streets.",
      ],
      2: [
        "3 May, Bistritz. I left Munich at 8:35 on the evening of 1 May and got to Vienna early the next morning. We were supposed to arrive at 6:46, but the train ran an hour late. Budapest looks wonderful from what I saw from the train window and on a short walk.",
      ],
      3: [
        "May 3, Bistritz. Left Munich at 8:35 PM on May 1st and reached Vienna early the next morning. The train was an hour late, naturally. Budapest looks amazing, though I only saw it from the train and on a quick walk around.",
      ],
    },
    glossary: [
      {
        term: "Buda-Pesth",
        definition: "The old spelling of Budapest.",
        modernEquiv: "Budapest",
      },
    ],
  },

  "jane-eyre": {
    title: "Chapter 1",
    original: [
      "There was no possibility of taking a walk that day. We had been wandering, indeed, in the leafless shrubbery an hour in the morning; but since dinner (Mr. Reed, when there was no company, dined early) the cold winter wind had brought with it clouds so sombre, and a rain so penetrating, that further out-door exercise was now out of the question.",
    ],
    levels: {
      1: [
        "There was no chance of a walk that day. We had wandered in the leafless shrubbery for an hour that morning, but since dinner (Mr. Reed dined early when there were no guests) the cold winter wind had brought clouds so dark and rain so soaking that going outside again was out of the question.",
      ],
      2: [
        "We couldn't go for a walk that day. We'd spent an hour that morning wandering through the bare bushes, but after dinner (Mr. Reed ate early when there were no guests) the cold winter wind brought dark clouds and heavy rain, so there was no going out again.",
      ],
      3: [
        "No walk today. We'd already trudged around the bare garden for an hour that morning, but after an early dinner the freezing wind rolled in with dark clouds and rain that soaked through everything. Outside was officially off the table.",
      ],
    },
    glossary: [
      { term: "sombre", definition: "Dark and gloomy.", modernEquiv: "dark, gloomy" },
      {
        term: "shrubbery",
        definition: "An area planted with shrubs.",
        modernEquiv: "bushes",
      },
    ],
  },

  "wuthering-heights": {
    title: "Chapter 1",
    original: [
      "1801.—I have just returned from a visit to my landlord—the solitary neighbour that I shall be troubled with. This is certainly a beautiful country! In all England, I do not believe that I could have fixed on a situation so completely removed from the stir of society.",
    ],
    levels: {
      1: [
        "1801. I have just come back from visiting my landlord, the one lonely neighbour I will have to put up with. This is certainly a beautiful country! I do not think I could have found a place in all of England so completely removed from the bustle of society.",
      ],
      2: [
        "1801. I've just got back from visiting my landlord, who will be my only neighbour out here. It's beautiful country! I doubt I could have found anywhere in England so far from the noise of society.",
      ],
      3: [
        "1801. Just got back from meeting my landlord, my one and only neighbour. Gorgeous scenery, honestly. I doubt there's a spot anywhere in England more cut off from civilisation.",
      ],
    },
    glossary: [
      {
        term: "landlord",
        definition: "The person from whom one rents a property.",
        modernEquiv: "landlord",
      },
    ],
  },

  "great-expectations": {
    title: "Chapter 1",
    original: [
      "My father's family name being Pirrip, and my Christian name Philip, my infant tongue could make of both names nothing longer or more explicit than Pip. So, I called myself Pip, and came to be called Pip.",
      "I give Pirrip as my father's family name, on the authority of his tombstone and my sister,—Mrs. Joe Gargery, who married the blacksmith.",
    ],
    levels: {
      1: [
        "My father's family name was Pirrip and my first name was Philip, and my baby tongue could manage nothing longer or clearer than Pip. So I called myself Pip, and came to be called Pip.",
        "I give Pirrip as my father's family name on the authority of his tombstone and my sister, Mrs. Joe Gargery, who married the blacksmith.",
      ],
      2: [
        "My father's surname was Pirrip and my first name was Philip, but as a toddler the best I could say was “Pip.” So I called myself Pip, and everyone else did too.",
        "I only know my father's surname from his gravestone and from my sister, Mrs. Joe Gargery, who married the blacksmith.",
      ],
      3: [
        "My dad's last name was Pirrip and my first name is Philip, but as a baby I couldn't get past “Pip.” So I called myself Pip, and the name stuck.",
        "I only know the Pirrip part from his gravestone and from my sister, Mrs. Joe Gargery, who married the local blacksmith.",
      ],
    },
    glossary: [
      {
        term: "Christian name",
        definition: "A person's given name, as opposed to the family name.",
        modernEquiv: "first name",
      },
    ],
  },

  "the-picture-of-dorian-gray": {
    title: "Chapter 1",
    original: [
      "The studio was filled with the rich odour of roses, and when the light summer wind stirred amidst the trees of the garden, there came through the open door the heavy scent of the lilac, or the more delicate perfume of the pink-flowering thorn.",
    ],
    levels: {
      1: [
        "The studio was filled with the rich smell of roses, and when the light summer breeze stirred the trees in the garden, the heavy scent of lilac drifted through the open door, or the more delicate perfume of the pink-flowering hawthorn.",
      ],
      2: [
        "The studio smelled richly of roses. Whenever a light summer breeze moved through the garden trees, it carried in through the open door the heavy scent of lilac or the softer fragrance of pink hawthorn blossom.",
      ],
      3: [
        "The studio was thick with the smell of roses. Every time a warm summer breeze shook the garden trees, it wafted in through the open door: heavy lilac, or the softer scent of pink hawthorn.",
      ],
    },
    glossary: [
      {
        term: "pink-flowering thorn",
        definition: "Hawthorn, a thorny shrub with pink blossoms.",
        modernEquiv: "pink hawthorn",
      },
    ],
  },

  "crime-and-punishment": {
    title: "Part 1, Chapter 1",
    original: [
      "On an exceptionally hot evening early in July a young man came out of the garret in which he lodged in S. Place and walked slowly, as though in hesitation, towards K. bridge.",
    ],
    levels: {
      1: [
        "On an exceptionally hot evening in early July, a young man left the attic room where he lodged in S. Place and walked slowly, as if hesitating, towards K. Bridge.",
      ],
      2: [
        "One unusually hot evening in early July, a young man stepped out of the tiny attic room he rented and began walking slowly, almost reluctantly, towards the bridge.",
      ],
      3: [
        "It was an insanely hot evening in early July. A young man left the cramped attic he was renting and started walking toward the bridge, slowly, like he wasn't sure he should.",
      ],
    },
    glossary: [
      {
        term: "garret",
        definition: "A small, cramped room directly under the roof.",
        modernEquiv: "attic room",
      },
    ],
  },

  "moby-dick": {
    title: "Chapter 1: Loomings",
    original: [
      "Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world.",
    ],
    levels: {
      1: [
        "Call me Ishmael. Some years ago, never mind exactly how long, having little or no money and nothing in particular to hold my interest on land, I thought I would sail about a little and see the watery part of the world.",
      ],
      2: [
        "Call me Ishmael. A few years back, I won't say exactly how many, I was nearly broke and there was nothing on land to keep me interested, so I decided to go to sea and see the watery part of the world.",
      ],
      3: [
        "Call me Ishmael. A while back, don't ask how long, I was broke and bored with life on land. So I figured I'd head out to sea and check out the watery side of the world.",
      ],
    },
    glossary: [
      {
        term: "Loomings",
        definition:
          "Things appearing indistinctly or looking threatening on the horizon.",
        modernEquiv: "looming shapes",
      },
    ],
  },

  "romeo-and-juliet": {
    title: "Prologue",
    original: [
      "Two households, both alike in dignity,\nIn fair Verona, where we lay our scene,\nFrom ancient grudge break to new mutiny,\nWhere civil blood makes civil hands unclean.",
    ],
    levels: {
      1: [
        "Two families, equal in rank,\nIn beautiful Verona, where our story is set,\nFrom an old grudge break out in fresh violence,\nWhere citizens' blood stains citizens' hands.",
      ],
      2: [
        "Two powerful families, equal in status,\nLive in Verona, where our story takes place.\nAn old feud erupts into new fighting,\nAnd ordinary people's blood stains ordinary hands.",
      ],
      3: [
        "Two families, same social rank,\nIn Verona, where this all goes down.\nAn ancient grudge boils over into fresh chaos,\nAnd innocent blood is spilled on everyone's hands.",
      ],
    },
    glossary: [
      {
        term: "mutiny",
        definition: "Here, an outbreak of violent disorder.",
        modernEquiv: "violence",
      },
      {
        term: "civil",
        definition: "Of citizens, as in the ordinary people of a city.",
        modernEquiv: "ordinary",
      },
    ],
  },

  "the-odyssey": {
    title: "Book 1",
    original: [
      "Tell me, O Muse, of that ingenious hero who travelled far and wide after he had sacked the famous town of Troy. Many cities did he visit, and many were the nations with whose manners and customs he was acquainted; moreover he suffered much by sea while trying to save his own life and bring his men safely home; but do what he might he could not save his men, for they perished through their own sheer folly in eating the cattle of the Sun-god Hyperion; so the god prevented them from ever reaching home.",
    ],
    levels: {
      1: [
        "Tell me, O Muse, about that clever hero who travelled far and wide after he had destroyed the famous city of Troy. He visited many cities and learned the manners and customs of many peoples. He also suffered greatly at sea while trying to save his own life and bring his men safely home. But whatever he did, he could not save them, for they perished through their own foolishness in eating the cattle of the Sun-god Hyperion, and so the god kept them from ever reaching home.",
      ],
      2: [
        "Muse, tell me about the clever hero who wandered the world after he destroyed the famous city of Troy. He visited many cities and learned how many different peoples lived. At sea he suffered terribly, fighting to survive and bring his men home. But he couldn't save them. They doomed themselves by eating the cattle of the Sun-god Hyperion, and the god made sure they never got home.",
      ],
      3: [
        "Muse, tell me about the man who was always one step ahead, the one who roamed the world after taking down Troy. He saw countless cities and learned how all kinds of people live. He went through hell at sea trying to keep himself alive and get his crew home. It didn't work. His men signed their own death warrants by eating the Sun-god's cattle, and the god made sure none of them ever saw home again.",
      ],
    },
    glossary: [
      {
        term: "sacked",
        definition: "Captured and plundered a city.",
        modernEquiv: "destroyed",
      },
      {
        term: "ingenious",
        definition: "Clever and inventive.",
        modernEquiv: "clever",
      },
    ],
  },
};
