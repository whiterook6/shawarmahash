export const getBlocks = async () => {
  const response = await fetch("http://localhost:8080/api/blocks/recent");
  if (!response.ok){
    const body = await response.text();
    throw new Error(body);
  }
  return response.json();
}

export const getTeams = async () => {
  const response = await fetch("http://localhost:8080/api/teams");
  if (!response.ok){
    const body = await response.text();
    throw new Error(body);
  }
  return response.json();
}

export const getPlayers = async () => {
  const response = await fetch("http://localhost:8080/api/players");
  if (!response.ok){
    const body = await response.text();
    throw new Error(body);
  }
  return response.json();
}

export const submitBlock = async (block) => {
  const response = await fetch("http://localhost:8080/api/blocks", {
    body: JSON.stringify(block),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });
  if (!response.ok){
    const body = await response.text();
    throw new Error(body);
  }
}