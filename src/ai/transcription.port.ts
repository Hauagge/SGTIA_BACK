export const TRANSCRIPTION = Symbol('TRANSCRIPTION');

export interface TranscriptionProvider {
  transcribe(audio: Buffer, mimeType: string): Promise<string>;
}
