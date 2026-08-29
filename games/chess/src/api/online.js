const API_BASE_URL = "http://localhost:3000/api";

export async function createOnlineGame(playerName) {
  const response = await fetch(`${API_BASE_URL}/games`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      playerName
    })
  });

  if (!response.ok) {
    throw new Error("Unable to create online game");
  }

  return response.json();
}

export async function joinOnlineGame(gameId, playerName) {
  const response = await fetch(
    `${API_BASE_URL}/games/${gameId}/join`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        playerName
      })
    }
  );

  if (!response.ok) {
    throw new Error("Unable to join game");
  }

  return response.json();
}
