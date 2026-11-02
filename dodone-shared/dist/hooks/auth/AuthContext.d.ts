import { type AuthState, type AuthAction } from "./AuthState";
type AuthContextType = AuthState & {
    dispatch: React.Dispatch<AuthAction>;
};
export declare const AuthContext: import("react").Context<AuthContextType | undefined>;
export {};
