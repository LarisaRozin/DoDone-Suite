# dodone-shared Library

A shared library for task management functionality with React hooks and authentication.

## Installation

```bash
npm install dodone-shared
```

## Setup

Wrap your application with both the `ConfigProvider` and `AuthProvider`:

```tsx
import React from 'react';
import { ConfigProvider, AuthProvider } from 'dodone-shared';

function App() {
  return (
    <ConfigProvider config={{ baseUrl: 'https://your-api-server.com' }}>
      <AuthProvider>
        {/* Your app components */}
        <YourAppComponents />
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
```

## Usage

### Authentication

```tsx
import { useAuth } from 'dodone-shared';

function LoginComponent() {
  const { user, token, authError, authLoading, dispatch } = useAuth();

  const handleLogin = (user, token) => {
    dispatch({ type: 'LOGIN_SUCCESS', user, token });
  };

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  // ... rest of your component
}
```

### Task Management Hooks

All hooks now automatically use the configured base URL:

```tsx
import { 
  useTaskItems, 
  useTaskGroups, 
  useTaskKinds, 
  useTaskCategories,
  useTeam 
} from 'dodone-shared';

function TaskDashboard() {
  const userId = 123;
  const groupId = 456;
  const kindId = 789;

  // No need to pass baseUrl anymore!
  const { taskItems, loadingTaskItems, refreshTaskItems } = useTaskItems(userId);
  const { taskGroups, taskGroupsLoading, refreshTaskGroups } = useTaskGroups(userId);
  const { kinds, loading: kindsLoading } = useTaskKinds(groupId);
  const { groups: categories, loading: categoriesLoading } = useTaskCategories(kindId);
  const { team, loading: teamLoading } = useTeam();

  // ... rest of your component
}
```

## Configuration Options

The `ConfigProvider` accepts a config object with the following options:

- `baseUrl` (required): The base URL of your API server

Future configuration options may include:
- `timeout`: Request timeout in milliseconds
- `defaultHeaders`: Default headers to include with all requests

## Migration from Previous Versions

If you were previously passing `baseUrl` as a parameter to hooks:

**Before:**
```tsx
const { taskItems } = useTaskItems(userId, 'https://api.example.com');
const { taskGroups } = useTaskGroups(userId, 'https://api.example.com');
```

**After:**
```tsx
// In your App.tsx or root component
<ConfigProvider config={{ baseUrl: 'https://api.example.com' }}>
  <AuthProvider>
    {/* Your app */}
  </AuthProvider>
</ConfigProvider>

// In your components
const { taskItems } = useTaskItems(userId);
const { taskGroups } = useTaskGroups(userId);
```
