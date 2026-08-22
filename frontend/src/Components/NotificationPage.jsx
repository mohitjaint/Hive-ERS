import { useState } from 'react';
import NotificationComponent from './notificationComponent';

function NotificationPage() {
  const [notifications, setNotifications] = useState([
    { id: 1, title: "Return Reminder", description: "Your Arduino Uno R3 is due for return in 3 days", time: "1h ago", type: "REMINDER", variant: "reminder", isUnread: true },
    { id: 2, title: "Overdue Item", description: "Digital Multimeter is overdue by 1 day. Please return immediately.", time: "3h ago", type: "OVERDUE", variant: "overdue", isUnread: true },
    { id: 3, title: "Request Approved", description: "Your borrow request for Arduino Uno R3 has been approved", time: "21h ago", type: "APPROVAL", variant: "approval", isUnread: false },
    { id: 4, title: "New Equipment Added", description: "New 3D printers are now available for borrowing!", time: "2d ago", type: "ANNOUNCEMENT", variant: "announcement", isUnread: false },
    { id: 5, title: "Request Rejected", description: "Your request for Oscilloscope was rejected - item reserved for lab session", time: "2d ago", type: "REJECTION", variant: "rejection", isUnread: false }
  ]);

  const unreadCount = notifications.filter(n => n.isUnread).length;

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isUnread: false })));
  };

  return (
    <div className="w-full text-white pt-2 select-none bg-bg min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Notifications</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
           {unreadCount > 0 ? `${unreadCount} unread notifications` : "You are all caught up!"} 
          </p>
        </div>
        <button 
          onClick={handleMarkAllAsRead}
          className="bg-transparent border border-zinc-800 hover:border-[#facc15] hover:text-[#facc15] text-white text-xs px-3 py-1.5 rounded-md transition-all font-medium active:scale-95"
        >
          Mark All as Read
        </button>
      </div>

      <div className="flex flex-col space-y-3 w-full ">
        {notifications.map((item) => (
          <NotificationComponent
            key={item.id}
            title={item.title}
            description={item.description}
            time={item.time}
            type={item.type}
            variant={item.variant}
            isUnread={item.isUnread}
          />
        ))}
      </div>
    </div>
  );
}

export default NotificationPage;
