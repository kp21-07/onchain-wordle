import React from "react";

export function WordleBoard({ guesses, currentGuess, wordLength = 5 }) {
  const rows = [];

  for (let i = 0; i < 6; i++) {
    if (i < guesses.length) {
      // Completed row
      rows.push({
        word: guesses[i].word,
        // Double check your on-chain data struct here: is it 'result' or 'results'?
        results: guesses[i].result, 
        isCompleted: true,
        isCurrent: false,
      });
    } else if (i === guesses.length) {
      // Current active row
      rows.push({
        word: currentGuess.padEnd(wordLength, " ").slice(0, wordLength),
        results: null,
        isCompleted: false,
        isCurrent: true,
        isQuantum: false,
      });
    } else {
      // Empty upcoming row
      rows.push({
        word: " ".repeat(wordLength),
        results: null,
        isCompleted: false,
        isCurrent: false,
        isQuantum: false,
      });
    }
  }

  return (
    <div className="flex flex-col items-center justify-center gap-1.5 my-4">
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${wordLength}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: wordLength }).map((_, colIndex) => {
            const letter = row.word[colIndex]?.trim() || "";
            
            // Default styles
            let hexBg = "transparent";
            let hexBorder = "#3a3a3c"; 

            if (row.isCompleted && row.results) {
              // Number() handles both standard JS numbers and on-chain BigInts safely
              const res = Number(row.results[colIndex]);
              if (res === 2) {
                // Exact match (Green)
                hexBg = "#538d4e";
                hexBorder = "#538d4e";
              } else if (res === 1) {
                // Partial match (Yellow)
                hexBg = "#b59f3b";
                hexBorder = "#b59f3b";
              } else {
                // No match (Gray)
                hexBg = "#3a3a3c";
                hexBorder = "#3a3a3c";  
              }
            } else if (letter) {
              // Actively typed letter
              hexBorder = "#565758";
            }

            return (
              <div
                key={colIndex}
                style={{
                  backgroundColor: hexBg,
                  borderColor: hexBorder,
                }}
                className="w-14 h-14 sm:w-16 sm:h-16 border-2 flex items-center justify-center font-bold text-2xl uppercase text-white select-none rounded"
              >
                {letter}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}