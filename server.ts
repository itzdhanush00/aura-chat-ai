import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '25mb' }));

// Server-side Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

function resolveModelAndConfig(body: any) {
  const {
    speedMode = 'ultra-fast',
    systemInstruction,
    enableSearch = false,
    temperature = 0.7,
  } = body;

  // Ultra-fast uses gemini-3.1-flash-lite (fastest possible time to first token, ~1s)
  // Balanced uses gemini-3.8-flash with LOW thinking level
  // Deep uses gemini-3.8-flash with HIGH thinking level
  let model = 'gemini-3.1-flash-lite';
  const config: any = {
    temperature: Math.max(0, Math.min(2, Number(temperature) || 0.7)),
  };

  if (speedMode === 'deep') {
    model = 'gemini-3.8-flash';
    config.thinkingConfig = {
      thinkingLevel: ThinkingLevel.HIGH,
    };
  } else if (speedMode === 'balanced') {
    model = 'gemini-3.8-flash';
    config.thinkingConfig = {
      thinkingLevel: ThinkingLevel.LOW,
    };
  } else {
    // ultra-fast default: gemini-3.1-flash-lite
    model = 'gemini-3.1-flash-lite';
  }

  if (systemInstruction && typeof systemInstruction === 'string' && systemInstruction.trim()) {
    config.systemInstruction = systemInstruction.trim();
  }

  if (enableSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  return { model, config };
}

// Streaming chat endpoint using SSE with zero-buffering headers
app.post('/api/chat/stream', async (req, res) => {
  const startTime = Date.now();
  console.log(`[STREAM START] speedMode: ${req.body?.speedMode || 'default'}`);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Prevents proxy buffering on Cloud Run / Nginx
  res.flushHeaders?.();

  try {
    const { contents } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      res.write(
        `data: ${JSON.stringify({
          error:
            'GEMINI_API_KEY is not configured on the server. Please add it to your environment secrets.',
        })}\n\n`
      );
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    if (!contents || !Array.isArray(contents) || contents.length === 0) {
      res.write(
        `data: ${JSON.stringify({ error: 'Valid conversation contents array is required.' })}\n\n`
      );
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    const { model, config } = resolveModelAndConfig(req.body);

    let stream: any;
    try {
      stream = await ai.models.generateContentStream({
        model,
        contents,
        config,
      });
    } catch (primaryErr: any) {
      console.warn(`Primary model ${model} failed, switching to backup model:`, primaryErr?.message);
      const backupModel = model === 'gemini-3.1-flash-lite' ? 'gemini-3.8-flash' : 'gemini-3.1-flash-lite';
      const backupConfig = { ...config };
      if (backupModel === 'gemini-3.8-flash') {
        backupConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      } else {
        delete backupConfig.thinkingConfig;
      }
      stream = await ai.models.generateContentStream({
        model: backupModel,
        contents,
        config: backupConfig,
      });
    }

    let chunkCount = 0;
    for await (const chunk of stream) {
      chunkCount++;
      if (chunkCount === 1) {
        console.log(`[FIRST CHUNK] emitted in ${Date.now() - startTime}ms`);
      }
      let text = '';
      try {
        text = chunk.text || '';
      } catch {
        text = '';
      }

      // Extract any grounding metadata if Google Search tool returned citations
      let groundingInfo: any = null;
      const candidate = chunk.candidates?.[0];
      if (candidate?.groundingMetadata) {
        const gm = candidate.groundingMetadata;
        groundingInfo = {
          webSearchQueries: gm.webSearchQueries || [],
          groundingChunks:
            gm.groundingChunks
              ?.map((c: any) => ({
                title: c.web?.title || 'Web Source',
                uri: c.web?.uri || '',
              }))
              .filter((c: any) => c.uri) || [],
        };
      }

      if (text || groundingInfo) {
        res.write(
          `data: ${JSON.stringify({
            text,
            grounding: groundingInfo,
          })}\n\n`
        );
        // Flush chunk immediately to client
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
      }
    }

    console.log(`[STREAM COMPLETE] ${chunkCount} chunks in ${Date.now() - startTime}ms`);
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error('Error during Gemini stream:', err);
    res.write(
      `data: ${JSON.stringify({
        error: err?.message || 'An error occurred while generating the response.',
      })}\n\n`
    );
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// Non-streaming fallback endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { contents } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
    }

    const { model, config } = resolveModelAndConfig(req.body);

    let response: any;
    try {
      response = await ai.models.generateContent({
        model,
        contents,
        config,
      });
    } catch (primaryErr: any) {
      console.warn(`Primary model ${model} failed, switching to backup:`, primaryErr?.message);
      const backupModel = model === 'gemini-3.1-flash-lite' ? 'gemini-3.8-flash' : 'gemini-3.1-flash-lite';
      const backupConfig = { ...config };
      if (backupModel === 'gemini-3.8-flash') {
        backupConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      } else {
        delete backupConfig.thinkingConfig;
      }
      response = await ai.models.generateContent({
        model: backupModel,
        contents,
        config: backupConfig,
      });
    }

    let groundingInfo: any = null;
    const candidate = response.candidates?.[0];
    if (candidate?.groundingMetadata) {
      const gm = candidate.groundingMetadata;
      groundingInfo = {
        webSearchQueries: gm.webSearchQueries || [],
        groundingChunks:
          gm.groundingChunks
            ?.map((c: any) => ({
              title: c.web?.title || 'Web Source',
              uri: c.web?.uri || '',
            }))
            .filter((c: any) => c.uri) || [],
      };
    }

    res.json({
      text: response.text || '',
      grounding: groundingInfo,
    });
  } catch (err: any) {
    console.error('Error in /api/chat:', err);
    res.status(500).json({ error: err.message || 'Failed to generate response' });
  }
});

// Text-to-speech endpoint using gemini-3.8-flash-lite-tts
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'Kore' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    const sanitizedText = text.slice(0, 1200);
    const validVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
    const selectedVoice = validVoices.includes(voice) ? voice : 'Kore';

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: sanitizedText,
              speechMetadata: {
                style: 'Natural, expressive, clear conversational tone',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(500).json({ error: 'Failed to generate audio stream' });
    }

    res.json({
      audio: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (err: any) {
    console.error('TTS generation failed:', err);
    res.status(500).json({ error: err.message || 'TTS generation failed' });
  }
});

// Mount Vite middleware for dev or serve static files in production
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
