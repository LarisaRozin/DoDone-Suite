/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
/* eslint-disable react/no-unstable-nested-components,react-native/no-inline-styles*/
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Appearance,
  ColorSchemeName,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  Linking,
  View,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { FAB, ActivityIndicator } from 'react-native-paper';
import { Snackbar } from '../components/StyledText';
import { Text } from '../components/StyledText';
import { actions, FONT_SIZE, RichEditor, RichToolbar } from 'react-native-pell-rich-editor';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { InsertLinkModal } from '../components/taskDetails/insertLink';
import { InsertMediaModal } from '../components/taskDetails/InsertMedia';
import { EmojiView } from '../components/taskDetails/emoji';
import { FontView } from '../components/taskDetails/fontSelect';
import { ColorView } from '../components/taskDetails/colorSelect';
import { colors, fonts } from '../defaultTheme';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth, useConfig, TaskItemTaskDetailsUpdateRequest } from '@larisarozin/dodone-shared';
import { createApiClient } from '../utils/apiClientWrapper';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { useConfirmationDialog } from '../hooks/useConfirmationDialog';

interface RefLinkModal {
  setModalVisible: (visible: boolean) => void;
} 

interface RefMediaModal {
  setModalVisible: (visible: boolean, type: 'image' | 'video') => void;
} 

type IconRecord = {
  selected: boolean;
  disabled: boolean;
  tintColor: any;
  iconSize: number;
};


// interface INavigation {
//   push: (key: any, params?: Record<string, any>) => void;
// }

type TaskDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'TaskDetails'>;
type TaskDetailsScreenRouteProp = RouteProp<RootStackParamList, 'TaskDetails'>;


interface TaskDetailScreenProps {
  navigation: TaskDetailsScreenNavigationProp;
  route: TaskDetailsScreenRouteProp
  theme?: ColorSchemeName;
}

const initHTML = ``;

// Create Material Community Icon components for rich text editor
const EmojiIcon = () => <MaterialCommunityIcons name="emoticon-happy" size={20} color="#000" />;
const HtmlIcon = () => <MaterialCommunityIcons name="language-html5" size={20} color="#000" />;
const CopyIcon = () => <MaterialCommunityIcons name="content-copy" size={20} color="#000" />;
const CutIcon = () => <MaterialCommunityIcons name="content-cut" size={20} color="#000" />;
const PasteIcon = () => <MaterialCommunityIcons name="content-paste" size={20} color="#000" />;
const TranslateIcon = () => <MaterialCommunityIcons name="translate" size={20} color="#000" />;

function createContentStyle(theme: ColorSchemeName, isLandscape = false, rightPadding = 0) {
  // Can be selected for more situations (cssText or contentCSSText).
  const contentStyle = {
    backgroundColor: '#2e3847',
    color: '#fff',
    caretColor: 'red', // initial valid// initial valid
    placeholderColor: 'gray',
    // cssText: '#editor {background-color: #f3f3f3}', // initial valid
    contentCSSText: `
      /* Load Fredoka font from local assets - platform specific */
      @font-face {
        font-family: 'Fredoka-Regular';
        font-weight: normal;
        font-style: normal;
        src: ${Platform.OS === 'ios' 
          ? "url('Fredoka-Regular') format('truetype')" 
          : "url('file:///android_asset/fonts/Fredoka-Regular.ttf') format('truetype')"};
        font-display: swap;
      }
      
      @font-face {
        font-family: 'Fredoka';
        font-weight: normal;
        font-style: normal;
        src: ${Platform.OS === 'ios' 
          ? "url('Fredoka-Regular') format('truetype')" 
          : "url('file:///android_asset/fonts/Fredoka-Regular.ttf') format('truetype')"};
        font-display: swap;
      }
      
      body, #editor { 
        font-size: 16px; 
        min-height: 100px; 
        padding: 10px; 
        font-family: 'Fredoka', 'Fredoka-Regular', -apple-system, BlinkMacSystemFont, sans-serif;
        ${isLandscape ? `padding-right: ${rightPadding + 10}px;` : ''}
      }
      
      /* Test if any fonts are loading */
      .font-debug {
        font-family: 'Fredoka', 'Fredoka-Web', 'Fredoka-Local', cursive;
        color: red;
        font-size: 20px;
        background: yellow;
        padding: 5px;
        border: 2px solid blue;
        display: block;
        margin: 10px 0;
      }
      /* Comprehensive approach to disable native text selection menu */
      * {
        -webkit-user-select: text;
        -webkit-touch-callout: none !important;
        -webkit-tap-highlight-color: transparent;
        -webkit-appearance: none;
      }
      /* Additional WebKit properties to control selection */
      html, body {
        -webkit-touch-callout: none !important;
        -webkit-user-select: text;
        user-select: text;
        -webkit-tap-highlight-color: rgba(0,0,0,0);
      }
      /* Hide any potential selection handles */
      ::-webkit-selection {
        background: #3390FF;
        color: white;
      }
      ::selection {
        background: #3390FF;
        color: white;
      }
      
      /* Checkbox styling for task lists */
      input[type="checkbox"] {
        -webkit-appearance: checkbox !important;
        appearance: checkbox !important;
        width: 18px;
        height: 18px;
        margin: 0 2px 0 0;
        vertical-align: middle;
        cursor: pointer;
        display: inline-block;
        position: relative;
        flex-shrink: 0;
      }
      
      /* Ensure list items with checkboxes display properly */
      li input[type="checkbox"] {
        margin-right: 2px;
      }
      
      /* Style the list items themselves */
      ul[data-checked], ul[data-checked] li {
        list-style-type: none;
        padding-left: 0;
      }
      
      ul[data-checked] li {
        display: flex;
        align-items: flex-start;
        padding: 2px 0;
      }
    `,
  };
  if (theme === 'light') {
    contentStyle.backgroundColor = '#fff';
    contentStyle.color = '#000033';
    contentStyle.placeholderColor = '#a9a9a9';
  }
  return contentStyle;
}

export default function TaskDetailsScreen(props: TaskDetailScreenProps) {
  const { theme: initTheme = Appearance.getColorScheme(), route } = props;
  const { taskId, taskName } = route.params || {};
  const { token, user } = useAuth();
  const { baseUrl } = useConfig();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  
  const richText = useRef<RichEditor>(null);
  const linkModal = useRef<RefLinkModal>(null);
  const mediaModal = useRef<RefMediaModal>(null);
  const scrollRef = useRef<ScrollView>(null);
  const topToolbarScrollRef = useRef<ScrollView>(null);
  const bottomToolbarScrollRef = useRef<ScrollView>(null);
  // save on html
  const contentRef = useRef(initHTML);
  const { bottom, right } = useSafeAreaInsets();

  // Add loading and error state management
  const [loading, setLoading] = useState(false);
  const [_saving, setSaving] = useState(false);
  const [taskDetails, setTaskDetails] = useState<string>(initHTML);
  const [_error, setError] = useState<string>('');
  const [editorReady, setEditorReady] = useState(false);

  // Add orientation detection
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const isLandscape = screenData.width > screenData.height;

  // Add keyboard height and visibility tracking
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [_keyboardTransitioning, setKeyboardTransitioning] = useState(false);

  const [theme, setTheme] = useState(initTheme);
  const [emojiVisible, setEmojiVisible] = useState(false);
  const [fontVisible, setFontVisible] = useState(false);
  const [foreColorVisible, setForeColorVisible] = useState(false);
  const [hiliteColorVisible, setHiliteColorVisible] = useState(false);
  const [disabled, _setDisable] = useState(false);
  const [selectedText, setSelectedText] = useState<string>('');
  const [hasSelection, setHasSelection] = useState<boolean>(false);
  // Snackbar state for toast notifications
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarError, setSnackbarError] = useState(false);
  
  // Task data state for permission checks
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [_taskLoading, setTaskLoading] = useState(false);
  
  // Dirty flag for unsaved changes
  const [isDirty, setIsDirty] = useState(false);
  const initialContentRef = useRef<string>(initHTML);
  
  // Unsaved changes confirmation dialog
  const { dialogState: unsavedChangesDialogState, showDialog: showUnsavedChangesDialog, hideDialog: hideUnsavedChangesDialog } = useConfirmationDialog();
  const navigationActionRef = React.useRef<any>(null);
  
  // Permission variables similar to TaskEditScreen
  const isTaskCreator = React.useMemo(() => {
    return currentTask?.createdByUser?.id === user?.id;
  }, [currentTask, user]);

  const isTaskAssignee = React.useMemo(() => {
    return currentTask?.assignedTo === user?.id;
  }, [currentTask, user]);

  const canFullyEdit = React.useMemo(() => {
    return user?.isAdmin || isTaskCreator || isTaskAssignee;
  }, [user, isTaskCreator, isTaskAssignee]);
  
  const DEFAULT_FONT_SIZE = 3;
  // Add a ref to store the last applied font size to avoid detection loops
  const lastAppliedFontSize = useRef<number | null>(null);
  const contentStyle = useMemo(() => createContentStyle(theme, isLandscape, right || 4), [theme, isLandscape, right]);

  // Helper functions for snackbar toast notifications
  const showSuccessMessage = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarError(false);
    setSnackbarVisible(true);
  }, []);

  const showErrorMessage = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarError(true);
    setSnackbarVisible(true);
  }, []);

  // Fetch task data for permission checks
  const fetchTaskData = useCallback(async () => {
    if (!taskId || !token) return;
    
    setTaskLoading(true);
    try {
      const apiClient = createApiClient(baseUrl, token);
      const response = await apiClient.tasks.get(taskId);
      
      if (response && typeof response === 'object') {
        let taskData = null;
        
        if ('Data' in response && response.Success) {
          taskData = response.Data;
        } else if (response.id) {
          // Direct task object
          taskData = response;
        }
        
        if (taskData) {
          setCurrentTask(taskData);
        }
      }
    } catch (error) {
      console.error('TaskDetailsScreen: Error fetching task data:', error);
    } finally {
      setTaskLoading(false);
    }
  }, [taskId, token, baseUrl]);

  // Fetch task details from API
  const fetchTaskDetails = useCallback(async () => {
    if (!taskId || !token) return;
    
    setLoading(true);
    setError('');
    
    try {
      const apiClient = createApiClient(baseUrl, token);
      // taskId is already a number from route params
      const response = await apiClient.tasks.getTaskDetails(taskId);
      
      // API always returns DataResponse<string> with capitalized property names
      let detailsString = initHTML;
      
      if (response && typeof response === 'object') {
        if (!response.success) {
          throw new Error(`API Error: ${response.message || 'Failed to fetch task details'}`);
        }
        
        detailsString = response.data;
      }
      
      setTaskDetails(detailsString);
      contentRef.current = detailsString;
      
      // Save initial content for dirty tracking
      initialContentRef.current = detailsString;
      setIsDirty(false); // Reset dirty flag when loading fresh content
      
      // Update the rich editor content
      if (richText.current) {
        richText.current.setContentHTML(detailsString);
        
        // Force font refresh after content is loaded (iOS specific fix)
        if (Platform.OS === 'ios') {
          setTimeout(() => {
            richText.current?.command(`
              (function() {
                // Apply font family to all elements that might not have it
                var allElements = document.querySelectorAll('*');
                allElements.forEach(function(element) {
                  var currentFont = window.getComputedStyle(element).fontFamily;
                  if (currentFont.includes('cursive') || currentFont.includes('Times') || currentFont.includes('serif')) {
                    element.style.fontFamily = 'Fredoka, Fredoka-Regular, -apple-system, BlinkMacSystemFont, sans-serif';
                  }
                });
              })();
            `);
          }, 1000);
        }
      }
    } catch (err) {
      console.error('Error fetching task details:', err);
      setError('Failed to load task details');
      showErrorMessage('Failed to load task details');
    } finally {
      setLoading(false);
    }
  }, [taskId, token, baseUrl, showErrorMessage]);

  const updateTaskDetails = useCallback(async (details: string) => {
    if (!taskId || !token) {
      console.log('TaskDetailsScreen: Missing taskId or token:', { taskId, token: !!token });
      return false;
    }
    
    setSaving(true);
    setError('');
    
    try {
      const apiClient = createApiClient(baseUrl, token);
      
      const request: TaskItemTaskDetailsUpdateRequest = {
        id: taskId, // taskId is already a number
        taskDetails: details
      };
      
      const response = await apiClient.tasks.updateTaskDetails(request);
      
      // Handle both boolean response and DataResponse format
      if (!response.success) {
        const errorMessage = response?.message || 'Update failed - API returned false';
        throw new Error(errorMessage);
      } else {
        setTaskDetails(details);
        // Reset dirty flag and update initial content snapshot after successful save
        initialContentRef.current = details;
        setIsDirty(false);
        showSuccessMessage('Task details saved successfully!');
        return true;
      }
    } catch (err) {
      console.error('TaskDetailsScreen: Error updating task details:', err);
      setError('Failed to save task details');
      showErrorMessage('Failed to save task details');
      return false;
    } finally {
      setSaving(false);
    }
  }, [taskId, token, baseUrl, showSuccessMessage, showErrorMessage]);

  // Handle save action
  const handleSave = useCallback(async () => {
    // First try to get fresh content from the editor
    if (richText.current) {
      richText.current.command(`
        (function() {
          var editorElement = document.getElementById('editor');
          var content = editorElement ? editorElement.innerHTML : '';
          
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'save-content',
              data: content
            }));
          }
        })();
      `);
    }
    
    // Use contentRef for now and add more detailed logging
    await updateTaskDetails(contentRef.current);
  }, [updateTaskDetails]);

  // Reset keyboard state when screen comes into focus to prevent persistent state issues
  useFocusEffect(
    useCallback(() => {
      // Reset keyboard state when screen gains focus
      const currentInput = TextInput.State.currentlyFocusedInput();
      if (!currentInput) {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
        setKeyboardTransitioning(false);
      }
    }, [])
  );

  // Load task details when component mounts or comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchTaskDetails();
      fetchTaskData(); // Fetch task data for permission checks
    }, [fetchTaskDetails, fetchTaskData])
  );

  // Prevent navigation when there are unsaved changes
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (!isDirty) {
        // If we don't have unsaved changes, allow navigation
        return;
      }

      // Prevent default behavior of leaving the screen
      e.preventDefault();

      // Store the navigation action to execute later if user confirms
      navigationActionRef.current = e.data.action;

      // Show confirmation dialog
      showUnsavedChangesDialog(
        'Discard changes?',
        'Do you want to discard unsaved changes to this task?',
        [
          { 
            text: "Cancel", 
            style: 'cancel',
            onPress: () => {
              hideUnsavedChangesDialog();
            }
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setIsDirty(false);
              hideUnsavedChangesDialog();
              // Execute the stored navigation action
              if (navigationActionRef.current) {
                navigation.dispatch(navigationActionRef.current);
              }
            },
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, isDirty, showUnsavedChangesDialog, hideUnsavedChangesDialog]);

  // const handleHome = useCallback(() => {
  //   navigation.push('index');
  // }, [navigation]);

  // editor change data
  const handleChange = useCallback((html: string) => {
    // save html to content ref;
    contentRef.current = html;
    
    // Mark as dirty if content changed from initial value
    if (html !== initialContentRef.current && !isDirty) {
      setIsDirty(true);
    }
  }, [isDirty]);

  // theme change to editor color
  const themeChange = useCallback(({ colorScheme }: Appearance.AppearancePreferences) => {
    setTheme(colorScheme);
  }, []);

  // const onTheme = useCallback(() => {
  //   setTheme(theme === 'light' ? 'dark' : 'light');
  // }, [theme]);

  // const onDisabled = useCallback(() => {
  //   setDisable(!disabled);
  // }, [disabled]);

  const editorInitializedCallback = useCallback(() => {
    // Set editor as ready so toolbars can be safely rendered
    setEditorReady(true);
    
    // richText.current.registerToolbar(function (items) {
    // console.log('Toolbar click, selected items (insert end callback):', items);
    // });
    
    // Test font loading after editor is ready
    setTimeout(() => {
      // Re-enable ONLY CSS injection for font loading
      const fontSrc = Platform.OS === 'ios' 
        ? "url('Fredoka-Regular') format('truetype')" 
        : "url('file:///android_asset/fonts/Fredoka-Regular.ttf') format('truetype')";
      
      const minimalCssScript = `
        (function() {
          var style = document.createElement('style');
          style.textContent = \`
            @font-face {
              font-family: 'Fredoka-Regular';
              src: ${fontSrc};
              font-display: swap;
            }
            @font-face {
              font-family: 'Fredoka';
              src: ${fontSrc};
              font-display: swap;
            }
            
            /* Ensure default font family is applied */
            body, #editor, div, span, p, h1, h2, h3, h4, h5, h6, li, ul, ol {
              font-family: 'Fredoka', 'Fredoka-Regular', -apple-system, BlinkMacSystemFont, sans-serif !important;
            }
          \`;
          document.head.appendChild(style);
          
          // Verify font loading after a delay
          setTimeout(function() {
            var testElement = document.createElement('div');
            testElement.style.fontFamily = 'Fredoka';
            testElement.style.fontSize = '16px';
            testElement.textContent = 'Font test';
            testElement.style.position = 'absolute';
            testElement.style.visibility = 'hidden';
            document.body.appendChild(testElement);
            
            var computedStyle = window.getComputedStyle(testElement);
            
            document.body.removeChild(testElement);
          }, 1000);
        })();
      `;
      richText.current?.command(minimalCssScript);
    }, 500);
    
    // Inject selection detection and context menu prevention script
    setTimeout(() => {
     
      // Create a less invasive selection detection script
      const minimalSelectionScript = `
        (function() {
          function checkSelection() {
            var selection = window.getSelection();
            var selectedText = '';
            var hasSelection = false;
            
            if (selection && selection.rangeCount > 0) {
              selectedText = selection.toString().trim();
              hasSelection = selectedText.length > 0;
            }
            
            if (hasSelection) {
              // Send message to React Native
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'selection-change',
                  data: selectedText
                }));
              }
            }
          }
          
          // Only listen for selection changes, don't prevent other events
          document.addEventListener('selectionchange', checkSelection);
          
          // Check selection on mouse up but don't prevent the event
          document.addEventListener('mouseup', function() {
            setTimeout(checkSelection, 50);
          });
        })();
      `;
      
      richText.current?.command(minimalSelectionScript);
      
      // Inject link click handler script
      const linkClickScript = `
        (function() {
          // Handle link clicks by intercepting them and sending to React Native
          document.addEventListener('click', function(e) {
            var target = e.target;
            
            // Find the closest anchor tag (in case we clicked on text inside the link)
            while (target && target.tagName !== 'A' && target.parentNode) {
              target = target.parentNode;
            }
            
            if (target && target.tagName === 'A' && target.href) {
              e.preventDefault();
              e.stopPropagation();
              
              // Send message to React Native
              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'link-clicked',
                  data: { url: target.href }
                }));
              } else {
                console.error('ReactNativeWebView not available');
              }
              
              return false;
            }
          });
        })();
      `;
      
      // Execute the link click handler script
      richText.current?.command(linkClickScript);
      
      // Inject checkbox initialization script to ensure checkboxes are visible and functional
      const checkboxInitScript = `
        (function() {
          // Function to ensure checkboxes are visible
          function ensureCheckboxesVisible() {
            var checkboxes = document.querySelectorAll('input[type="checkbox"]');
            
            checkboxes.forEach(function(checkbox) {
              // Ensure proper styling
              checkbox.style.webkitAppearance = 'checkbox';
              checkbox.style.appearance = 'checkbox';
              checkbox.style.width = '18px';
              checkbox.style.height = '18px';
              checkbox.style.margin = '0 2px 0 0';
              checkbox.style.verticalAlign = 'middle';
              checkbox.style.display = 'inline-block';
              checkbox.style.cursor = 'pointer';
            });
          }
          
          // Run on initialization
          ensureCheckboxesVisible();
          
          // Also run when content changes (using MutationObserver)
          var observer = new MutationObserver(function(mutations) {
            var hasNewCheckboxes = false;
            mutations.forEach(function(mutation) {
              if (mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(function(node) {
                  if (node.nodeType === 1) { // Element node
                    if (node.tagName === 'INPUT' && node.type === 'checkbox') {
                      hasNewCheckboxes = true;
                    } else if (node.querySelectorAll) {
                      var newCheckboxes = node.querySelectorAll('input[type="checkbox"]');
                      if (newCheckboxes.length > 0) {
                        hasNewCheckboxes = true;
                      }
                    }
                  }
                });
              }
            });
            
            if (hasNewCheckboxes) {
              ensureCheckboxesVisible();
            }
          });
          
          // Observe the editor for changes
          var editorElement = document.getElementById('editor') || document.body;
          observer.observe(editorElement, {
            childList: true,
            subtree: true
          });
        })();
      `;
      
      // Execute the checkbox initialization script
      richText.current?.command(checkboxInitScript);
    }, 500);
  }, []);

  const onKeyHide = useCallback(() => {
    // Immediately reset keyboard state without transition delays
    setIsKeyboardVisible(false);
    setKeyboardHeight(0);
    setKeyboardTransitioning(false); // No transition state to avoid touch blocking
  }, []);

  const onKeyShow = useCallback((event: any) => {
    TextInput.State.currentlyFocusedInput() && setEmojiVisible(false);
    
    // Close all open dialogs when keyboard appears
    setFontVisible(false);
    setForeColorVisible(false);
    setHiliteColorVisible(false);
    setEmojiVisible(false);
    
    // Get keyboard height from the event
    const eventKeyboardHeight = event?.endCoordinates?.height || 0;
    
    // Immediately set keyboard visible and height without transition state
    setIsKeyboardVisible(true);
    setKeyboardHeight(eventKeyboardHeight);
    setKeyboardTransitioning(false); // Don't use transition state that might block touches
  }, []);

  // editor height change
  // const handleHeightChange = useCallback((height: number) => {
  //   console.log('editor height change:', height);
  // }, []);

  const handleInsertEmoji = useCallback((emoji: string) => {
    richText.current?.insertText(emoji);
    richText.current?.blurContentEditor();
    // Note: EmojiView doesn't automatically close after selection, 
    // but if it did, we would need to add keyboard state reset here too
  }, []);

  const handleEmoji = useCallback(() => {
    Keyboard.dismiss();
    richText.current?.blurContentEditor();
    setEmojiVisible(!emojiVisible);
    setFontVisible(false); // Close font selector when opening emoji
    setForeColorVisible(false); // Close color selectors when opening emoji
    setHiliteColorVisible(false);
  }, [emojiVisible]);

  const handleFontSelect = useCallback((fontFamily: string) => {
    if (!richText.current) {
      return;
    }

    // Use a more sophisticated approach that preserves existing styles and hyperlinks
    richText.current.command(`
      (function() {
        var selection = window.getSelection();
        if (!selection.rangeCount || !selection.toString().trim()) {
          return;
        }
        
        var range = selection.getRangeAt(0);
        var selectedContent = range.extractContents();
        
        // Function to apply font to a node while preserving other styles
        function applyFontToNode(node, fontFamily) {
          if (node.nodeType === Node.TEXT_NODE) {
            // Wrap text nodes in span with font-family
            var span = document.createElement('span');
            span.style.fontFamily = fontFamily;
            span.textContent = node.textContent;
            return span;
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            // For element nodes, preserve existing styles and add font-family
            var clonedNode = node.cloneNode(false);
            
            // Preserve existing inline styles
            var existingStyle = node.getAttribute('style') || '';
            
            // Remove any existing font-family from the style
            var styleWithoutFont = existingStyle.replace(/font-family\\s*:[^;]*;?/gi, '').trim();
            
            // Add new font-family
            var newStyle = 'font-family: ' + fontFamily + ';';
            if (styleWithoutFont) {
              newStyle += ' ' + styleWithoutFont;
            }
            
            clonedNode.setAttribute('style', newStyle);
            
            // Preserve all other attributes (like href for links)
            for (var i = 0; i < node.attributes.length; i++) {
              var attr = node.attributes[i];
              if (attr.name !== 'style') {
                clonedNode.setAttribute(attr.name, attr.value);
              }
            }
            
            // Recursively process child nodes
            for (var j = 0; j < node.childNodes.length; j++) {
              var processedChild = applyFontToNode(node.childNodes[j], fontFamily);
              clonedNode.appendChild(processedChild);
            }
            
            return clonedNode;
          }
          return node.cloneNode(true);
        }
        
        // Process all nodes in the selection
        var processedFragment = document.createDocumentFragment();
        var childNodes = Array.from(selectedContent.childNodes);
        
        for (var i = 0; i < childNodes.length; i++) {
          var processedNode = applyFontToNode(childNodes[i], '${fontFamily}');
          processedFragment.appendChild(processedNode);
        }
        
        // Insert the processed content back
        range.insertNode(processedFragment);
        
        // Restore selection
        selection.removeAllRanges();
        selection.addRange(range);
      })();
    `);
    
    setFontVisible(false);
    // Force keyboard state reset when closing dialog to prevent position drift
    setTimeout(() => {
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
    }, 100);
  }, []);

  const handleFontToggle = useCallback(() => {
    Keyboard.dismiss();
    richText.current?.blurContentEditor();
    setFontVisible(!fontVisible);
    setEmojiVisible(false); // Close emoji selector when opening font
    setForeColorVisible(false); // Close color selectors when opening font
    setHiliteColorVisible(false);
  }, [fontVisible]);

  const handleInsertVideo = useCallback(() => {
    mediaModal.current?.setModalVisible(true, 'video');
  }, []);

  const onPressAddImage = useCallback(() => {
    mediaModal.current?.setModalVisible(true, 'image');
  }, []);

  const onInsertLink = useCallback(() => {
    linkModal.current?.setModalVisible(true);
  }, []);



  // Copy selected text to clipboard
  const handleCopy = useCallback(() => {
    if (hasSelection && selectedText) {
      Clipboard.setString(selectedText);
      showSuccessMessage('Text copied to clipboard');
    } else {
      showErrorMessage('Please select text first');
    }
  }, [hasSelection, selectedText, showSuccessMessage, showErrorMessage]);

  // Cut selected text (copy and delete)
  const handleCut = useCallback(() => {
    if (hasSelection && selectedText) {
      Clipboard.setString(selectedText);
      // Delete the selected text by replacing it with empty string
      richText.current?.command(`
        (function() {
          var selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            var range = selection.getRangeAt(0);
            range.deleteContents();
            
            // Create a new range at the deletion point to place cursor
            var newRange = document.createRange();
            newRange.setStart(range.startContainer, range.startOffset);
            newRange.collapse(true);
            
            // Clear and set the new range
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        })();
      `);
      
      // Clear selection state after a brief delay to ensure command executes
      setTimeout(() => {
        setSelectedText('');
        setHasSelection(false);
      }, 50);
      
      showSuccessMessage('Text cut to clipboard');
    } else {
      showErrorMessage('Please select text first');
    }
  }, [hasSelection, selectedText, showSuccessMessage, showErrorMessage]);

  // Open selected text in Google Translate
  const handleTranslate = useCallback(() => {
    if (hasSelection && selectedText) {
      const encodedText = encodeURIComponent(selectedText);
      const translateUrl = `https://translate.google.com/?sl=auto&tl=en&text=${encodedText}`;
      Linking.openURL(translateUrl).catch((err) => {
        console.error('Failed to open translate URL:', err);
        showErrorMessage('Failed to open Google Translate');
      });
    } else {
      showErrorMessage('Please select text first');
    }
  }, [hasSelection, selectedText, showErrorMessage]);

  // Paste text from clipboard (toolbar button)
  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const clipboardContent = await Clipboard.getString();
      if (clipboardContent && clipboardContent.trim().length > 0) {
        // Use insertHTML with proper selection handling to avoid duplication
        richText.current?.command(`
          (function() {
            var selection = window.getSelection();
            var textToInsert = ${JSON.stringify(clipboardContent)};
            
            if (selection && selection.rangeCount > 0) {
              var range = selection.getRangeAt(0);
              
              // Delete any selected content first
              range.deleteContents();
              
              // Create a text node with the clipboard content
              var textNode = document.createTextNode(textToInsert);
              
              // Insert the text node
              range.insertNode(textNode);
              
              // Move cursor to end of inserted text
              range.setStartAfter(textNode);
              range.collapse(true);
              
              // Update selection
              selection.removeAllRanges();
              selection.addRange(range);
            }
          })();
        `);
        showSuccessMessage('Text pasted from clipboard');
      } else {
        showErrorMessage('No text found in clipboard');
      }
    } catch (clipboardError) {
      console.error('Failed to paste from clipboard:', clipboardError);
      showErrorMessage('Failed to paste from clipboard');
    }
  }, [showSuccessMessage, showErrorMessage]);

  const onLinkDone = useCallback(({ title, url }: { title?: string; url?: string }) => {
    if (title && url) {
      richText.current?.insertLink(title, url);
    }
  }, []);

  const onMediaDone = useCallback(({ url, mediaType }: { url: string; mediaType: 'image' | 'video' }) => {
    if (url) {
      if (mediaType === 'image') {
        richText.current?.insertImage(url, 'max-width: 100%; height: auto;');
      } else {
        // Handle different video URL formats
        let videoHTML = '';
        
        // Check if it's a YouTube URL
        const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/;
        const youtubeMatch = url.match(youtubeRegex);
        
        if (youtubeMatch) {
          // Convert YouTube URL to embed format
          const videoId = youtubeMatch[1];
          videoHTML = `
            <div style="max-width: 100%; margin: 10px 0; text-align: center; position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
              <iframe 
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 8px;" 
                src="https://www.youtube.com/embed/${videoId}" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
              </iframe>
            </div>
          `;
        } else if (url.includes('vimeo.com')) {
          // Handle Vimeo URLs
          const vimeoRegex = /vimeo\.com\/(\d+)/;
          const vimeoMatch = url.match(vimeoRegex);
          if (vimeoMatch) {
            const videoId = vimeoMatch[1];
            videoHTML = `
              <div style="max-width: 100%; margin: 10px 0; text-align: center; position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
                <iframe 
                  style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 8px;" 
                  src="https://player.vimeo.com/video/${videoId}" 
                  frameborder="0" 
                  allow="autoplay; fullscreen; picture-in-picture" 
                  allowfullscreen>
                </iframe>
              </div>
            `;
          }
        } else {
          // For direct video file URLs (mp4, webm, etc.)
          videoHTML = `
            <div style="max-width: 100%; margin: 10px 0; text-align: center;">
              <video 
                controls 
                playsinline 
                preload="metadata"
                style="max-width: 100%; height: auto; border-radius: 8px;"
                poster=""
              >
                <source src="${url}" type="video/mp4">
                <p>Your browser doesn't support HTML5 video. <a href="${url}" target="_blank">Download the video</a> instead.</p>
              </video>
            </div>
          `;
        }
        
        richText.current?.insertHTML(videoHTML);
      }
    }
  }, []);

  const handleFontSize = useCallback(() => {
    // 1=  10px, 2 = 13px, 3 = 16px, 4 = 18px, 5 = 24px, 6 = 32px, 7 = 48px;
    
    // Detection script that respects previously applied font sizes
    const detectCurrentFontSizeScript = `
      (function() {
        var selection = window.getSelection();
        var currentSize = 3; // default
        
        if (selection && selection.rangeCount > 0) {
          var range = selection.getRangeAt(0);
          var element = range.startContainer;
          
          if (element.nodeType === Node.TEXT_NODE) {
            element = element.parentElement;
          }
          
          if (element) {
            var computedStyle = window.getComputedStyle(element);
            var fontSize = parseInt(computedStyle.fontSize, 10);
            
            // Map to font size number
            if (fontSize <= 11) currentSize = 1;
            else if (fontSize <= 14) currentSize = 2; 
            else if (fontSize <= 17) currentSize = 3;
            else if (fontSize <= 20) currentSize = 4;
            else if (fontSize <= 26) currentSize = 5;
            else if (fontSize <= 36) currentSize = 6;
            else currentSize = 7;
          }
        }
        
        return currentSize;
      })();
    `;
    
    // Use setTimeout to separate detection from application
    setTimeout(() => {
      richText.current?.command(detectCurrentFontSizeScript);
      
      // After detection, wait a moment and apply the next size
      setTimeout(() => {
        // For now, let's manually track what we think the current size should be
        const lastApplied = lastAppliedFontSize.current || DEFAULT_FONT_SIZE;
        const nextSize = lastApplied >= 7 ? 1 : lastApplied + 1;
        
        lastAppliedFontSize.current = nextSize;
        richText.current?.setFontSize(nextSize as FONT_SIZE);
      }, 50);
    }, 10);
  }, []);

  const handleForeColor = useCallback(() => {
    Keyboard.dismiss();
    richText.current?.blurContentEditor();
    setForeColorVisible(!foreColorVisible);
    setHiliteColorVisible(false); // Close hilite color selector when opening fore color
    setEmojiVisible(false); // Close other selectors
    setFontVisible(false);
  }, [foreColorVisible]);

  const handleHiliteColor = useCallback(() => {
    Keyboard.dismiss();
    richText.current?.blurContentEditor();
    setHiliteColorVisible(!hiliteColorVisible);
    setForeColorVisible(false); // Close fore color selector when opening hilite color
    setEmojiVisible(false); // Close other selectors
    setFontVisible(false);
  }, [hiliteColorVisible]);

  const handleForeColorSelect = useCallback((color: string) => {
    richText.current?.setForeColor(color);
    setForeColorVisible(false);
    // Force keyboard state reset when closing dialog to prevent position drift
    setTimeout(() => {
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
    }, 100);
  }, []);

  const handleHiliteColorSelect = useCallback((color: string) => {
    richText.current?.setHiliteColor(color);
    setHiliteColorVisible(false);
    // Force keyboard state reset when closing dialog to prevent position drift
    setTimeout(() => {
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
    }, 100);
  }, []);

  // Scroll handlers for toolbar navigation
  const handleScrollToolbarLeft = useCallback((toolbarRef: React.RefObject<ScrollView | null>) => {
    if (toolbarRef.current) {
      toolbarRef.current.scrollTo({ x: 0, animated: true });
    }
  }, []);

  const handleScrollToolbarRight = useCallback((toolbarRef: React.RefObject<ScrollView | null>) => {
    if (toolbarRef.current) {
      // Scroll by a fixed amount (e.g., 200 pixels) to the right
      toolbarRef.current.scrollTo({ x: 1000, animated: true }); // Large value to ensure we reach the end
    }
  }, []);

  const handleHeading = useCallback((level: number) => {
    // Use insertHTML approach similar to how we handle font selection
    setTimeout(() => {
      const headingScript = `
        (function() {
          var selection = window.getSelection();
          var selectedText = '';
          var hasSelection = false;
          
          if (selection && selection.rangeCount > 0) {
            selectedText = selection.toString().trim();
            hasSelection = selectedText.length > 0;
          }
                    
          if (hasSelection) {
            // Get existing styles from the selection's parent element
            var range = selection.getRangeAt(0);
            var parentElement = range.commonAncestorContainer;
            if (parentElement.nodeType === 3) { // Text node
              parentElement = parentElement.parentElement;
            }
            
            var existingStyles = '';
            if (parentElement && parentElement.style) {
              var computedStyle = window.getComputedStyle(parentElement);
              var stylesToPreserve = ['color', 'background-color', 'font-weight', 'font-style', 'text-decoration', 'font-family', 'text-align'];
              
              stylesToPreserve.forEach(function(prop) {
                var value = computedStyle.getPropertyValue(prop);
                if (value && value !== 'initial' && value !== 'normal' && value !== 'rgba(0, 0, 0, 0)') {
                  existingStyles += prop + ': ' + value + '; ';
                }
              });
            }
            
            var headingHTML = existingStyles 
              ? '<h${level} style="' + existingStyles + '">' + selectedText + '</h${level}>'
              : '<h${level}>' + selectedText + '</h${level}>';
            
            document.execCommand('insertHTML', false, headingHTML);
          } else {
            // No selection - create empty heading and position cursor inside it
            var headingId = 'heading-cursor-' + Date.now();
            var emptyHeading = '<h${level} id="' + headingId + '">Type here</h${level}>';
            
            document.execCommand('insertHTML', false, emptyHeading);
            
            // Position cursor inside the heading
            setTimeout(function() {
              var insertedHeading = document.getElementById(headingId);
              if (insertedHeading) {
                var range = document.createRange();
                range.selectNodeContents(insertedHeading);
                range.collapse(false); // Collapse to end
                
                var selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
              }
            }, 50);
          }
        })();
      `;
      
      richText.current?.command(headingScript);
    }, 100);
  }, []);

  const handleHeading1 = useCallback(() => handleHeading(1), [handleHeading]);
  const handleHeading2 = useCallback(() => handleHeading(2), [handleHeading]);
  const handleHeading3 = useCallback(() => handleHeading(3), [handleHeading]);
  const handleHeading4 = useCallback(() => handleHeading(4), [handleHeading]);
  const handleHeading5 = useCallback(() => handleHeading(5), [handleHeading]);
  const handleHeading6 = useCallback(() => handleHeading(6), [handleHeading]);

  const handlePaste = useCallback((data: any) => {
    richText.current?.insertText(data);
  }, []);

  // @deprecated Android keyCode 229
  const handleKeyUp = useCallback(() => {
    // console.log('KeyUp:', data);
  }, []);

  // @deprecated Android keyCode 229
  const handleKeyDown = useCallback(() => {
    // console.log('KeyDown:', data);
  }, []);

  const handleInput = useCallback(() => {
    // console.log(inputType, data)
  }, []);

  const handleInternalNavigation = useCallback((url: string) => {
    try {
      // Parse dodone:// URLs to navigate to app screens
      // Handle different URL formats that might come from the WebView
      let targetRoute = '';
      let pathParts: string[] = [];
      
      if (url.startsWith('dodone://')) {
        // Remove the protocol
        const withoutProtocol = url.replace('dodone://', '');
        
        // Split by / to get route and parts
        const parts = withoutProtocol.split('/').filter(part => part);
        
        if (parts.length > 0) {
          targetRoute = parts[0];
          pathParts = parts.slice(1);
        }
      } else {
        console.warn('URL does not start with dodone://');
        return false;
      }
      
      switch (targetRoute.toLowerCase()) {
        case 'mainapp':
          // Support different mainapp actions based on path parts
          if (pathParts.length === 0) {
            // Simple navigation to MainApp
            navigation.navigate('MainApp', {});
            return true;
          } else if (pathParts.length === 1) {
            const action = pathParts[0].toLowerCase();
            switch (action) {
              case 'expand':
              case 'expanddashboard':
                // Navigate to MainApp with expand dashboard action
                navigation.navigate('MainApp', { action: 'expandDashboard' });
                return true;
              case 'allowances':
              case 'allowancehistory':
                // Navigate to MainApp with show allowances action
                navigation.navigate('MainApp', { action: 'showAllowances' });
                return true;
              case 'bonuses':
              case 'bonushistory':
                // Navigate to MainApp with show bonuses action
                navigation.navigate('MainApp', { action: 'showBonuses' });
                return true;
              default:
                console.warn('Unknown MainApp action:', action);
                // Fallback to simple navigation
                navigation.navigate('MainApp', {});
                return true;
            }
          } else {
            console.warn('Invalid MainApp URL format');
            navigation.navigate('MainApp', {});
            return true;
          }
        case 'team':
          navigation.navigate('Team');
          return true;
        case 'teampreferences':
          navigation.navigate('TeamPreferences');
          return true;
        case 'teammemberedit':
          // Can be used for editing own profile or creating new member
          // URL format: dodone://teammemberedit (for own profile)
          // URL format: dodone://teammemberedit/new (for new member)
          // URL format: dodone://teammemberedit/userId (for specific user - requires user lookup)
          if (pathParts.length === 0) {
            // Edit own profile - pass current user and isNew: false
            if (user) {
              navigation.navigate('TeamMemberEdit', { 
                user: user, 
                isNew: false 
              });
              return true;
            } else {
              console.warn('No current user available for profile editing');
              return false;
            }
          } else if (pathParts.length === 1 && pathParts[0].toLowerCase() === 'new') {
            // Create new member
            navigation.navigate('TeamMemberEdit', { isNew: true });
            return true;
          }
          // For editing specific users by ID, we would need to fetch user data
          // This is more complex and might require additional API calls
          console.warn('TeamMemberEdit with user ID not yet supported');
          break;
        case 'taskgroups':
          navigation.navigate('TaskGroups');
          return true;
        case 'notificationsettings':
          navigation.navigate('NotificationSettings', {});
          return true;
        case 'taskkinds':
          // Requires groupId and groupName parameters
          if (pathParts.length >= 2) {
            const groupId = parseInt(pathParts[0], 10);
            const groupName = decodeURIComponent(pathParts[1]);
            if (!isNaN(groupId)) {
              navigation.navigate('TaskKinds', { groupId, groupName });
              return true;
            }
          }
          break;
        case 'taskcategories':
          // Requires kindId and kindName parameters
          if (pathParts.length >= 2) {
            const kindId = parseInt(pathParts[0], 10);
            const kindName = decodeURIComponent(pathParts[1]);
            if (!isNaN(kindId)) {
              navigation.navigate('TaskCategories', { kindId, kindName });
              return true;
            }
          }
          break;
        case 'taskedit':
          // Optional taskItem parameter
          navigation.navigate('TaskEdit', {});
          return true;
        case 'taskcomments':
          // Requires taskId, optional taskName
          if (pathParts.length >= 1) {
            const targetTaskId = parseInt(pathParts[0], 10);
            const targetTaskName = pathParts.length > 1 ? decodeURIComponent(pathParts[1]) : undefined;
            if (!isNaN(targetTaskId)) {
              navigation.navigate('TaskComments', { taskId: targetTaskId, taskName: targetTaskName });
              return true;
            }
          }
          break;
        default:
          console.warn('Unknown internal route:', targetRoute);
          return false;
      }
      
      console.warn('Invalid parameters for internal route:', targetRoute);
      return false;
    } catch (error) {
      console.error('Error parsing internal URL:', error);
      return false;
    }
  }, [navigation, user]);

  const handleMessage = useCallback(({ type, id, data }: { type: string; id: string; data?: any }) => {
    // Handle content save request
    if (type === 'save-content') {
      // Update the contentRef with the latest content from the editor
      if (data && typeof data === 'string') {
        contentRef.current = data;
      }
      return;
    }
    
    // Handle link clicks
    if (type === 'link-clicked' || type === 'link') {
      const url = data?.url || data;
      
      if (url && typeof url === 'string') {
        // Check if it's an internal app link
        if (url.startsWith('dodone://')) {
          const handled = handleInternalNavigation(url);
          if (!handled) {
            showErrorMessage(`Cannot navigate to: ${url}`);
          }
        } else {
          // Handle external URLs as before
          // Normalize URL - ensure it has proper protocol and no trailing slash issues
          let normalizedUrl = url.trim();
          if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
            normalizedUrl = 'https://' + normalizedUrl;
          }
          
          Linking.canOpenURL(normalizedUrl)
            .then((supported) => {
              if (supported) {
                return Linking.openURL(normalizedUrl);
              } else {
                // Some Android versions return false for canOpenURL but can still open the URL
                return Linking.openURL(normalizedUrl)
                  .catch((openErr) => {
                    console.error('URL really cannot be opened:', openErr);
                    showErrorMessage(`Cannot open URL: ${normalizedUrl}`);
                  });
              }
            })
            .catch((err) => {
              console.error('Failed to check/open URL:', err);
              showErrorMessage(`Failed to open URL: ${normalizedUrl}`);
            });
        }
      }
      return;
    }
    
    // Detect text selection for cut/copy/paste operations
    if (type === 'selection-change' || type === 'selection') {
      if (data && data.length > 0) {
        // Text is selected - store it in state for cut/copy/paste
        setSelectedText(data);
        setHasSelection(true);
        // Don't blur the editor - let formatting buttons work normally
      } else {
        // No selection
        setSelectedText('');
        setHasSelection(false);
      }
    }
  }, [showErrorMessage, handleInternalNavigation]);

  const handleFocus = useCallback(() => {
    try {
      // Close all open dialogs when editor gains focus (keyboard will appear)
      setFontVisible(false);
      setForeColorVisible(false);
      setHiliteColorVisible(false);
      setEmojiVisible(false);
    } catch (error) {
      console.warn('Error in handleFocus:', error);
    }
  }, []);

  const handleBlur = useCallback(() => {
  }, []);

  const handleCursorPosition = useCallback((scrollY: number) => {
    // Positioning scroll bar
    scrollRef.current!.scrollTo({ y: scrollY - 30, animated: true });
  }, []);

  useEffect(() => {
    const onChange = (result: any) => {
      setScreenData(result.window);
      
      // Reset keyboard state on orientation change
      // This forces a recalculation of keyboard positioning
      if (isKeyboardVisible) {
        // Re-trigger keyboard height detection after orientation change
        setTimeout(() => {
          // Check if keyboard is still visible after orientation change
          const currentInput = TextInput.State.currentlyFocusedInput();
          if (currentInput && isKeyboardVisible) {
            // If we have a focused input and keyboard was visible, refocus
            // Force a keyboard hide/show cycle to get accurate measurements
            Keyboard.dismiss();
            setTimeout(() => {
              if (richText.current) {
                try {
                  richText.current.focusContentEditor();
                } catch (error) {
                  console.warn('Failed to focus editor:', error);
                }
              }
            }, 100);
          }
          // Don't modify keyboard state here - let keyboard events handle it
        }, 200); // Give orientation change time to complete
      }
    };
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, [isKeyboardVisible]);

  useEffect(() => {
    let listener = [
      Appearance.addChangeListener(themeChange),
      Keyboard.addListener('keyboardDidShow', onKeyShow),
      Keyboard.addListener('keyboardDidHide', onKeyHide),
    ];
    return () => {
      // Clean up keyboard state when component unmounts
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
      setKeyboardTransitioning(false);
      listener.forEach(it => it.remove());
    };
  }, [onKeyHide, onKeyShow, themeChange]);

  // Additional effect to validate keyboard state when selectors close
  useEffect(() => {
    // If no selectors are open and no input is focused, ensure keyboard state is clean
    const noSelectorsOpen = !fontVisible && !foreColorVisible && !hiliteColorVisible && !emojiVisible;
    const noInputFocused = !TextInput.State.currentlyFocusedInput();
    
    if (noSelectorsOpen && noInputFocused) {
      // Delayed check to ensure keyboard events have finished processing
      const timeoutId = setTimeout(() => {
        if (!TextInput.State.currentlyFocusedInput()) {
          setIsKeyboardVisible(false);
          setKeyboardHeight(0);
          setKeyboardTransitioning(false);
        }
      }, 150);
      return () => clearTimeout(timeoutId);
    }
  }, [fontVisible, foreColorVisible, hiliteColorVisible, emojiVisible]);

  // Disabled problematic effect that was incorrectly resetting keyboard state
  // useEffect(() => {
  //   console.log('Orientation change effect disabled - was causing FABs to disappear');
  // }, [screenData]);

  // Disabled problematic keyboard validation that was interfering with rich text editor
  // useEffect(() => {
  //   console.log('Keyboard validation interval disabled - was causing state resets');
  // }, [isKeyboardVisible, keyboardTransitioning]);

  const dark = theme === 'dark';

  // Dynamic styles for landscape mode
  const containerStyle = useMemo(() => [
    localStyles.container, 
    dark && localStyles.darkBack,
    Platform.OS === 'ios' && {
      paddingTop: 20, // Reduced from 44 for better balance
    },
    isLandscape && {
      paddingTop: Platform.OS === 'ios' ? 0 : 0, // No extra padding in landscape
      paddingLeft: 0, // Remove left padding completely in landscape
      paddingRight: 0, // Remove right padding completely in landscape
    }
  ], [dark, isLandscape]);

  const titleStyle = useMemo(() => [
    localStyles.gameTitle,
    localStyles.underline,
    isLandscape && {
      marginTop: 2, // Minimal margin in landscape
      paddingHorizontal: 4, // Minimal horizontal padding
    }
  ], [isLandscape]);

  const contentPadding = useMemo(() => ({
    flexGrow: 1, 
    paddingTop: isLandscape ? 2 : 0,
    paddingHorizontal: 0, // Remove horizontal padding completely
    paddingLeft: 0, // Ensure no left padding
    paddingRight: isLandscape ? right || 4 : 0, // Add right padding in landscape to avoid system UI
  }), [isLandscape, right]);

  // Dynamic toolbar styles for edge-to-edge in landscape
  const topToolbarStyle = useMemo(() => [
    localStyles.richBar, 
    dark && localStyles.richBarDark,
    isLandscape && {
      marginLeft: 0,
      marginRight: 0,
      paddingLeft: 0,
      paddingRight: right || 4, // Add right padding to avoid system UI
    }
  ], [dark, isLandscape, right]);

  const bottomToolbarStyle = useMemo(() => [
    localStyles.richBar, 
    dark && localStyles.richBarDark, 
    localStyles.bottomToolbar,
    isLandscape && {
      marginLeft: 0,
      marginRight: 0,
      paddingLeft: 0,
      paddingRight: right || 4, // Add right padding to avoid system UI
    }
  ], [dark, isLandscape, right]);

  const toolbarContainerStyle = useMemo(() => [
    localStyles.toolbarContainer, 
    dark && localStyles.richBarDark,
    isLandscape && {
      marginLeft: 0,
      marginRight: 0,
      paddingRight: right || 4, // Add right padding to avoid system UI
    }
  ], [dark, isLandscape, right]);

  const flatStyleLandscape = useMemo(() => [
    localStyles.flatStyle,
    isLandscape && {
      paddingHorizontal: 0,
      marginHorizontal: 0,
    }
  ], [isLandscape]);

  const richEditorStyle = useMemo(() => [
    localStyles.rich,
    isLandscape && {
      marginLeft: 0,
      marginRight: 0,
    }
  ], [isLandscape]);

  // State for scroll hint
  const [showScrollHint, setShowScrollHint] = useState(true);

  // Hide scroll hint after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowScrollHint(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={containerStyle} edges={Platform.OS === 'ios' ? [] : ['top']}>
        <StatusBar barStyle={!dark ? 'dark-content' : 'light-content'} />
        <InsertLinkModal
          onDone={onLinkDone}
          forwardRef={linkModal}
        />
        <InsertMediaModal
          onDone={onMediaDone}
          forwardRef={mediaModal}
        />
        <KeyboardAvoidingView 
        key={`keyboard-${isLandscape}-${screenData.width}-${screenData.height}`} // Force re-render on orientation change
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? (isLandscape ? 0 : 44) : 0}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1 }}>
          <ScrollView
            style={[localStyles.scroll, dark && localStyles.scrollDark]}
            keyboardDismissMode={Platform.OS === 'ios' ? 'on-drag' : 'none'}
            keyboardShouldPersistTaps="handled"
            // @ts-ignore - ref prop type issue in newer TypeScript versions
            ref={scrollRef}
            nestedScrollEnabled={true}
            scrollEventThrottle={20}
            contentContainerStyle={contentPadding}>
          <View style={[
            localStyles.titleContainer,
            isLandscape && localStyles.titleContainerLandscape
          ]}>
            <Text variant="headlineMedium" style={localStyles.gameTitle}>
              <Text variant='headlineMedium' style={titleStyle}>{taskName}</Text> Details
            </Text>
          </View>
          
          {loading && (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={{ marginTop: 10, color: colors.textSecondary }}>Loading task details...</Text>
            </View>
          )}

          {!loading && (
            <>
              {editorReady && (
                <View style={[
                  localStyles.toolbarWrapper,
                  {
                    backgroundColor: colors.backgroundDefault
                  }
                ]}>
                  {showScrollHint && (
                    <View style={localStyles.scrollHintContainer}>
                      <Text style={localStyles.scrollHintText}>← Swipe for more buttons →</Text>
                    </View>
                  )}
                  <View style={localStyles.toolbarWithArrows}>
                    <TouchableOpacity 
                      style={[localStyles.toolbarArrowButton, localStyles.toolbarArrowLeft, dark && localStyles.toolbarArrowButtonDark]}
                      onPress={() => handleScrollToolbarLeft(topToolbarScrollRef)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="chevron-left" size={20} color={dark ? '#fff' : '#333'} />
                    </TouchableOpacity>
                    <View style={localStyles.toolbarScrollContainer}>
                      <RichToolbar
                        style={topToolbarStyle}
                        flatContainerStyle={flatStyleLandscape}
                        editor={richText}
                        disabled={disabled}
                        selectedIconTint={'#2095F2'}
                        disabledIconTint={'#bfbfbf'}
                        onPressAddImage={onPressAddImage}
                        onInsertLink={onInsertLink}
                        getEditor={() => richText.current}
                        actions={[
                          actions.setBold,
                          actions.setItalic,
                          actions.setUnderline,
                          actions.setStrikethrough,
                          actions.alignLeft,
                          actions.alignCenter,
                          actions.alignRight,
                          actions.alignFull,
                          actions.indent,
                          actions.outdent,
                          actions.setSubscript,
                          actions.setSuperscript,
                          actions.fontName,
                          actions.fontSize,
                          actions.foreColor,
                          actions.hiliteColor,
                          'customHeading1',
                          'customHeading2',
                          'customHeading3',
                          'customHeading4',
                          'customHeading5',
                          'customHeading6',
                        ]}
                        iconMap={{
                          [actions.fontName]: () => <Text style={[localStyles.tib, { color: 'blue' }]}>FN</Text>,
                          [actions.foreColor]: () => <Text style={[localStyles.tib, { color: 'blue' }]}>FG</Text>,
                          [actions.hiliteColor]: ({ tintColor }: IconRecord) => (
                            <Text style={[localStyles.tib, { color: tintColor, backgroundColor: 'yellow' }]}>BG</Text>
                          ),
                          customHeading1: ({ tintColor }: IconRecord) => (
                            <Text style={[localStyles.tib, { color: tintColor }]}>H1</Text>
                          ),
                          customHeading2: ({ tintColor }: IconRecord) => (
                            <Text style={[localStyles.tib, { color: tintColor }]}>H2</Text>
                          ),
                          customHeading3: ({ tintColor }: IconRecord) => (
                            <Text style={[localStyles.tib, { color: tintColor }]}>H3</Text>
                          ),
                          customHeading4: ({ tintColor }: IconRecord) => (
                            <Text style={[localStyles.tib, { color: tintColor }]}>H4</Text>
                          ),
                          customHeading5: ({ tintColor }: IconRecord) => (
                            <Text style={[localStyles.tib, { color: tintColor }]}>H5</Text>
                          ),
                          customHeading6: ({ tintColor }: IconRecord) => (
                            <Text style={[localStyles.tib, { color: tintColor }]}>H6</Text>
                          ),
                        }}
                        fontName={handleFontToggle}
                        fontSize={handleFontSize}
                        foreColor={handleForeColor}
                        hiliteColor={handleHiliteColor}
                        customHeading1={handleHeading1}
                        customHeading2={handleHeading2}
                        customHeading3={handleHeading3}
                        customHeading4={handleHeading4}
                        customHeading5={handleHeading5}
                        customHeading6={handleHeading6}
                      />
                    </View>
                    <TouchableOpacity 
                      style={[localStyles.toolbarArrowButton, localStyles.toolbarArrowRight, dark && localStyles.toolbarArrowButtonDark]}
                      onPress={() => handleScrollToolbarRight(topToolbarScrollRef)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="chevron-right" size={20} color={dark ? '#fff' : '#333'} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <RichEditor
                // initialFocus={true}
                initialFocus={false}
                firstFocusEnd={false}
                disabled={disabled}
                editorStyle={contentStyle} // default light style
                ref={richText}
                style={richEditorStyle}
                useContainer={false}
                initialHeight={150}
                enterKeyHint={'done'}
                // containerStyle={{borderRadius: 24}}
                placeholder={'enter task details'}
                initialContentHTML={taskDetails}
                editorInitializedCallback={editorInitializedCallback}
                onChange={handleChange}
                // onHeightChange={handleHeightChange}
                onPaste={handlePaste}
                onKeyUp={handleKeyUp}
                onKeyDown={handleKeyDown}
                onInput={handleInput}
                onMessage={handleMessage}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onCursorPosition={handleCursorPosition}
                pasteAsPlainText={false}
              />
            </>
          )}
        </ScrollView>

        {/* Emoji selector with absolute positioning */}
        {emojiVisible && (
          <View style={[localStyles.colorSelectorContainer, {
            bottom: 0, // Position at screen bottom, let component handle safe area internally
          }]}>
            <EmojiView onSelect={handleInsertEmoji} />
          </View>
        )}
        
        {/* Font selector with absolute positioning */}
        {fontVisible && (
          <View style={[localStyles.colorSelectorContainer, {
            bottom: 0, // Position at screen bottom, let component handle safe area internally
          }]}>
            <FontView onSelect={handleFontSelect} />
          </View>
        )}
        
        {/* Color selectors with absolute positioning */}
        {foreColorVisible && (
          <View style={[localStyles.colorSelectorContainer, {
            bottom: 0, // Position at screen bottom, let component handle safe area internally
          }]}>
            <ColorView onSelect={handleForeColorSelect} title="Select Text Color" />
          </View>
        )}
        {hiliteColorVisible && (
          <View style={[localStyles.colorSelectorContainer, {
            bottom: 0, // Position at screen bottom, let component handle safe area internally
          }]}>
            <ColorView onSelect={handleHiliteColorSelect} title="Select Highlight Color" />
          </View>
        )}
        </View>
      </KeyboardAvoidingView>

      {/* Bottom Toolbar - positioned absolutely outside ScrollView */}
      {editorReady && !fontVisible && !foreColorVisible && !hiliteColorVisible && !emojiVisible && (
        <View style={[
          toolbarContainerStyle,
          {
            position: 'absolute',
            bottom: Platform.OS === 'ios' && isKeyboardVisible && keyboardHeight > 0 ? 
              keyboardHeight - bottom + 10 : bottom,
            left: 0,
            right: 0,
            backgroundColor: dark ? '#191d20' : colors.backgroundDefault,
            zIndex: 999,
          }
        ]}>
          <View style={localStyles.toolbarWithArrows}>
            <TouchableOpacity 
              style={[localStyles.toolbarArrowButton, localStyles.toolbarArrowLeft, dark && localStyles.toolbarArrowButtonDark]}
              onPress={() => handleScrollToolbarLeft(bottomToolbarScrollRef)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="chevron-left" size={20} color={dark ? '#fff' : '#333'} />
            </TouchableOpacity>
            <View style={localStyles.toolbarScrollContainer}>
              <RichToolbar
                style={bottomToolbarStyle}
                flatContainerStyle={flatStyleLandscape}
                editor={richText}
                disabled={disabled}
                selectedIconTint={'#2095F2'}
                disabledIconTint={'#bfbfbf'}
                onPressAddImage={onPressAddImage}
                onInsertLink={onInsertLink}
                getEditor={() => richText.current}
                actions={[
                  actions.undo,
                  actions.redo,
                  'cutText',
                  'copyText',
                  'pasteText',
                  'translateText',
                  actions.insertLink,
                  actions.checkboxList,
                  actions.insertBulletsList,
                  actions.insertOrderedList,
                  actions.blockquote,
                  actions.code,
                  actions.line,
                  actions.insertVideo,
                  actions.insertImage,
                  'insertEmoji',
                  actions.keyboard
                ]}
                iconMap={{
                 insertEmoji: EmojiIcon,
                 insertHTML: HtmlIcon,
                 copyText: CopyIcon,
                 cutText: CutIcon,
                 translateText: TranslateIcon,
                 pasteText: PasteIcon
                }}
                insertEmoji={handleEmoji}
                copyText={handleCopy}
                cutText={handleCut}
                pasteText={handlePasteFromClipboard}
                translateText={handleTranslate}
                insertVideo={handleInsertVideo}
              />
            </View>
            <TouchableOpacity 
              style={[localStyles.toolbarArrowButton, localStyles.toolbarArrowRight, dark && localStyles.toolbarArrowButtonDark]}
              onPress={() => handleScrollToolbarRight(bottomToolbarScrollRef)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="chevron-right" size={20} color={dark ? '#fff' : '#333'} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Keyboard Dismissal Overlay for iOS - disabled to prevent touch interference */}
      {false && Platform.OS === 'ios' && (isKeyboardVisible || keyboardHeight > 0) && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 400, // Fixed bottom space to leave room for FABs
            backgroundColor: 'transparent',
            zIndex: 500, // Below FABs but above content
          }}
          activeOpacity={1}
          onPress={() => {
            Keyboard.dismiss();
            richText.current?.blurContentEditor();
          }}
        />
      )}
      
      {/* Keyboard Dismiss Button for iOS */}
      {Platform.OS === 'ios' && (isKeyboardVisible || keyboardHeight > 0) && (
        <FAB
          icon="keyboard-close"
          onPress={() => {
            Keyboard.dismiss();
            // Don't blur editor immediately to prevent focus conflicts
            setTimeout(() => {
              richText.current?.blurContentEditor();
            }, 100);
          }}
          style={[
            {
              position: 'absolute',
              right: isLandscape ? 56 + 72 : right + 26 + 72, // Position to the left of save button
              bottom: isKeyboardVisible ? 350 : bottom + 56 + 8, // Simple: fixed position when keyboard visible
              backgroundColor: colors.textSecondary,
              zIndex: 1000
            }
          ]}
          color="white"
          size="small"
        />
      )}

      {/* FAB - Hidden if current user is not an admin and did not create the task and task is not assigned to them */}
      {canFullyEdit && (
        <FAB
          icon="content-save"
          // label="Save"
          onPress={handleSave}
          style={[
            localStyles.fabAbsolute,
            {
              right: isLandscape ? 56 : right + 26, // Closer to edge in landscape
              bottom: (fontVisible || foreColorVisible || hiliteColorVisible || emojiVisible)
                ? bottom + 8 // Just above safe area when toolbar is hidden
                : (isKeyboardVisible || keyboardHeight > 0)
                  ? Platform.OS === 'ios'
                    ? 370 // iOS: Simple fixed position above keyboard
                    : keyboardHeight + 56 + 8 // Android: keyboard height + toolbar + padding (safe area handled automatically)
                  : bottom + 56 + 8, // Above safe area + toolbar height + padding
              zIndex: 1000
            }
          ]}
          color="white"
        />
      )}

      {/* Toast Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        style={[
          {
            position: 'absolute',
            bottom: (fontVisible || foreColorVisible || hiliteColorVisible || emojiVisible)
              ? bottom + 16 // Just above safe area when toolbar is hidden
              : (isKeyboardVisible || keyboardHeight > 0)
                ? Platform.OS === 'ios'
                  ? 420 // iOS: Fixed position above FABs
                  : keyboardHeight + 56 + 16 // Android: keyboard height + toolbar + padding
                : bottom + 56 + 16, // Above safe area + toolbar height + padding
            left: isLandscape ? 8 : 16, // Closer to edge in landscape
            right: isLandscape ? 8 : 16, // Closer to edge in landscape
            borderRadius: 8,
            elevation: 8,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          },
          snackbarError ? { backgroundColor: colors.error } : { backgroundColor: colors.success }
        ]}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
          labelStyle: { color: 'white' }
        }}
      >
        <Text style={{
          fontSize: 14,
          fontWeight: '500',
          color: 'white',
        }}>
          {snackbarMessage}
        </Text>
      </Snackbar>

      {/* Unsaved Changes Confirmation Dialog */}
      <ConfirmationDialog
        visible={unsavedChangesDialogState.visible}
        title={unsavedChangesDialogState.title}
        message={unsavedChangesDialogState.message}
        buttons={unsavedChangesDialogState.buttons}
        onDismiss={hideUnsavedChangesDialog}
      />
    </SafeAreaView>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDefault,
  },
  gameTitle: {
    fontFamily: fonts.fredokaBold,
    width: '100%',
    textAlign: 'center',
    marginBottom: 8, // Reduced from 16
    color: colors.highlight,
    textShadowColor: colors.shadow,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  title: {
    marginTop: 0, // Remove top margin that interferes with centering
    marginBottom: 0, // Remove bottom margin that interferes with centering
    paddingHorizontal: 16,
    // fontStyle: 'italic',
    color: colors.textPrimary,
    textAlign: 'center',
    backgroundColor: colors.backgroundDefault,
  },
  titleContainer: {
    display: 'flex', // Explicitly set flex display
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 40, // Reduced from 60
    marginTop: Platform.OS === 'ios' ? 16 : 4, // Increased to balance with bottom spacing
    marginBottom: 16, // Increased to match top margin for balance
  },
  titleContainerLandscape: {
    minHeight: 30, // Reduced from 40
    marginTop: 2, // Reduced from 4
    marginBottom: 6, // Reduced from 8
    paddingVertical: 0, // Remove conflicting padding
  },
  fabAbsolute: {
    position: 'absolute',
    backgroundColor: colors.accent,
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 5,
  },
  rich: {
    minHeight: 150,
    borderBottomWidth: 0,
    borderColor: '#e3e3e3',
  },
  topVi: {
    backgroundColor: '#fafafa',
  },
  richBar: {
    borderColor: '#efefef',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 0, // Remove default padding
  },
  richBarDark: {
    backgroundColor: '#191d20',
    borderColor: '#696969',
  },
  scroll: {
    flex: 1,
    // backgroundColor: colors.backgroundDefault,
  },
  scrollDark: {
    backgroundColor: '#2e3847',
  },
  darkBack: {
    backgroundColor: '#191d20',
  },
  item: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e8e8e8',
    flexDirection: 'row',
    height: 40,
    alignItems: 'center',
    paddingHorizontal: 15,
  },

  input: {
    flex: 1,
  },

  tib: {
    textAlign: 'center',
    color: '#515156',
  },
  underline: {
    textDecorationLine: 'underline',
    // textDecorationStyle: 'double',
    borderBottomWidth: 3,
    borderBottomColor: colors.textPrimary,
    paddingBottom: 2,
  },
  flatStyle: {
    paddingHorizontal: 0, // Remove default padding for edge-to-edge
  },
  keyboardAvoidingView: {
    // No absolute positioning - let it flow naturally at bottom
  },
  bottomToolbar: {
    marginTop: 0,
    paddingTop: 0,
  },
  toolbarContainer: {
    backgroundColor: colors.backgroundPaper,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#efefef',
    marginHorizontal: 0, // Ensure no margins
    paddingHorizontal: 0, // Ensure no padding
  },
  customActionsRow: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundPaper,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'flex-start',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e8e8e8',
  },
  colorSelectorContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 10,
  },
  toolbarWrapper: {
    position: 'relative',
    width: '100%',
  },
  scrollIndicatorLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 10,
    pointerEvents: 'none',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.1)',
  },
  scrollIndicatorRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 10,
    pointerEvents: 'none',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0, 0, 0, 0.1)',
  },
  scrollIndicatorDark: {
    backgroundColor: 'rgba(25, 29, 32, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollHintContainer: {
    position: 'absolute',
    top: -28,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
    pointerEvents: 'none',
  },
  scrollHintText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  toolbarWithArrows: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  toolbarArrowButton: {
    width: 32,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e0e0e0',
  },
  toolbarArrowLeft: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  toolbarArrowRight: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  toolbarArrowButtonDark: {
    backgroundColor: '#2a2a2a',
    borderColor: '#444',
  },
  toolbarScrollContainer: {
    flex: 1,
  },
});