import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useShop } from '../../context/ShopContext';
import { Colors } from '../../constants/colors';

function TabBadge({ count }) {
  if (!count || count <= 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

function TabIcon({ name, focused, badgeCount }) {
  return (
    <View style={styles.iconContainer}>
      <Ionicons
        name={name}
        size={24}
        color={focused ? Colors.slate900 : Colors.slate400}
      />
      {badgeCount > 0 && <TabBadge count={badgeCount} />}
    </View>
  );
}

export default function TabLayout() {
  const { totalCartCount, wishlist } = useShop();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.slate900,
        tabBarInactiveTintColor: Colors.slate400,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: Colors.slate200,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: Colors.slate900,
        headerTitleStyle: { fontWeight: '900', fontSize: 17, letterSpacing: 0.5 },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: 'Shop',
          headerTitle: 'QuickFit',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'grid' : 'grid-outline'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Bag',
          headerTitle: 'Shopping Bag',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'bag' : 'bag-outline'}
              focused={focused}
              badgeCount={totalCartCount}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Saved',
          headerTitle: 'Wishlist',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'heart' : 'heart-outline'}
              focused={focused}
              badgeCount={wishlist.length}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          headerTitle: 'My Account',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: { position: 'relative', width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute', top: -4, right: -8,
    backgroundColor: Colors.rose500, borderRadius: 8,
    minWidth: 16, height: 16, paddingHorizontal: 3,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#ffffff',
  },
  badgeText: { color: '#ffffff', fontSize: 9, fontWeight: '900' },
});
