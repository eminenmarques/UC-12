import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from "react-native";


const { width, height } = Dimensions.get("window");

// Lista de emojis de monstros
const monsterEmojis = ["👹", "👺", "🧌", "🐉", "👾", "🦇"];

// Gera 2 pontos de spawn por lado (total de 8 pontos)
const generateSpawnPoints = () => {
  const points = [];

  // Pontos de spawn na borda superior
  points.push({ x: width * 0.25, y: 0, color: "red" });
  points.push({ x: width * 0.75, y: 0, color: "red" });

  // Pontos de spawn na borda inferior
  points.push({ x: width * 0.25, y: height, color: "blue" });
  points.push({ x: width * 0.75, y: height, color: "blue" });

  // Pontos de spawn na borda esquerda
  points.push({ x: 0, y: height * 0.25, color: "green" });
  points.push({ x: 0, y: height * 0.75, color: "green" });

  // Pontos de spawn na borda direita
  points.push({ x: width, y: height * 0.25, color: "purple" });
  points.push({ x: width, y: height * 0.75, color: "purple" });

  return points;
};

// Pontos de spawn dos inimigos
const spawnPoints = generateSpawnPoints();

export default function App() {
  const [isGameStarted, setIsGameStarted] = useState(false); // Controla se o jogo começou
  const [positionX, setPositionX] = useState(width / 2 - 25); // Posição horizontal do personagem
  const [positionY, setPositionY] = useState(height / 2 - 25); // Posição vertical do personagem (centro da tela)
  const [isMovingLeft, setIsMovingLeft] = useState(false);
  const [isMovingRight, setIsMovingRight] = useState(false);
  const [isMovingUp, setIsMovingUp] = useState(false);
  const [isMovingDown, setIsMovingDown] = useState(false);
  const [shots, setShots] = useState([]);
  const [enemies, setEnemies] = useState(
    spawnPoints.map((point, index) => ({
      id: index + 1,
      x: point.x,
      y: point.y,
      alive: true,
      deathTime: null,
      lives: 1, // Número de vidas (tiros necessários para derrotar)
      emoji: monsterEmojis[Math.floor(Math.random() * monsterEmojis.length)], // Emoji aleatório
    }))
  );
  const [health, setHealth] = useState(100); // Vida do personagem
  const [gameOver, setGameOver] = useState(false); // Estado de game over
  const [isTakingDamage, setIsTakingDamage] = useState(false); // Estado de dano
  const [round, setRound] = useState(1); // Round atual
  const [timeLeft, setTimeLeft] = useState(25); // Tempo restante no round
  const [isWaiting, setIsWaiting] = useState(false); // Estado de espera entre rounds
  const [isSpawningEnabled, setIsSpawningEnabled] = useState(true); // Controle de spawn
  const [points, setPoints] = useState(0); // Pontos do jogador
  const [enemySpeed, setEnemySpeed] = useState(1); // Velocidade base dos monstros
  const [enemyDamage, setEnemyDamage] = useState(1); // Dano base dos monstros
  const [damageLevel, setDamageLevel] = useState(1); // Nível de dano
  const [maxHealth, setMaxHealth] = useState(100); // Vida máxima
  const [resistanceLevel, setResistanceLevel] = useState(1); // Nível de resistência
  const [drops, setDrops] = useState([]); // Drops no chão
  const [showUpgrades, setShowUpgrades] = useState(false); // Controla a visibilidade dos upgrades
  const [pointsMultiplier, setPointsMultiplier] = useState(1); // Multiplicador de pontos (inicia em 1)

  // Buffer para aumentar o limite da tela
  const buffer = 400;

  // Verifica se há inimigos vivos
  const hasAliveEnemies = enemies.some((enemy) => enemy.alive);

  // Referência para o loop de animação
  const animationFrameRef = useRef();

  // Raio de colisão do personagem
  const playerCollisionRadius = 25;

  // Velocidade do personagem
  const playerSpeed = 5;

  const renderStartScreen = () => (
    <View style={styles.startScreenContainer}>
      <Text style={styles.title}>Monster Shooter</Text>
      <TouchableOpacity style={styles.startButton} onPress={() => setIsGameStarted(true)}>
        <Text style={styles.startButtonText}>Iniciar Jogo</Text>
      </TouchableOpacity>
      <Text style={styles.Dev}>Dev: Eminen</Text>
    </View>
  );

  // Atualiza a posição do personagem continuamente
  useEffect(() => {
    const move = () => {
      if (gameOver || !isGameStarted) return; // Desabilita o movimento se o jogo não tiver começado ou estiver em game over
  
      setPositionX((prevX) => {
        if (isMovingLeft && prevX > 15) return prevX - playerSpeed;
        if (isMovingRight && prevX < width - 50) return prevX + playerSpeed;
        return prevX;
      });
      setPositionY((prevY) => {
        if (isMovingUp && prevY > 15) return prevY - playerSpeed;
        if (isMovingDown && prevY < height - 100) return prevY + playerSpeed;
        return prevY;
      });
      animationFrameRef.current = requestAnimationFrame(move);
    };
  
    animationFrameRef.current = requestAnimationFrame(move);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [isMovingLeft, isMovingRight, isMovingUp, isMovingDown, gameOver, isGameStarted]); // Adicione isGameStarted como dependência

  // Função para calcular a direção do tiro
  const calculateShotDirection = (shotX, shotY) => {
    const aliveEnemies = enemies.filter((enemy) => enemy.alive);

    if (aliveEnemies.length === 0) {
      return null; // Não há inimigos vivos
    }

    // Encontra o inimigo mais próximo
    const closestEnemy = aliveEnemies.reduce((closest, enemy) => {
      const distanceCurrent = Math.hypot(enemy.x - shotX, enemy.y - shotY);
      const distanceClosest = Math.hypot(closest.x - shotX, closest.y - shotY);
      return distanceCurrent < distanceClosest ? enemy : closest;
    }, aliveEnemies[0]);

    // Calcula o ângulo de direção
    const deltaX = closestEnemy.x - shotX;
    const deltaY = closestEnemy.y - shotY;
    return Math.atan2(deltaY, deltaX); // Retorna o ângulo
  };

  // Limita a vida ao máximo
  useEffect(() => {
    if (health > maxHealth) {
      setHealth(maxHealth);
    }
  }, [health, maxHealth]);

  // Atualiza os tiros
  useEffect(() => {
    const updateShots = () => {
      setShots((prevShots) =>
        prevShots
          .map((shot) => {
            // Move o tiro na direção calculada
            const speed = 5; // Velocidade do tiro
            const newX = shot.x + speed * Math.cos(shot.angle);
            const newY = shot.y + speed * Math.sin(shot.angle);

            // Verifica se o tiro saiu dos limites da tela
            if (
              newX < -buffer ||
              newX > width + buffer ||
              newY < -buffer ||
              newY > height + buffer
            ) {
              return null; // Remove o tiro
            }

            // Verifica colisão com inimigos
            const collidedEnemy = enemies.find(
              (enemy) => enemy.alive && Math.hypot(newX - enemy.x, newY - enemy.y) < 20
            );
            if (collidedEnemy) {
              // Reduz a vida do inimigo
              const updatedEnemies = enemies.map((enemy) =>
                enemy.id === collidedEnemy.id
                  ? { ...enemy, lives: enemy.lives - damageLevel } // Aplica o dano
                  : enemy
              );

              // Se a vida do inimigo chegar a 0, ele morre
              if (collidedEnemy.lives - damageLevel <= 0) {
                setEnemies((prevEnemies) =>
                  prevEnemies.map((enemy) =>
                    enemy.id === collidedEnemy.id
                      ? { ...enemy, alive: false, deathTime: Date.now() }
                      : enemy
                  )
                );

                // Adiciona pontos ao jogador
                const minPoints = round; // Pontos mínimos aumentam com o round
                const maxPoints = round + 4; // Pontos máximos aumentam com o round
                const pointsEarned = Math.floor(Math.random() * (maxPoints - minPoints + 1)) + minPoints;
                setPoints((prevPoints) => prevPoints + pointsEarned * pointsMultiplier);

// Chance de 5% de dropar um upgrade
if (Math.random() < 0.05) {
  const dropType = Math.random(); // Gera um número aleatório entre 0 e 1
  let type;
  if (dropType < 0.15) {
    type = "damage"; // 15% de chance de dropar dano
  } else if (dropType < 0.3) {
    type = "resistance"; // 15% de chance de dropar resistência
  } else if (dropType < 0.45) {
    type = "health"; // 15% de chance de dropar vida
  } else {
    type = "points"; // 5% de chance de dropar 2x pontos
  }

  // Adiciona o drop ao estado
  setDrops((prevDrops) => [
    ...prevDrops,
    {
      id: Date.now(), // ID único para o drop
      x: collidedEnemy.x, // Posição X do monstro morto
      y: collidedEnemy.y, // Posição Y do monstro morto
      type: type, // Tipo de drop
    },
  ]);
}
              } else {
                setEnemies(updatedEnemies); // Atualiza a vida do inimigo
              }

              return null; // Remove o tiro
            }

            // Atualiza a posição do tiro
            return { ...shot, x: newX, y: newY };
          })
          .filter((shot) => shot !== null) // Remove tiros nulos
      );
    };

    const shotInterval = setInterval(updateShots, 16);
    return () => clearInterval(shotInterval);
  }, [enemies, round, damageLevel]);

  // Atualiza os inimigos para perseguir o personagem e renascer após 5 segundos
  useEffect(() => {
    const updateEnemies = () => {
      if (!isSpawningEnabled) return; // Desativa o spawn durante o tempo de espera

      setEnemies((prevEnemies) =>
        prevEnemies.map((enemy) => {
          if (!enemy.alive) {
            // Verifica se já se passaram 5 segundos desde a morte
            if (Date.now() - enemy.deathTime >= 5000) {
              // Renasce o inimigo em seu ponto de spawn original
              const spawnPoint = spawnPoints[enemy.id - 1]; // Usa o ID para mapear o ponto de spawn correto
              return {
                ...enemy,
                alive: true,
                deathTime: null,
                x: spawnPoint.x,
                y: spawnPoint.y,
                lives: round + 1, // Aumenta a vida conforme o round
                emoji: monsterEmojis[Math.floor(Math.random() * monsterEmojis.length)], // Novo emoji aleatório
              };
            }
            return enemy; // Mantém o inimigo morto
          }

          // Movimenta o inimigo em direção ao personagem
          const deltaX = positionX - enemy.x;
          const deltaY = positionY - enemy.y;
          const angle = Math.atan2(deltaY, deltaX);
          const speed = enemySpeed; // Velocidade dos monstros (ajustada conforme o round)
          return { ...enemy, x: enemy.x + speed * Math.cos(angle), y: enemy.y + speed * Math.sin(angle) };
        })
      );
    };

    const enemyInterval = setInterval(updateEnemies, 16);
    return () => clearInterval(enemyInterval);
  }, [positionX, positionY, isSpawningEnabled, enemySpeed, round]);

  // Verifica colisão entre personagem e inimigos
  useEffect(() => {
    const checkCollision = () => {
      if (gameOver || !isGameStarted) return; // Desabilita colisões se o jogo não tiver começado
  
      let isColliding = false;
      enemies.forEach((enemy) => {
        if (
          enemy.alive &&
          Math.hypot(positionX - enemy.x, positionY - enemy.y) < playerCollisionRadius
        ) {
          isColliding = true;
          setHealth((prevHealth) => {
            const damage = enemyDamage / resistanceLevel;
            const newHealth = prevHealth - damage;
            if (newHealth <= 0) {
              setGameOver(true);
            }
            return newHealth;
          });
        }
      });
      setIsTakingDamage(isColliding);
    };
  
    const collisionInterval = setInterval(checkCollision, 16);
    return () => clearInterval(collisionInterval);
  }, [enemies, positionX, positionY, enemyDamage, resistanceLevel, gameOver, isGameStarted]); // Adicione isGameStarted como dependência

  // Verifica colisão com drops
  useEffect(() => {
    const checkDropCollision = () => {
      setDrops((prevDrops) =>
        prevDrops.filter((drop) => {
          // Verifica se o personagem está próximo o suficiente do drop
          if (Math.hypot(positionX - drop.x, positionY - drop.y) < playerCollisionRadius) {
            // Aplica o upgrade correspondente
            switch (drop.type) {
              case "damage":
                setDamageLevel((prevLevel) => prevLevel + 1);
                break;
              case "resistance":
                setResistanceLevel((prevLevel) => prevLevel + 1);
                break;
              case "health":
                setMaxHealth((prevHealth) => prevHealth + 20);
                setHealth((prevHealth) => Math.min(prevHealth + 20, maxHealth + 20));
                break;
              case "points":
                setPointsMultiplier(2); // Define o multiplicador de pontos como 2
                break;
              default:
                break;
            }
            return false; // Remove o drop
          }
          return true; // Mantém o drop
        })
      );
    };

    const dropInterval = setInterval(checkDropCollision, 16); // Verifica colisão a cada frame
    return () => clearInterval(dropInterval);
  }, [positionX, positionY, drops]);

  // Funções de upgrade
  const upgradeDamage = () => {
    if (points >= 100) {
      setDamageLevel((prevLevel) => prevLevel + 1);
      setPoints((prevPoints) => prevPoints - 100); // Deduz 200 pontos
    }
  };

  const upgradeHealth = () => {
    if (points >= 30) {
      setMaxHealth((prevHealth) => prevHealth + 20); // Aumenta a vida máxima em 20
      setHealth((prevHealth) => prevHealth + 20); // Recupera 20 de vida
      setPoints((prevPoints) => prevPoints - 30); // Deduz 50 pontos
    }
  };

  const upgradeResistance = () => {
    if (points >= 200) {
      setResistanceLevel((prevLevel) => prevLevel + 1);
      setPoints((prevPoints) => prevPoints - 200); // Deduz 300 pontos
    }
  };

  // Função de tiro
  const shoot = () => {
    if (!hasAliveEnemies || gameOver || isWaiting || !isGameStarted) return; // Desabilita tiros se o jogo estiver em estado de game over
  
    const shotX = positionX + 25;
    const shotY = positionY;
    const angle = calculateShotDirection(shotX, shotY);
    if (angle === null) return;
  
    setShots((prevShots) => [...prevShots, { id: Date.now(), x: shotX, y: shotY, angle }]);
  };

  // Reinicia o jogo
  const restartGame = () => {
    // Reseta todos os estados de forma síncrona
    setGameOver(false); // Desativa a tela de game over imediatamente
    setHealth(100);
    setEnemies(
      spawnPoints.map((point, index) => ({
        id: index + 1,
        x: point.x,
        y: point.y,
        alive: true,
        deathTime: null,
        lives: 1,
        emoji: monsterEmojis[Math.floor(Math.random() * monsterEmojis.length)],
      }))
    );
    setShots([]);
    setPositionX(width / 2 - 25);
    setPositionY(height / 2 - 25);
    setRound(1);
    setTimeLeft(25);
    setIsWaiting(false);
    setIsSpawningEnabled(true);
    setPoints(0);
    setEnemySpeed(1);
    setEnemyDamage(1);
    setDamageLevel(1);
    setMaxHealth(100);
    setResistanceLevel(1);
    setDrops([]);
    setPointsMultiplier(1);
  };

  // Contador de tempo para rounds e espera
  useEffect(() => {
    const timer = setInterval(() => {
      if (gameOver) return;

      if (timeLeft > 0) {
        setTimeLeft((prevTime) => prevTime - 1);
      } else {
        if (isWaiting) {
          // Terminou o tempo de espera, inicia o próximo round
          setIsWaiting(false);
          setTimeLeft(25);
          setRound((prevRound) => prevRound + 1);

          // Aumenta a dificuldade a cada 1 round
          setEnemySpeed((prevSpeed) => prevSpeed * 1.1); // Aumenta a velocidade em 10%
          setEnemyDamage((prevDamage) => prevDamage * 1.1); // Aumenta o dano em 10%

          // Respawn dos monstros
          setEnemies(
            spawnPoints.map((point, index) => ({
              id: index + 1,
              x: point.x,
              y: point.y,
              alive: true,
              deathTime: null,
              lives: round + 1, // Aumenta a vida conforme o round
              emoji: monsterEmojis[Math.floor(Math.random() * monsterEmojis.length)], // Novo emoji aleatório
            }))
          );
          setIsSpawningEnabled(true); // Reativa o spawn
        } else {
          // Terminou o round, inicia o tempo de espera
          setIsWaiting(true);
          setTimeLeft(10);
          // Despawn de todos os monstros
          setEnemies((prevEnemies) =>
            prevEnemies.map((enemy) => ({ ...enemy, alive: false }))
          );
          setIsSpawningEnabled(false); // Desativa o spawn
        }
      }
    }, 1000); // Atualiza a cada segundo

    return () => clearInterval(timer);
  }, [timeLeft, isWaiting, gameOver, round]);

  return (
    <View style={styles.container}>
      {!isGameStarted ? (
        renderStartScreen() // Exibe a tela inicial
      ) : (
        // Exibe o jogo
        <>
          {/* Tela de Game Over */}
          {gameOver && (
            <View style={styles.gameOverContainer}>
              <Text style={styles.gameOverText}>Game Over!</Text>
              <Text style={styles.gameOverText}>Pontos: {points}</Text>
              <TouchableOpacity style={styles.restartButton} onPress={restartGame}>
                <Text style={styles.restartButtonText}>Restart</Text>
              </TouchableOpacity>
            </View>
          )}
  
          {/* Personagem */}
          <View
            style={[
              styles.character,
              { left: positionX, top: positionY },
              isTakingDamage && styles.characterDamaged,
            ]}
          >
            <Text style={styles.characterText}>😎</Text>
            <Text style={styles.weaponText}>🔫</Text>
          </View>
  
          {/* Tiros */}
          {shots.map((shot) => (
            <Text key={shot.id} style={[styles.shot, { left: shot.x, top: shot.y }]}>💩</Text>
          ))}
  
          {/* Inimigos */}
          {enemies.map((enemy) =>
            enemy.alive && (
              <Text key={enemy.id} style={[styles.enemy, { left: enemy.x, top: enemy.y }]}>
                {enemy.emoji}
              </Text>
            )
          )}
  
          {/* Drops */}
          {drops.map((drop) => (
            <Text key={drop.id} style={[styles.drop, { left: drop.x, top: drop.y }]}>
              {drop.type === "damage" ? "⚔️" : drop.type === "resistance" ? "🛡️" : drop.type === "health" ? "❤️" : "🏅"}
            </Text>
          ))}
  
          {/* Barra de Vida */}
          <View style={styles.healthBarContainer}>
            <View style={[styles.healthBar, { width: `${Math.floor(health)}%` }]} />
            <Text style={[styles.healthText, health <= 20 && styles.criticalHealthText]}>
              {Math.floor(health)}%
            </Text>
          </View>
  
          {/* Botão para mostrar/ocultar upgrades */}
          <TouchableOpacity
            style={styles.toggleUpgradesButton}
            onPress={() => setShowUpgrades(!showUpgrades)}
          >
            <Text style={styles.toggleUpgradesButtonText}>
              {showUpgrades ? "X" : "Upgrades"}
            </Text>
          </TouchableOpacity>
  
          {/* Interface de Upgrades */}
          {showUpgrades && (
            <View style={styles.upgradesContainer}>
              <Text style={styles.upgradesTitle}>Upgrades</Text>
              <View style={styles.upgradeItem}>
                <Text style={styles.upgradeText}>⚔️: Nível {damageLevel}</Text>
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={upgradeDamage}
                  disabled={points < 100}
                >
                  <Text style={styles.upgradeButtonText}>+ (100 pontos)</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.upgradeItem}>
                <Text style={styles.upgradeText}>❤️: Nível {maxHealth}</Text>
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={upgradeHealth}
                  disabled={points < 30}
                >
                  <Text style={styles.upgradeButtonText}>+ (30 pontos)</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.upgradeItem}>
                <Text style={styles.upgradeText}>🛡️: Nível {resistanceLevel}</Text>
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={upgradeResistance}
                  disabled={points < 200}
                >
                  <Text style={styles.upgradeButtonText}>+ (200 pontos)</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
  
          {/* Indicador de Multiplicador de Pontos */}
          {pointsMultiplier > 1 && (
            <Text style={styles.multiplierText}>{pointsMultiplier}x</Text>
          )}
  
          {/* Contador de Tempo, Round e Pontos */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>Round: {round}</Text>
            <Text style={styles.infoText}>
              {isWaiting ? `Próximo Round em: ${timeLeft}s` : `Tempo Restante: ${timeLeft}s`}
            </Text>
            <Text style={styles.infoText}>Pontos: {points}</Text>
          </View>
  
          {/* Controles de Movimento */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={[styles.controlButton, { marginBottom: 5 }]}
              onPressIn={() => setIsMovingUp(true)}
              onPressOut={() => setIsMovingUp(false)}
            >
              <Text style={styles.controlButtonText}>⬆️</Text>
            </TouchableOpacity>
            <View style={styles.controlsRow}>
              <TouchableOpacity
                style={styles.controlButton}
                onPressIn={() => setIsMovingLeft(true)}
                onPressOut={() => setIsMovingLeft(false)}
              >
                <Text style={styles.controlButtonText}>⬅️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.controlButton}
                onPressIn={() => setIsMovingDown(true)}
                onPressOut={() => setIsMovingDown(false)}
              >
                <Text style={styles.controlButtonText}>⬇️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.controlButton}
                onPressIn={() => setIsMovingRight(true)}
                onPressOut={() => setIsMovingRight(false)}
              >
                <Text style={styles.controlButtonText}>➡️</Text>
              </TouchableOpacity>
            </View>
          </View>
  
          {/* Botão de Atirar */}
          <TouchableOpacity style={[styles.shootButton, { height: 60 }]} onPress={shoot}>
            <Text style={styles.shootButtonText}>Atirar 💩</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  character: {
    position: "absolute",
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  characterDamaged: {
    backgroundColor: "rgba(255, 0, 0, 0.3)", // Efeito visual de dano
    borderRadius: 25,
  },
  characterText: { fontSize: 40 },
  weaponText: {
    fontSize: 20,
    position: "absolute",
    right: -20,
    top: 10,
    transform: [{ scaleX: -1 }],
  },
  shot: { position: "absolute", fontSize: 20 },
  enemy: { position: "absolute", fontSize: 30 },
  drop: { position: "absolute", fontSize: 30 },
  controlsContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    alignItems: "center",
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 5, // Reduzir o espaçamento entre os botões
  },
  controlButton: {
    backgroundColor: "#333",
    padding: 10, // Reduzir o padding
    borderRadius: 10,
    width: 50, // Largura fixa para os botões
    height: 50, // Altura fixa para os botões
    justifyContent: "center",
    alignItems: "center",
  },
  controlButtonText: {
    fontSize: 20, // Reduzir o tamanho do emoji
    color: "#fff",
  },
  shootButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#ff4444",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent:"center",
  },
  shootButtonText: { fontSize: 20, color: "#fff" },
  healthBarContainer: {
    width: '100%',
    height: 20,
    backgroundColor: '#ccc',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  healthBar: {
    height: '100%',
    backgroundColor: '#ff4444',
  },
  healthText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    color: '#fff',
    fontSize: 14,
  },
  criticalHealthText: {
    color: 'red',
    fontWeight: 'bold',
  },
  upgradesContainer: {
    position: 'absolute',
    top: 80,
    left: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Fundo semi-transparente
  },
  upgradesTitle: {
    fontSize: 20,
    color: '#000',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  upgradeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  upgradeText: {
    fontSize: 16,
    color: '#000',
  },
  upgradeButton: {
    backgroundColor: '#4CAF50',
    padding: 5,
    borderRadius: 5,
  },
  upgradeButtonText: {
    fontSize: 14,
    color: '#fff',
  },
  infoContainer: {
    position: "absolute",
    top: 20,
    right: 5,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  infoText: {
    fontSize: 16,
    color: "#000",
    marginBottom: 5, // Espaçamento entre os textos
  },
  gameOverContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  gameOverText: {
    fontSize: 40,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 20,
  },
  restartButton: {
    backgroundColor: "#ff4444",
    padding: 10,
    borderRadius: 10,
  },
  restartButtonText: {
    fontSize: 20,
    color: "#fff",
  },
  toggleUpgradesButton: {
    position: 'absolute',
    top: 30,
    left: 10,
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
  },
  toggleUpgradesButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  multiplierText: {
    position: 'absolute',
    top: 76,
    right: 110,
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },startScreenContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 10,
  },
  startButtonText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
  },
  Dev: {
    position: "absolute",
    fontSize: 15,
    bottom: 20,
  }
});