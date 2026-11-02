/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import React from 'react';
import { Box, TextField, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio } from '@mui/material';

import { type User } from "dodone-shared";

export interface UserFieldsFormProps {
    fields: User;
    onFieldsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    showPassword?: boolean;
    showIntendedUse?: boolean;
}

export default function UserFieldsForm({ fields, onFieldsChange, showPassword = true, showIntendedUse = true }: UserFieldsFormProps) {
    return (
        <Box>
            <TextField
                label="Username"
                name="userName"
                value={fields?.userName || ''}
                onChange={onFieldsChange}
                fullWidth
                margin="dense"
                autoComplete="username"
            />
            {showPassword && (
                <TextField
                    label="Password"
                    name="password"
                    type="password"
                    value={fields?.password || ''}
                    onChange={onFieldsChange}
                    fullWidth
                    margin="dense"
                    autoComplete="new-password"
                />
            )}
            <TextField
                label="Email"
                name="email"
                type="email"
                value={fields?.email || ''}
                onChange={onFieldsChange}
                fullWidth
                margin="dense"
                autoComplete="email"
            />
            <TextField
                label="First Name"
                name="firstName"
                value={fields?.firstName || ''}
                onChange={onFieldsChange}
                fullWidth
                margin="dense"
                autoComplete="given-name"
            />
            <TextField
                label="Last Name"
                name="lastName"
                value={fields?.lastName || ''}
                onChange={onFieldsChange}
                fullWidth
                margin="dense"
                autoComplete="family-name"
            />
            <TextField
                label="Middle Name (optional)"
                name="middleName"
                value={fields?.middleName || ''}
                onChange={onFieldsChange}
                fullWidth
                margin="dense"
            />
            <TextField
                label="Salutation (optional)"
                name="salutation"
                value={fields?.salutation || ''}
                onChange={onFieldsChange}
                fullWidth
                margin="dense"
            />
            {showIntendedUse && (
                <FormControl component="fieldset" sx={{ mb: 2, mt: 2,
                                                  display: 'flex',
                                                  alignItems: 'center', 
                                                  justifyContent: 'center' }}>
                    <FormLabel component="legend" sx={{ mr: 2, 
                                                        minWidth: 110, 
                                                        width: '100%',
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center' 
                                                    }}>
                        Intended Use
                    </FormLabel>
                    <RadioGroup
                        row
                        value="personal"
                        onChange={onFieldsChange}
                        name="intendedUse"
                    >
                        <FormControlLabel value="personal" control={<Radio />} label="Personal" />
                        <FormControlLabel value="business" control={<Radio />} label="Business" />
                    </RadioGroup>
                </FormControl>
            )}
        </Box>
    );
}
