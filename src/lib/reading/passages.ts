// Original passages written for this app, three per grade, long enough that most children are
// still reading when the minute ends. The first one of each grade is the first check; the others
// are for re-checks, so a child never reads a practiced passage.

import type { Grade } from "./norms";
import { type PassageWord, tokenizePassage } from "./text";

export type Passage = {
  id: string;
  grade: Grade;
  title: string;
  text: string;
};

export const PASSAGES: Passage[] = [
  {
    id: "g1-red-hat",
    grade: 1,
    title: "The Big Red Hat",
    text: `Sam has a big red hat. He likes his hat a lot. One day the wind came. It took the hat off his head. The hat went up and up. Sam ran after it. "Come back, hat!" he said. The hat landed in a tree. Sam could not get it. He was sad. Then his dog Pip came to help. Pip sat under the tree and barked. A bird in the tree did not like the noise. It flew away fast. The branch shook, and the hat fell down. Pip got the hat and ran to Sam. Sam was glad. He put the hat back on his head. "Thank you, Pip," he said. "You are a good dog." Pip wagged his tail. Then they went home to eat. Mom made hot soup and bread. Sam gave Pip a big bone. Sam and Pip sat by the fire. The red hat sat on a hook by the door. Sam did not want the wind to get it again. Next time he will hold it with his hand.`,
  },
  {
    id: "g2-lemonade",
    grade: 2,
    title: "The Lemonade Stand",
    text: `On the first hot day of summer, Maya and her brother Leo wanted to sell lemonade. They found an old table in the garage. They dragged it to the end of the driveway. Leo made a sign that said "Cold Lemonade, Fifty Cents." He spelled lemonade wrong, so Maya helped him fix it. In the kitchen, they squeezed twelve lemons. Their hands got very sticky. They added water, sugar, and a big pile of ice. Maya took a sip and made a funny face. "Too sour!" she said. They added more sugar and tried again. This time it was just right. For the first hour, nobody stopped. Cars drove past and did not slow down. Leo started to think it was a bad idea. Then a mail carrier walked up the street. She was hot and tired. She bought two cups and said it was the best lemonade on the block. After that, a man with a dog stopped. Then a group of kids on bikes came by. By the end of the day, the pitcher was empty and the jar was full of coins. Maya and Leo counted the money on the front steps. They had made nine dollars. They spent some on ice cream. They saved the rest for next weekend, when they would make an even bigger pitcher.`,
  },
  {
    id: "g3-night-garden",
    grade: 3,
    title: "The Night Garden",
    text: `Grandpa Joe had a secret about his garden. In the daytime, it looked like any other garden. It had rows of beans, red tomatoes, and tall yellow sunflowers. But Grandpa said the best part of the garden only came out after dark. One night in August, Nora got to stay up late to see it. She and Grandpa carried a flashlight and two chairs to the back of the yard. At first, Nora did not see anything special. The air was warm, and crickets were chirping in the grass. Then Grandpa pointed to a vine on the fence. Its flowers had been closed tight all afternoon. Now they were slowly opening. The white petals unfolded like tiny paper umbrellas, and a sweet smell drifted across the yard. "Moonflowers," Grandpa whispered. "They bloom at night so the moths can find them." Just then, a large gray moth flew out of the dark. It landed on one of the flowers. Nora held her breath so she would not scare it away. A few minutes later, tiny green lights began to blink above the lawn. Fireflies were rising from the grass like sparks from a campfire. Nora counted twenty fireflies before she lost track. She asked Grandpa why the garden seemed so different at night. He told her that many plants and animals are busy while people sleep. Some hide from the hot sun during the day. Others hide from hungry birds. Before bed, Nora wrote in her journal. She wrote that she wanted a night garden of her own.`,
  },
  {
    id: "g4-bridge-contest",
    grade: 4,
    title: "The Bridge Contest",
    text: `Every spring, the fourth graders at Riverside School held a bridge contest. Each team got the same supplies: one hundred wooden craft sticks, a bottle of glue, and a roll of string. The rules were simple. The bridge had to stretch across a gap between two desks. The winner would be the bridge that held the most weight before it broke. Priya, Marcus, and Elena decided to work as a team. Marcus wanted to build the longest bridge anyone had ever seen. Elena reminded him that a longer bridge would not always be a stronger one. Priya suggested they learn about real bridges first. At the library, they found out that many bridges use triangles. Triangles keep their shape when weight presses down on them. The team drew a plan with triangles along both sides. Gluing the sticks together took much longer than they expected. Their first try sagged in the middle before they even finished. Instead of giving up, they added a second layer of sticks underneath. Then they let the glue dry overnight. On the day of the contest, the whole class gathered around to watch. Their teacher placed a small bucket on each bridge and slowly poured sand into it. One bridge cracked right away. Another one twisted sideways and crashed to the floor. When it was their turn, Priya could barely watch. The bucket grew heavier and heavier, but the triangles held. Their bridge finally broke at eleven pounds. That was enough to win second place. Marcus had to admit that a strong bridge was better than a long one after all.`,
  },
  {
    id: "g1-lost-kite",
    grade: 1,
    title: "The Lost Kite",
    text: `Ben and his dad went to the park. Ben had a new kite. It was blue with a long red tail. The wind was strong. Dad held the string, and Ben ran fast. Up went the kite! It went up over the trees. Ben was so happy. He took the string from Dad. Then a big gust of wind came. The string slipped out of his hand. The kite flew away. Ben ran after it, but it was too fast. He sat on the grass and felt sad. Dad sat next to him. "We can look for it," Dad said. They walked to the pond. They did not see the kite. They walked up the hill. It was not there. Then Ben saw a bit of red in a bush. It was the tail! The kite was stuck in the bush. Dad helped him pull it out. It had a small rip, but that was fine. At home, Mom fixed the rip with tape. Ben put the kite on his bed. Next time, he will tie the string to his hand.`,
  },
  {
    id: "g1-snow-day",
    grade: 1,
    title: "The Snow Day",
    text: `Mia woke up and looked out the window. The ground was white. It was a snow day! There was no school. Mia put on her coat, her hat, and her boots. She ran out the door. The snow was cold and soft. Mia made a ball of snow. She rolled it and rolled it. It got big. Her brother Tom came out to help. Tom made a small ball for the head. They put it on top. "He needs eyes," said Mia. Tom got two black rocks. Mia got a carrot for the nose. Then they put a hat on him. The snowman looked funny. Mia and Tom sat in the snow and laughed. Then Mom called them in. She had hot milk for them. Mia sat by the window with her cup. She could see the snowman in the yard. A bird sat on his hat. Mia did not want the sun to melt him. She wanted to play with him again the next day.`,
  },
  {
    id: "g2-big-move",
    grade: 2,
    title: "The Big Move",
    text: `Sofia and her family were moving to a new town. Sofia did not want to go. She liked her old school and her best friend, Ana. On the last day, Ana gave her a bracelet made of green and yellow beads. "So you won't forget me," Ana said. Sofia promised to call her every week. The drive to the new town took all day. Sofia watched the fields and farms go by. At last they got there. The new house looked big and empty. Her room had no bed yet, so she slept in a sleeping bag on the floor. The next morning, Sofia heard a dog barking outside. She looked out the window. A girl her age was chasing a puppy across the yard next door. The puppy ran straight toward Sofia's house. Sofia ran outside and caught it. The girl came over, out of breath. "Thanks! His name is Biscuit. I'm Grace," she said. Grace showed Sofia the park at the end of the street. They played on the swings until lunch. That night, Sofia called Ana. She told her all about Grace and Biscuit. Maybe the new town would be okay after all.`,
  },
  {
    id: "g2-science-fair",
    grade: 2,
    title: "The Science Fair",
    text: `Jamal wanted to win the science fair. His idea was to find out which ball bounces the highest. He got a tennis ball, a soccer ball, a rubber ball, and a ping pong ball. His sister Nia helped him tape a measuring tape to the wall. Jamal dropped each ball from the same height. Nia watched closely and wrote down how high each one bounced. They did it three times for every ball. The rubber ball bounced the highest every time. The soccer ball came next, and the ping pong ball was last. Jamal made a poster with a bright chart. He drew a picture of each ball next to its score. On the day of the fair, the gym was full of tables and posters. One girl had made a volcano that really worked. A boy had grown beans under different colored lights. Jamal felt nervous when the judges came to his table. He took a deep breath and told them about his test. One judge asked why he dropped each ball three times. "To make sure it was not just luck," Jamal said. The judge smiled and wrote something down. Jamal did not win first place, but he got a ribbon for the best plan.`,
  },
  {
    id: "g3-ice-fishing",
    grade: 3,
    title: "Ice Fishing",
    text: `Every winter, the lake behind Aunt Rosa's cabin froze solid. When the ice was thick enough, she took Daniel ice fishing. Daniel had always thought fishing was for summer. He wanted to see how it worked on ice. They pulled a sled full of gear across the frozen lake. Aunt Rosa stopped at a spot she said was lucky. She used a long tool to drill a round hole in the ice. Daniel looked into the hole. He saw dark, cold water below. Aunt Rosa set up a small tent around the hole to block the wind. Inside, they sat on buckets and dropped their lines into the water. Nothing happened for a long time. Daniel's fingers grew cold, even inside his gloves. Aunt Rosa poured him a cup of hot cocoa. She told him stories about the lake. She said that fish move slowly in winter because the water is so cold. Suddenly, Daniel felt a sharp tug on his line. He reeled it in carefully, and a silver fish flopped onto the ice. It was a perch, about as long as his hand. Aunt Rosa cheered. They looked at it for a moment. Then Daniel gently let it slide back into the hole. On the walk back, the sun was setting and the ice glowed orange. Daniel decided that winter fishing might be even better than summer fishing.`,
  },
  {
    id: "g3-honeybees",
    grade: 3,
    title: "How Bees Make Honey",
    text: `Honeybees are some of the busiest insects in the world. A single hive can hold more than twenty thousand bees, and each one has a job. The queen bee lays the eggs. The worker bees do almost everything else. Some workers clean the hive, some feed the young bees, and some guard the door. The oldest workers fly out to find flowers. When a bee lands on a flower, it uses its long tongue to sip a sweet juice called nectar. It stores the nectar in a special part of its body and carries it back to the hive. There, other bees pass the nectar from mouth to mouth. Then they spread it into the small wax cells of the honeycomb. The bees fan the cells with their wings to dry out the water. Slowly, the nectar turns thick and sticky. When it is ready, the bees close each cell with a cap of wax. That is how honey is made. A bee visits many flowers on every trip. Even so, one bee makes only a tiny bit of honey in its whole life. It takes thousands of bees to fill a single jar. Bees also help plants. As they move from flower to flower, they carry pollen that helps the plants make seeds and fruit. Without bees, there would be fewer apples, berries, and pumpkins.`,
  },
  {
    id: "g4-missing-lunch",
    grade: 4,
    title: "The Case of the Missing Lunch",
    text: `Someone was stealing lunches from the fourth-grade cubbies, and Olivia wanted to find out who. It had happened three times in two weeks. First, Ethan's peanut butter sandwich was gone. Then Maya's bag of pretzels went missing. Last, someone took the chocolate muffin that Olivia's grandmother had baked for her. Olivia decided to act like a real detective. She got a small notebook and wrote down everything she knew. Each lunch had gone missing on a day when the class had recess outside. Each time, the cubby door had been left open a crack. The wrappers were never found in the trash. Olivia asked the school janitor if he had seen anything strange. He scratched his chin. He said he had seen crumbs near the window by the coat hooks. The next day, Olivia's teacher let her stay inside during recess. She sat quietly behind the bookshelf and waited. After about ten minutes, she heard a scratching sound. A gray squirrel squeezed through a gap in the old window and hopped onto the shelf. It pushed open a cubby door, grabbed a granola bar, and ran back outside. Olivia nearly laughed out loud. When she told the class, everyone wanted to see the clever thief. The school fixed the window that afternoon. Olivia's notebook was put on display in the library. It had a new title on the cover: The Case of the Hungry Squirrel.`,
  },
  {
    id: "g4-monarchs",
    grade: 4,
    title: "The Long Trip of the Monarchs",
    text: `Every fall, millions of monarch butterflies start a very long trip. Monarchs that live in the eastern United States and Canada fly south to the mountains of Mexico. The trip can be more than two thousand miles long. That is a long way for an insect that weighs less than a paper clip. Scientists still wonder how the butterflies find their way. Monarchs seem to use the sun to guide them. They may also sense the pull of the earth, like a compass. Here is the strange part. None of these butterflies has made the trip before. The monarchs that fly south in the fall are the great-grandchildren of the ones that left Mexico the spring before. In Mexico, the butterflies gather in forests high in the mountains. So many monarchs cling to the trees that the branches look orange. Sometimes the branches even bend under their weight. The cool mountain air helps them rest all winter. When spring comes, the monarchs start flying north. Along the way, females lay their eggs on milkweed plants. Milkweed is the only food that monarch caterpillars can eat. Their children and grandchildren keep flying north until they reach Canada again. Today, monarchs face many dangers. The milkweed they need is harder to find, and the weather is changing. Many families now plant milkweed in their gardens. It gives the butterflies a place to stop and rest.`,
  },
];

/**
 * Short stories for practice only (one word at a time, syllables). They are never used in a check,
 * so practicing can't make a later check look better than it is.
 */
export const PRACTICE_PASSAGES: Passage[] = [
  {
    id: "p1-frog",
    grade: 1,
    title: "The Frog and the Duck",
    text: `A green frog sat on a log. The log was in a pond. The sun was hot. The frog wanted to swim. He jumped into the water. Splash! A duck swam by. "Can I swim with you?" said the frog. "Yes, you can," said the duck. They swam to the other side of the pond. Then they sat on a rock in the sun. The frog was happy. He had a new friend.`,
  },
  {
    id: "p1-bath",
    grade: 1,
    title: "Bath Time for Max",
    text: `Max is a big brown dog. Max does not like baths. Kim got the tub and the soap. Max ran under the bed. "Come out, Max," said Kim. Max did not come out. Kim got a ball. She let it bounce on the floor. Max came out to get the ball. Kim got him in the tub. The water was warm. Max got soap on his nose. He shook and shook. Now Kim was wet too!`,
  },
  {
    id: "p2-pancakes",
    grade: 2,
    title: "Pancakes for Dad",
    text: `On Saturday morning, Lily wanted to make pancakes for her dad. She found the flour, the milk, and two eggs. Her big brother Sam helped her read the recipe. They mixed everything in a large bowl until the batter was smooth. Sam heated the pan, and Lily poured in the first pancake. It came out flat and a little burned. "That one is for the dog," Sam said with a grin. The next pancake was golden and round. Lily stacked them on a plate and put berries on top. When Dad came into the kitchen, he smiled. "This is the best breakfast ever," he said.`,
  },
  {
    id: "p3-library-cat",
    grade: 3,
    title: "The Library Cat",
    text: `The town library had a helper with four paws. Her name was Pepper, and she was a gray cat with one white foot. Every morning, Pepper waited by the front door until it was unlocked. Then she walked between the shelves as if she were checking on every book. Children loved to read to her. Pepper would curl up on a pillow and listen to stories about dragons, pirates, and rockets. Some kids felt nervous about reading out loud. They found it easier to read to a cat. Pepper never laughed at a mistake. When the library closed each night, she climbed to the top shelf and fell asleep.`,
  },
  {
    id: "p4-weather",
    grade: 4,
    title: "The Backyard Weather Station",
    text: `For the science fair, Jordan built a weather station in his backyard. First, he made a rain gauge from a clear plastic bottle. He cut off the top and turned it upside down. Then he marked a line every centimeter with a ruler. Next, he made a wind vane from a straw, a pencil, and a paper arrow. It spun on a pin and pointed to where the wind was coming from. Every afternoon for three weeks, Jordan wrote down the temperature, the rain, and the wind direction in a chart. Then he noticed a pattern. When the wind blew from the west, rain usually came within a day. His teacher was impressed and asked him to share his discovery with the class.`,
  },
];

export function practicePassagesFor(grade: Grade): Passage[] {
  return PRACTICE_PASSAGES.filter((p) => p.grade === grade);
}

export function passageFor(grade: Grade): Passage {
  return PASSAGES.find((p) => p.grade === grade)!;
}

export function passageById(id: string): Passage | undefined {
  return PASSAGES.find((p) => p.id === id) ?? PRACTICE_PASSAGES.find((p) => p.id === id);
}

/**
 * The passage for the next check: the first one of the grade this child hasn't read, or once all
 * have been read, the one read longest ago. `history` lists passage ids, most recent first.
 */
export function pickPassage(grade: Grade, history: string[]): Passage {
  const forGrade = PASSAGES.filter((p) => p.grade === grade);
  const unread = forGrade.find((p) => !history.includes(p.id));
  if (unread) return unread;
  return forGrade.reduce((oldest, p) => (history.indexOf(p.id) > history.indexOf(oldest.id) ? p : oldest));
}

export function passageWords(passage: Passage): PassageWord[] {
  return tokenizePassage(passage.text);
}
