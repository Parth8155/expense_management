# Logout Functionality

The expense management application now includes comprehensive logout functionality accessible to all users.

## Implementation

### 1. Header Component with Logout Button

All protected pages automatically include a header with navigation and a logout button through the `Layout` component:

```jsx
import { Layout } from '../components';

// All protected routes automatically get the header with logout
<Layout>
  <YourPageContent />
</Layout>
```

The header includes:
- App logo and navigation menu
- User information (name and role)
- Logout button in the top-right corner

### 2. Standalone Logout Button

For custom implementations or pages that don't use the main layout:

```jsx
import { LogoutButton } from '../components';

// Basic usage
<LogoutButton />

// With custom text
<LogoutButton>Sign Out</LogoutButton>

// With custom styling
<LogoutButton 
  className="my-custom-class"
  style={{ backgroundColor: 'red', padding: '10px 20px' }}
>
  Exit
</LogoutButton>
```

### 3. Programmatic Logout

For custom logout logic in your components:

```jsx
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const MyComponent = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleCustomLogout = () => {
    // Perform any cleanup
    logout(); // Clears token and user state
    navigate('/login'); // Redirect to login page
  };

  return (
    <button onClick={handleCustomLogout}>
      Custom Logout
    </button>
  );
};
```

## Features

### Automatic Integration
- All protected routes automatically include the header with logout functionality
- No additional setup required for basic logout functionality

### Role-Based Navigation
- Navigation menu items are filtered based on user role:
  - **Admin**: Dashboard, Expenses, Users, Approval Rules
  - **Manager**: Dashboard, Expenses
  - **Employee**: Dashboard, Expenses

### Responsive Design
- Header adapts to mobile screens with collapsible navigation
- Logout button remains accessible on all screen sizes

### Security
- Logout clears the JWT token from localStorage
- Redirects to login page after logout
- Protected routes automatically redirect unauthenticated users

## Usage Examples

### In a Custom Page Component
```jsx
import React from 'react';
import { LogoutButton } from '../components';

const CustomPage = () => {
  return (
    <div>
      <h1>Custom Page</h1>
      <p>This page doesn't use the main layout</p>
      <LogoutButton>Exit Application</LogoutButton>
    </div>
  );
};
```

### In a Modal or Popup
```jsx
import React from 'react';
import { LogoutButton } from '../components';

const UserMenu = ({ onClose }) => {
  return (
    <div className="user-menu">
      <button onClick={onClose}>Settings</button>
      <button onClick={onClose}>Profile</button>
      <LogoutButton style={{ width: '100%' }}>
        Logout
      </LogoutButton>
    </div>
  );
};
```

## Testing

The logout functionality includes comprehensive tests:

```bash
# Run logout-related tests
npm test -- --testNamePattern="logout|Logout"

# Run header tests
npm test -- --testPathPattern="Header"
```

## Accessibility

- Logout button includes proper ARIA labels
- Keyboard navigation support
- High contrast colors for visibility
- Responsive touch targets for mobile devices