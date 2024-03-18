"use client";

import {
  useSelectedTimerSoundStore,
  useTimerConfigStore,
  useTimerVolumeStore,
} from "@/app/_store";
import { useEffect, useMemo, useRef, useState } from "react";
import { IoPlaySkipForward, IoPlaySkipForwardOutline, IoReload } from "react-icons/io5";

type TimerState = "work" | "shortBreak" | "longBreak";

export default function Timer() {
  const [time, setTime] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [timerState, setTimerState] = useState<TimerState>("work");

  const audioRef = useRef<HTMLAudioElement>(null);

  const timerConfig = useTimerConfigStore((state) => state.timerConfig);
  const audioVolume = useTimerVolumeStore((state) => state.audioVolume);
  const timerSound = useSelectedTimerSoundStore((state) => state.timerSound);

  const timerStateTimes = useMemo(() => {
    return {
      work: timerConfig.workMinutes * 60,
      shortBreak: timerConfig.shortBreakMinutes * 60,
      longBreak: timerConfig.longBreakMinutes * 60,
    };
  }, [timerConfig]);

  const timerStateTitles = useMemo(() => {
    return {
      work: "Focus",
      shortBreak: "Short break",
      longBreak: "Long break",
    };
  }, []);

  useEffect(() => {
    const timeInterval = setInterval(() => {
      if (time === 1) {
        clearInterval(timeInterval);
        progressRound();
      } else if (!isRunning) {
        clearInterval(timeInterval);
      } else {
        setTime((prevTime) => prevTime - 1);
      }
    }, 1000);

    return () => clearInterval(timeInterval);
  });

  useEffect(() => {
    setTime(timerStateTimes[timerState]);
  }, [timerState, timerStateTimes]);

  useEffect(() => {
    setIsRunning(false);
  }, [timerConfig]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = audioVolume / 100;
    }
  }, [audioVolume]);

  const getNextState = (timerState: TimerState) => {
    if (timerState === "shortBreak" || timerState === "longBreak") {
      return "work";
    }

    return currentRound % timerConfig.numberOfRounds === 0
      ? "longBreak"
      : "shortBreak";
  };

  const progressRound = async () => {
    if (timerState !== "work") {
      // Reset if prevround was the number of rounds set
      setCurrentRound(
        (prevRound) => (prevRound % timerConfig.numberOfRounds) + 1
      );
      setIsRunning(timerConfig.autoStartWork);
    } else {
      setIsRunning(timerConfig.autoStartBreak);
    }
    setTimerState((timerState) => getNextState(timerState));

    if (audioRef.current) {
      await audioRef.current.play();
    }
  };

  const reset = () => {
    setTime(timerStateTimes[timerState]);
    setIsRunning(false);
  };

  const formatTime = () => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;

    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div className="flex flex-col items-center min-w-72">
      <h1
        className={`text-2xl text-white border-1 w-16 py-1 rounded-3xl self-end mb-4 text-center`}
      >
        {currentRound}/{timerConfig.numberOfRounds}
      </h1>
      <h1 className="text-4xl mb-2 font-medium">
        {timerStateTitles[timerState]}
      </h1>
      <h1 className="mb-4 text-8xl font-medium">{formatTime()}</h1>
      <div className="flex gap-4">
        <button
          onClick={() => {
            setIsRunning(!isRunning);
          }}
          className="bg-white text-black w-20 py-2 rounded-3xl transition ease-in-out hover:text-white hover:bg-transparent hover:border-white border-1"
        >
          {!isRunning ? "Start" : "Stop"}
        </button>
        <button onClick={reset}>
          <IoReload className="size-8 font-bold" />
        </button>
        <button onClick={progressRound}>
          <IoPlaySkipForwardOutline className="size-8" />
        </button>
      </div>
      {timerSound.file && <audio ref={audioRef} src={timerSound.file} />}
    </div>
  );
}