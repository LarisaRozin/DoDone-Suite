/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import React from "react";
import { type User } from "dodone-shared";

type EditProfilePageProps = {
    user: User | null;
};

const EditProfilePage: React.FC<EditProfilePageProps> = ({ user }) => {
    console.log("EditProfilePage user:", user);
    return (
        <div>
            <h2>Edit Profile</h2>
            <p>Profile editing functionality coming soon.</p>
        </div>
    );
};

export default EditProfilePage;