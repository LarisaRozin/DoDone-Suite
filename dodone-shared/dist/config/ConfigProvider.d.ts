import { type ReactNode } from 'react';
import { type LibraryConfig } from './ConfigContext';
interface ConfigProviderProps {
    children: ReactNode;
    config: LibraryConfig;
}
export declare function ConfigProvider({ children, config }: ConfigProviderProps): import("react/jsx-runtime").JSX.Element;
export {};
