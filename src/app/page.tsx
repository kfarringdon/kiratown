"use client"

import Image from "next/image"
import { FormEventHandler, useEffect, useState } from "react"
const secretWord = "train"
const maxGuesses = 3

export default function Home() {
  const [guesses, setGuesses] = useState<string[]>([])
  const status = secretWord == guesses[guesses.length - 1]
  const lost = guesses.length >= maxGuesses

  function submit(formData: FormData) {
    const guess = formData.get("guess") as string

    if (guess.length != 5) {
      alert("Guess must contain 5 letters")
      return
    }

    if (lost) {
      alert("No more guesses left!")
      return
    }

    setGuesses(guesses.concat([guess]))
  }

  return (
    <div className="p-5">
      <h1 className="text-xl">Wordle</h1>
      <p> Status {status ? "You Win" : lost ? "Game Over" : "Keep Trying"}</p>

      <form action={submit}>
        <input name="guess" className="border mb-2" />
      </form>

      {guesses.map((value) => (
        <Guess title={value} key={value} />
      ))}
    </div>
  )
}

function Guess(props: { title: string }) {
  return (
    <div className="border p-5 mb-5">
      <h3 className="text-lg text-pink-500"> {props.title}</h3>
    </div>
  )
}

function About(props: { face: string }) {
  return <h2>Hi {props.face} </h2>
}

function Times(props: { amount: number }) {
  const x = props.amount * 5
  return <div>a {x}</div>
}

// function fullname(first: string, last: string) {
//   return first + " " + last
// }
