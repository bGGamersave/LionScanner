import express from "express";
import path from "path";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const FALLBACK_QUOTES: Record<string, { name: string; price: number; change_24h: number; volume: number; market_cap: number; high: number; low: number }> = {
  TSLA: { name: "Tesla, Inc.", price: 185.50, change_24h: 1.45, volume: 85400000, market_cap: 580000000000, high: 188.20, low: 183.10 },
  AAPL: { name: "Apple Inc.", price: 212.40, change_24h: -0.35, volume: 52100000, market_cap: 3250000000000, high: 214.50, low: 211.20 },
  NVDA: { name: "NVIDIA Corporation", price: 127.30, change_24h: 3.22, volume: 110400000, market_cap: 3100000000000, high: 129.80, low: 124.50 },
  MSFT: { name: "Microsoft Corporation", price: 422.10, change_24h: 0.12, volume: 22800000, market_cap: 3150000000000, high: 425.30, low: 419.80 },
  AMZN: { name: "Amazon.com, Inc.", price: 189.20, change_24h: -0.85, volume: 38400000, market_cap: 1950000000000, high: 191.40, low: 187.60 },
  META: { name: "Meta Platforms, Inc.", price: 498.50, change_24h: 2.15, volume: 19500000, market_cap: 1250000000000, high: 502.40, low: 491.20 },
  GOOGL: { name: "Alphabet Inc.", price: 178.40, change_24h: 0.45, volume: 25400000, market_cap: 2200000000000, high: 180.10, low: 176.50 },
  GOLD: { name: "Gold Spot", price: 2350.60, change_24h: 0.85, volume: 12500000000, market_cap: 15500000000000, high: 2365.20, low: 2338.40 },
  XAU: { name: "Gold Spot", price: 2350.60, change_24h: 0.85, volume: 12500000000, market_cap: 15500000000000, high: 2365.20, low: 2338.40 },
  SILVER: { name: "Silver Spot", price: 29.40, change_24h: 1.15, volume: 2400000000, market_cap: 1400000000000, high: 29.85, low: 28.90 },
  XAG: { name: "Silver Spot", price: 29.40, change_24h: 1.15, volume: 2400000000, market_cap: 1400000000000, high: 29.85, low: 28.90 },
  PLATINUM: { name: "Platinum Spot", price: 980.20, change_24h: -0.45, volume: 180000000, market_cap: 280000000000, high: 992.50, low: 974.10 },
  XPT: { name: "Platinum Spot", price: 980.20, change_24h: -0.45, volume: 180000000, market_cap: 280000000000, high: 992.50, low: 974.10 },
  PALLADIUM: { name: "Palladium Spot", price: 940.50, change_24h: -1.25, volume: 95000000, market_cap: 110000000000, high: 960.00, low: 932.40 },
  XPD: { name: "Palladium Spot", price: 940.50, change_24h: -1.25, volume: 95000000, market_cap: 110000000000, high: 960.00, low: 932.40 },
  COPPER: { name: "Copper Spot", price: 4.45, change_24h: 0.65, volume: 45000000, market_cap: 85000000000, high: 4.52, low: 4.41 }
};

const SYMBOL_TO_CG_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  XRP: "ripple",
  ADA: "cardano",
  DOT: "polkadot",
  DOGE: "dogecoin",
  SHIB: "shiba-inu",
  LINK: "chainlink",
  LTC: "litecoin",
  TRX: "tron",
  AVAX: "avalanche-2",
  MATIC: "matic-network",
  POL: "matic-network",
  ATOM: "cosmos",
  UNI: "uniswap",
  ETC: "ethereum-classic",
  BCH: "bitcoin-cash",
  XLM: "stellar",
  NEAR: "near",
  FTM: "fantom",
  ALGO: "algorand",
  LDO: "lido-dao",
  ICP: "internet-computer",
  FIL: "filecoin",
  APT: "aptos",
  ARB: "arbitrum",
  OP: "optimism",
  SUI: "sui",
  PEPE: "pepe",
  WIF: "dogwifhat",
  RNDR: "render-token",
  RENDER: "render-token",
  FLOKI: "floki",
  STX: "blockstack",
  GRT: "the-graph",
  THETA: "theta-token",
  IMX: "immutable-x",
  VET: "vechain",
  TON: "the-open-network",
  BNB: "binancecoin",
  USDT: "tether",
  USDC: "usd-coin",
  DAI: "dai",
  WETH: "weth",
  WBTC: "wrapped-bitcoin",
  BONK: "bonk",
  JUP: "jupiter-exchange-solana",
  PYTH: "pyth-network",
  ONDO: "ondo-finance",
  FET: "fetch-ai",
  AGIX: "singularitynet",
  OCEAN: "ocean-protocol",
  RUNE: "thorchain",
  INJ: "injective-protocol",
  TIA: "celestia",
  SEI: "sei-network",
  SATS: "sats-bcs",
  ORDI: "ordi",
  OPSEC: "opsec",
  TAO: "bittensor",
  AAVE: "aave",
  MKR: "maker",
  LRC: "loopring",
  EGLD: "elrond-erd-2",
  FLOW: "flow",
  SAND: "the-sandbox",
  MANA: "decentraland",
  AXS: "axie-infinity",
  GALA: "gala",
  CHZ: "chiliz",
  MINA: "mina-protocol",
  KAS: "kaspa",
  GOLD: "pax-gold",
  XAU: "pax-gold",
  PAXG: "pax-gold",
  SILVER: "kinesis-silver",
  XAG: "kinesis-silver",
  KAG: "kinesis-silver"
};

// Helper to fetch data from CoinGecko API supporting both Demo and Pro keys, or public API if no key
async function fetchFromCoinGecko(endpoint: string, params: Record<string, any> = {}) {
  const apiKey = process.env.COINGECKO_API_KEY || process.env.CMC_API_KEY;
  let baseUrl = "https://api.coingecko.com/api/v3";
  const headers: Record<string, string> = {};

  if (apiKey) {
    const isPro = process.env.COINGECKO_IS_PRO === "true";
    if (isPro) {
      baseUrl = "https://pro-api.coingecko.com/api/v3";
      headers["x-cg-pro-api-key"] = apiKey;
    } else {
      baseUrl = "https://demo-api.coingecko.com/api/v3";
      headers["x-cg-demo-api-key"] = apiKey;
    }
  }

  const response = await axios.get(`${baseUrl}${endpoint}`, {
    headers,
    params,
  });
  return response.data;
}

async function getCoinGeckoId(symbol: string): Promise<string | null> {
  const upperSymbol = symbol.toUpperCase();
  if (SYMBOL_TO_CG_ID[upperSymbol]) {
    return SYMBOL_TO_CG_ID[upperSymbol];
  }

  try {
    const searchResult = await fetchFromCoinGecko("/search", { query: upperSymbol });
    if (searchResult && searchResult.coins && searchResult.coins.length > 0) {
      const exactMatch = searchResult.coins.find(
        (c: any) => c.symbol.toUpperCase() === upperSymbol
      );
      if (exactMatch) {
        return exactMatch.id;
      }
      return searchResult.coins[0].id;
    }
  } catch (error) {
    console.error(`Error searching CoinGecko ID for symbol ${symbol}:`, error);
  }

  return symbol.toLowerCase();
}

const getCryptoQuoteDeclaration = {
  name: "get_crypto_quote",
  description: "Get the latest market quote for a cryptocurrency using its ticker symbol from CoinGecko. Use this whenever the user asks about a top 300 cryptocurrency.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      symbol: {
        type: Type.STRING,
        description: "The uppercase ticker symbol of the currency, e.g., BTC, ETH, SOL",
      },
    },
    required: ["symbol"],
  },
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' })); // Increase body size limit for base64 screenshots
  app.use(cors());

  // Secure Server-side Route for Gemini Chat (using @google/genai recommended standards)
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { contents } = req.body;
      if (!contents || !Array.isArray(contents)) {
        return res.status(400).json({ error: "contents array is required" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ 
          error: "GEMINI_API_KEY is not configured on the server. Please add it via Settings > Secrets." 
        });
      }

      // Initialize Server-side GoogleGenAI Client with User-Agent for telemetry
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const aiConfig = {
        systemInstruction: "You are the Lions Trading Swarm AI. If the user asks about a token in the CoinGecko top 300, LIMIT your response STRICTLY to stating whether it is a good time to BUY, SELL, LONG, or SHORT for the day, with a 1-2 sentence justification based on current market sentiment and any live data you fetched. Be decisive. If the user answers your clarifying questions about their strategy, acknowledge them and tailor future advice. Otherwise, adhere strictly to the prompts and restrictions.",
        tools: [{ functionDeclarations: [getCryptoQuoteDeclaration] }],
      };

      // Model choice: 'gemini-3.5-flash' on server side for blazing-fast responses and standard compliance
      let response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: aiConfig
      });

      // Loop execution for server-side function calling
      let loopCount = 0;
      const localContents = [...contents];

      while (response.functionCalls && response.functionCalls.length > 0 && loopCount < 5) {
        loopCount++;
        const functionCall = response.functionCalls[0];
        
        // Add model's request to contents
        if (response.candidates?.[0]?.content) {
          localContents.push(response.candidates[0].content);
        }

        let apiResult = {};
        if (functionCall.name === "get_crypto_quote") {
          const { symbol } = functionCall.args as any;
          try {
            const upperSymbol = symbol.toUpperCase();
            if (FALLBACK_QUOTES[upperSymbol]) {
              const fallback = FALLBACK_QUOTES[upperSymbol];
              apiResult = {
                data: {
                  [upperSymbol]: {
                    id: upperSymbol.toLowerCase(),
                    name: fallback.name,
                    symbol: upperSymbol,
                    quote: {
                      USD: {
                        price: fallback.price,
                        volume_24h: fallback.volume,
                        percent_change_24h: fallback.change_24h,
                        market_cap: fallback.market_cap,
                        high_24h: fallback.high,
                        low_24h: fallback.low
                      }
                    }
                  }
                }
              };
            } else {
              const cgApiKey = process.env.COINGECKO_API_KEY || process.env.CMC_API_KEY;
              if (!cgApiKey) {
                apiResult = { error: "COINGECKO_API_KEY is not configured on the server" };
              } else {
                const coinId = await getCoinGeckoId(upperSymbol);
                if (!coinId) {
                  apiResult = { error: `Could not find CoinGecko ID for symbol ${upperSymbol}` };
                } else {
                  const coinData = await fetchFromCoinGecko(`/coins/${coinId}`, {
                    localization: "false",
                    tickers: "false",
                    market_data: "true",
                    community_data: "false",
                    developer_data: "false",
                    sparkline: "false"
                  });

                  apiResult = {
                    data: {
                      [upperSymbol]: {
                        id: coinId,
                        name: coinData.name,
                        symbol: upperSymbol,
                        quote: {
                          USD: {
                            price: coinData.market_data?.current_price?.usd || 0,
                            volume_24h: coinData.market_data?.total_volume?.usd || 0,
                            percent_change_24h: coinData.market_data?.price_change_percentage_24h || 0,
                            market_cap: coinData.market_data?.market_cap?.usd || 0,
                            high_24h: coinData.market_data?.high_24h?.usd || 0,
                            low_24h: coinData.market_data?.low_24h?.usd || 0
                          }
                        }
                      }
                    }
                  };
                }
              }
            }
          } catch (err: any) {
            apiResult = { error: err.response?.data || err.message || "Failed to fetch CoinGecko quote on backend" };
          }
        } else {
          apiResult = { error: "Unknown function called" };
        }

        const functionResponsePart = {
          functionResponse: {
            name: functionCall.name,
            response: apiResult
          }
        };

        localContents.push({ role: "user", parts: [functionResponsePart] });

        response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: localContents,
          config: aiConfig
        });
      }

      res.json({
        text: response.text,
        candidates: response.candidates,
        history: localContents.concat(response.candidates?.[0]?.content ? [response.candidates[0].content] : [])
      });

    } catch (error: any) {
      console.error("Gemini API Error on Server:", error.message || error);
      res.status(500).json({ error: error.message || "Failed to query Swarm AI on server" });
    }
  });

  // API Route for CoinGecko Quote
  app.get("/api/coingecko/quote", async (req, res) => {
    try {
      const { symbol } = req.query;
      if (!symbol || typeof symbol !== "string") {
        return res.status(400).json({ error: "Symbol is required" });
      }

      const upperSymbol = symbol.toUpperCase();
      if (FALLBACK_QUOTES[upperSymbol]) {
        const fallback = FALLBACK_QUOTES[upperSymbol];
        return res.json({
          data: {
            [upperSymbol]: {
              id: upperSymbol.toLowerCase(),
              name: fallback.name,
              symbol: upperSymbol,
              quote: {
                USD: {
                  price: fallback.price,
                  volume_24h: fallback.volume,
                  percent_change_24h: fallback.change_24h,
                  market_cap: fallback.market_cap,
                  high_24h: fallback.high,
                  low_24h: fallback.low
                }
              }
            }
          }
        });
      }

      const apiKey = process.env.COINGECKO_API_KEY || process.env.CMC_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "COINGECKO_API_KEY is not configured on the server" });
      }

      const coinId = await getCoinGeckoId(upperSymbol);
      if (!coinId) {
        return res.status(404).json({ error: `Could not find CoinGecko ID for symbol ${upperSymbol}` });
      }

      const coinData = await fetchFromCoinGecko(`/coins/${coinId}`, {
        localization: "false",
        tickers: "false",
        market_data: "true",
        community_data: "false",
        developer_data: "false",
        sparkline: "false"
      });

      const formattedResult = {
        data: {
          [upperSymbol]: {
            id: coinId,
            name: coinData.name,
            symbol: upperSymbol,
            quote: {
              USD: {
                price: coinData.market_data?.current_price?.usd || 0,
                volume_24h: coinData.market_data?.total_volume?.usd || 0,
                percent_change_24h: coinData.market_data?.price_change_percentage_24h || 0,
                market_cap: coinData.market_data?.market_cap?.usd || 0,
                high_24h: coinData.market_data?.high_24h?.usd || 0,
                low_24h: coinData.market_data?.low_24h?.usd || 0
              }
            }
          }
        }
      };

      res.json(formattedResult);
    } catch (error: any) {
      console.error("Error fetching CoinGecko quote:", error.response?.data || error.message);
      res.status(error.response?.status || 500).json(error.response?.data || { error: "Failed to fetch CoinGecko quote" });
    }
  });

  // Backward compatible route mapping for CMC queries backed by CoinGecko
  app.get("/api/cmc/quote", async (req, res) => {
    try {
      const { symbol } = req.query;
      if (!symbol || typeof symbol !== "string") {
        return res.status(400).json({ error: "Symbol is required" });
      }

      const upperSymbol = symbol.toUpperCase();
      if (FALLBACK_QUOTES[upperSymbol]) {
        const fallback = FALLBACK_QUOTES[upperSymbol];
        return res.json({
          data: {
            [upperSymbol]: {
              id: upperSymbol.toLowerCase(),
              name: fallback.name,
              symbol: upperSymbol,
              quote: {
                USD: {
                  price: fallback.price,
                  volume_24h: fallback.volume,
                  percent_change_24h: fallback.change_24h,
                  market_cap: fallback.market_cap,
                  high_24h: fallback.high,
                  low_24h: fallback.low
                }
              }
            }
          }
        });
      }

      const apiKey = process.env.COINGECKO_API_KEY || process.env.CMC_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "COINGECKO_API_KEY is not configured on the server" });
      }

      const coinId = await getCoinGeckoId(upperSymbol);
      if (!coinId) {
        return res.status(404).json({ error: `Could not find CoinGecko ID for symbol ${upperSymbol}` });
      }

      const coinData = await fetchFromCoinGecko(`/coins/${coinId}`, {
        localization: "false",
        tickers: "false",
        market_data: "true",
        community_data: "false",
        developer_data: "false",
        sparkline: "false"
      });

      const formattedResult = {
        data: {
          [upperSymbol]: {
            id: coinId,
            name: coinData.name,
            symbol: upperSymbol,
            quote: {
              USD: {
                price: coinData.market_data?.current_price?.usd || 0,
                volume_24h: coinData.market_data?.total_volume?.usd || 0,
                percent_change_24h: coinData.market_data?.price_change_percentage_24h || 0,
                market_cap: coinData.market_data?.market_cap?.usd || 0,
                high_24h: coinData.market_data?.high_24h?.usd || 0,
                low_24h: coinData.market_data?.low_24h?.usd || 0
              }
            }
          }
        }
      };

      res.json(formattedResult);
    } catch (error: any) {
      console.error("Error fetching CoinGecko fallback quote:", error.response?.data || error.message);
      res.status(error.response?.status || 500).json(error.response?.data || { error: "Failed to fetch quote" });
    }
  });

  // Vite middleware for development (imported dynamically to avoid production startup crashes)
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
