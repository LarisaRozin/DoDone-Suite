// /*
//  * Copyright (c) 2025 LarisaRozin
//  * DoDone - Task Management, Allowance & Bonus Tracking Application
//  * All rights reserved.
//  */
// import { useEffect } from "react";
// import { useAuth } from "dodone-shared";
// import type { ToDoGroup } from "../../types/toDo.ts";
// import { Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, TextField } from "@mui/material";
// import { useForm, Controller } from "react-hook-form";

// interface AddOrEditGroupDialogProps {
//     openDialog: boolean;
//     setOpenDialog: React.Dispatch<React.SetStateAction<boolean>>;
//     editingGroup: Partial<ToDoGroup> | null;
//     onGroupAdded: (newGroup: ToDoGroup) => void;
//     existingGroupNames?: string[];
// }

// type GroupFormValues = {
//     name: string;
//     description: string;
//     isActive: boolean;
// };

// export default function AddOrEditGroupDialog({
//     openDialog: open,
//     setOpenDialog,
//     editingGroup,
//     onGroupAdded,
//     existingGroupNames
// }: AddOrEditGroupDialogProps) {
//     const { user } = useAuth();

//     const {
//         control,
//         handleSubmit,
//         setError,
//         clearErrors,
//         reset,
//         formState: { errors }
//     } = useForm<GroupFormValues>({
//         defaultValues: {
//             name: editingGroup?.name || "",
//             description: editingGroup?.description || "",
//             isActive: editingGroup?.isActive ?? true,
//         }
//     });

//     // Reset form when dialog opens/closes or editingGroup changes
//     useEffect(() => {
//         reset({
//             name: editingGroup?.name || "",
//             description: editingGroup?.description || "",
//             isActive: editingGroup?.isActive ?? true,
//         });
//         clearErrors();
//     }, [editingGroup, open, reset, clearErrors]);

//     const onSubmit = (data: GroupFormValues) => {
//         if (!user) return;

//         const trimmedName = data.name.trim();
//         if (!trimmedName) {
//             setError("name", { type: "manual", message: "Name is required." });
//             return;
//         }

//         if (
//             existingGroupNames &&
//             existingGroupNames
//                 .filter(n => n !== editingGroup?.name) // allow unchanged name in edit mode
//                 .map(n => n.trim().toLowerCase())
//                 .includes(trimmedName.toLowerCase())
//         ) {
//             setError("name", { type: "manual", message: "Group name must be unique. A group with this name already exists." });
//             return;
//         }

//         const newGroup: ToDoGroup = {
//             ...editingGroup,
//             id: editingGroup?.id,
//             name: trimmedName,
//             teamId: user.teamId,
//             description: data.description,
//             isActive: data.isActive,
//             createdBy: editingGroup?.createdBy || user.id,
//             createdAt: editingGroup?.createdAt || new Date(),
//             updatedBy: user.id,
//         };

//         onGroupAdded(newGroup);
//         setOpenDialog(false);
//     };

//     return (
//         <div>
//             {user && (
//                 <Dialog
//                     open={open}
//                     onClose={() => setOpenDialog(false)}
//                     fullWidth
//                 >
//                     <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
//                         <DialogTitle>
//                             {editingGroup?.id ? "Edit Group" : "Add Group"}
//                         </DialogTitle>
//                         <DialogContent sx={{ justifyContent: "center", alignItems: "center" }}>
//                             <Controller
//                                 name="name"
//                                 control={control}
//                                 rules={{
//                                     required: "Name is required",
//                                     validate: value =>
//                                         !existingGroupNames ||
//                                         existingGroupNames
//                                             .filter(n => n !== editingGroup?.name)
//                                             .map(n => n.trim().toLowerCase())
//                                             .includes(value.trim().toLowerCase())
//                                             ? "Group name must be unique. A group with this name already exists."
//                                             : true
//                                 }}
//                                 render={({ field }) => (
//                                     <TextField
//                                         {...field}
//                                         variant="outlined"
//                                         label="Name"
//                                         fullWidth
//                                         margin="dense"
//                                         error={!!errors.name}
//                                         helperText={errors.name?.message}
//                                         autoFocus
//                                         onKeyDown={e => {
//                                             if (e.key === "Enter" && field.value.trim()) {
//                                                 handleSubmit(onSubmit)();
//                                             }
//                                         }}
//                                     />
//                                 )}
//                             />
//                             <Controller
//                                 name="description"
//                                 control={control}
//                                 render={({ field }) => (
//                                     <TextField
//                                         {...field}
//                                         variant="outlined"
//                                         label="Description"
//                                         fullWidth
//                                         margin="dense"
//                                         onKeyDown={e => {
//                                             if (e.key === "Enter") {
//                                                 handleSubmit(onSubmit)();
//                                             }
//                                         }}
//                                     />
//                                 )}
//                             />
//                             <FormControl
//                                 sx={{
//                                     display: "flex",
//                                     alignItems: "center",
//                                     justifyContent: "center",
//                                     overflowX: "hidden"
//                                 }}
//                             >
//                                 <Controller
//                                     name="isActive"
//                                     control={control}
//                                     render={({ field }) => (
//                                         <FormControlLabel
//                                             control={
//                                                 <Checkbox
//                                                     checked={field.value}
//                                                     onChange={e => field.onChange(e.target.checked)}
//                                                 />
//                                             }
//                                             label="Active"
//                                         />
//                                     )}
//                                 />
//                             </FormControl>
//                         </DialogContent>
//                         <DialogActions>
//                             <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
//                             <Button
//                                 type="submit"
//                                 variant="contained"
//                                 disabled={!!errors.name}
//                             >
//                                 {editingGroup?.id ? "Save" : "Add"}
//                             </Button>
//                         </DialogActions>
//                     </form>
//                 </Dialog>
//             )}
//         </div>
//     );
// }