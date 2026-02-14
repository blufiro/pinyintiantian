
import { GoogleGenAI, Modality } from "@google/genai";

// Audio Decoding Functions
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const length = Math.floor(data.byteLength / 2);
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, length);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

let audioContext: AudioContext | null = null;
const getAudioContext = (): AudioContext => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return audioContext;
};

// Client-side caches
const audioCache = new Map<string, AudioBuffer>();
const explanationCache = new Map<string, string>();

export const geminiService = {
  /**
   * Plays back the provided text using Gemini TTS.
   * Results are cached to prevent redundant API calls.
   */
  speak: async (text: string, isEnglish: boolean = false) => {
    if (!process.env.API_KEY || !text) return;
    
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
        ctx.resume().catch(e => console.error("Failed to resume AudioContext:", e));
    }

    const cacheKey = `${isEnglish ? 'en' : 'zh'}:${text}`;
    
    // Check audio cache
    if (audioCache.has(cacheKey)) {
        const cachedBuffer = audioCache.get(cacheKey);
        if (cachedBuffer) {
            const source = ctx.createBufferSource();
            source.buffer = cachedBuffer;
            source.connect(ctx.destination);
            source.start();
            return;
        }
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: isEnglish ? `Read clearly: ${text}` : `Say clearly in Chinese: ${text}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: isEnglish ? 'Puck' : 'Kore' },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;

        if (base64Audio) {
            if (ctx.state === 'suspended') await ctx.resume();

            const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
            audioCache.set(cacheKey, audioBuffer);

            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            source.start();
        }
    } catch (error) {
        console.error("Gemini TTS Service Error:", error);
    }
  },

  /**
   * Explains a Chinese sentence in English, focusing on the target word.
   * Caches both the text explanation and the resulting audio.
   */
  explainAndSpeak: async (chineseSentence: string, targetWord: string) => {
    if (!process.env.API_KEY) return;

    const cacheKey = `${chineseSentence}:${targetWord}`;
    
    // Check text cache
    let explanationText = explanationCache.get(cacheKey);

    if (!explanationText) {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Explain this Chinese sentence to a young child in simple English: "${chineseSentence}". 
                Highlight the meaning of the specific word "${targetWord}" used in the sentence. 
                Keep it brief: first the translation, then a one-sentence explanation of the words.`,
            });
            explanationText = response.text;
            if (explanationText) {
                explanationCache.set(cacheKey, explanationText);
            }
        } catch (error) {
            console.error("Gemini Explanation Error:", error);
            return;
        }
    }

    if (explanationText) {
        await geminiService.speak(explanationText, true);
    }
  }
};
