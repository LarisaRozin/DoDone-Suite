/*
 * Copyright (c) 2025 LarisaRozin
 * dodone-shared - Task Management, Allowance & Bonus Tracking Application Package
 * All rights reserved.
 */

// import React from 'react';
// import { 
//   ConfigProvider, 
//   AuthProvider, 
//   useTaskItems, 
//   useTaskGroups,
//   useTaskKinds,
//   useTaskCategories,
//   useTeam,
//   useAuth,
//   PagedTaskItemListRequestBuilder,
//   PagedListRequestBuilder,
//   SortDirection
// } from 'dodone-shared';

// // Example of how to set up the library in a consuming application
// function App() {
//   return (
//     <ConfigProvider config={{ baseUrl: 'https://your-api-server.com' }}>
//       <AuthProvider>
//         <Dashboard />
//       </AuthProvider>
//     </ConfigProvider>
//   );
// }

// // Example component using the hooks
// function Dashboard() {
//   const { user } = useAuth();

//   // Example using the updated paged hooks
//   const teamRequest = new PagedListRequestBuilder()
//     .setPaging(1, 10)
//     .setSorting('name', SortDirection.Ascending)
//     .build();

//   const taskGroupsRequest = new PagedListRequestBuilder()
//     .setParentId(user?.id || 0)
//     .setPaging(1, 10)
//     .setSorting('name', SortDirection.Ascending)
//     .build();

//   const taskKindsRequest = new PagedListRequestBuilder()
//     .setParentId(1) // group ID
//     .setPaging(1, 10)
//     .build();

//   const taskCategoriesRequest = new PagedListRequestBuilder()
//     .setParentId(1) // kind ID
//     .setPaging(1, 10)
//     .build();

//   const taskItemsRequest = new PagedTaskItemListRequestBuilder()
//     .setPaging(1, 10)
//     .setGroupId(1)
//     .build();

//   const { pagedTeam, loadingTeam, refreshTeam } = useTeam(teamRequest);
//   const { pagedTaskGroups, taskGroupsLoading, refreshTaskGroups } = useTaskGroups(taskGroupsRequest);
//   const { pagedTaskKinds, loading: kindsLoading, refreshTaskKinds } = useTaskKinds(taskKindsRequest);
//   const { pagedTaskCategories, loading: categoriesLoading, refreshTaskCategories } = useTaskCategories(taskCategoriesRequest);
//   const { pagedTaskItems, loadingTaskItems, refreshTaskItems } = useTaskItems(taskItemsRequest);

//   if (loadingTeam || taskGroupsLoading || kindsLoading || categoriesLoading || loadingTaskItems) {
//     return <div>Loading...</div>;
//   }

//   return (
//     <div>
//       <h1>Task Dashboard</h1>
      
//       <section>
//         <h2>Team Members ({pagedTeam?.paging.totalItems || 0})</h2>
//         <button onClick={() => refreshTeam(teamRequest)}>Refresh Team</button>
//         <ul>
//           {pagedTeam?.data.map(member => (
//             <li key={member.id}>{member.firstName} {member.lastName}</li>
//           ))}
//         </ul>
//       </section>

//       <section>
//         <h2>Task Groups ({pagedTaskGroups?.paging.totalItems || 0})</h2>
//         <button onClick={() => refreshTaskGroups(taskGroupsRequest)}>Refresh Groups</button>
//         <ul>
//           {pagedTaskGroups?.data.map(group => (
//             <li key={group.id}>{group.name}</li>
//           ))}
//         </ul>
//       </section>

//       <section>
//         <h2>Task Kinds ({pagedTaskKinds?.paging.totalItems || 0})</h2>
//         <button onClick={() => refreshTaskKinds(taskKindsRequest)}>Refresh Kinds</button>
//         <ul>
//           {pagedTaskKinds?.data.map(kind => (
//             <li key={kind.id}>{kind.name}</li>
//           ))}
//         </ul>
//       </section>

//       <section>
//         <h2>Task Categories ({pagedTaskCategories?.paging.totalItems || 0})</h2>
//         <button onClick={() => refreshTaskCategories(taskCategoriesRequest)}>Refresh Categories</button>
//         <ul>
//           {pagedTaskCategories?.data.map(category => (
//             <li key={category.id}>{category.name}</li>
//           ))}
//         </ul>
//       </section>

//       <section>
//         <h2>Task Items ({pagedTaskItems?.paging.totalItems || 0})</h2>
//         <button onClick={() => refreshTaskItems(taskItemsRequest)}>Refresh Items</button>
//         <ul>
//           {pagedTaskItems?.data.map(item => (
//             <li key={item.id}>{item.name}</li>
//           ))}
//         </ul>
//       </section>
//     </div>
//   );
// }

// export default App;
