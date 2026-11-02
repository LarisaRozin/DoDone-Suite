/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
// import ToDoManager from "./toDoAdmin/ToDoManager.tsx";
import { type User } from "dodone-shared";
import WelcomeGuest from "./WelcomeGuest.tsx";
import { Typography } from "@mui/material";
import theme from "../themes/default.tsx";

interface AppContentProps {
    user: User | null;
}
export default function AppContent({ user }: AppContentProps) {
    if (!user) {
        return (
            <WelcomeGuest />
        );
    }

    return (
        // <ToDoManager />
        <Typography
            variant="h2"
            sx={{
                marginTop: 12,
                fontFamily: '"Fredoka", "Roboto", "Helvetica", "Arial", sans-serif',
                fontWeight: 700,
                width: '100%',
                textAlign: 'center',
                marginBottom: 2,
                color: theme.palette.dodone.highlight,
                textShadow: `1px 1px 2px ${theme.palette.dodone.shadow}`,
                fontSize: '3rem',
            }}
        >
            Pardon our Dust.
            <br />
            <br />
            DoDone Web Application Coming Soon!
        </Typography>
    );
}