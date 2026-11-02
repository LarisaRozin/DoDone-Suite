// /*
//  * Copyright (c) 2025 LarisaRozin
//  * DoDone - Task Management, Allowance & Bonus Tracking Application
//  * All rights reserved.
//  */
// import { Accordion, AccordionDetails, AccordionSummary, Avatar, Box, Button, Checkbox, FormControl, FormControlLabel, Grid, IconButton, List, ListItem, ListItemAvatar, ListItemText, Tab, Tabs, Typography } from "@mui/material";
// import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
// import GroupIcon from '@mui/icons-material/Group';
// import DeleteIcon from '@mui/icons-material/Delete';
// import AddIcon from '@mui/icons-material/Add';
// import { useAuth } from "dodone-shared";
// import { useCallback, useEffect, useRef, useState } from "react";
// import { type ToDoGroup } from "../../types/toDo.ts";
// import type { guid } from "../../types/aliases.ts";
// import AddOrEditGroupDialog from "./AddOrEditGroupDialog.tsx";
// import { useGlobalNotification } from "../globalNotificationProvider/UseGlobalNotification.tsx";
// import { API_ROUTES } from "../../api/apiRoutes.ts";

// export default function SettingsPage() {
//     const { user, token } = useAuth();
//     const [tab, setTab] = useState(0);
//     const [groups, setGroups] = useState<ToDoGroup[]>([]);
//     const [editingGroup, setEditingGroup] = useState<Partial<ToDoGroup> | null>(null);
//     const [openDialog, setOpenDialog] = useState(false);
//     const openButtonRef = useRef(null);
//     const { setNotification: setNotification } = useGlobalNotification();
//     const [isSaving, setIsSaving] = useState(false);

//     const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
//         event.preventDefault();
//         setTab(newValue);
//     };

//     const openAddDialog = () => {
//         if (!user) return;

//         setEditingGroup({ teamId: user.teamId, isActive: true });
//         setOpenDialog(true);
//     };

//     const saveGroups = async () => {
//         if (!user) return;
//         try {
//             const groupsToSave = groups.filter(g => g.id == null || g.updatedBy != null);
//             if (groupsToSave.length == 0) {
//                 console.log("No groups to save");
//                 setNotification({ message: "No groups to save", type: "warning" });
//                 return;
//             }

//             setIsSaving(true);

//             const response = await fetch(API_ROUTES.toDoGroups.updateList, {
//                 method: 'PUT',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(groups.filter(g => g.id == null || g.updatedBy != null)),
//             });

//             if (response.ok) {
//                 console.log("Groups saved successfully");
//                 setNotification({ message: "Groups saved successfully", type: "success" });
//                 fetchGroups();
//                 setOpenDialog(false);
//                 setEditingGroup(null);
//             }
//         } catch (e) {
//             console.log("error saving groups: ", e);
//             setNotification({ message: "Error saving groups", type: "error" });
//         } finally {
//             setIsSaving(false);
//         }
//     }

//     function addGroup(newGroup: ToDoGroup) {
//         setGroups(prevGroups => [...prevGroups, newGroup]);

//         if (openButtonRef.current) {
//             (openButtonRef.current as HTMLButtonElement).blur();
//         }
//     }

//     const deleteGroup = async (id: guid | null) => {
//         if (!user || !id) return;

//         try {
//             const response = await fetch(API_ROUTES.toDoGroups.delete(id), {
//                 method: 'DELETE',
//                 headers: { 'Accept': 'application/json' },
//             });

//             if (response.ok) {
//                 console.log("Group deleted successfully");
//                 setNotification({ message: "Group deleted successfully", type: "success" });
//             }
//         } catch (e) {
//             console.log("error deleting group: ", e);
//             setNotification({ message: "Error deleting group", type: "error" });
//         }
//     }

//     const fetchGroups = useCallback(async () => {
//         if (!user || !user.teamId) return;

//         fetch(API_ROUTES.toDoGroups.getByTeamId(user.teamId), {
//             headers: { Authorization: `Bearer ${token}` }
//         })
//         .then(res => res.json())
//         .then(data => {
//             if (Array.isArray(data) && data.length > 0) {
//                 setGroups(data);
//             }
//         })
//         .catch((e) => {
//             console.log("Error fetching todo groups", e)
//             setNotification({ message: "Error fetching todo groups", type: "error" });
//         });
//     }, [token, user, setNotification]);


//     useEffect(() => {
//         fetchGroups();
//     }, [fetchGroups]);

//     function loadKindsForGroup(groupId: string) {
//         console.log("Implement Loading kinds for group!!!!!!", groupId);
//         // throw new Error("Function not implemented.");
//     }

//     return (
//         <Box sx={{ padding: 2,
//             display: 'flex',
//             flexDirection: 'column',
//             alignItems: 'center',
//             minHeight: '80vh',
//          }}>
//         <Typography variant="h3" sx={{ mb: 3, mt: 1}}>Settings</Typography>
//         {user ? (
//             <Accordion sx={{ width: '100%', maxWidth: 600, mb: 2 }} defaultExpanded>
//                 <AccordionSummary expandIcon={<ExpandMoreIcon />}>
//                     <Typography variant="h6">Define ToDo Groups and Kinds</Typography>
//                 </AccordionSummary>
//                 <AccordionDetails>
//                     <Tabs value={tab} onChange={handleTabChange} aria-label="ToDo Types">
//                         <Tab label="Groups" />
//                         <Tab label="Kinds" />
//                     </Tabs>
//                     {tab === 0 && (
//                         <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
//                             { groups.length === 0 && (
//                                 <Typography variant="body2" sx={{ mt: 2 }}>No groups defined yet. Add some.</Typography>
//                             )} 
//                             <List sx={{ width: '100%', bgcolor: 'background.paper', alignItems: 'center', justifyContent: 'center'}}> 
//                                 {groups.map((item) => (
//                                     <ListItem  
//                                         key={item.id || "new-" + crypto.randomUUID()}
//                                         secondaryAction={
//                                             <IconButton edge="start" aria-label="delete" onClick={() => {
//                                                 setGroups(groups.filter(i => i.name !== item.name));
//                                                 deleteGroup(item.id ?? null)
//                                             }}>
//                                                 <DeleteIcon />
//                                             </IconButton>
//                                         }
//                                     >
//                                         <ListItemAvatar>
//                                             <Avatar>
//                                                 <GroupIcon />
//                                             </Avatar>
//                                         </ListItemAvatar>
//                                         <ListItemText sx={{ minWidth: 100, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}
//                                             primary={item.name}
//                                             secondary={item.description}
//                                         />
//                                         <FormControl sx={{ display: 'flex',
//                                             alignItems: 'center', justifyContent: 'center', overflowX: 'hidden' }}>
//                                             <FormControlLabel 
//                                                 control={
//                                                     <Checkbox
//                                                         checked={item.isActive || false}
//                                                     />
//                                                 }
//                                                 label="Active"
//                                             />
//                                         </FormControl>
//                                     </ListItem>
//                                 ))}
//                                 <ListItem sx={{ mt: 2, justifyContent: 'center' }} key="add-item">
//                                 <Box sx={{ mt: 3,
//                                         mb: 3,
//                                         width: '100%',
//                                         display: 'flex', 
//                                         alignItems: 'center', 
//                                         justifyContent: 'center' }}>
//                                     <Button variant="contained" 
//                                             color="secondary" 
//                                             ref={openButtonRef}
//                                             onClick={() => openAddDialog()}>
//                                         <AddIcon sx={{ mr: 1 }} />
//                                         Add Group
//                                     </Button>
//                                     <Button sx={{ml: 3}} 
//                                             variant="contained" 
//                                             color="secondary" 
//                                             disabled={isSaving}
//                                             onClick={() => saveGroups()}>
//                                         Save
//                                     </Button>
//                                     <div>
//                                         <AddOrEditGroupDialog openDialog={openDialog} 
//                                                             setOpenDialog={setOpenDialog} 
//                                                             editingGroup={editingGroup} 
//                                                             onGroupAdded={addGroup}
//                                                             existingGroupNames={groups.map(g => g.name)}
//                                                             />
//                                     </div>
//                                 </Box>
//                                 </ListItem>
//                             </List>
//                         </Box>
//                     )}
//                     {tab === 1 && (
//                         <Grid container spacing={2} sx={{ mt: 2 }}>
//                             <Grid size={4}>
//                                 <List>
//                                     {groups.map(group => (
//                                         <ListItem key={group.id || "new-" + crypto.randomUUID()}
//                                             onClick={() => {loadKindsForGroup(group.id!)}}
//                                         >
//                                             <ListItemAvatar>
//                                                 <Avatar>
//                                                     <GroupIcon />
//                                                 </Avatar>
//                                             </ListItemAvatar>
//                                             <ListItemText sx={{ minWidth: 100, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}
//                                                 primary={group.name}
//                                                 secondary={group.description}
//                                             />
//                                         </ListItem>
//                                     ))}
//                                 </List>
//                             </Grid>
//                             <Grid size={8}>
//                                 <List>
//                                     <ListItem>
//                                         <ListItemText primary="Select a group to view its kinds." />
//                                     </ListItem>
//                                 </List>
//                             </Grid>
//                         </Grid>
//                     )}
//                 </AccordionDetails>
//             </Accordion>
//         ) : (
//             <p>Please log in to access settings.</p>
//         )}
//     </Box>
//     );
// }
