import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Animated, Alert, Dimensions } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

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
    try {
      const dirInfo = await FileSystem.getInfoAsync(recordingsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(recordingsDir, { intermediates: true });
        setRecordings([]);
        setRecordingCount(0);
      } else {
        const files = await FileSystem.readDirectoryAsync(recordingsDir);
        setRecordings(files);
        setRecordingCount(files.length);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred while loading recordings.');
    }
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Required', 'Permission to access microphone is required!');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await newRecording.startAsync();

      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      const newCount = recordingCount + 1;
      const fileName = `${newCount}.mp3`;
      const recordingsDir = `${FileSystem.documentDirectory}recordings/`;
      const newPath = recordingsDir + fileName;

      await FileSystem.moveAsync({
        from: uri,
        to: newPath,
      });

      setRecordings([...recordings, fileName]);
      setRecordingCount(newCount);
      setRecording(null);
    } catch (error) {
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
      for (const recording of recordings) {
        await FileSystem.deleteAsync(`${recordingsDir}${recording}`, { idempotent: true });
      }
      setRecordings([]);
      setRecordingCount(0);
      Alert.alert('Success', 'All recordings have been cleared.');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear recordings. Please try again.');
    }
  };

  return (
    <LinearGradient
      colors={['#3f5e7c', '#574c75', '#324168']}
      style={styles.container}
    >
      {/* Placeholder Text Box for Transcription */}
      <View style={styles.placeholderBox}>
        <Text style={styles.placeholderText}></Text>
      </View>

      {/* Recording Indicator */}
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

      {/* Start/Stop Recording Button */}
      <TouchableOpacity
        style={styles.recordButton}
        onPress={recording ? stopRecording : startRecording}
      >
        <Text style={styles.buttonText}>{recording ? 'Stop Recording' : 'Start Recording'}</Text>
      </TouchableOpacity>

      {/* List of Recordings */}
      <View style={styles.recordingsContainer}>
        {getRecordingLines()}
      </View>

      {/* Clear Recordings Button */}
      {recordings.length > 0 && (
        <TouchableOpacity style={styles.clearButton} onPress={clearRecordings}>
          <Text style={styles.buttonText}>Clear Recordings</Text>
        </TouchableOpacity>
      )}

      <StatusBar style="auto" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  recordingsContainer: {
    width: '100%',
    marginTop: 20,
    alignItems: 'center',
  },
  recordingRow: {
    marginTop: 10,
  },
  recordingText: {
    fontSize: 16,
    color: '#fff', // White text for recordings
  },
  recordButton: {
    backgroundColor: '#3f5e7c', // Matching one of the gradient colors
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50, // Positioning the button lower
    width: '80%',
  },
  clearButton: {
    backgroundColor: '#574c75', // Matching one of the gradient colors
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    width: '60%',
  },
  buttonText: {
    color: '#fff', // White text for buttons
    fontSize: 16,
    fontWeight: 'bold',
  },
  placeholderBox: {
    width: '80%',
    height: 100,
    borderWidth: 2,
    borderColor: '#fff', // White borders
    borderRadius: 10,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 16,
  },
});