export function getTodaysWord() {
  const june1 = new Date("2025-06-01")
  const now = new Date()

  const todaysWordNumber = Math.floor(
    (now.getTime() - june1.getTime()) / 1000 / 60 / 60 / 24,
  )
  return todaysWordNumber
}

export function getGuessColours(word: string, secretWord: string) {
  const colours = ["gray", "gray", "gray", "gray", "gray", "gray"]
  const usedChars = [false, false, false, false, false, false]

  const secret = Array.from(secretWord)

  // The greens
  for (let i = 0; i < word.length; i++) {
    const isGreen = word[i] == secretWord[i]
    if (isGreen) {
      colours[i] = "green"
      usedChars[i] = true
    }
  }

  // YELLOWS
  for (let i = 0; i < word.length; i++) {
    // if the letter is already green, skip it
    if (colours[i] === "green") {
      continue
    }

    // get the i'th letter from guess word
    const letter = word[i]

    // find which position it is in the secret word. -1 if not present at all
    const secretPosition = secret.findIndex(
      (l, index) => l == letter && !usedChars[index],
    )

    // if the word is present (not -1 but is 0,1,2 ... or something)
    if (secretPosition !== -1) {
      // set the colour of the guess letter to yellow
      colours[i] = "yellow"
      // and mark as used
      usedChars[secretPosition] = true
    }
  }

  return colours
}
