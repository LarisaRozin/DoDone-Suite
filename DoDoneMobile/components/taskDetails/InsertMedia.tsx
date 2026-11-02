/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
/**
 * Insert Media Modal - for inserting images and videos via URL
 * @author GitHub Copilot
 */

import React, { FC, RefObject, useImperativeHandle, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Modal from 'react-native-modal';
import { colors, fonts } from '../../defaultTheme';

type MediaType = 'image' | 'video';

interface IProps {
  onDone: (param: { url: string; mediaType: MediaType }) => void;
  forwardRef: RefObject<any>;
}

export const InsertMediaModal: FC<IProps> = ({ onDone, forwardRef }) => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [url, setURL] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('image');

  const handleURLChange = (text: string) => {
    setURL(text);
  };

  const handleDone = () => {
    setModalVisible(false);
    
    const finalData = {
      url: url.trim(),
      mediaType
    };
    
    // Clear the input field for next time
    setURL('');
    
    // Only proceed if we have a URL
    if (finalData.url) {
      onDone(finalData);
    }
  };

  useImperativeHandle(forwardRef, () => {
    return {
      setModalVisible: (visible: boolean, type: MediaType = 'image') => {
        if (visible) {
          // Clear previous values and set media type when opening modal
          setURL('');
          setMediaType(type);
        }
        setModalVisible(visible);
      },
    };
  }, []);

  const getTitle = () => {
    return mediaType === 'image' ? 'Insert Image' : 'Insert Video';
  };

  const getPlaceholder = () => {
    return mediaType === 'image' 
      ? 'https://example.com/image.jpg' 
      : 'https://youtu.be/VIDEO_ID or direct video URL';
  };

  return (
    <Modal
      animationIn={'slideInUp'}
      animationOut={'slideOutDown'}
      coverScreen={false}
      isVisible={isModalVisible}
      backdropColor={'#000000'}
      backdropOpacity={0.4}
      onBackdropPress={() => setModalVisible(false)}
      style={styles.modalContainer}>
      <View style={styles.dialog}>
        <View style={styles.header}>
          <Text style={styles.title}>{getTitle()}</Text>
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>URL</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor="#B0B0B0"
            placeholder={getPlaceholder()}
            value={url}
            onChangeText={handleURLChange}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            multiline={false}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel={`${mediaType === 'image' ? 'Image' : 'Video'} URL input field`}
            accessibilityHint={`Enter the URL for the ${mediaType} to insert`}
          />
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={() => setModalVisible(false)}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            accessibilityHint="Closes media insertion dialog"
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.confirmButton} 
            onPress={handleDone}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={mediaType === 'image' ? 'Insert Image' : 'Insert Video'}
            accessibilityHint={`Inserts ${mediaType} from provided URL`}
          >
            <Text style={styles.confirmButtonText}>
              {mediaType === 'image' ? 'Insert' : 'Insert'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 0,
  },
  dialog: {
    backgroundColor: colors.backgroundDefault,
    borderRadius: 16,
    marginHorizontal: 20,
    padding: 0,
    elevation: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    minWidth: 320,
  },
  header: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.fredoka,
    fontSize: 18,
    color: colors.textOnPrimary,
    textAlign: 'center',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  inputLabel: {
    fontFamily: fonts.roboto,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: fonts.roboto,
    color: colors.textOnBackground,
    minHeight: 44,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.buttonPrimary,
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  cancelButtonText: {
    fontFamily: fonts.roboto,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  confirmButtonText: {
    fontFamily: fonts.roboto,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textOnPrimary,
    textAlign: 'center',
  },
});
