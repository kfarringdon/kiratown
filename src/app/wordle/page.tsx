"use client"

import Image from "next/image"
import { FormEventHandler, useEffect, useState } from "react"
import { wordList } from "./words"
import { getGuessColours, getTodaysWord } from "./utils"
import { dictionary } from "./dictionary"
import { Keyboard } from "./keyboard"

const secretWord = wordList[getTodaysWord()].toUpperCase()
const maxGuesses = 6

export default function Wordle() {
  const [guesses, setGuesses] = useState<string[]>([])
  const [currentGuess, setCurrentGuess] = useState<string>("")
  const status = secretWord == guesses[guesses.length - 1]
  const lost = guesses.length >= maxGuesses

  function submitGuess(guess: string) {
    if (guess.length != 6) {
      alert("Guess must contain 6 letters")
      return
    }

    if (lost) {
      alert("No more guesses left!")
      return
    }

    if (!dictionary.includes(guess.toLowerCase())) {
      alert(guess + " is not in word list")
      return
    }

    const upperGuess = guess.toUpperCase()
    setGuesses(guesses.concat([upperGuess]))
    setCurrentGuess("")
  }

  function submit(formData: FormData) {
    const guess = formData.get("guess") as string
    submitGuess(guess)
  }

  function handleKeyPress(letter: string) {
    if (currentGuess.length < 6) {
      setCurrentGuess(currentGuess + letter.toUpperCase())
    }
  }

  function handleBackspace() {
    setCurrentGuess(currentGuess.slice(0, -1))
  }

  function handleEnter() {
    submitGuess(currentGuess)
  }

  return (
    <div className="p-1 max-w-md border-pink-600 border-3 flex-1 align-center flex flex-col">
      <h1 className="text-xl text-center">Wordle #{getTodaysWord() + 1}</h1>

      <p className="text-center">
        You Have {maxGuesses - guesses.length} Guesses Left
      </p>

      <form action={submit} className="text-center mt-2">
        <input
          name="guess"
          value={currentGuess}
          onChange={(e) => setCurrentGuess(e.target.value.toUpperCase())}
          className="border mb-2 inline text-lg"
          autoComplete="off"
          maxLength={6}
        />
      </form>

      {guesses.map((word) => (
        <Guess word={word} key={word} />
      ))}

      <p className="text-center my-2">
        {status
          ? "You Win"
          : lost
            ? "Game Over"
            : guesses.length == 0
              ? "Take a guess"
              : "Keep Trying"}
      </p>

      <Keyboard 
        guesses={guesses} 
        secretWord={secretWord}
        onKeyPress={handleKeyPress}
        onBackspace={handleBackspace}
        onEnter={handleEnter}
      />

      {/* ignore these */}
      <div className="bg-green-300 opacity-40 line-through bold"></div>
      <div className=" bg-yellow-300"></div>
      <div className=" bg-gray-300"></div>
    </div>
  )
}

function Guess({ word }: { word: string }) {
  const colours = getGuessColours(word, secretWord)

  return (
    <div className=" p-2 mb-2 flex justify-center space-x-1">
      {colours.map((colour, index) => (
        <Letter
          letter={word[index]}
          index={index}
          colour={colour}
          key={index}
        />
      ))}
    </div>
  )
}

function Letter(props: { letter: string; index: number; colour: string }) {
  // const yellow = secretWord.includes(props.letter)
  // const green = secretWord[props.index] == props.letter

  // const colour = green
  //   ? "bg-green-400"
  //   : yellow
  //     ? "bg-yellow-300"
  //     : "bg-gray-300"

  const styleColour = "bg-" + props.colour + "-300"

  return (
    <div
      className={
        "font-bold inline-block sm:h-11 sm:w-11 w-8 h-8 text-center py-3 leading-1.5 sm:leading-5 text-black " +
        styleColour
      }
    >
      {props.letter}
    </div>
  )
}
