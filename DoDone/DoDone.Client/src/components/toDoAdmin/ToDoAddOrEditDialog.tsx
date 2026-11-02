// /*
//  * Copyright (c) 2025 LarisaRozin
//  * DoDone - Task Management, Allowance & Bonus Tracking Application
//  * All rights reserved.
//  */
// import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Select, TextField } from '@mui/material';
// import { useAuth } from '../../hooks/auth/useAuth.tsx';
// // import { useState } from 'react';
// import type { ToDoItem } from '../../types/toDo.ts';

// // const defaultToDoItem: Partial<ToDoItem> = {
// //     title: '',
// //     description: '',
// //     rank: 0,
// //     weight: 0,
// //     kind: { id: 0, 
// //             name: '', 
// //             description: '', 
// //             isActive: true, 
// //             group: { 
// //                 id: 0, 
// //                 name: '', 
// //                 description: '', 
// //                 isActive: true, 
// //                 createdBy: '', 
// //                 createdAt: new Date() 
// //             }, 
// //             createdBy: '', 
// //             createdAt: new Date() },
// //     dueDate: undefined,
// //     percentCompleted: 0,
// //     assignedTo: '',
// //     assignedBy: '',
// //     parent: null,
// // };

// interface ToDoAddOrEditDialogProps {
//     openDialog: boolean;
//     setOpenDialog: React.Dispatch<React.SetStateAction<boolean>>;
//     // onClose: () => void;
//     // onSave: (toDo: Partial<ToDoItem>) => void;
//     editingToDo: Partial<ToDoItem> | null;
//     setEditingToDo: React.Dispatch<React.SetStateAction<Partial<ToDoItem> | null>>;
// }

// export default function ToDoAddOrEditDialog({openDialog: open, setOpenDialog, editingToDo, setEditingToDo}: ToDoAddOrEditDialogProps) {
//     const {user} = useAuth();
//     // const [editingToDo, setEditingToDo] = useState<Partial<ToDoItem> | null>(null);

//     // Helper for field changes with type safety
//     function handleFieldChange<K extends keyof ToDoItem>(field: K, value: ToDoItem[K]) {
//         setEditingToDo((prev: Partial<ToDoItem> | null) => ({ ...prev, [field]: value }));
//     }

//     const handleSaveToDo = async () => {
//         // if (!editingToDo && !user) return;
//         // const isEdit = !!editingToDo?.id;
//         // const url = isEdit ? `/api/todo/${editingToDo.id}` : 'api/todo';
//         // const method = isEdit ? 'PUT' : 'POST';

//         // editingToDo.assignedBy = user?.id;
//         // try {
//         //     const response = await fetch(url, {
//         //         method,
//         //         headers: { 'Content-Type': 'application/json' },
//         //         body: JSON.stringify(editingToDo),
//         //     });

//         //     if (response.ok) {
//         //         fetch('/api/todo/todos')
//         //             .then(res => res.json())
//         //             .then(setToDos)
//         //             .catch((e) => console.log("error fetching todos after save: ", e));
//         //         setOpenDialog(false);
//         //         setEditingToDo(null);
//         //     }
//         // } catch (e) {
//         //     console.log("error saving todo: ", e);
//         // }
//     };

//     return (
//             <div>
//                 {user && <Dialog open={open} onClose={() => setOpenDialog(false)}>
//                     <DialogTitle>{editingToDo?.id ? 'Edit ToDo' : 'Add ToDo'}</DialogTitle>
//                     <DialogContent>
//                         // TODO: parent dropdown
//                         {/* <TextField
//                             label="Parent ID"
//                             type="number"
//                             fullWidth
//                             margin="dense"
//                             value={editingToDo?.parentId ?? ''}
//                             onChange={e => handleFieldChange('parentId', Number(e.target.value))}
//                         />
//  */}
//                         <TextField
//                             label="Title"
//                             fullWidth
//                             margin="dense"
//                             value={editingToDo?.title || ''}
//                             onChange={e => handleFieldChange('title', e.target.value)}
//                         />
//                         <TextField
//                             label="Description"
//                             fullWidth
//                             margin="dense"
//                             value={editingToDo?.description || ''}
//                             onChange={e => handleFieldChange('description', e.target.value)}
//                         />
//                         <TextField
//                             label="Rank"
//                             type="number"
//                             fullWidth
//                             margin="dense"
//                             value={editingToDo?.rank ?? ''}
//                             onChange={e => handleFieldChange('rank', Number(e.target.value))}
//                         />
//                         <TextField
//                             label="Weight"
//                             type="number"
//                             fullWidth
//                             margin="dense"
//                             value={editingToDo?.weight ?? ''}
//                             onChange={e => handleFieldChange('weight', Number(e.target.value))}
//                         />
//                         // TODO: kind dropdown
//                         {/* <TextField
//                             label="Kind"
//                             fullWidth
//                             margin="dense"
//                             value={editingToDo?.kind?.name || ''}
//                             onChange={e => handleFieldChange('kind', e.target.value)}
//                         /> */}
//                         {/* <TextField
//                             label="Due Date"
//                             type="date"
//                             fullWidth
//                             margin="dense"
//                             value={
//                                 editingToDo?.dueDate
//                                     ? (editingToDo.dueDate instanceof Date
//                                         ? editingToDo.dueDate.toISOString().slice(0, 10)
//                                         : new Date(editingToDo.dueDate).toISOString().slice(0, 10)
//                                     )
//                                     : ''
//                             }
//                             onChange={e => {
//                                 if (e.target.value) {
//                                     handleFieldChange('dueDate', new Date(e.target.value));
//                                 }
//                             }}
//                         /> */}
//                         {editingToDo && <TextField
//                             label="Percent Completed"
//                             type="number"
//                             fullWidth
//                             margin="dense"
//                             slotProps={{ input: { inputProps: { min: 0, max: 100 } } }}
//                             value={editingToDo?.percentCompleted ?? ''}
//                             onChange={e => handleFieldChange('percentCompleted', Number(e.target.value))}
//                         />}
//                         {user.isAdmin ? (
//                             <Select
//                                 fullWidth
//                                 value={editingToDo?.assignedTo || user.id}
//                                 onChange={e => handleFieldChange('assignedTo', e.target.value)}
//                                 sx={{ mt: 2 }}
//                             >
//                                 <MenuItem key={user.id} value={user.id}>Self</MenuItem>
//                                 // TODO: team members dropdown
//                                 {/* {teamMembers.map(u => (
//                                     <MenuItem key={u.id} value={u.id}>{u.firstName} </MenuItem>
//                                 ))} */}
//                             </Select>
//                         ) : null}
//                     </DialogContent>
//                     <DialogActions>
//                         <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
//                         <Button onClick={handleSaveToDo} variant="contained">Save</Button>
//                     </DialogActions>
//                 </Dialog>}
//             </div>
//     );
// }