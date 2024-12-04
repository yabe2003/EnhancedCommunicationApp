
import * as FileSystem from 'expo-file-system';

const ASSEMBLY_AI_API_KEY = 'e52d2718ec764011afe77312b37df4f9';

/**
 * Uploads an MP3 file to AssemblyAI and retrieves the transcription.
 * @param {string} mp3FilePath - The file path to the MP3 file.
 * @returns {Promise<string>} - The transcription text.
 */
export const processRecording = async (mp3FilePath: string): Promise<string> => {
  try {
    console.log('Reading MP3 file for transcription...');
    const audioFile = await FileSystem.readAsStringAsync(mp3FilePath, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Step 1: Upload the file
    console.log('Uploading audio to AssemblyAI...');
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        Authorization: ASSEMBLY_AI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ audio_data: audioFile }),
    });

    const uploadResult = await uploadResponse.json();
    if (!uploadResponse.ok || !uploadResult.upload_url) {
      throw new Error('Failed to upload audio file.');
    }

    // Step 2: Request transcription
    console.log('Requesting transcription...');
    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        Authorization: ASSEMBLY_AI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: uploadResult.upload_url,
        language_code: 'en', // Set the desired language code
      }),
    });

    const transcriptResult = await transcriptResponse.json();
    if (!transcriptResponse.ok || !transcriptResult.id) {
      throw new Error('Failed to initiate transcription.');
    }

    // Step 3: Poll for transcription completion
    console.log('Waiting for transcription to complete...');
    let status = transcriptResult.status;
    let transcriptText = '';
    while (status === 'processing' || status === 'queued') {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
      const pollingResponse = await fetch(
        `https://api.assemblyai.com/v2/transcript/${transcriptResult.id}`,
        {
          method: 'GET',
          headers: {
            Authorization: ASSEMBLY_AI_API_KEY,
          },
        }
      );

      const pollingResult = await pollingResponse.json();
      status = pollingResult.status;

      if (status === 'completed') {
        transcriptText = pollingResult.text;
        break;
      } else if (status === 'failed') {
        throw new Error('Transcription failed.');
      }
    }

    console.log('Transcription completed:', transcriptText);
    return transcriptText;
  } catch (error) {
    console.error('Error during transcription:', error);
    throw error;
  }
};












/*
import { AssemblyAI } from 'assemblyai';
import * as FileSystem from 'expo-file-system';

const client = new AssemblyAI({
  apiKey: 'e52d2718ec764011afe77312b37df4f9',
});

/**
 * Processes an MP3 file and returns the transcription.
 * @param {string} mp3FilePath - The file path to the MP3 file.
 * @returns {Promise<string>} - The transcription text.
 */
/*
export const processRecording = async (mp3FilePath: string): Promise<string> => {
  try {
    console.log('Uploading file to AssemblyAI:', mp3FilePath);

    // Upload the file
    const audioFile = await FileSystem.readAsStringAsync(mp3FilePath, { encoding: FileSystem.EncodingType.Base64 });
    const transcriptData = {
      audio: `data:audio/mp3;base64,${audioFile}`,
      language_code: 'en', // Update language code as needed
    };

    const transcript = await client.transcripts.transcribe(transcriptData);
    console.log('Transcription received:', transcript.text);

// Ensure transcript.text is valid
    if (transcript.text) {
      console.log('Transcription received:', transcript.text);
      return transcript.text;
    } else {
      throw new Error('Transcription text is empty or undefined.');
    }
    } catch (error) {
    console.error('Error transcribing file:', error);
    throw new Error('Failed to transcribe recording. Please try again.');
    }
};


const fs = require('fs');
const path = require('path');

const FILE_URL = '/Users/ant-smalls/Desktop/CPSC_Seminar/TestTSCode/yusuke.mp3';

// Request parameters
const data = {
  audio: FILE_URL,
  language_code: 'ja'
};

const run = async () => {
  try {
    const transcript = await client.transcripts.transcribe(data);

    // Specify the folder and file name
    const folderPath = path.join(__dirname, 'Transcriptions');   
    const fileName = 'transcription.txt';

    // Ensure the folder exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }

    // Write the transcribed text to the file
    const filePath = path.join(folderPath, fileName);
    fs.writeFileSync(filePath, transcript.text);

    console.log(`Transcription saved to ${filePath}`);
  } catch (error) {
    console.error('Error transcribing file:', error);
  }
};

run();
*/






/*
import fs from 'fs';
import path from 'path';

export class AudioTranscriber {
  private client: AssemblyAI;

  constructor(apiKey: string) {
    this.client = new AssemblyAI({ apiKey });
  }

  public async transcribeAudio(filePath: string, languageCode: string = 'ja'): Promise<void> {
    const data = {
      audio: filePath,
      language_code: languageCode,
    };

    try {
      const transcript = await this.client.transcripts.transcribe(data);

      // Specify the folder and file name
      const folderPath = path.join(__dirname, 'Transcriptions');
      const fileName = 'transcription.txt';

      // Ensure the folder exists
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
      }

      // Write the transcribed text to the file
      const transcriptionFilePath = path.join(folderPath, fileName);
      fs.writeFileSync(transcriptionFilePath, transcript.text);

      console.log(`Transcription saved to ${transcriptionFilePath}`);
    } catch (error) {
      console.error('Error transcribing file:', error);
    }
  }
}
*/
