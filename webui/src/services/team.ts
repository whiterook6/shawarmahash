export const TeamService = {
  getTeams: async () => {
    const response = await fetch("/teams");
    return response.json();
  },
}