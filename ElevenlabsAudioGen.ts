
import { ElevenLabsClient } from "elevenlabs";
import { createReadStream, createWriteStream, readFileSync } from "fs";
import { v4 as uuid } from "uuid";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

const client = new ElevenLabsClient({
  apiKey: ELEVENLABS_API_KEY,
});

export const createAudioFileFromFile = async (
  filePath: string
): Promise<string> => {
  return new Promise<string>(async (resolve, reject) => {
    try {
      //Read the file content 
      const text = readFileSync(filePath,"utf-8");

      //Generate the audio
      const audio = await client.generate({
        voice: "Rachel",
        model_id: "eleven_turbo_v2_5",
        text,
      });

      //Create audio file in folder with random name and write the audio to the file
      const fileName = `/Users/ant-smalls/Desktop/CPSC_Seminar/TestTSCode/GeneratedElevenlabsAudio/${uuid()}.mp3`;
      const fileStream = createWriteStream(fileName);

      audio.pipe(fileStream);

      fileStream.on("finish", () => resolve(fileName)); // Resolve with the fileName
      fileStream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
};


(async () => {
    try {
      const audioFile = await createAudioFileFromFile("/Users/ant-smalls/Desktop/CPSC_Seminar/TestTSCode/Transcriptions/transcription.txt"); // Pass the file path
      console.log(`Audio file saved as: ${audioFile}`);
    } catch (error) {
      console.error("Error generating audio:", error);
    }
  }) ();

  




  
/*
import { v4 as uuid } from "uuid";
import * as dotenv from "dotenv";
import path from 'path';

dotenv.config();

export class AudioGenerator {
  private client: ElevenLabsClient;

  constructor(apiKey: string) {
    this.client = new ElevenLabsClient({ apiKey });
  }

  public async generateAudio(filePath: string, voice: string = 'Rachel', modelId: string = 'eleven_turbo_v2_5'): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      try {
        // Read the file content
        const text = readFileSync(filePath, 'utf-8');

        // Generate the audio
        const audio = await this.client.generate({
          voice,
          model_id: modelId,
          text,
        });

        // Create audio file in folder with random name and write the audio to the file
        const outputFolder = path.join(__dirname, 'GeneratedElevenlabsAudio');
        const outputFileName = `${uuid()}.mp3`;
        const outputFilePath = path.join(outputFolder, outputFileName);

        const fileStream = createWriteStream(outputFilePath);

        audio.pipe(fileStream);

        fileStream.on('finish', () => resolve(outputFilePath)); // Resolve with the file path
        fileStream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }
}
*/

