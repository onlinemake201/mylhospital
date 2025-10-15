// template
import { Tabs } from "expo-router";
import { LayoutDashboard, Users, Calendar, Pill, FlaskConical, AlertCircle, Settings, UserCircle, FileText } from "lucide-react-native";
import React from "react";

import Colors from "@/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint,
        headerShown: true,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600' as const,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: "Patients",
          tabBarIcon: ({ color }) => <Users size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="medications"
        options={{
          title: "Meds",
          tabBarIcon: ({ color }) => <Pill size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="laboratory"
        options={{
          title: "Lab",
          tabBarIcon: ({ color }) => <FlaskConical size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="emergency"
        options={{
          title: "Emergency",
          tabBarIcon: ({ color }) => <AlertCircle size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="invoices"
        options={{
          title: "Invoices",
          tabBarIcon: ({ color }) => <FileText size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <UserCircle size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
