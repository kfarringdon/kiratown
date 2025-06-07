const qwertyAlphabet = [
  "q",
  "w",
  "e",
  "r",
  "t",
  "y",
  "u",
  "i",
  "o",
  "p", //new line
  "a",
  "s",
  "d",
  "f",
  "g",
  "h",
  "j",
  "k",
  "l", //new line
  "z",
  "x",
  "c",
  "v",
  "b",
  "n",
  "m",
]

function isLetterUsable(
  guesses: string[],
  smallLetter: string,
  secretWord: string,
) {
  const letter = smallLetter.toUpperCase()
  if (secretWord.includes(letter)) {
    return true
  }
  if (guesses.some((guess) => guess.includes(letter))) {
    return false
  }
  return true
}

export function Keyboard({
  guesses,
  secretWord,
}: {
  guesses: string[]
  secretWord: string
}) {
  return (
    <div className="text-center">
      {qwertyAlphabet.map((l) => (
        <>
          <div
            className={
              "w-6 h-6 text-sm bg-gray-900 inline-block text-white font-bold " +
              (isLetterUsable(guesses, l, secretWord)
                ? ""
                : "opacity-40 line-through")
            }
          >
            {l}
          </div>
          {(l == "p" || l == "l") && <br />}
        </>
      ))}
    </div>
  )
}
