// /*
//  * Copyright (c) 2025 LarisaRozin
//  * DoDone - Task Management, Allowance & Bonus Tracking Application
//  * All rights reserved.
//  */
// import React, { useEffect, useState } from "react";
// import Grid from "@mui/material/Grid";
// import {
//     Avatar,
//     Button,
//     Dialog,
//     DialogActions,
//     DialogContent,
//     DialogTitle,
//     Typography,
//     Box
// } from "@mui/material";
// import { deepPurple } from "@mui/material/colors";
// import { useAuth } from "dodone-shared";

// import { type User } from "dodone-shared";
// import UserFieldsForm from './UserFieldsForm.tsx';
// import { API_ROUTES } from "../../api/apiRoutes.ts";

// const defaultUserFields: User = {
//     id: "",
//     teamId: "",
//     userName: "",
//     email: "",
//     firstName: "",
//     lastName: "",
//     middleName: "",
//     salutation: "",
//     isAdmin: false,
//     isBusiness: false,
//     createdAt: "",
//     updatedAt: "",
//     createdBy: "",
//     updatedBy: ""
// };

// const ManageTeamPage: React.FC = () => {
//     const {user, token} = useAuth();
//     const [teamMembers, setTeamMembers] = useState<User[]>([]);
//     const [selectedUser, setSelectedUser] = useState<User | null>(null);
//     const [modalOpen, setModalOpen] = useState(false);
//     const [editUser, setEditUser] = useState<User | null>(null);
//     const [addModalOpen, setAddModalOpen] = useState(false);
//     const [newUser, setNewUser] = useState<User>(defaultUserFields);

//     useEffect(() => {
//         if (!user || !user.teamId) return;
//         fetch(API_ROUTES.user.getTeam(user.id, user.teamId), {
//             headers: { Authorization: `Bearer ${token}` }
//         })
//         .then(res => res.json())
//         .then(setTeamMembers)
//         .catch((e) => {
//             console.error("Failed to fetch team members:", e);
//             setTeamMembers([])
//         });
//     }, [user, token]);

//     const handleAvatarClick = (clickedUser: User) => {
//         setSelectedUser(clickedUser);
//         setEditUser(clickedUser);
//         setModalOpen(true);
//     };

//     const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         if (!editUser) return;
//         setEditUser({ ...editUser, [e.target.name]: e.target.value });
//     };

//     const handleNewUserEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         setNewUser({ ...newUser, [e.target.name]: e.target.value });
//     };

//     const handleSave = () => {
//         if (!editUser) return;
//         // TODO: why pass Id in parameter when passing the whole user object in body?
//         fetch(API_ROUTES.user.save(editUser.id), {
//             method: "PUT",
//             headers: {
//                 "Content-Type": "application/json",
//                 Authorization: `Bearer ${token}`
//             },
//             body: JSON.stringify(editUser)
//         })
//         .then(() => {
//             setTeamMembers(members =>
//                 members.map(u => (u.id === editUser.id ? editUser : u))
//             );
//             setModalOpen(false);
//         })
//         .catch((ex) => console.log(ex));
//     };

//     const handleDelete = () => {
//         if (!selectedUser) return;
//         fetch(API_ROUTES.user.delete(selectedUser.id), {
//             method: "DELETE",
//             headers: { Authorization: `Bearer ${token}` }
//         })
//         .then(() => {
//             setTeamMembers(members =>
//                 members.filter(u => u.id !== selectedUser.id)
//             );
//             setModalOpen(false);
//         })
//         .catch((ex) => console.log(ex));
//     };

//     const handleAddUser = () => {
//         if (!user || !user.teamId || !newUser?.userName || !newUser.email || !newUser.firstName || !newUser.lastName) return;
//         fetch(API_ROUTES.user.create, {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//                 Authorization: `Bearer ${token}`
//             },
//             body: JSON.stringify({
//                 teamId: user.teamId,
//                 userName: newUser.userName,
//                 firstName: newUser.firstName,
//                 lastName: newUser.lastName,
//                 middleName: newUser.middleName || null,
//                 salutation: newUser.salutation || null,
//                 email: newUser.email,
//                 isAdmin: newUser.isAdmin,
//                 isBusiness: user.isBusiness,
//                 createdBy: user.id
//             })
//         })
//         .then(res => res.json())
//         .then((created: User) => {
//             console.log("Created user:", created);
//             console.log("members before:", teamMembers);
//             setTeamMembers(teamMembers => [...teamMembers, created]);
//             console.log("members after:", teamMembers);
//             setAddModalOpen(false);
//             setNewUser(defaultUserFields);
//         })
//         .catch((ex) => console.log(ex));
//     };

//     return (
//         <Box sx={{ p: 3 }}>
//             <Typography variant="h4" gutterBottom>
//                 Manage {user?.isBusiness ? "Team" : "Family"}
//             </Typography>
//             {teamMembers.length === 0 ? (
//                 <Typography variant="body1" sx={{ mb: 2 }}>
//                     No team/family members yet. Add your first member below!
//                 </Typography>
//             ) : (
//                 <Grid container spacing={3} sx={{ mb: 3 }}>
//                     {teamMembers.map(member => (
//                         <Grid component="div" key={member.id}>
//                             <Box 
//                                 sx={{ cursor: "pointer", textAlign: "center" }}
//                                 onClick={() => handleAvatarClick(member)}
//                             >
//                                 <Avatar
//                                     sx={{
//                                         width: 80,
//                                         height: 80,
//                                         bgcolor: deepPurple[500],
//                                         fontSize: 36,
//                                         margin: "0 auto"
//                                     }}
//                                 >
//                                     {member.userName[0]?.toUpperCase() || "?"}
//                                 </Avatar>
//                                 <Typography variant="subtitle1" sx={{ mt: 1 }}>
//                                     {member.userName}
//                                 </Typography>
//                             </Box>
//                         </Grid>
//                     ))}
//                 </Grid>
//             )}
//             <Button
//                 variant="contained"
//                 color="primary"
//                 onClick={() => setAddModalOpen(true)}
//             >
//                 Add {user?.isBusiness ? "Team" : "Family"} Member
//             </Button>

//             <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
//                 <DialogTitle>Edit {user?.isBusiness ? "Team" : "Family"} Member</DialogTitle>
//                 <DialogContent>
//                     <UserFieldsForm
//                         fields={editUser || defaultUserFields}
//                         onFieldsChange={handleEditChange}
//                         showPassword={false}
//                         showIntendedUse={false}
//                     />
//                 </DialogContent>
//                 <DialogActions>
//                     <Button onClick={handleDelete} color="error">
//                         Delete
//                     </Button>
//                     <Button onClick={() => setModalOpen(false)}>Cancel</Button>
//                     <Button onClick={handleSave} variant="contained" color="primary">
//                         Save
//                     </Button>
//                 </DialogActions>
//             </Dialog>

//             <Dialog open={addModalOpen} onClose={() => setAddModalOpen(false)}>
//                 <DialogTitle>Add {user?.isBusiness ? "Team" : "Family"} Member</DialogTitle>
//                 <DialogContent>
//                     <UserFieldsForm
//                         fields={newUser}
//                         onFieldsChange={handleNewUserEditChange}
//                         showPassword={false}
//                         showIntendedUse={false}
//                     />
//                 </DialogContent>
//                 <DialogActions>
//                     <Button onClick={() => setAddModalOpen(false)}>Cancel</Button>
//                     <Button
//                         onClick={handleAddUser}
//                         variant="contained"
//                         color="primary"
//                         disabled={
//                             !newUser?.userName || !newUser.email || !newUser.firstName || !newUser.lastName
//                         }
//                     >
//                         Add
//                     </Button>
//                 </DialogActions>
//             </Dialog>
//         </Box>
//     );
// };

// export default ManageTeamPage;