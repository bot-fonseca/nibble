import { Platform } from 'react-native';

/** True when running as the web / "Add to Home Screen" version (e.g. on iPhone). */
export const IS_WEB = Platform.OS === 'web';
