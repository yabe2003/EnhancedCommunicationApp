import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, Animated, Alert } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export default function App() {
  const [recording, setRecording] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [recordingCount, setRecordingCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadRecordings();
  }, []);

  useEffect(() => {
    if (isRecording) {
      startPulsing();
    } else {
      pulseAnim.setValue(1); // Reset animation
    }
  }, [isRecording]);

  const startPulsing = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.5,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const loadRecordings = async () => {
    const recordingsDir = `${FileSystem.documentDirectory}recordings/`;
    console.log(`Attempting to access recordings directory at: ${recordingsDir}`);
    try {
      const dirInfo = await FileSystem.getInfoAsync(recordingsDir);
      console.log('Directory info:', dirInfo);
      if (!dirInfo.exists) {
        console.log('Recordings directory does not exist. Creating...');
        await FileSystem.makeDirectoryAsync(recordingsDir, { intermediates: true });
        console.log('Recordings directory created successfully.');
        setRecordings([]);
        setRecordingCount(0);
      } else {
        console.log('Recordings directory exists. Reading files...');
        const files = await FileSystem.readDirectoryAsync(recordingsDir);
        console.log('Files found:', files);
        setRecordings(files);
        setRecordingCount(files.length);
      }
    } catch (error) {
      console.error('Error loading recordings:', error);
      Alert.alert('Error', 'An unexpected error occurred while loading recordings.');
    }
  };

  const startRecording = async () => {
    try {
      // Request permissions to access the microphone
      console.log('Requesting microphone permissions...');
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Required', 'Permission to access microphone is required!');
        return;
      }

      // Prepare audio settings
      console.log('Setting audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create a new recording instance
      console.log('Initializing recording...');
      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await newRecording.startAsync();
      console.log('Recording started.');

      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      console.log('Stopping recording...');
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log(`Recording stopped. URI: ${uri}`);

      // Determine the new recording number
      const newCount = recordingCount + 1;
      const fileName = `${newCount}.mp3`;
      const recordingsDir = `${FileSystem.documentDirectory}recordings/`;
      const newPath = recordingsDir + fileName;
      console.log(`Moving recording to: ${newPath}`);

      // Move the file to the recordings directory with the new name
      await FileSystem.moveAsync({
        from: uri,
        to: newPath,
      });
      console.log(`Recording saved as ${fileName}`);

      // Update state
      setRecordings([...recordings, fileName]);
      setRecordingCount(newCount);
      setRecording(null);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
    }
  };

  const getRecordingLines = () => {
    return recordings.map((recording, index) => (
      <View key={index} style={styles.recordingRow}>
        <Text style={styles.recordingText}>{recording}</Text>
      </View>
    ));
  };

  const clearRecordings = async () => {
    try {
      const recordingsDir = `${FileSystem.documentDirectory}recordings/`;
      console.log(`Clearing all recordings in: ${recordingsDir}`);
      // Delete all files in the recordings directory
      for (const recording of recordings) {
        console.log(`Deleting: ${recording}`);
        await FileSystem.deleteAsync(`${recordingsDir}${recording}`, { idempotent: true });
      }
      setRecordings([]);
      setRecordingCount(0);
      console.log('All recordings cleared.');
      Alert.alert('Success', 'All recordings have been cleared.');
    } catch (error) {
      console.error('Failed to clear recordings:', error);
      Alert.alert('Error', 'Failed to clear recordings. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      {isRecording && (
        <Animated.View
          style={[
            styles.recordingIndicator,
            {
              transform: [{ scale: pulseAnim }],
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.5],
                outputRange: [1, 0.5],
              }),
            },
          ]}
        />
      )}
      <Button
        title={recording ? 'Stop Recording' : 'Start Recording'}
        onPress={recording ? stopRecording : startRecording}
      />
      {getRecordingLines()}
      {recordings.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Button title="Clear Recordings" onPress={clearRecordings} color="red" />
        </View>
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  recordingIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'red',
    marginBottom: 20,
  },
  recordingRow: {
    marginTop: 10,
  },
  recordingText: {
    fontSize: 16,
  },
});