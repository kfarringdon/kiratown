const wordList = [
  "Jacket",
  "Banana",
  "Random",
  "Silver",
  "Answer",
  "Autumn",
  "Broken",
  "Kindly",
  "Poodle",
  "Temple",
  "Energy",
  "Cradle",
  "Future",
  "Puzzle",
  "Orange",
  "Listen",
  "Mighty",
  "Square",
  "Window",
  "Yellow",
  "Dreamy",
  "Unique",
  "Eleven",
  "Useful",
  "Velvet",
  "Corner",
  "Honest",
  "Packet",
  "Simple",
  "Zombie",
]

export function getTodaysWord() {
  const now = new Date()
  const date = now.getDate()
  return wordList[date - 1]
}
