import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

// Import screens
import Home from '../screens/Home';
import Favourite from '../screens/Favourite';
import SettingsNavigator from './SettingsNavigator';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Favourites') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'SettingsTab') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={Home}
        options={{
          title: 'Home',
        }}
      />
      <Tab.Screen 
        name="Favourites" 
        component={Favourite}
        options={{
          title: 'Favourites',
        }}
      />
      <Tab.Screen 
        name="SettingsTab" 
        component={SettingsNavigator}
        options={{
          title: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator; 