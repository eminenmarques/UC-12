import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const BOARD_SIZE = 5; // Tamanho do tabuleiro (5x5)
const WIN_CONDITION = 4; // Número necessário para vencer (4 em linha)
const PLAYER_TIMES = { X: 4, O: 6 }; // Tempo limite para cada jogador (em segundos)

export default function JogoDaVelha() {
  const [board, setBoard] = useState(Array(BOARD_SIZE * BOARD_SIZE).fill(""));
  const [currentPlayer, setCurrentPlayer] = useState("X");
  const [winner, setWinner] = useState(null);
  const [score, setScore] = useState({ X: 0, O: 0, Empate: 0 });
  const [timeLeft, setTimeLeft] = useState(PLAYER_TIMES[currentPlayer]); // Tempo restante

  // Função para verificar se há um vencedor ou empate
  const checkWin = (newBoard) => {
    const directions = [
      [1, 0],  // Horizontal →
      [0, 1],  // Vertical ↓
      [1, 1],  // Diagonal ↘
      [1, -1], // Diagonal ↙
    ];

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const index = row * BOARD_SIZE + col;
        const player = newBoard[index];

        if (!player) continue; // Ignora células vazias

        for (const [dx, dy] of directions) {
          let count = 1;
          for (let step = 1; step < WIN_CONDITION; step++) {
            const newRow = row + step * dy;
            const newCol = col + step * dx;
            const newIndex = newRow * BOARD_SIZE + newCol;

            if (
              newRow >= 0 && newRow < BOARD_SIZE &&
              newCol >= 0 && newCol < BOARD_SIZE &&
              newBoard[newIndex] === player
            ) {
              count++;
            } else {
              break;
            }
          }
          if (count === WIN_CONDITION) return player; // Retorna o jogador vencedor
        }
      }
    }

    // Verifica se todas as células estão preenchidas (empate)
    return newBoard.every(cell => cell !== "") ? "Empate" : null;
  };

  // Função para lidar com o pressionamento de uma célula
  const handlePress = (index) => {
    if (board[index] || winner) return; // Ignora se a célula já estiver preenchida ou houver um vencedor

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const result = checkWin(newBoard);
    if (result) {
      setWinner(result);
      setScore((prevScore) => ({
        ...prevScore,
        [result]: prevScore[result] + 1,
      }));
    } else {
      switchPlayer(); // Alterna o jogador
    }
  };

  // Função para alternar o jogador
  const switchPlayer = () => {
    setCurrentPlayer((prevPlayer) => (prevPlayer === "X" ? "O" : "X"));
    setTimeLeft(PLAYER_TIMES[currentPlayer === "X" ? "O" : "X"]); // Reinicia o tempo para o próximo jogador
  };

  // Função para reiniciar o jogo
  const resetGame = () => {
    setBoard(Array(BOARD_SIZE * BOARD_SIZE).fill(""));
    setCurrentPlayer("X");
    setWinner(null);
    setTimeLeft(PLAYER_TIMES["X"]); // Reinicia o tempo para o jogador X
  };

  // Efeito para o cronômetro
  useEffect(() => {
    if (winner) return; // Para o cronômetro se houver um vencedor

    const timer = setTimeout(() => {
      if (timeLeft > 0) {
        setTimeLeft((prevTime) => prevTime - 1); // Decrementa o tempo
      } else {
        switchPlayer(); // Passa a vez para o próximo jogador
      }
    }, 1000);

    return () => clearTimeout(timer); // Limpa o timer ao desmontar o componente
  }, [timeLeft, winner]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Jogo da Velha 5x5</Text>

      {!winner && (
        <View>
          <Text style={[styles.turnText, { color: currentPlayer === "X" ? "red" : "blue" }]}>
            Vez do jogador: {currentPlayer}
          </Text>
          <Text style={styles.timerText}>Tempo restante: {timeLeft}s</Text>
        </View>
      )}

      <View style={styles.scoreBoard}>
        <Text style={styles.scoreText}>
          � X: {score.X} | O: {score.O} | 🤝 Empates: {score.Empate}
        </Text>
      </View>

      <View style={styles.board}>
        {board.map((cell, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.cell, cell && styles.cellPressed]} // Efeito visual ao pressionar
            onPress={() => handlePress(index)}
          >
            <Text style={[styles.cellText, { color: cell === "X" ? "red" : cell === "O" ? "blue" : "black" }]}>
              {cell}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {winner && (
        <Text style={styles.result}>
          {winner === "Empate" ? "Deu empate! 😐" : `Jogador ${winner} venceu! 🎉`}
        </Text>
      )}

      <TouchableOpacity style={styles.button} onPress={resetGame}>
        <Text style={styles.buttonText}>Reiniciar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8f8f8" },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 10 },
  turnText: { fontSize: 20, fontWeight: "bold", marginBottom: 5 },
  timerText: { fontSize: 16, marginBottom: 10, color: "#555" },
  scoreBoard: { backgroundColor: "#ddd", padding: 10, borderRadius: 5, marginBottom: 10 },
  scoreText: { fontSize: 18, fontWeight: "bold" },
  board: { width: 250, flexDirection: "row", flexWrap: "wrap" },
  cell: { width: 50, height: 50, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#000" },
  cellPressed: { backgroundColor: "#f0f0f0" }, // Efeito visual ao pressionar
  cellText: { fontSize: 30, fontWeight: "bold" },
  result: { fontSize: 24, fontWeight: "bold", marginVertical: 20, color: "green" },
  button: { backgroundColor: "blue", padding: 10, borderRadius: 5, marginTop: 10 },
  buttonText: { color: "#fff", fontSize: 18 },
});