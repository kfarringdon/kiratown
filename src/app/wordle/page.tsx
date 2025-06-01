"use client"

import Image from "next/image"
import { FormEventHandler, useEffect, useState } from "react"
import { getTodaysWord } from "./words"
const secretWord = getTodaysWord().toUpperCase()
const maxGuesses = 6

export default function Wordle() {
  const [guesses, setGuesses] = useState<string[]>([])
  const status = secretWord == guesses[guesses.length - 1]
  const lost = guesses.length >= maxGuesses

  function submit(formData: FormData) {
    const guess = formData.get("guess") as string

    if (guess.length != 6) {
      alert("Guess must contain 6 letters")
      return
    }

    if (lost) {
      alert("No more guesses left!")
      return
    }

    const upperGuess = guess.toUpperCase()

    setGuesses(guesses.concat([upperGuess]))
  }

  return (
    <div className="p-5 max-w-3xl border-pink-600 border-3 flex-1">
      <h1 className="text-xl">Wordle</h1>
      <p>Status {status ? "You Win" : lost ? "Game Over" : "Keep Trying"}</p>
      <p>You Have {maxGuesses - guesses.length} Guesses Left</p>

      <form action={submit}>
        <input name="guess" className="border mb-2" autoComplete="off" />
      </form>

      {guesses.map((word) => (
        <Guess word={word} key={word} />
      ))}
    </div>
  )
}

function Guess({ word }: { word: string }) {
  return (
    <div className="border p-5 mb-5">
      <Letter letter={word[0]} index={0} />
      <Letter letter={word[1]} index={1} />
      <Letter letter={word[2]} index={2} />
      <Letter letter={word[3]} index={3} />
      <Letter letter={word[4]} index={4} />
      <Letter letter={word[5]} index={5} />
    </div>
  )
}

function Letter(props: { letter: string; index: number }) {
  const yellow = secretWord.includes(props.letter)
  const green = secretWord[props.index] == props.letter

  const colour = green
    ? "bg-green-400"
    : yellow
      ? "bg-yellow-300"
      : "bg-gray-300"

  return (
    <div className={"inline-block w-11 text-center py-3 mr-2 " + colour}>
      {props.letter}
    </div>
  )
}
