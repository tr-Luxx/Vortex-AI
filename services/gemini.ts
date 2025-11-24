
import { GoogleGenAI, Chat, GenerateContentResponse, LiveServerMessage, Modality, Blob, Content } from "@google/genai";
import { GroundingSource, Message, MessageRole } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface StreamResponseChunk {
  text: string;
  sources?: GroundingSource[];
}

/**
 * Creates a new chat session configured for search.
 * Optionally accepts history to restore context and model config.
 */
export const createSearchChat = (
  history: Message[] = [], 
  modelName: string = 'gemini-2.5-flash'
): Chat => {
  // Map internal Message type to SDK Content type
  const sdkHistory: Content[] = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }]
  }));

  return ai.chats.create({
    model: modelName, 
    history: sdkHistory,
    config: {
      tools: [{ googleSearch: {} }], // Enable Search Grounding
      systemInstruction: "You are Vortex, a smart and helpful assistant. Keep your answers brief, conversational, and engaging.",
    },
  });
};

/**
 * Sends a message to the chat and streams the response.
 * Extracts grounding metadata (sources) from the chunks.
 */
export const streamMessage = async (
  chat: Chat,
  message: string,
  onChunk: (chunk: StreamResponseChunk) => void
): Promise<void> => {
  
  try {
    const resultStream = await chat.sendMessageStream({ message });
    
    for await (const chunk of resultStream) {
      const c = chunk as GenerateContentResponse;
      const text = c.text || '';
      
      // Extract sources from grounding metadata if available
      let sources: GroundingSource[] | undefined;
      
      // The SDK structure for grounding in chunks usually appears in groundingMetadata
      const groundingChunks = c.candidates?.[0]?.groundingMetadata?.groundingChunks;
      
      if (groundingChunks) {
        sources = groundingChunks
          .map((gc: any) => {
            if (gc.web) {
              return {
                title: gc.web.title || 'Web Source',
                uri: gc.web.uri || '#',
              };
            }
            return null;
          })
          .filter((s: any): s is GroundingSource => s !== null);
      }

      onChunk({ text, sources });
    }
  } catch (error) {
    console.error("Error streaming message:", error);
    onChunk({ text: "\n\n*Sorry, I encountered an error while searching.*" });
  }
};

/**
 * Generates an image based on the prompt.
 */
export const generateImage = async (prompt: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: {
                imageConfig: {
                    aspectRatio: "1:1"
                }
            }
        });

        // Iterate through parts to find the image
        const candidate = response.candidates?.[0];
        if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    const mimeType = part.inlineData.mimeType || 'image/png';
                    return `data:${mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        return null;
    } catch (error) {
        console.error("Image generation error:", error);
        return null;
    }
};

/* --- LIVE API HELPERS --- */

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    // The supported audio MIME type is 'audio/pcm'. Do not use other types.
    mimeType: 'audio/pcm;rate=16000',
  };
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
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
  const dataInt16 = new Int16Array(data.buffer);
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

/* --- LIVE CLIENT --- */

export class GeminiLiveClient {
  private inputContext: AudioContext | null = null;
  private outputContext: AudioContext | null = null;
  private inputNode: ScriptProcessorNode | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private outputNode: GainNode | null = null;
  private sources: Set<AudioBufferSourceNode> = new Set();
  private nextStartTime: number = 0;
  private session: any = null; // Holds the LiveSession object

  constructor(private onVolume?: (vol: number) => void) {}

  async connect(voiceName: string = 'Zephyr') {
    this.inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    if (this.inputContext?.state === 'suspended') await this.inputContext.resume();
    if (this.outputContext?.state === 'suspended') await this.outputContext.resume();

    this.outputNode = this.outputContext!.createGain();
    this.outputNode.connect(this.outputContext!.destination);

    // Get user media with advanced audio constraints for barge-in
    const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
        } 
    });

    // Connect to Gemini Live
    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => {
          if (!this.inputContext) return;
          console.log('Gemini Live Connected');
          
          // Setup Input Stream
          this.inputSource = this.inputContext.createMediaStreamSource(stream);
          this.inputNode = this.inputContext.createScriptProcessor(4096, 1, 1);
          
          this.inputNode.onaudioprocess = (audioProcessingEvent) => {
            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
            
            // Calculate volume for visualization
            if (this.onVolume) {
                let sum = 0;
                for (let i = 0; i < inputData.length; i++) {
                    sum += inputData[i] * inputData[i];
                }
                const rms = Math.sqrt(sum / inputData.length);
                this.onVolume(rms);
            }

            const pcmBlob = createBlob(inputData);
            sessionPromise.then((session) => {
              session.sendRealtimeInput({ media: pcmBlob });
            });
          };

          this.inputSource.connect(this.inputNode);
          this.inputNode.connect(this.inputContext.destination);
        },
        onmessage: async (message: LiveServerMessage) => {
          const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          
          if (base64EncodedAudioString && this.outputContext && this.outputNode) {
            this.nextStartTime = Math.max(this.nextStartTime, this.outputContext.currentTime);
            
            const audioBuffer = await decodeAudioData(
              decode(base64EncodedAudioString),
              this.outputContext,
              24000,
              1
            );
            
            const source = this.outputContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.outputNode);
            
            source.addEventListener('ended', () => {
              this.sources.delete(source);
            });

            source.start(this.nextStartTime);
            this.nextStartTime += audioBuffer.duration;
            this.sources.add(source);
          }

          const interrupted = message.serverContent?.interrupted;
          if (interrupted) {
            this.stopAudioPlayback();
          }
        },
        onerror: (e: ErrorEvent) => {
          console.error('Gemini Live Error', e);
        },
        onclose: (e: CloseEvent) => {
          console.log('Gemini Live Closed', e);
        }
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
        },
        systemInstruction: 'You are Vortex, a smart and helpful assistant. Keep your answers brief, conversational, and engaging.',
      },
    });

    this.session = await sessionPromise;
  }

  private stopAudioPlayback() {
    for (const source of this.sources.values()) {
      source.stop();
      source.disconnect();
    }
    this.sources.clear();
    this.nextStartTime = 0;
  }
  
  // Exposed for manual interruption
  interrupt() {
    this.stopAudioPlayback();
  }

  disconnect() {
    if (this.session) {
      // cleanup logic
    }

    this.stopAudioPlayback();

    if (this.inputSource) {
        this.inputSource.disconnect();
        this.inputSource = null;
    }
    if (this.inputNode) {
        this.inputNode.disconnect();
        this.inputNode.onaudioprocess = null;
        this.inputNode = null;
    }
    
    if (this.inputContext) {
        this.inputContext.close();
        this.inputContext = null;
    }
    if (this.outputContext) {
        this.outputContext.close();
        this.outputContext = null;
    }
  }
}
