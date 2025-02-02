import axios from "axios";

const RIOT_API_KEY = "RGAPI-47107d8d-b310-4621-be56-39f6da60662d";
const ACCOUNT_URL = "https://asia.api.riotgames.com";
const possibleRegions = ["na1", "euw1", "eun1", "kr", "jp1", "br1", "ru", "tr1", "oc1", "la1", "la2"];

interface RankedData {
  tier: string;
  rank: string;
  leaguePoints: number;
}

async function getPuuid(username: string, tag: string): Promise<string | null> {
  try {
    const response = await axios.get(`${ACCOUNT_URL}/riot/account/v1/accounts/by-riot-id/${username}/${tag}`, {
      headers: { "X-Riot-Token": RIOT_API_KEY },
    });
  
    return response.data.puuid;
  } catch (error: any) {
    console.error("❌ Error fetching PUUID:", error.response?.data || error.message);
    return null;
  }
}

async function findSummonerId(puuid: string): Promise<{ summonerId: string; region: string } | null> {
  for (const region of possibleRegions) {
    try {
      console.log(`🔍 Checking region: ${region.toUpperCase()}...`);
      const BASE_URL = `https://${region}.api.riotgames.com`;
      const response = await axios.get(`${BASE_URL}/lol/summoner/v4/summoners/by-puuid/${puuid}`, {
        headers: { "X-Riot-Token": RIOT_API_KEY },
      });
  
      if (response.data && response.data.id) {
        console.log(`✅ found player in ${region.toUpperCase()} NO NEED TO FUCK UR MOTHER`);
        return { summonerId: response.data.id, region };
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log(`❌ Not found in ${region.toUpperCase()}`);
      } else {
        console.error(`⚠️ Error in ${region.toUpperCase()}:`, error.response?.data || error.message);
      }
    }
  }
  return null;
}

async function getRankedData(summonerId: string, region: string): Promise<RankedData | null> {
  try {
    const BASE_URL = `https://${region}.api.riotgames.com`;
    const response = await axios.get(`${BASE_URL}/lol/league/v4/entries/by-summoner/${summonerId}`, {
      headers: { "X-Riot-Token": RIOT_API_KEY },
    });
  
    const rankedInfo = response.data.find((queue: any) => queue.queueType === "RANKED_SOLO_5x5");
    if (!rankedInfo) return null;
  
    return {
      tier: rankedInfo.tier,
      rank: rankedInfo.rank,
      leaguePoints: rankedInfo.leaguePoints,
    };
  } catch (error: any) {
    console.error("❌ Error fetching ranked data:", error.response?.data || error.message);
    return null;
  }
}

export async function getLeaugeOfLegendsPeakRank(gameTag: string): Promise<string | null> {
  try {
    const [username, tag] = gameTag.split('#');
    if (!username || !tag) {
      console.log("❌ Invalid format. Please use username#tag format");
      return null;
    }

    console.log(`searching for ${username}#${tag}...`);
  
    const puuid = await getPuuid(username, tag);
    if (!puuid) {
      console.log("❌ failed to get PUUID. Check if Riot ID is correct.");
      return null;
    }
  
    const summonerData = await findSummonerId(puuid);
    if (!summonerData) {
      console.log("❌ Summoner not found in any region.");
      return null;
    }
  
    const { summonerId, region } = summonerData;
  
    const rankedData = await getRankedData(summonerId, region);
    if (!rankedData) {
      console.log(`${username} has no ranked data.`);
      return null;
    }
  
    const rankString = `${rankedData.tier} ${rankedData.rank} (${rankedData.leaguePoints} LP)`;
    console.log(
      `✅ Player: ${username}#${tag} \nRegion: ${region.toUpperCase()} \nCurrent Rank: ${rankString}`
    );
  
    return rankString;
  } catch (error: any) {
    console.error('Error fetching rank:', error.message);
    return null;
  }
}
