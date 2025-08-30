import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/contexts/NotificationsContext";
import { markAsRead } from "@/services/notifications";

const NotificationBell = () => {
  const { notifications, unreadCount, markAll } = useNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <Button variant="ghost" size="sm" onClick={markAll}>Mark all as read</Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No notifications</div>
        ) : (
          notifications.slice(0, 10).map((n) => (
            <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 whitespace-normal">
              <div className="flex w-full items-center justify-between">
                <span className={`text-sm ${n.read ? '' : 'font-semibold'}`}>{n.title}</span>
                {!n.read && n.id && (
                  <button
                    className="text-xs text-primary hover:underline"
                    onClick={async (e) => { e.stopPropagation(); await markAsRead(n.id!); }}
                  >
                    Mark read
                  </button>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{n.body}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
