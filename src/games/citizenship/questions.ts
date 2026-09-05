import { Question } from './types';

// The official USCIS civics questions for the naturalization test (2008
// version, the set still used for most applicants), reworked into a
// multiple-choice practice quiz. Each entry keeps the official question wording
// and a correct answer straight from the USCIS answer key, with three plausible
// distractors and a short explanation.
//
// Time-sensitive / applicant-specific questions from the official 100 are left
// out on purpose so every answer here stays correct without maintenance:
// "who is the President/Vice President/Speaker/Chief Justice now", the
// President's party, and the ones that depend on where you live (your state's
// senators, your representative, your governor, your state capital). Everything
// else from the official list is here.
export const citizenshipQuestions: Question[] = [
  // ---- American Government: Principles of American Democracy ----
  {
    id: 'q1',
    question: 'What is the supreme law of the land?',
    options: ['The Declaration of Independence', 'The Constitution', 'The Emancipation Proclamation', 'The Articles of Confederation'],
    correctAnswerIndex: 1,
    explanation: 'The Constitution is the supreme law of the United States. It sets up the government and protects the basic rights of Americans.',
  },
  {
    id: 'q2',
    question: 'What does the Constitution do?',
    options: ['Declares independence from Great Britain', 'Sets up the government', 'Defines the borders of the United States', 'Elects the President'],
    correctAnswerIndex: 1,
    explanation: 'The Constitution sets up the government, defines the government, and protects the basic rights of Americans.',
  },
  {
    id: 'q3',
    question: 'The idea of self-government is in the first three words of the Constitution. What are these words?',
    options: ['We the People', 'Life, Liberty, Happiness', 'In God We Trust', 'United States of'],
    correctAnswerIndex: 0,
    explanation: 'The Constitution begins with "We the People," establishing that the power of the government comes from the citizens.',
  },
  {
    id: 'q4',
    question: 'What is an amendment?',
    options: ['A law passed by the President', 'A decision by the Supreme Court', 'A change or addition to the Constitution', 'A treaty with another country'],
    correctAnswerIndex: 2,
    explanation: 'An amendment is a change or an addition to the Constitution.',
  },
  {
    id: 'q5',
    question: 'What do we call the first ten amendments to the Constitution?',
    options: ['The Preamble', 'The Bill of Rights', 'The Articles of Confederation', 'The Declaration of Rights'],
    correctAnswerIndex: 1,
    explanation: 'The Bill of Rights is the first ten amendments to the Constitution and protects basic rights like freedom of speech and religion.',
  },
  {
    id: 'q6',
    question: 'What is one right or freedom from the First Amendment?',
    options: ['Right to bear arms', 'Right to a jury trial', 'Freedom of speech', 'Right to vote'],
    correctAnswerIndex: 2,
    explanation: 'The First Amendment protects freedom of speech, religion, assembly, the press, and the right to petition the government.',
  },
  {
    id: 'q7',
    question: 'How many amendments does the Constitution have?',
    options: ['10', '21', '27', '50'],
    correctAnswerIndex: 2,
    explanation: 'The Constitution has 27 amendments. The most recent was ratified in 1992.',
  },
  {
    id: 'q8',
    question: 'What did the Declaration of Independence do?',
    options: ['Freed the slaves', 'Announced our independence from Great Britain', 'Formed the United Nations', 'Established the Supreme Court'],
    correctAnswerIndex: 1,
    explanation: 'The Declaration of Independence announced that the United States was free and independent from Great Britain.',
  },
  {
    id: 'q9',
    question: 'What are two rights in the Declaration of Independence?',
    options: ['Life and liberty', 'Voting and bearing arms', 'Speech and assembly', 'Fair trial and free press'],
    correctAnswerIndex: 0,
    explanation: 'The Declaration of Independence names life, liberty, and the pursuit of happiness as unalienable rights.',
  },
  {
    id: 'q10',
    question: 'What is freedom of religion?',
    options: ['You must belong to a church', 'The government chooses the religion', 'You can practice any religion, or not practice a religion', 'You can only practice Christianity'],
    correctAnswerIndex: 2,
    explanation: 'Freedom of religion means you can practice any religion you choose, or no religion at all.',
  },
  {
    id: 'q11',
    question: 'What is the economic system in the United States?',
    options: ['Communist economy', 'Socialist economy', 'Capitalist economy', 'Barter economy'],
    correctAnswerIndex: 2,
    explanation: 'The United States has a capitalist, or market, economy in which businesses and individuals make most economic decisions.',
  },
  {
    id: 'q12',
    question: 'What is the "rule of law"?',
    options: ['The President can make any law', 'Everyone must follow the law', 'Police do not have to follow the law', 'Only citizens must follow the law'],
    correctAnswerIndex: 1,
    explanation: 'The rule of law means everyone must follow the law — leaders, the government, and the people alike. No one is above the law.',
  },

  // ---- American Government: System of Government ----
  {
    id: 'q13',
    question: 'Name one branch or part of the government.',
    options: ['The United Nations', 'The State Department', 'Congress', 'The military'],
    correctAnswerIndex: 2,
    explanation: 'The three branches of government are the legislative (Congress), the executive (the President), and the judicial (the courts).',
  },
  {
    id: 'q14',
    question: 'What stops one branch of government from becoming too powerful?',
    options: ['The President', 'The military', 'Checks and balances', 'The states'],
    correctAnswerIndex: 2,
    explanation: 'Checks and balances (also called separation of powers) keep any one branch from becoming too powerful.',
  },
  {
    id: 'q15',
    question: 'Who is in charge of the executive branch?',
    options: ['The Chief Justice', 'The Speaker of the House', 'The President', 'The Senate Majority Leader'],
    correctAnswerIndex: 2,
    explanation: 'The President of the United States is in charge of the executive branch.',
  },
  {
    id: 'q16',
    question: 'Who makes federal laws?',
    options: ['The Supreme Court', 'The President', 'Congress', 'The states'],
    correctAnswerIndex: 2,
    explanation: 'Congress — the Senate and the House of Representatives — makes federal laws.',
  },
  {
    id: 'q17',
    question: 'What are the two parts of the U.S. Congress?',
    options: ['The Senate and the House of Representatives', 'The Supreme Court and the President', 'The Cabinet and the Senate', 'State legislatures and federal courts'],
    correctAnswerIndex: 0,
    explanation: 'Congress has two chambers: the Senate and the House of Representatives.',
  },
  {
    id: 'q18',
    question: 'How many U.S. Senators are there?',
    options: ['50', '100', '435', '9'],
    correctAnswerIndex: 1,
    explanation: 'There are 100 U.S. Senators — two from each of the 50 states.',
  },
  {
    id: 'q19',
    question: 'We elect a U.S. Senator for how many years?',
    options: ['2', '4', '6', '8'],
    correctAnswerIndex: 2,
    explanation: 'U.S. Senators are elected to six-year terms.',
  },
  {
    id: 'q20',
    question: 'The House of Representatives has how many voting members?',
    options: ['100', '435', '538', '50'],
    correctAnswerIndex: 1,
    explanation: 'The House of Representatives has 435 voting members, apportioned among the states by population.',
  },
  {
    id: 'q21',
    question: 'We elect a U.S. Representative for how many years?',
    options: ['2', '4', '6', '8'],
    correctAnswerIndex: 0,
    explanation: 'U.S. Representatives are elected to two-year terms.',
  },
  {
    id: 'q22',
    question: 'Who does a U.S. Senator represent?',
    options: ['Half of the state', 'All people of the state', 'Only the people who voted for them', 'The state legislature'],
    correctAnswerIndex: 1,
    explanation: 'A U.S. Senator represents all the people of the state.',
  },
  {
    id: 'q23',
    question: 'Why do some states have more Representatives than other states?',
    options: ['Because of the state’s population', 'Because the state is older', 'Because the state is larger in area', 'Because the state pays more taxes'],
    correctAnswerIndex: 0,
    explanation: 'A state gets more Representatives when it has more people — representation in the House is based on population.',
  },
  {
    id: 'q24',
    question: 'We elect a President for how many years?',
    options: ['2', '4', '6', '8'],
    correctAnswerIndex: 1,
    explanation: 'The President is elected to a four-year term.',
  },
  {
    id: 'q25',
    question: 'In what month do we vote for President?',
    options: ['January', 'July', 'October', 'November'],
    correctAnswerIndex: 3,
    explanation: 'Presidential elections are held in November.',
  },
  {
    id: 'q26',
    question: 'If the President can no longer serve, who becomes President?',
    options: ['The Vice President', 'The Speaker of the House', 'The Chief Justice', 'The Secretary of State'],
    correctAnswerIndex: 0,
    explanation: 'If the President can no longer serve, the Vice President becomes President.',
  },
  {
    id: 'q27',
    question: 'If both the President and the Vice President can no longer serve, who becomes President?',
    options: ['The Chief Justice', 'The Speaker of the House', 'The Secretary of State', 'The Senate Majority Leader'],
    correctAnswerIndex: 1,
    explanation: 'If both the President and Vice President can no longer serve, the Speaker of the House becomes President.',
  },
  {
    id: 'q28',
    question: 'Who is the Commander in Chief of the military?',
    options: ['The President', 'The Secretary of Defense', 'A five-star general', 'The Speaker of the House'],
    correctAnswerIndex: 0,
    explanation: 'The President is the Commander in Chief of the military.',
  },
  {
    id: 'q29',
    question: 'Who signs bills to become laws?',
    options: ['The Chief Justice', 'The President', 'The Speaker of the House', 'The Vice President'],
    correctAnswerIndex: 1,
    explanation: 'The President signs bills into law.',
  },
  {
    id: 'q30',
    question: 'Who vetoes bills?',
    options: ['The Supreme Court', 'Congress', 'The President', 'The states'],
    correctAnswerIndex: 2,
    explanation: 'The President vetoes — that is, rejects — bills.',
  },
  {
    id: 'q31',
    question: "What does the President's Cabinet do?",
    options: ['Advises the President', 'Makes federal laws', 'Decides if laws are constitutional', 'Elects the Vice President'],
    correctAnswerIndex: 0,
    explanation: "The Cabinet advises the President.",
  },
  {
    id: 'q32',
    question: 'What is one Cabinet-level position?',
    options: ['Secretary of State', 'Speaker of the House', 'Chief Justice', 'Senate Majority Leader'],
    correctAnswerIndex: 0,
    explanation: 'Cabinet-level positions include the Secretary of State, Secretary of Defense, Attorney General, and the other department secretaries.',
  },
  {
    id: 'q33',
    question: 'What does the judicial branch do?',
    options: ['Writes new laws', 'Reviews and explains laws', 'Commands the military', 'Collects taxes'],
    correctAnswerIndex: 1,
    explanation: 'The judicial branch reviews and explains laws, resolves disputes, and decides if a law goes against the Constitution.',
  },
  {
    id: 'q34',
    question: 'What is the highest court in the United States?',
    options: ['The Court of Appeals', 'The Supreme Court', 'The Federal District Court', 'The Constitutional Court'],
    correctAnswerIndex: 1,
    explanation: 'The Supreme Court is the highest court in the United States.',
  },
  {
    id: 'q35',
    question: 'How many justices are on the Supreme Court?',
    options: ['7', '9', '12', '15'],
    correctAnswerIndex: 1,
    explanation: 'There are nine justices on the Supreme Court.',
  },
  {
    id: 'q36',
    question: 'Under our Constitution, what is one power of the federal government?',
    options: ['To print money', 'To give a driver’s license', 'To provide schooling', 'To provide police protection'],
    correctAnswerIndex: 0,
    explanation: 'Powers of the federal government include printing money, declaring war, creating an army, and making treaties.',
  },
  {
    id: 'q37',
    question: 'Under our Constitution, what is one power of the states?',
    options: ['To print money', 'To declare war', 'To provide schooling and education', 'To make treaties'],
    correctAnswerIndex: 2,
    explanation: 'Powers of the states include providing schooling and education, police and fire protection, driver’s licenses, and land-use approval.',
  },
  {
    id: 'q38',
    question: 'What are the two major political parties in the United States?',
    options: ['Democratic and Republican', 'Liberal and Conservative', 'Federalist and Whig', 'Labor and Green'],
    correctAnswerIndex: 0,
    explanation: 'The two major political parties in the United States are the Democratic and Republican parties.',
  },

  // ---- American Government: Rights and Responsibilities ----
  {
    id: 'q39',
    question: 'There are four amendments to the Constitution about who can vote. Describe one of them.',
    options: ['Only landowners can vote', 'Citizens eighteen (18) and older can vote', 'You must pay a poll tax to vote', 'Only men can vote'],
    correctAnswerIndex: 1,
    explanation: 'Citizens eighteen and older can vote; you do not have to pay a poll tax; any citizen can vote; and a citizen of any race can vote.',
  },
  {
    id: 'q40',
    question: 'What is one responsibility that is only for United States citizens?',
    options: ['Pay taxes', 'Obey the law', 'Serve on a jury', 'Attend school'],
    correctAnswerIndex: 2,
    explanation: 'Serving on a jury and voting in a federal election are responsibilities reserved for U.S. citizens.',
  },
  {
    id: 'q41',
    question: 'Name one right only for United States citizens.',
    options: ['Freedom of speech', 'Vote in a federal election', 'Freedom of religion', 'The right to a fair trial'],
    correctAnswerIndex: 1,
    explanation: 'Voting in a federal election and running for federal office are rights reserved for U.S. citizens.',
  },
  {
    id: 'q42',
    question: 'What are two rights of everyone living in the United States?',
    options: ['Freedom of speech and freedom of religion', 'Voting and running for office', 'Serving on a jury and voting', 'Holding federal office and voting'],
    correctAnswerIndex: 0,
    explanation: 'Rights of everyone living in the U.S. include freedom of expression, speech, assembly, religion, and the right to petition the government.',
  },
  {
    id: 'q43',
    question: 'What do we show loyalty to when we say the Pledge of Allegiance?',
    options: ['The President', 'The United States and the flag', 'Congress', 'Our home state'],
    correctAnswerIndex: 1,
    explanation: 'When we say the Pledge of Allegiance we show loyalty to the United States and to the flag.',
  },
  {
    id: 'q44',
    question: 'What is one promise you make when you become a United States citizen?',
    options: ['To vote in every election', 'To be loyal to the United States', 'To join the military', 'To learn a second language'],
    correctAnswerIndex: 1,
    explanation: 'Promises include giving up loyalty to other countries, defending the Constitution, obeying the laws, and being loyal to the United States.',
  },
  {
    id: 'q45',
    question: 'How old do citizens have to be to vote for President?',
    options: ['16', '18', '21', '25'],
    correctAnswerIndex: 1,
    explanation: 'Citizens must be eighteen (18) or older to vote.',
  },
  {
    id: 'q46',
    question: 'What is one way Americans can participate in their democracy?',
    options: ['Vote', 'Pay a poll tax', 'Serve in the Cabinet', 'Appoint a judge'],
    correctAnswerIndex: 0,
    explanation: 'Americans can vote, join a political party, help with a campaign, join a civic group, call their representatives, or run for office.',
  },
  {
    id: 'q47',
    question: 'When is the last day you can send in federal income tax forms?',
    options: ['April 15', 'January 1', 'July 4', 'December 31'],
    correctAnswerIndex: 0,
    explanation: 'Federal income tax forms are due by April 15 each year.',
  },
  {
    id: 'q48',
    question: 'When must all men register for the Selective Service?',
    options: ['At age sixteen (16)', 'At age eighteen (18)', 'At age twenty-one (21)', 'When they graduate high school'],
    correctAnswerIndex: 1,
    explanation: 'All men must register for the Selective Service at age eighteen (between 18 and 26).',
  },

  // ---- American History: Colonial Period and Independence ----
  {
    id: 'q49',
    question: 'What is one reason colonists came to America?',
    options: ['To pay higher taxes', 'For religious freedom', 'To serve the British king', 'To join the Civil War'],
    correctAnswerIndex: 1,
    explanation: 'Colonists came for freedom, political and religious liberty, economic opportunity, and to escape persecution.',
  },
  {
    id: 'q50',
    question: 'Who lived in America before the Europeans arrived?',
    options: ['American Indians', 'The Spanish', 'The Pilgrims', 'The French'],
    correctAnswerIndex: 0,
    explanation: 'American Indians (Native Americans) lived in America before the Europeans arrived.',
  },
  {
    id: 'q51',
    question: 'What group of people was taken to America and sold as slaves?',
    options: ['Africans', 'Europeans', 'Australians', 'Canadians'],
    correctAnswerIndex: 0,
    explanation: 'Africans were taken to America and sold as slaves.',
  },
  {
    id: 'q52',
    question: 'Why did the colonists fight the British?',
    options: ['Because of high taxes (taxation without representation)', 'Because of a border dispute', 'Because of a trade deal with France', 'Because of the Civil War'],
    correctAnswerIndex: 0,
    explanation: 'The colonists fought the British over high taxes without representation, quartered soldiers, and the lack of self-government.',
  },
  {
    id: 'q53',
    question: 'Who wrote the Declaration of Independence?',
    options: ['George Washington', 'Thomas Jefferson', 'Benjamin Franklin', 'John Adams'],
    correctAnswerIndex: 1,
    explanation: 'Thomas Jefferson wrote the Declaration of Independence.',
  },
  {
    id: 'q54',
    question: 'When was the Declaration of Independence adopted?',
    options: ['July 4, 1776', 'July 4, 1789', 'December 25, 1776', 'September 17, 1787'],
    correctAnswerIndex: 0,
    explanation: 'The Declaration of Independence was adopted on July 4, 1776.',
  },
  {
    id: 'q55',
    question: 'There were 13 original states. Which of these was one of them?',
    options: ['Ohio', 'Virginia', 'California', 'Florida'],
    correctAnswerIndex: 1,
    explanation: 'The 13 original states included Virginia, along with New Hampshire, Massachusetts, Rhode Island, Connecticut, New York, New Jersey, Pennsylvania, Delaware, Maryland, North Carolina, South Carolina, and Georgia.',
  },
  {
    id: 'q56',
    question: 'What happened at the Constitutional Convention?',
    options: ['The Constitution was written', 'The slaves were freed', 'The Declaration of Independence was signed', 'The first President was elected'],
    correctAnswerIndex: 0,
    explanation: 'At the Constitutional Convention, the Founding Fathers wrote the Constitution.',
  },
  {
    id: 'q57',
    question: 'When was the Constitution written?',
    options: ['1776', '1787', '1791', '1812'],
    correctAnswerIndex: 1,
    explanation: 'The Constitution was written in 1787.',
  },
  {
    id: 'q58',
    question: 'The Federalist Papers supported the passage of the U.S. Constitution. Name one of the writers.',
    options: ['James Madison', 'Thomas Jefferson', 'George Washington', 'Benjamin Franklin'],
    correctAnswerIndex: 0,
    explanation: 'The Federalist Papers were written by James Madison, Alexander Hamilton, and John Jay (under the name "Publius").',
  },
  {
    id: 'q59',
    question: 'What is one thing Benjamin Franklin is famous for?',
    options: ['He was the first President', 'He was a U.S. diplomat', 'He wrote the Constitution alone', 'He led the army in the Civil War'],
    correctAnswerIndex: 1,
    explanation: 'Benjamin Franklin was a U.S. diplomat, the oldest member of the Constitutional Convention, the first Postmaster General, and started the first free libraries.',
  },
  {
    id: 'q60',
    question: 'Who is the "Father of Our Country"?',
    options: ['Thomas Jefferson', 'Abraham Lincoln', 'George Washington', 'Benjamin Franklin'],
    correctAnswerIndex: 2,
    explanation: 'George Washington is called the "Father of Our Country."',
  },
  {
    id: 'q61',
    question: 'Who was the first President?',
    options: ['John Adams', 'George Washington', 'Thomas Jefferson', 'James Madison'],
    correctAnswerIndex: 1,
    explanation: 'George Washington was the first President of the United States.',
  },

  // ---- American History: 1800s ----
  {
    id: 'q62',
    question: 'What territory did the United States buy from France in 1803?',
    options: ['The Louisiana Territory', 'Alaska', 'Florida', 'Texas'],
    correctAnswerIndex: 0,
    explanation: 'In 1803 the United States bought the Louisiana Territory from France.',
  },
  {
    id: 'q63',
    question: 'Name one war fought by the United States in the 1800s.',
    options: ['World War I', 'The Civil War', 'The Vietnam War', 'The Korean War'],
    correctAnswerIndex: 1,
    explanation: 'Wars fought by the U.S. in the 1800s include the War of 1812, the Mexican-American War, the Civil War, and the Spanish-American War.',
  },
  {
    id: 'q64',
    question: 'Name the U.S. war between the North and the South.',
    options: ['The Revolutionary War', 'The Civil War', 'The War of 1812', 'World War I'],
    correctAnswerIndex: 1,
    explanation: 'The Civil War (also called the War between the States) was fought between the North and the South.',
  },
  {
    id: 'q65',
    question: 'Name one problem that led to the Civil War.',
    options: ['Slavery', 'A foreign invasion', 'A stock market crash', 'A dispute with Canada'],
    correctAnswerIndex: 0,
    explanation: 'Problems that led to the Civil War include slavery, economic reasons, and states’ rights.',
  },
  {
    id: 'q66',
    question: 'What was one important thing that Abraham Lincoln did?',
    options: ['Wrote the Constitution', 'Freed the slaves', 'Bought the Louisiana Territory', 'Discovered electricity'],
    correctAnswerIndex: 1,
    explanation: 'Abraham Lincoln freed the slaves with the Emancipation Proclamation, saved the Union, and led the country during the Civil War.',
  },
  {
    id: 'q67',
    question: 'What did the Emancipation Proclamation do?',
    options: ['Ended World War I', 'Freed the slaves', 'Gave women the vote', 'Created the Supreme Court'],
    correctAnswerIndex: 1,
    explanation: 'The Emancipation Proclamation freed the slaves in the Confederate states.',
  },
  {
    id: 'q68',
    question: 'What did Susan B. Anthony do?',
    options: ['Fought for women’s rights', 'Wrote the national anthem', 'Was the first female President', 'Led the army in the Civil War'],
    correctAnswerIndex: 0,
    explanation: 'Susan B. Anthony fought for women’s rights and civil rights.',
  },

  // ---- American History: Recent History and Other Important Information ----
  {
    id: 'q69',
    question: 'Name one war fought by the United States in the 1900s.',
    options: ['The Civil War', 'World War II', 'The Revolutionary War', 'The War of 1812'],
    correctAnswerIndex: 1,
    explanation: 'Wars fought by the U.S. in the 1900s include World War I, World War II, the Korean War, the Vietnam War, and the Gulf War.',
  },
  {
    id: 'q70',
    question: 'Who was President during World War I?',
    options: ['Woodrow Wilson', 'Franklin Roosevelt', 'Theodore Roosevelt', 'Harry Truman'],
    correctAnswerIndex: 0,
    explanation: 'Woodrow Wilson was President during World War I.',
  },
  {
    id: 'q71',
    question: 'Who was President during the Great Depression and World War II?',
    options: ['Woodrow Wilson', 'Franklin Roosevelt', 'Dwight Eisenhower', 'Harry Truman'],
    correctAnswerIndex: 1,
    explanation: 'Franklin Roosevelt was President during the Great Depression and World War II.',
  },
  {
    id: 'q72',
    question: 'Who did the United States fight in World War II?',
    options: ['Japan, Germany, and Italy', 'The Soviet Union and China', 'Great Britain and France', 'Spain and Mexico'],
    correctAnswerIndex: 0,
    explanation: 'In World War II, the United States fought Japan, Germany, and Italy.',
  },
  {
    id: 'q73',
    question: 'Before he was President, Eisenhower was a general. What war was he in?',
    options: ['World War I', 'World War II', 'The Civil War', 'The Korean War'],
    correctAnswerIndex: 1,
    explanation: 'Dwight Eisenhower was a general in World War II before becoming President.',
  },
  {
    id: 'q74',
    question: 'During the Cold War, what was the main concern of the United States?',
    options: ['Communism', 'Climate change', 'Immigration', 'Free trade'],
    correctAnswerIndex: 0,
    explanation: 'During the Cold War, the main concern of the United States was communism.',
  },
  {
    id: 'q75',
    question: 'What movement tried to end racial discrimination?',
    options: ['The labor movement', 'The civil rights movement', 'The temperance movement', 'The suffrage movement'],
    correctAnswerIndex: 1,
    explanation: 'The civil rights movement worked to end racial discrimination.',
  },
  {
    id: 'q76',
    question: 'What did Martin Luther King, Jr. do?',
    options: ['Fought for civil rights', 'Was the first Black President', 'Wrote the Declaration of Independence', 'Led troops in World War II'],
    correctAnswerIndex: 0,
    explanation: 'Martin Luther King, Jr. fought for civil rights and worked for equality for all Americans.',
  },
  {
    id: 'q77',
    question: 'What major event happened on September 11, 2001, in the United States?',
    options: ['Terrorists attacked the United States', 'The stock market crashed', 'A hurricane hit New Orleans', 'The Cold War ended'],
    correctAnswerIndex: 0,
    explanation: 'On September 11, 2001, terrorists attacked the United States.',
  },
  {
    id: 'q78',
    question: 'Name one American Indian tribe in the United States.',
    options: ['Cherokee', 'Aztec', 'Maya', 'Inca'],
    correctAnswerIndex: 0,
    explanation: 'American Indian tribes include the Cherokee, Navajo, Sioux, Apache, Iroquois, Choctaw, Pueblo, and many others.',
  },

  // ---- Integrated Civics: Geography ----
  {
    id: 'q79',
    question: 'Name one of the two longest rivers in the United States.',
    options: ['The Colorado River', 'The Mississippi River', 'The Rio Grande', 'The Hudson River'],
    correctAnswerIndex: 1,
    explanation: 'The two longest rivers in the United States are the Missouri River and the Mississippi River.',
  },
  {
    id: 'q80',
    question: 'What ocean is on the West Coast of the United States?',
    options: ['The Atlantic Ocean', 'The Pacific Ocean', 'The Arctic Ocean', 'The Indian Ocean'],
    correctAnswerIndex: 1,
    explanation: 'The Pacific Ocean is on the West Coast of the United States.',
  },
  {
    id: 'q81',
    question: 'What ocean is on the East Coast of the United States?',
    options: ['The Atlantic Ocean', 'The Pacific Ocean', 'The Arctic Ocean', 'The Indian Ocean'],
    correctAnswerIndex: 0,
    explanation: 'The Atlantic Ocean is on the East Coast of the United States.',
  },
  {
    id: 'q82',
    question: 'Name one U.S. territory.',
    options: ['Puerto Rico', 'Cuba', 'The Bahamas', 'Jamaica'],
    correctAnswerIndex: 0,
    explanation: 'U.S. territories include Puerto Rico, the U.S. Virgin Islands, American Samoa, the Northern Mariana Islands, and Guam.',
  },
  {
    id: 'q83',
    question: 'Name one state that borders Canada.',
    options: ['Maine', 'Texas', 'Florida', 'Arizona'],
    correctAnswerIndex: 0,
    explanation: 'States that border Canada include Maine, New York, Michigan, Minnesota, Montana, Washington, and Alaska, among others.',
  },
  {
    id: 'q84',
    question: 'Name one state that borders Mexico.',
    options: ['California', 'Florida', 'Nevada', 'Oregon'],
    correctAnswerIndex: 0,
    explanation: 'The states that border Mexico are California, Arizona, New Mexico, and Texas.',
  },
  {
    id: 'q85',
    question: 'What is the capital of the United States?',
    options: ['New York City', 'Washington, D.C.', 'Philadelphia', 'Boston'],
    correctAnswerIndex: 1,
    explanation: 'The capital of the United States is Washington, D.C.',
  },
  {
    id: 'q86',
    question: 'Where is the Statue of Liberty?',
    options: ['New York Harbor', 'San Francisco Bay', 'The Potomac River', 'Chesapeake Bay'],
    correctAnswerIndex: 0,
    explanation: 'The Statue of Liberty stands on Liberty Island in New York Harbor.',
  },

  // ---- Integrated Civics: Symbols ----
  {
    id: 'q87',
    question: 'Why does the flag have 13 stripes?',
    options: ['Because there were 13 original colonies', 'Because of 13 Presidents', 'Because of the Bill of Rights', 'Because of 13 amendments'],
    correctAnswerIndex: 0,
    explanation: 'The flag has 13 stripes because there were 13 original colonies.',
  },
  {
    id: 'q88',
    question: 'Why does the flag have 50 stars?',
    options: ['One for each state', 'One for each amendment', 'One for each President', 'One for each original colony'],
    correctAnswerIndex: 0,
    explanation: 'The flag has 50 stars because there is one star for each state.',
  },
  {
    id: 'q89',
    question: 'What is the name of the national anthem?',
    options: ['America the Beautiful', 'The Star-Spangled Banner', 'God Bless America', 'My Country, ’Tis of Thee'],
    correctAnswerIndex: 1,
    explanation: 'The national anthem is "The Star-Spangled Banner."',
  },

  // ---- Integrated Civics: Holidays ----
  {
    id: 'q90',
    question: 'When do we celebrate Independence Day?',
    options: ['July 4', 'June 14', 'September 17', 'November 11'],
    correctAnswerIndex: 0,
    explanation: 'Independence Day is celebrated on July 4.',
  },
  {
    id: 'q91',
    question: 'Which of these is a national U.S. holiday?',
    options: ['Thanksgiving', 'Valentine’s Day', 'Halloween', 'Groundhog Day'],
    correctAnswerIndex: 0,
    explanation: 'National U.S. holidays include Thanksgiving, New Year’s Day, Memorial Day, Independence Day, Labor Day, Veterans Day, and Christmas.',
  },
];

// Fisher-Yates shuffle (returns a new array).
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// A quiz question with its four options shuffled, so the correct answer isn't
// always in the same position. Tracks where the correct option landed.
export interface QuizQuestion extends Question {
  shuffledOptions: string[];
  correctIndex: number;
}

function toQuizQuestion(q: Question): QuizQuestion {
  const correct = q.options[q.correctAnswerIndex];
  const shuffledOptions = shuffle(q.options);
  return {
    ...q,
    shuffledOptions,
    correctIndex: shuffledOptions.indexOf(correct),
  };
}

// Pick `count` random questions (or all of them), each with its options shuffled.
export function getQuizQuestions(count: number): QuizQuestion[] {
  const picked = shuffle(citizenshipQuestions).slice(0, Math.min(count, citizenshipQuestions.length));
  return picked.map(toQuizQuestion);
}

export const TOTAL_QUESTIONS = citizenshipQuestions.length;
