/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import { Box, Typography } from '@mui/material';
// import { useState } from 'react';
// import { useAuth } from 'dodone-shared';
// import ToDoAddOrEditDialog from './ToDoAddOrEditDialog.tsx';
// import type { ToDoItem } from '../../types/toDo.ts';

// export function AddToDo()  {
//     const {user} = useAuth();
//     const [editingToDo, setEditingToDo] = useState<Partial<ToDoItem> | null>(null);
//     const [openDialog, setOpenDialog] = useState(false);

//     const openAddDialog = () => {
//         if (!user) return;

//         setEditingToDo({ assignedTo: user.id });
//         setOpenDialog(true);
//     };

//     return (
//         <Box sx={{ mt: 3,
//                    mb: 3,
//                    width: '100%',
//                    display: 'flex', 
//                    alignItems: 'center', 
//                    justifyContent: 'center' }}>
//             <Button variant="contained" 
//                     color="secondary" 
//                     onClick={() => openAddDialog()}>
//                 Add ToDo
//             </Button>
//             <div>
//                 <ToDoAddOrEditDialog openDialog={openDialog} setOpenDialog={setOpenDialog} editingToDo={editingToDo} setEditingToDo={setEditingToDo} />
//             </div>
//         </Box>
//     );
// }

export default function ToDoManager() {
    // const {user} = useAuth();
    // const [toDos, setToDos] = useState<ToDoItem[]>([]);
    // const [toDos] = useState<ToDoItem[]>([]);
    // const [openDialog, setOpenDialog] = useState(false);
    // const [editingToDo, setEditingToDo] = useState<Partial<ToDoItem> | null>(null);

    // const [toDos, setToDos] = useState<ToDoItem[]>([]);
    // const openEditDialog = (todo: ToDoItem) => {
    //     setEditingToDo(todo);
    //     setOpenDialog(true);
    // };

    // if (toDos.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
                {/* <AddToDo />   */}
                <Typography variant='h4' sx={{mt: 4}}>
                    No ToDos yet. &nbsp; Add your first ToDo.
                </Typography>
            </Box>
        )
    // } else {
    //     return (
    //         <Box>
    //             <AddToDo />  
    //             <p>You have {toDos.length} ToDos.</p>
    //             // {/* <ToDoList toDos={filteredToDos} onEdit={openEditDialog} onDelete={handleDeleteToDo} /> */}
    //         </Box>
    //     )
    // }
}