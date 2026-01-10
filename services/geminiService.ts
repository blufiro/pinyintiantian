
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
  // Gemini returns 16-bit PCM (2 bytes per sample).
  // Ensure we don't try to read more than available even bytes.
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

export const geminiService = {
  speak: async (text: string) => {
    if (!process.env.API_KEY) {
        console.error("API key is not set. Cannot use text-to-speech feature.");
        return;
    }
    
    // CRITICAL: We must resume the AudioContext while still in the synchronous user gesture stack.
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
        ctx.resume().catch(e => console.error("Failed to resume AudioContext:", e));
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Say clearly in Chinese: ${text}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;

        if (base64Audio) {
            // Re-ensure context is running just before playback
            if (ctx.state === 'suspended') {
                await ctx.resume();
            }

            const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                ctx,
                24000,
                1,
            );
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            source.start();
        } else {
            console.warn("Speech generation failed: No audio data returned from the model.");
        }
    } catch (error) {
        console.error("Gemini TTS Service Error:", error);
    }
  },
};
