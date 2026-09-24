import { atom, useAtom } from "jotai";

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: number;
  dismissible?: boolean;
}

const notificationsAtom = atom<Notification[]>([]);
const isConnectedAtom = atom<boolean>(false);
const activeSymbolAtom = atom<string | null>("AAPL");
const themeAtom = atom<"dark" | "light">("dark");

export function useStore() {
  const [notifications, setNotifications] = useAtom(notificationsAtom);
  const [isConnected, setIsConnected] = useAtom(isConnectedAtom);
  const [activeSymbol, setActiveSymbol] = useAtom(activeSymbolAtom);
  const [theme, setTheme] = useAtom(themeAtom);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "timestamp">) => {
      const id = Math.random().toString(36).slice(2, 9);
      const newNotification: Notification = {
        ...notification,
        id,
        timestamp: Date.now(),
        dismissible: notification.dismissible ?? true,
      };
      setNotifications((prev) => [...prev, newNotification]);
      if (notification.dismissible !== false) {
        setTimeout(() => {
          removeNotification(id);
        }, 5000);
      }
    },
    [setNotifications]
  );

  const removeNotification = useCallback(
    (id: string) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    },
    [setNotifications]
  );

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, [setNotifications]);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    isConnected,
    setIsConnected,
    activeSymbol,
    setActiveSymbol,
    theme,
    setTheme,
    toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
  };
}

import { useCallback } from "react";