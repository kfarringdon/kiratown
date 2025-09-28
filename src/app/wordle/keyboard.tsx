import { Fragment } from "react"

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
  onKeyPress,
  onBackspace,
  onEnter,
}: {
  guesses: string[]
  secretWord: string
  onKeyPress: (letter: string) => void
  onBackspace: () => void
  onEnter: () => void
}) {
  return (
    <div className="text-center">
      {qwertyAlphabet.map((l) => (
        <Fragment key={l}>
          <button
            onClick={() => onKeyPress(l)}
            className={
              "w-6 h-6 text-sm bg-gray-900 inline-block text-white font-bold cursor-pointer hover:bg-gray-700 " +
              (isLetterUsable(guesses, l, secretWord)
                ? ""
                : "opacity-40 line-through")
            }
          >
            {l}
          </button>
          {(l == "p" || l == "l") && <br />}
        </Fragment>
      ))}
      <br />
      <button
        onClick={onBackspace}
        className="w-16 h-6 text-sm bg-red-600 text-white font-bold cursor-pointer hover:bg-red-500 mr-2"
      >
        ⌫
      </button>
      <button
        onClick={onEnter}
        className="w-16 h-6 text-sm bg-green-600 text-white font-bold cursor-pointer hover:bg-green-500"
      >
        ENTER
      </button>
    </div>
  )
}
