import React, {createContext, useContext, useEffect, useState} from 'react';
import {loadUser, loadUserList} from './api';

interface User {
  name: string;
  phone: string;
  code: string;
  // Add more fields as needed
}

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  userList: User[]; // To store the user list
  loading: boolean;
  refetch: () => Promise<void>; // Function to refetch user data
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userList, setUserList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to fetch the user and user list data
  const fetchUser = async () => {
    setLoading(true);
    try {
      const data = await loadUser(); // Load the current user
      if (data?.user) {
        setUser(data.user); // Set user data

        const {users} = await loadUserList(); // Fetch user list
        setUserList(users); // Set user list
      } else {
        setUser(null); // If no user, set to null
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  // Expose a refetch function that can be used to manually reload the user and user list
  const refetch = async () => {
    await fetchUser();
  };

  useEffect(() => {
    fetchUser(); // Fetch user data when the provider mounts
  }, []);

  return (
    <UserContext.Provider value={{user, setUser, userList, loading, refetch}}>
      {children}
    </UserContext.Provider>
  );
};
