/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
/**
 *
 * @author wxik
 * @sine 2020-07-07 20:21
 */

import React, { FC, RefObject, useImperativeHandle, useRef, useState } from 'react';
import { BackHandler, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Modal from 'react-native-modal';
import { colors, fonts } from '../../defaultTheme';

interface IProps {
  onDone: (param: { title?: string; url?: string }) => void;
  forwardRef: RefObject<any>;
}

export const InsertLinkModal: FC<IProps> = ({ onDone, forwardRef }) => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setURL] = useState('');
  const dataRef = useRef<{ title?: string; url?: string }>({});

  const handleTitleChange = (text: string) => {
    setTitle(text);
    dataRef.current.title = text;
  };

  const handleURLChange = (text: string) => {
    setURL(text);
    dataRef.current.url = text;
  };

  const handleDone = () => {
    setModalVisible(false);
    
    // Use URL as title if no title is provided
    const finalData = {
      title: title.trim() || url.trim() || '',
      url: url.trim() || ''
    };
    
    // Clear the input fields for next time
    setTitle('');
    setURL('');
    dataRef.current = {};
    
    // Only proceed if we have a URL
    if (finalData.url) {
      onDone(finalData);
    }
  };

  useImperativeHandle(forwardRef, () => {
    return {
      setModalVisible: (visible: boolean) => {
        if (visible) {
          // Clear previous values when opening modal
          setTitle('');
          setURL('');
          dataRef.current = {};
        }
        setModalVisible(visible);
      },
    };
  }, []);

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
          <Text style={styles.title}>Insert Link</Text>
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Link Title</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor="#B0B0B0"
            placeholder="Enter link title (optional)"
            value={title}
            onChangeText={handleTitleChange}
            multiline={false}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel="Link title input field"
            accessibilityHint="Enter optional title for the link"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>URL</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor="#B0B0B0"
            placeholder="https://example.com"
            value={url}
            onChangeText={handleURLChange}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            multiline={false}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel="URL input field"
            accessibilityHint="Enter the web address for the link"
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
            accessibilityHint="Closes link insertion dialog"
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.confirmButton} 
            onPress={handleDone}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Insert Link"
            accessibilityHint="Inserts the link with provided URL and title"
          >
            <Text style={styles.confirmButtonText}>Insert Link</Text>
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.buttonPrimary,
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  cancelButtonText: {
    fontFamily: fonts.roboto,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  confirmButtonText: {
    fontFamily: fonts.roboto,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textOnPrimary,
  },
});