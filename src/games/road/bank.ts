import { Question } from './types';
import type { Category } from './questions';

// ---------------------------------------------------------------------------
// An expanded bank of U.S. civics / history / geography questions, layered on
// top of the official USCIS set so Trivia and Jeopardy have far more variety
// (and reshuffle fresh every game). Most are generated from small, easy-to-
// verify fact tables (state capitals, the ordered list of Presidents, notable
// amendments) with distractors drawn from the same tables, plus a curated batch
// of well-known, stable facts. Nothing here is time-sensitive.
// ---------------------------------------------------------------------------

const ord = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
};

// k distinct distractors from `pool` (excluding `answer`), chosen deterministically
// so questions are stable/testable. Consecutive picks guarantee distinctness.
function distractors(pool: string[], answer: string, seed: number, k = 3): string[] {
  const cand = Array.from(new Set(pool)).filter((x) => x !== answer);
  const out: string[] = [];
  if (!cand.length) return out;
  const start = seed % cand.length;
  for (let i = 0; i < k && i < cand.length; i++) out.push(cand[(start + i) % cand.length]);
  return out;
}

// Build one question. The correct answer sits at index 0 here; every consumer
// deals questions through `deal()`, which shuffles the options, so position
// carries no signal.
function mc(id: string, question: string, answer: string, pool: string[], seed: number, explanation: string, category: Category): Question {
  return { id, question, options: [answer, ...distractors(pool, answer, seed)], correctAnswerIndex: 0, explanation, category };
}

// ---- state capitals -------------------------------------------------------
const STATE_CAPITALS: [string, string][] = [
  ['Alabama', 'Montgomery'], ['Alaska', 'Juneau'], ['Arizona', 'Phoenix'], ['Arkansas', 'Little Rock'],
  ['California', 'Sacramento'], ['Colorado', 'Denver'], ['Connecticut', 'Hartford'], ['Delaware', 'Dover'],
  ['Florida', 'Tallahassee'], ['Georgia', 'Atlanta'], ['Hawaii', 'Honolulu'], ['Idaho', 'Boise'],
  ['Illinois', 'Springfield'], ['Indiana', 'Indianapolis'], ['Iowa', 'Des Moines'], ['Kansas', 'Topeka'],
  ['Kentucky', 'Frankfort'], ['Louisiana', 'Baton Rouge'], ['Maine', 'Augusta'], ['Maryland', 'Annapolis'],
  ['Massachusetts', 'Boston'], ['Michigan', 'Lansing'], ['Minnesota', 'Saint Paul'], ['Mississippi', 'Jackson'],
  ['Missouri', 'Jefferson City'], ['Montana', 'Helena'], ['Nebraska', 'Lincoln'], ['Nevada', 'Carson City'],
  ['New Hampshire', 'Concord'], ['New Jersey', 'Trenton'], ['New Mexico', 'Santa Fe'], ['New York', 'Albany'],
  ['North Carolina', 'Raleigh'], ['North Dakota', 'Bismarck'], ['Ohio', 'Columbus'], ['Oklahoma', 'Oklahoma City'],
  ['Oregon', 'Salem'], ['Pennsylvania', 'Harrisburg'], ['Rhode Island', 'Providence'], ['South Carolina', 'Columbia'],
  ['South Dakota', 'Pierre'], ['Tennessee', 'Nashville'], ['Texas', 'Austin'], ['Utah', 'Salt Lake City'],
  ['Vermont', 'Montpelier'], ['Virginia', 'Richmond'], ['Washington', 'Olympia'], ['West Virginia', 'Charleston'],
  ['Wisconsin', 'Madison'], ['Wyoming', 'Cheyenne'],
];
const ALL_STATES = STATE_CAPITALS.map(([s]) => s);
const ALL_CAPITALS = STATE_CAPITALS.map(([, c]) => c);
// Well-known U.S. cities that are NOT any state capital (distractors / "not a capital").
const NON_CAPITALS = [
  'Los Angeles', 'Chicago', 'Houston', 'Miami', 'Seattle', 'Dallas', 'San Diego', 'San Francisco',
  'Las Vegas', 'New Orleans', 'Detroit', 'Philadelphia', 'Buffalo', 'San Antonio', 'Portland',
  'Anchorage', 'Tampa', 'Cleveland', 'Milwaukee', 'Kansas City',
];

const capitalQs: Question[] = [];
STATE_CAPITALS.forEach(([state, capital], i) => {
  capitalQs.push(mc(`cap-a${i}`, `What is the capital of ${state}?`, capital, ALL_CAPITALS, i, `${capital} is the capital of ${state}.`, 'geography'));
  capitalQs.push(mc(`cap-b${i}`, `${capital} is the capital of which U.S. state?`, state, ALL_STATES, i + 5, `${capital} is the capital of ${state}.`, 'geography'));
  // "Which of these is a state capital?" — real capital vs. non-capital cities.
  capitalQs.push(mc(`cap-c${i}`, 'Which of these cities is a U.S. state capital?', capital, NON_CAPITALS, i, `${capital} is the capital of ${state}.`, 'geography'));
  // "Which of these is NOT a state capital?" — a non-capital vs. three capitals.
  const nonCap = NON_CAPITALS[i % NON_CAPITALS.length];
  capitalQs.push(mc(`cap-d${i}`, 'Which of these cities is NOT a U.S. state capital?', nonCap, ALL_CAPITALS, i + 11, `${nonCap} is a major U.S. city but not a state capital.`, 'geography'));
});

// ---- Presidents (ordered 1–44, Washington through Obama; evergreen) --------
const PRES = [
  '', 'George Washington', 'John Adams', 'Thomas Jefferson', 'James Madison', 'James Monroe',
  'John Quincy Adams', 'Andrew Jackson', 'Martin Van Buren', 'William Henry Harrison', 'John Tyler',
  'James K. Polk', 'Zachary Taylor', 'Millard Fillmore', 'Franklin Pierce', 'James Buchanan',
  'Abraham Lincoln', 'Andrew Johnson', 'Ulysses S. Grant', 'Rutherford B. Hayes', 'James A. Garfield',
  'Chester A. Arthur', 'Grover Cleveland', 'Benjamin Harrison', 'Grover Cleveland', 'William McKinley',
  'Theodore Roosevelt', 'William Howard Taft', 'Woodrow Wilson', 'Warren G. Harding', 'Calvin Coolidge',
  'Herbert Hoover', 'Franklin D. Roosevelt', 'Harry S. Truman', 'Dwight D. Eisenhower', 'John F. Kennedy',
  'Lyndon B. Johnson', 'Richard Nixon', 'Gerald Ford', 'Jimmy Carter', 'Ronald Reagan',
  'George H. W. Bush', 'Bill Clinton', 'George W. Bush', 'Barack Obama',
];
const PRES_NAMES = Array.from(new Set(PRES.slice(1)));

const presidentQs: Question[] = [];
for (let n = 1; n <= 44; n++) {
  presidentQs.push(mc(`pres-d${n}`, `Who was the ${ord(n)} President of the United States?`, PRES[n], PRES_NAMES, n, `${PRES[n]} was the ${ord(n)} President.`, 'history'));
  // name -> ordinal (skip Grover Cleveland: he served two non-consecutive terms)
  if (PRES[n] !== 'Grover Cleveland') {
    presidentQs.push(mc(`pres-e${n}`, `Which number President was ${PRES[n]}?`, ord(n), Array.from({ length: 44 }, (_, i) => ord(i + 1)), n + 3, `${PRES[n]} was the ${ord(n)} President.`, 'history'));
  }
  if (n <= 43) presidentQs.push(mc(`pres-f${n}`, `Who became President immediately after the ${ord(n)} President?`, PRES[n + 1], PRES_NAMES, n + 7, `The ${ord(n + 1)} President, ${PRES[n + 1]}, followed the ${ord(n)}.`, 'history'));
  if (n >= 2) presidentQs.push(mc(`pres-g${n}`, `Who was President immediately before the ${ord(n)} President?`, PRES[n - 1], PRES_NAMES, n + 13, `The ${ord(n - 1)} President, ${PRES[n - 1]}, came before the ${ord(n)}.`, 'history'));
}

// Curated, high-confidence "which President…" facts.
const PRES_FACTS: [string, string][] = [
  ['was the first President of the United States', 'George Washington'],
  ['was President during the Civil War', 'Abraham Lincoln'],
  ['issued the Emancipation Proclamation', 'Abraham Lincoln'],
  ['delivered the Gettysburg Address', 'Abraham Lincoln'],
  ['was the tallest U.S. President, at 6 feet 4 inches', 'Abraham Lincoln'],
  ['was the only President to resign from office', 'Richard Nixon'],
  ['was the only President elected to four terms', 'Franklin D. Roosevelt'],
  ['led the nation during the Great Depression and most of World War II', 'Franklin D. Roosevelt'],
  ['was President during World War I', 'Woodrow Wilson'],
  ['was a Union general before becoming President', 'Ulysses S. Grant'],
  ['was Supreme Allied Commander in World War II before the presidency', 'Dwight D. Eisenhower'],
  ['wrote the Declaration of Independence', 'Thomas Jefferson'],
  ['completed the Louisiana Purchase', 'Thomas Jefferson'],
  ['was the youngest person ever elected President', 'John F. Kennedy'],
  ['was assassinated in Dallas in 1963', 'John F. Kennedy'],
  ['was the first Catholic President', 'John F. Kennedy'],
  ['was the first President to live in the White House', 'John Adams'],
  ['is called the "Father of the Constitution"', 'James Madison'],
  ['was the first African American President', 'Barack Obama'],
  ['signed the Civil Rights Act of 1964', 'Lyndon B. Johnson'],
  ['served two non-consecutive terms as President', 'Grover Cleveland'],
  ['was President when the U.S. purchased Alaska', 'Andrew Johnson'],
  ['is known as the "Father of Our Country"', 'George Washington'],
];
PRES_FACTS.forEach(([fact, who], i) => {
  presidentQs.push(mc(`pres-fact${i}`, `Which President ${fact}?`, who, PRES_NAMES, i * 2, `${who} ${fact}.`, 'history'));
});

// ---- notable amendments ---------------------------------------------------
const AMENDMENTS: [number, string, Category][] = [
  [1, 'protects freedom of speech, religion, press, assembly, and petition', 'rights'],
  [2, 'protects the right to keep and bear arms', 'rights'],
  [4, 'protects against unreasonable searches and seizures', 'rights'],
  [5, 'guarantees due process and protection from self-incrimination', 'rights'],
  [10, 'reserves powers not given to the federal government to the states or the people', 'legislative'],
  [13, 'abolished slavery', 'rights'],
  [14, 'granted citizenship and equal protection to all persons born or naturalized in the U.S.', 'rights'],
  [15, 'gave men of any race the right to vote', 'rights'],
  [16, 'allowed Congress to collect a federal income tax', 'legislative'],
  [17, 'established the direct election of U.S. Senators by the people', 'legislative'],
  [18, 'established Prohibition, banning alcohol', 'legislative'],
  [19, 'gave women the right to vote', 'rights'],
  [21, 'repealed Prohibition (the 18th Amendment)', 'legislative'],
  [22, 'limited the President to two terms', 'legislative'],
  [24, 'abolished the poll tax in federal elections', 'rights'],
  [26, 'lowered the voting age to 18', 'rights'],
];
const AMEND_EFFECTS = AMENDMENTS.map(([, e]) => e);
const amendmentQs: Question[] = AMENDMENTS.map(([n, effect, cat], i) =>
  mc(`amend${n}`, `What did the ${ord(n)} Amendment do?`, effect, AMEND_EFFECTS, i, `The ${ord(n)} Amendment ${effect}.`, cat),
);

// ---- curated facts (geography / history / government) ----------------------
type Curated = { q: string; a: string; d: string[]; e: string; c: Category };
const CURATED: Curated[] = [
  // Geography
  { q: 'What is the largest U.S. state by area?', a: 'Alaska', d: ['Texas', 'California', 'Montana'], e: 'Alaska is by far the largest state by land area.', c: 'geography' },
  { q: 'What is the smallest U.S. state by area?', a: 'Rhode Island', d: ['Delaware', 'Connecticut', 'Hawaii'], e: 'Rhode Island is the smallest state by area.', c: 'geography' },
  { q: 'Which U.S. state has the largest population?', a: 'California', d: ['Texas', 'New York', 'Florida'], e: 'California is the most populous U.S. state.', c: 'geography' },
  { q: 'What is the tallest mountain in North America?', a: 'Denali', d: ['Mount Whitney', 'Mount Rainier', 'Pikes Peak'], e: 'Denali (formerly Mount McKinley) in Alaska is the tallest peak in North America.', c: 'geography' },
  { q: 'How many Great Lakes are there?', a: 'Five', d: ['Three', 'Four', 'Six'], e: 'The five Great Lakes are Superior, Michigan, Huron, Erie, and Ontario.', c: 'geography' },
  { q: 'Which of these is one of the five Great Lakes?', a: 'Lake Michigan', d: ['Great Salt Lake', 'Lake Tahoe', 'Lake Okeechobee'], e: 'Lake Michigan is one of the five Great Lakes.', c: 'geography' },
  { q: 'Which state is known as the "Sunshine State"?', a: 'Florida', d: ['California', 'Arizona', 'Hawaii'], e: 'Florida is nicknamed the Sunshine State.', c: 'geography' },
  { q: 'Which U.S. state is made up entirely of islands?', a: 'Hawaii', d: ['Alaska', 'Florida', 'Rhode Island'], e: 'Hawaii is an archipelago in the Pacific Ocean.', c: 'geography' },
  { q: 'Which is the northernmost U.S. state?', a: 'Alaska', d: ['Maine', 'Minnesota', 'Washington'], e: 'Alaska is the northernmost U.S. state.', c: 'geography' },
  { q: 'Which is the southernmost U.S. state?', a: 'Hawaii', d: ['Florida', 'Texas', 'California'], e: 'Hawaii is the southernmost U.S. state.', c: 'geography' },
  { q: 'The Grand Canyon is located in which state?', a: 'Arizona', d: ['Nevada', 'Utah', 'Colorado'], e: 'The Grand Canyon is in Arizona.', c: 'geography' },
  { q: 'Which river forms much of the border between the U.S. and Mexico?', a: 'The Rio Grande', d: ['The Colorado River', 'The Mississippi River', 'The Missouri River'], e: 'The Rio Grande forms much of the Texas–Mexico border.', c: 'geography' },
  { q: 'Which mountain range runs along the eastern United States?', a: 'The Appalachian Mountains', d: ['The Rocky Mountains', 'The Sierra Nevada', 'The Cascades'], e: 'The Appalachians run along the eastern U.S.', c: 'geography' },
  { q: 'Which mountain range runs through the western United States?', a: 'The Rocky Mountains', d: ['The Appalachian Mountains', 'The Ozarks', 'The Berkshires'], e: 'The Rocky Mountains run through the western U.S.', c: 'geography' },
  { q: 'The Mississippi River empties into which body of water?', a: 'The Gulf of Mexico', d: ['The Atlantic Ocean', 'The Pacific Ocean', 'The Great Lakes'], e: 'The Mississippi River drains into the Gulf of Mexico.', c: 'geography' },
  { q: 'Which U.S. state shares a border with only one other state?', a: 'Maine', d: ['Florida', 'Alaska', 'Washington'], e: 'Maine borders only New Hampshire.', c: 'geography' },
  { q: 'Yellowstone, the first national park, is mostly in which state?', a: 'Wyoming', d: ['Montana', 'Colorado', 'Idaho'], e: 'Yellowstone National Park is primarily in Wyoming.', c: 'geography' },
  { q: 'How many U.S. states are there?', a: '50', d: ['48', '52', '13'], e: 'There are 50 states in the United States.', c: 'geography' },

  // History
  { q: 'In what year did the United States declare independence?', a: '1776', d: ['1789', '1492', '1812'], e: 'The Declaration of Independence was adopted on July 4, 1776.', c: 'history' },
  { q: 'Who was the first person to sign the Declaration of Independence?', a: 'John Hancock', d: ['Thomas Jefferson', 'Benjamin Franklin', 'George Washington'], e: 'John Hancock signed first, with a famously large signature.', c: 'history' },
  { q: 'The Pilgrims sailed to America on which ship?', a: 'The Mayflower', d: ['The Santa María', 'The Constitution', 'The Endeavour'], e: 'The Pilgrims arrived aboard the Mayflower in 1620.', c: 'history' },
  { q: 'In what year did the Civil War begin?', a: '1861', d: ['1776', '1812', '1865'], e: 'The American Civil War began in 1861.', c: 'history' },
  { q: 'In what year did the Civil War end?', a: '1865', d: ['1861', '1877', '1848'], e: 'The Civil War ended in 1865.', c: 'history' },
  { q: 'The Bill of Rights was ratified in what year?', a: '1791', d: ['1776', '1787', '1800'], e: 'The first ten amendments were ratified in 1791.', c: 'history' },
  { q: 'Which explorer is credited with reaching the Americas in 1492?', a: 'Christopher Columbus', d: ['Ferdinand Magellan', 'Amerigo Vespucci', 'Leif Erikson'], e: 'Columbus reached the Americas in 1492.', c: 'history' },
  { q: 'In which city was the Declaration of Independence signed?', a: 'Philadelphia', d: ['Boston', 'New York City', 'Washington, D.C.'], e: 'It was signed in Philadelphia.', c: 'history' },
  { q: 'Which war won the United States its independence?', a: 'The Revolutionary War', d: ['The Civil War', 'The War of 1812', 'World War I'], e: 'The Revolutionary War secured American independence from Britain.', c: 'history' },
  { q: 'In what year did World War II end?', a: '1945', d: ['1918', '1941', '1939'], e: 'World War II ended in 1945.', c: 'history' },
  { q: 'Who delivered the "I Have a Dream" speech?', a: 'Martin Luther King, Jr.', d: ['Abraham Lincoln', 'Frederick Douglass', 'Malcolm X'], e: 'Dr. King gave the speech during the 1963 March on Washington.', c: 'history' },
  { q: 'The Boston Tea Party was a protest against what?', a: 'British taxes on tea', d: ['Slavery', 'The gold standard', 'Prohibition'], e: 'Colonists protested British taxation by dumping tea into Boston Harbor.', c: 'history' },
  { q: 'In what year did women gain the right to vote nationwide?', a: '1920', d: ['1776', '1865', '1964'], e: 'The 19th Amendment (1920) gave women the right to vote.', c: 'history' },
  { q: 'Which of these documents is the oldest?', a: 'The Declaration of Independence', d: ['The Constitution', 'The Bill of Rights', 'The Gettysburg Address'], e: 'The Declaration (1776) predates the Constitution (1787) and Bill of Rights (1791).', c: 'history' },
  { q: 'From which country did the U.S. make the Louisiana Purchase?', a: 'France', d: ['Spain', 'Britain', 'Mexico'], e: 'The U.S. bought the Louisiana Territory from France in 1803.', c: 'history' },
  { q: 'Which national landmark was a gift from France to the United States?', a: 'The Statue of Liberty', d: ['The Washington Monument', 'Mount Rushmore', 'The Liberty Bell'], e: 'France gave the Statue of Liberty to the U.S. in 1886.', c: 'history' },

  // Government / civics
  { q: 'How many stars are on the U.S. flag?', a: '50', d: ['13', '48', '52'], e: 'There is one star for each of the 50 states.', c: 'legislative' },
  { q: 'How many stripes are on the U.S. flag?', a: '13', d: ['50', '7', '12'], e: 'The 13 stripes represent the original 13 colonies.', c: 'legislative' },
  { q: 'How many U.S. Senators does each state have?', a: 'Two', d: ['One', 'Three', 'It depends on population'], e: 'Each state elects two U.S. Senators.', c: 'legislative' },
  { q: 'What is the minimum age to be elected President?', a: '35', d: ['30', '25', '40'], e: 'The Constitution requires the President to be at least 35.', c: 'legislative' },
  { q: 'How many terms can a President serve?', a: 'Two', d: ['Three', 'One', 'Unlimited'], e: 'The 22nd Amendment limits the President to two terms.', c: 'legislative' },
  { q: 'How many branches does the federal government have?', a: 'Three', d: ['Two', 'Four', 'One'], e: 'The legislative, executive, and judicial branches.', c: 'legislative' },
  { q: 'Which branch of government makes the laws?', a: 'The legislative branch', d: ['The executive branch', 'The judicial branch', 'The military'], e: 'Congress, the legislative branch, makes federal laws.', c: 'legislative' },
  { q: 'Which branch of government interprets the laws?', a: 'The judicial branch', d: ['The legislative branch', 'The executive branch', 'The states'], e: 'The courts, the judicial branch, interpret laws.', c: 'legislative' },
  { q: 'Which branch of government enforces the laws?', a: 'The executive branch', d: ['The legislative branch', 'The judicial branch', 'Congress'], e: 'The President and the executive branch enforce the laws.', c: 'legislative' },
  { q: 'Where does the U.S. Congress meet?', a: 'The U.S. Capitol', d: ['The White House', 'The Supreme Court', 'The Pentagon'], e: 'Congress meets in the U.S. Capitol in Washington, D.C.', c: 'legislative' },
  { q: 'Where does the President live and work?', a: 'The White House', d: ['The Capitol', 'Independence Hall', 'Mount Vernon'], e: 'The President lives and works in the White House.', c: 'legislative' },
  { q: 'Which house of Congress has 100 members?', a: 'The Senate', d: ['The House of Representatives', 'The Cabinet', 'The Supreme Court'], e: 'The Senate has 100 members, two per state.', c: 'legislative' },
  { q: 'Which house of Congress is based on state population?', a: 'The House of Representatives', d: ['The Senate', 'The Cabinet', 'The Supreme Court'], e: 'House seats are apportioned by population.', c: 'legislative' },
  { q: 'How often are U.S. presidential elections held?', a: 'Every four years', d: ['Every two years', 'Every six years', 'Every year'], e: 'Presidential elections happen every four years.', c: 'legislative' },
  { q: 'How long do Supreme Court justices serve?', a: 'For life (until they retire, resign, or die)', d: ['Four years', 'Ten years', 'Until age 65'], e: 'Federal judges, including justices, serve during "good behavior" — effectively for life.', c: 'legislative' },
  { q: 'What is the minimum voting age in the United States?', a: '18', d: ['16', '21', '25'], e: 'The 26th Amendment set the voting age at 18.', c: 'rights' },
];
const curatedQs: Question[] = CURATED.map((x, i) => ({
  id: `cur${i}`,
  question: x.q,
  options: [x.a, ...x.d],
  correctAnswerIndex: 0,
  explanation: x.e,
  category: x.c,
}));

export const extraQuestions: Question[] = [
  ...capitalQs,
  ...presidentQs,
  ...amendmentQs,
  ...curatedQs,
];
